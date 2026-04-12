<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ApiController extends Controller
{
    private const RESERVA_DURADA_MINUTS = 5;
    private const ADMIN_EMAIL = 'admin@gmail.com';

    private function userRoleByEmail(string $email): string
    {
        return strtolower(trim($email)) === self::ADMIN_EMAIL ? 'administrador' : 'comprador';
    }

    private function ensureAdmin(Request $request): ?JsonResponse
    {
        $token = $this->parseToken($request->header('Authorization'));

        if (!$token || !isset($token['id'])) {
            return response()->json(['error' => 'TOKEN_INVALID', 'missatge' => 'Token invalid o expirat'], 401);
        }

        if (($token['role'] ?? 'comprador') !== 'administrador') {
            return response()->json(['error' => 'NO_AUTORITZAT', 'missatge' => 'Acces nomes per administradors'], 403);
        }

        return null;
    }

    private function syncTicketmasterEvents(): void
    {
        $apiKey = (string) env('TICKETMASTER_API_KEY', '');
        if ($apiKey === '') {
            return;
        }

        try {
            $response = Http::timeout(12)->get('https://app.ticketmaster.com/discovery/v2/events.json', [
                'apikey' => $apiKey,
                'countryCode' => (string) env('TICKETMASTER_COUNTRY_CODE', 'ES'),
                'city' => (string) env('TICKETMASTER_CITY', 'Barcelona'),
                'size' => (int) env('TICKETMASTER_SIZE', 20),
                'sort' => 'date,asc',
            ]);

            if (!$response->ok()) {
                Log::warning('Ticketmaster sync failed', ['status' => $response->status()]);
                return;
            }

            $payload = $response->json();
            $events = $payload['_embedded']['events'] ?? [];
            if (!is_array($events) || empty($events)) {
                return;
            }

            foreach ($events as $tmEvent) {
                if (!is_array($tmEvent)) {
                    continue;
                }

                $this->importTicketmasterEvent($tmEvent);
            }
        } catch (\Throwable $e) {
            Log::warning('Ticketmaster sync exception', ['error' => $e->getMessage()]);
        }
    }

    private function importTicketmasterEvent(array $tmEvent): ?int
    {
        $externalId = (string) ($tmEvent['id'] ?? '');
        if ($externalId === '') {
            return null;
        }

        $name = (string) ($tmEvent['name'] ?? 'Esdeveniment Ticketmaster');
        $startDateTime = $tmEvent['dates']['start']['dateTime'] ?? null;
        $localDate = $tmEvent['dates']['start']['localDate'] ?? null;
        $dateTime = $startDateTime
            ? Carbon::parse((string) $startDateTime)->timezone(config('app.timezone'))->format('Y-m-d H:i:s')
            : (($localDate ? Carbon::parse((string) $localDate)->setTime(20, 0) : now()->addDays(7))->format('Y-m-d H:i:s'));

        $venue = (string) ($tmEvent['_embedded']['venues'][0]['name'] ?? 'Recinte Ticketmaster');
        $description = (string) ($tmEvent['info'] ?? $tmEvent['pleaseNote'] ?? 'Esdeveniment importat des de Ticketmaster');
        $images = $tmEvent['images'] ?? [];
        $imageUrl = null;
        if (is_array($images) && count($images) > 0) {
            $imageUrl = (string) ($images[0]['url'] ?? '');
        }

        $existing = DB::table('events')
            ->where('external_source', 'ticketmaster')
            ->where('external_id', $externalId)
            ->first();

        if ($existing) {
            DB::table('events')
                ->where('id', $existing->id)
                ->update([
                    'name' => $name,
                    'date_time' => $dateTime,
                    'venue' => $venue,
                    'description' => $description,
                    'image_url' => $imageUrl ?: $existing->image_url,
                    'status' => 'active',
                    'updated_at' => now(),
                ]);

            $this->ensureEventSeatMap((int) $existing->id);
            return (int) $existing->id;
        }

        $eventId = DB::table('events')->insertGetId([
            'name' => $name,
            'date_time' => $dateTime,
            'venue' => $venue,
            'description' => $description,
            'image_url' => $imageUrl,
            'status' => 'active',
            'external_source' => 'ticketmaster',
            'external_id' => $externalId,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->ensureEventSeatMap((int) $eventId);
        return (int) $eventId;
    }

    private function ensureEventSeatMap(int $eventId): void
    {
        $hasZones = DB::table('zones')->where('event_id', $eventId)->exists();
        if ($hasZones) {
            return;
        }

        $zones = [
            ['zone_key' => 'general', 'zone_name' => 'General', 'price' => 39.00, 'color' => 'rgba(33,150,243,0.8)', 'rows' => 6, 'seats_per_row' => 14],
            ['zone_key' => 'premium', 'zone_name' => 'Premium', 'price' => 65.00, 'color' => 'rgba(76,175,80,0.8)', 'rows' => 4, 'seats_per_row' => 10],
        ];

        foreach ($zones as $zone) {
            $zoneId = DB::table('zones')->insertGetId([
                'event_id' => $eventId,
                'zone_key' => $zone['zone_key'],
                'zone_name' => $zone['zone_name'],
                'price' => $zone['price'],
                'color' => $zone['color'],
            ]);

            for ($r = 0; $r < $zone['rows']; $r++) {
                $row = chr(65 + $r);
                for ($seat = 1; $seat <= $zone['seats_per_row']; $seat++) {
                    DB::table('seats')->insert([
                        'event_id' => $eventId,
                        'zone_id' => $zoneId,
                        'row' => $row,
                        'seat_number' => $seat,
                        'status' => 'AVAILABLE',
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }
            }
        }
    }

    private function makeToken(int $userId, string $email): string
    {
        $secret = (string) env('JWT_SECRET', env('APP_KEY', 'dev-secret'));
        $role = $this->userRoleByEmail($email);
        $header = $this->base64UrlEncode(json_encode(['alg' => 'HS256', 'typ' => 'JWT']) ?: '{}');
        $payload = $this->base64UrlEncode(json_encode([
            'id' => $userId,
            'email' => $email,
            'role' => $role,
            'exp' => now()->addDays(7)->timestamp,
        ]) ?: '{}');

        $signature = hash_hmac('sha256', $header.'.'.$payload, $secret, true);

        return $header.'.'.$payload.'.'.$this->base64UrlEncode($signature);
    }

    private function parseToken(?string $authHeader): ?array
    {
        if (!$authHeader || !str_starts_with($authHeader, 'Bearer ')) {
            return null;
        }

        $token = substr($authHeader, 7);
        $parts = explode('.', $token);
        if (count($parts) !== 3) {
            return null;
        }

        [$header, $payload, $signature] = $parts;
        $secret = (string) env('JWT_SECRET', env('APP_KEY', 'dev-secret'));
        $expected = $this->base64UrlEncode(hash_hmac('sha256', $header.'.'.$payload, $secret, true));

        if (!hash_equals($expected, $signature)) {
            return null;
        }

        $decoded = json_decode($this->base64UrlDecode($payload), true);
        if (!is_array($decoded)) {
            return null;
        }

        if (isset($decoded['exp']) && (int) $decoded['exp'] < now()->timestamp) {
            return null;
        }

        return $decoded;
    }

    private function authUserId(Request $request): ?int
    {
        $token = $this->parseToken($request->header('Authorization'));

        return $token && isset($token['id']) ? (int) $token['id'] : null;
    }

    private function base64UrlEncode(string $data): string
    {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    private function base64UrlDecode(string $data): string
    {
        $padding = strlen($data) % 4;
        if ($padding > 0) {
            $data .= str_repeat('=', 4 - $padding);
        }

        $decoded = base64_decode(strtr($data, '-_', '+/'), true);

        return $decoded === false ? '' : $decoded;
    }

    private function seatStatusToCatalan(string $status): string
    {
        return match ($status) {
            'RESERVED' => 'reservat',
            'SOLD' => 'venut',
            default => 'disponible',
        };
    }

    private function mapEvent(object $event): array
    {
        return [
            'id' => $event->id,
            'nom' => $event->name,
            'data_hora' => $event->date_time,
            'recinte' => $event->venue,
            'descripcio' => $event->description ?? '',
            'imatge' => $event->image_url ?? null,
            'estat' => $event->status === 'active' ? 'actiu' : $event->status,
        ];
    }

    public function register(Request $request): JsonResponse
    {
        $email = $request->input('email', $request->input('correu_electronic'));
        $password = $request->input('password', $request->input('contrasenya'));
        $name = $request->input('full_name', $request->input('nom'));
        $phone = $request->input('phone');

        if (!$email || !$password || !$name) {
            return response()->json([
                'error' => 'DADES_FALTEN',
                'missatge' => 'Falten dades obligatories (email, password, full_name)',
            ], 400);
        }

        $exists = DB::table('users')->where('email', $email)->exists();
        if ($exists) {
            return response()->json([
                'error' => 'CORREU_EXIST',
                'missatge' => 'El correu electronic ja esta registrat',
            ], 400);
        }

        $userId = DB::table('users')->insertGetId([
            'email' => $email,
            'password' => $password,
            'name' => $name,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $token = $this->makeToken((int) $userId, (string) $email);
        $role = $this->userRoleByEmail((string) $email);

        return response()->json([
            'token' => $token,
            'usuari' => [
                'id' => (string) $userId,
                'correu_electronic' => $email,
                'nom' => $name,
                'rol' => $role,
            ],
        ], 201);
    }

    public function login(Request $request): JsonResponse
    {
        $email = $request->input('email', $request->input('correu_electronic'));
        $password = $request->input('password', $request->input('contrasenya'));

        if (!$email || !$password) {
            return response()->json([
                'error' => 'DADES_FALTEN',
                'missatge' => 'Falten dades obligatories',
            ], 400);
        }

        $user = DB::table('users')->where('email', $email)->first();
        if (!$user || $user->password !== $password) {
            return response()->json([
                'error' => 'CREDENCIALS_INCORRECTES',
                'missatge' => 'Credencials incorrectes',
            ], 401);
        }

        $token = $this->makeToken((int) $user->id, (string) $user->email);
        $role = $this->userRoleByEmail((string) $user->email);

        return response()->json([
            'token' => $token,
            'usuari' => [
                'id' => (string) $user->id,
                'correu_electronic' => $user->email,
                'nom' => $user->name,
                'rol' => $role,
            ],
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        $userId = $this->authUserId($request);
        if (!$userId) {
            return response()->json(['error' => 'TOKEN_INVALID', 'missatge' => 'Token invalid o expirat'], 401);
        }

        $user = DB::table('users')->where('id', $userId)->first();
        if (!$user) {
            return response()->json(['error' => 'USUARI_NO_TROBAT', 'missatge' => 'Usuari no trobat'], 404);
        }

        return response()->json([
            'id' => (string) $user->id,
            'correu_electronic' => $user->email,
            'nom' => $user->name,
            'rol' => $this->userRoleByEmail((string) $user->email),
        ]);
    }

    public function events(): JsonResponse
    {
        $this->syncTicketmasterEvents();

        $events = DB::table('events')->orderBy('date_time')->get();

        $zones = DB::table('zones')->get()->groupBy('event_id');

        $mapped = $events->map(function (object $event) use ($zones) {
            $eventZones = $zones->get($event->id, collect())->map(function (object $zone) {
                return [
                    'id' => $zone->id,
                    'nom' => $zone->zone_name,
                    'preu' => (float) $zone->price,
                    'color' => $zone->color,
                ];
            })->values()->all();

            return array_merge($this->mapEvent($event), ['zones' => $eventZones]);
        })->values()->all();

        return response()->json([
            'data' => $mapped,
            'eventos' => $mapped,
            'esdeveniments' => $mapped,
            'events' => $mapped,
            'total' => count($mapped),
        ]);
    }

    private function getEventSeatsWithStatus(int $eventId): array
    {
        $now = now();
        $rows = DB::table('seats as s')
            ->join('zones as z', 'z.id', '=', 's.zone_id')
            ->leftJoin('reservations as r', function ($join) use ($now) {
                $join->on('r.seat_id', '=', 's.id')
                    ->where('r.status', '=', 'PENDING')
                    ->where('r.expires_at', '>', $now);
            })
            ->select(
                's.id',
                's.event_id',
                's.zone_id',
                's.row',
                's.seat_number',
                's.status',
                's.reserved_by',
                'z.zone_name',
                'z.price',
                'z.color',
                'r.expires_at as active_reservation_expires_at'
            )
            ->where('s.event_id', $eventId)
            ->orderBy('s.row')
            ->orderBy('s.seat_number')
            ->get();

        return $rows->map(function (object $row) {
            $status = $row->status;
            if ($row->status === 'RESERVED' && !$row->active_reservation_expires_at) {
                $status = 'AVAILABLE';
            }

            return [
                'id' => (int) $row->id,
                'event_id' => (int) $row->event_id,
                'zone_id' => (int) $row->zone_id,
                'row' => $row->row,
                'seat_number' => (int) $row->seat_number,
                'status' => $status,
                'zone' => $row->zone_name,
                'price' => (float) $row->price,
                'color' => $row->color,
                'reserved_by' => $row->reserved_by ? (int) $row->reserved_by : null,
                'expires_at' => $row->active_reservation_expires_at,
            ];
        })->values()->all();
    }

    public function eventDetail(int $id): JsonResponse
    {
        $event = DB::table('events')->where('id', $id)->first();
        if (!$event) {
            return response()->json(['error' => 'Event no trobat'], 404);
        }

        $zones = DB::table('zones')->where('event_id', $id)->orderBy('id')->get()->map(function (object $zone) {
            return [
                'id' => $zone->id,
                'nom' => $zone->zone_name,
                'preu' => (float) $zone->price,
                'color' => $zone->color,
            ];
        })->values()->all();

        $seients = array_map(function (array $seat) {
            return [
                'id' => (string) $seat['id'],
                'zona_id' => (string) $seat['zone_id'],
                'numero' => (string) $seat['seat_number'],
                'fila' => $seat['row'],
                'estat' => $this->seatStatusToCatalan((string) $seat['status']),
                'zona' => [
                    'id' => (string) $seat['zone_id'],
                    'nom' => $seat['zone'],
                    'preu' => (float) $seat['price'],
                ],
            ];
        }, $this->getEventSeatsWithStatus($id));

        return response()->json(array_merge($this->mapEvent($event), [
            'zones' => $zones,
            'seients' => $seients,
        ]));
    }

    public function seients(int $eventId): JsonResponse
    {
        $seats = $this->getEventSeatsWithStatus($eventId);

        return response()->json([
            'data' => $seats,
            'total' => count($seats),
            'disponibles' => count(array_filter($seats, fn (array $s) => $s['status'] === 'AVAILABLE')),
            'reservats' => count(array_filter($seats, fn (array $s) => $s['status'] === 'RESERVED')),
            'venuts' => count(array_filter($seats, fn (array $s) => $s['status'] === 'SOLD')),
        ]);
    }

    public function zones(): JsonResponse
    {
        $zones = DB::table('zones')
            ->select('id', 'zone_key', 'zone_name', 'price', 'color')
            ->orderBy('id')
            ->get();

        return response()->json(['data' => $zones]);
    }

    public function entradesUsuari(Request $request): JsonResponse
    {
        $userId = $this->authUserId($request);
        if (!$userId) {
            return response()->json(['error' => 'TOKEN_INVALID'], 401);
        }

        $purchases = DB::table('purchases as p')
            ->join('events as e', 'e.id', '=', 'p.event_id')
            ->select('p.id', 'p.created_at', 'p.completed_at', 'e.name', 'e.date_time', 'e.venue')
            ->where('p.user_id', $userId)
            ->where('p.status', 'COMPLETED')
            ->orderByDesc('p.created_at')
            ->get();

        $purchaseIds = $purchases->pluck('id')->all();

        $itemsByPurchase = DB::table('purchase_items as pi')
            ->join('seats as s', 's.id', '=', 'pi.seat_id')
            ->select('pi.purchase_id', 'pi.seat_id', 'pi.zone_name', 's.row', 's.seat_number')
            ->whereIn('pi.purchase_id', $purchaseIds ?: [0])
            ->get()
            ->groupBy('purchase_id');

        $entrades = $purchases->map(function (object $purchase) use ($itemsByPurchase) {
            $items = $itemsByPurchase->get($purchase->id, collect())->map(function (object $item) {
                return [
                    'id' => (string) $item->seat_id,
                    'numero' => (string) $item->seat_number,
                    'fila' => $item->row,
                    'zona' => $item->zone_name,
                ];
            })->values()->all();

            return [
                'id' => (string) $purchase->id,
                'codi_entrada' => 'ENT-'.str_pad((string) $purchase->id, 6, '0', STR_PAD_LEFT),
                'data_compra' => $purchase->completed_at ?: $purchase->created_at,
                'esdeveniment' => [
                    'nom' => $purchase->name,
                    'data_hora' => $purchase->date_time,
                    'recinte' => $purchase->venue,
                ],
                'seients' => $items,
            ];
        })->values()->all();

        return response()->json(['entrades' => $entrades]);
    }

    public function reservesUsuari(Request $request): JsonResponse
    {
        $userId = $this->authUserId($request);
        if (!$userId) {
            return response()->json(['error' => 'TOKEN_INVALID'], 401);
        }

        $rows = DB::table('reservations as r')
            ->join('events as e', 'e.id', '=', 'r.event_id')
            ->join('seats as s', 's.id', '=', 'r.seat_id')
            ->join('zones as z', 'z.id', '=', 's.zone_id')
            ->select(
                'r.id',
                'r.event_id',
                'r.reserved_at',
                'r.expires_at',
                'e.name as event_name',
                's.id as seat_id',
                's.row',
                's.seat_number',
                'z.zone_name'
            )
            ->where('r.user_id', $userId)
            ->where('r.status', 'PENDING')
            ->where('r.expires_at', '>', now())
            ->orderByDesc('r.reserved_at')
            ->get();

        $reserves = $rows->map(function (object $row) {
            return [
                'id' => $row->id,
                'token' => (string) $row->id,
                'esdeveniment_id' => (string) $row->event_id,
                'data_inici' => $row->reserved_at,
                'data_expiracio' => $row->expires_at,
                'esdeveniment' => ['nom' => $row->event_name],
                'seients' => [[
                    'id' => (string) $row->seat_id,
                    'numero' => (string) $row->seat_number,
                    'fila' => $row->row,
                    'zona' => ['nom' => $row->zone_name],
                ]],
            ];
        })->values()->all();

        return response()->json(['reserves' => $reserves]);
    }

    public function deleteReserva(Request $request, int $id): JsonResponse
    {
        $userId = $this->authUserId($request);
        if (!$userId) {
            return response()->json(['error' => 'TOKEN_INVALID'], 401);
        }

        $reservation = DB::table('reservations')->where('id', $id)->first();
        if (!$reservation) {
            return response()->json(['error' => 'RESERVA_NO_TROBADA'], 404);
        }

        if ((int) $reservation->user_id !== $userId) {
            return response()->json(['error' => 'NO_TE_PERMIS'], 403);
        }

        DB::transaction(function () use ($reservation, $userId) {
            $seat = DB::table('seats')
                ->where('id', $reservation->seat_id)
                ->lockForUpdate()
                ->first();

            if ($seat && $seat->status === 'RESERVED' && (int) $seat->reserved_by === $userId) {
                DB::table('seats')
                    ->where('id', $seat->id)
                    ->update([
                        'status' => 'AVAILABLE',
                        'reserved_by' => null,
                        'updated_at' => now(),
                    ]);
            }

            DB::table('reservations')
                ->where('id', $reservation->id)
                ->update([
                    'status' => 'CANCELLED',
                ]);
        });

        return response()->json(['missatge' => 'Reserva alliberada']);
    }

    public function compres(Request $request): JsonResponse
    {
        $userId = $this->authUserId($request);
        if (!$userId) {
            return response()->json(['error' => 'TOKEN_INVALID'], 401);
        }

        $reservaToken = (int) $request->input('reserva_token');
        if ($reservaToken <= 0) {
            return response()->json(['error' => 'TOKEN_OBLIGATORI'], 400);
        }

        $targetReservation = DB::table('reservations')
            ->where('id', $reservaToken)
            ->where('user_id', $userId)
            ->where('status', 'PENDING')
            ->first();

        if (!$targetReservation) {
            return response()->json(['error' => 'RESERVA_NO_TROBADA', 'missatge' => 'Reserva no trobada o no activa'], 404);
        }

        if (Carbon::parse($targetReservation->expires_at)->lte(now())) {
            return response()->json(['error' => 'RESERVA_EXPIRADA', 'missatge' => 'La reserva ha expirat'], 400);
        }

        $activeReservations = DB::table('reservations as r')
            ->join('seats as s', 's.id', '=', 'r.seat_id')
            ->join('zones as z', 'z.id', '=', 's.zone_id')
            ->select('r.id', 'r.seat_id', 'r.event_id', 'r.expires_at', 'z.zone_name', 'z.price')
            ->where('r.user_id', $userId)
            ->where('r.event_id', $targetReservation->event_id)
            ->where('r.status', 'PENDING')
            ->where('r.expires_at', '>', now())
            ->get();

        if ($activeReservations->isEmpty()) {
            return response()->json(['error' => 'RESERVA_EXPIRADA', 'missatge' => 'No tens reserves actives'], 400);
        }

        $usuari = $request->input('usuari', []);
        $compra = DB::transaction(function () use ($activeReservations, $targetReservation, $userId, $usuari) {
            $totalPrice = $activeReservations->sum(fn (object $r) => (float) $r->price);

            $purchaseId = DB::table('purchases')->insertGetId([
                'user_id' => $userId,
                'event_id' => $targetReservation->event_id,
                'total_price' => $totalPrice,
                'status' => 'COMPLETED',
                'first_name' => (string) ($usuari['nom'] ?? ''),
                'last_name' => '',
                'email' => (string) ($usuari['correu'] ?? ''),
                'completed_at' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            foreach ($activeReservations as $reservation) {
                $seat = DB::table('seats')->where('id', $reservation->seat_id)->lockForUpdate()->first();

                if (!$seat || $seat->status !== 'RESERVED' || (int) $seat->reserved_by !== $userId) {
                    throw new \RuntimeException('SEIENT_INVALID_'.$reservation->seat_id);
                }

                DB::table('seats')->where('id', $reservation->seat_id)->update([
                    'status' => 'SOLD',
                    'reserved_by' => null,
                    'sold_by' => $userId,
                    'updated_at' => now(),
                ]);

                DB::table('reservations')->where('id', $reservation->id)->update([
                    'status' => 'COMPLETED',
                    'confirmed_at' => now(),
                    'completed_at' => now(),
                ]);

                DB::table('purchase_items')->insert([
                    'purchase_id' => $purchaseId,
                    'seat_id' => $reservation->seat_id,
                    'zone_name' => $reservation->zone_name,
                    'price' => $reservation->price,
                    'created_at' => now(),
                ]);
            }

            return [
                'id' => $purchaseId,
                'items' => $activeReservations->map(function (object $r) {
                    return [
                        'seat_id' => $r->seat_id,
                        'zone_name' => $r->zone_name,
                    ];
                })->values()->all(),
            ];
        });

        return response()->json([
            'compres' => [[
                'codi_entrada' => 'ENT-'.str_pad((string) $compra['id'], 6, '0', STR_PAD_LEFT),
                'seients' => array_map(fn (array $item) => [
                    'numero' => (string) $item['seat_id'],
                    'zona' => $item['zone_name'],
                ], $compra['items']),
            ]],
        ], 201);
    }

    public function adminEvents(Request $request): JsonResponse
    {
        if ($auth = $this->ensureAdmin($request)) {
            return $auth;
        }

        $events = DB::table('events')->orderBy('date_time')->get();
        $zones = DB::table('zones')->get()->groupBy('event_id');

        $mapped = $events->map(function (object $event) use ($zones) {
            return [
                'id' => $event->id,
                'nom' => $event->name,
                'data_hora' => $event->date_time,
                'recinte' => $event->venue,
                'descripcio' => $event->description ?? '',
                'estat' => $event->status,
                'zones' => $zones->get($event->id, collect())->map(fn (object $z) => [
                    'id' => $z->id,
                    'nom' => $z->zone_name,
                    'preu' => (float) $z->price,
                ])->values()->all(),
            ];
        })->values()->all();

        return response()->json(['events' => $mapped]);
    }

    public function adminStats(Request $request, int $id): JsonResponse
    {
        if ($auth = $this->ensureAdmin($request)) {
            return $auth;
        }

        $seats = $this->getEventSeatsWithStatus($id);

        $disponibles = count(array_filter($seats, fn (array $s) => $s['status'] === 'AVAILABLE'));
        $reservats = count(array_filter($seats, fn (array $s) => $s['status'] === 'RESERVED'));
        $venuts = count(array_filter($seats, fn (array $s) => $s['status'] === 'SOLD'));
        $total = count($seats);

        $reservesActives = DB::table('reservations')
            ->where('event_id', $id)
            ->where('status', 'PENDING')
            ->where('expires_at', '>', now())
            ->count();

        $compresTotals = DB::table('purchases')
            ->where('event_id', $id)
            ->where('status', 'COMPLETED')
            ->count();

        $recaptacioTotal = (float) DB::table('purchases')
            ->where('event_id', $id)
            ->where('status', 'COMPLETED')
            ->sum('total_price');

        return response()->json([
            'stats' => [
                'seients' => [
                    'disponibles' => $disponibles,
                    'seleccionats' => 0,
                    'venuts' => $venuts,
                    'reservats' => $reservats,
                    'total' => $total,
                ],
                'ocupacio_percentatge' => $total > 0 ? number_format(($venuts / $total) * 100, 2, '.', '') : '0.00',
                'reserves_actives' => $reservesActives,
                'compres_totals' => $compresTotals,
                'recaptacio_total' => $recaptacioTotal,
            ],
        ]);
    }

    public function adminReport(Request $request, int $id): JsonResponse
    {
        if ($auth = $this->ensureAdmin($request)) {
            return $auth;
        }

        $items = DB::table('purchase_items as pi')
            ->join('purchases as p', 'p.id', '=', 'pi.purchase_id')
            ->select('pi.zone_name', 'pi.price')
            ->where('p.event_id', $id)
            ->where('p.status', 'COMPLETED')
            ->get();

        $perZona = [];
        foreach ($items as $item) {
            $zonaNom = $item->zone_name ?: 'Desconeguda';
            if (!isset($perZona[$zonaNom])) {
                $perZona[$zonaNom] = [
                    'nom' => $zonaNom,
                    'preu' => (float) $item->price,
                    'quantitat' => 0,
                    'total' => 0.0,
                ];
            }

            $perZona[$zonaNom]['quantitat']++;
            $perZona[$zonaNom]['total'] += (float) $item->price;
        }

        $zones = array_values($perZona);
        $recaptacioTotal = array_reduce($zones, fn (float $sum, array $z) => $sum + $z['total'], 0.0);

        return response()->json([
            'report' => [
                'recaptacio_per_zona' => $zones,
                'recaptacio_total' => $recaptacioTotal,
                'entrades_venudes' => count($items),
            ],
        ]);
    }

    public function adminCreateEvent(Request $request): JsonResponse
    {
        if ($auth = $this->ensureAdmin($request)) {
            return $auth;
        }

        $nom = $request->input('nom');
        $dataHora = $request->input('data_hora');
        $recinte = $request->input('recinte');
        $descripcio = $request->input('descripcio', '');
        $zones = $request->input('zones', []);

        if (!$nom || !$dataHora || !$recinte) {
            return response()->json(['error' => 'Falten dades obligatories'], 400);
        }

        $eventId = DB::transaction(function () use ($nom, $dataHora, $recinte, $descripcio, $zones) {
            $eventId = DB::table('events')->insertGetId([
                'name' => $nom,
                'date_time' => $dataHora,
                'venue' => $recinte,
                'description' => $descripcio,
                'status' => 'active',
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            if (is_array($zones)) {
                foreach ($zones as $zona) {
                    $zonaNom = (string) ($zona['nom'] ?? 'General');
                    $zoneId = DB::table('zones')->insertGetId([
                        'event_id' => $eventId,
                        'zone_key' => strtolower(str_replace(' ', '_', $zonaNom)),
                        'zone_name' => $zonaNom,
                        'price' => (float) ($zona['preu'] ?? 0),
                        'color' => (string) ($zona['color'] ?? 'rgba(33, 150, 243, 0.8)'),
                    ]);

                    $files = max(1, (int) ($zona['files'] ?? 5));
                    $seientsPerFila = max(1, (int) ($zona['seientsPerFila'] ?? 15));

                    for ($fila = 0; $fila < $files; $fila++) {
                        $filaLletra = chr(65 + $fila);
                        for ($num = 1; $num <= $seientsPerFila; $num++) {
                            DB::table('seats')->insert([
                                'event_id' => $eventId,
                                'zone_id' => $zoneId,
                                'row' => $filaLletra,
                                'seat_number' => $num,
                                'status' => 'AVAILABLE',
                                'created_at' => now(),
                                'updated_at' => now(),
                            ]);
                        }
                    }
                }
            }

            return $eventId;
        });

        return response()->json([
            'event' => [
                'id' => $eventId,
                'nom' => $nom,
            ],
        ], 201);
    }

    public function adminUpdateEvent(Request $request, int $id): JsonResponse
    {
        if ($auth = $this->ensureAdmin($request)) {
            return $auth;
        }

        $event = DB::table('events')->where('id', $id)->first();
        if (!$event) {
            return response()->json(['error' => 'EVENT_NO_TROBAT'], 404);
        }

        $nom = $request->input('nom', $event->name);
        $dataHora = $request->input('data_hora', $event->date_time);
        $recinte = $request->input('recinte', $event->venue);
        $descripcio = $request->input('descripcio', $event->description ?? '');
        $estat = $request->input('estat', $event->status ?? 'active');

        DB::table('events')->where('id', $id)->update([
            'name' => $nom,
            'date_time' => $dataHora,
            'venue' => $recinte,
            'description' => $descripcio,
            'status' => $estat,
            'updated_at' => now(),
        ]);

        return response()->json([
            'event' => [
                'id' => $id,
                'nom' => $nom,
                'data_hora' => $dataHora,
                'recinte' => $recinte,
                'descripcio' => $descripcio,
                'estat' => $estat,
            ],
        ]);
    }

    public function adminDeleteEvent(Request $request, int $id): JsonResponse
    {
        if ($auth = $this->ensureAdmin($request)) {
            return $auth;
        }

        $event = DB::table('events')->where('id', $id)->first();
        if (!$event) {
            return response()->json(['error' => 'EVENT_NO_TROBAT'], 404);
        }

        DB::transaction(function () use ($id) {
            DB::table('purchase_items')->whereIn('purchase_id', function ($q) use ($id) {
                $q->select('id')->from('purchases')->where('event_id', $id);
            })->delete();

            DB::table('purchases')->where('event_id', $id)->delete();

            DB::table('reservations')->where('event_id', $id)->delete();

            DB::table('seats')->where('event_id', $id)->delete();

            DB::table('zones')->where('event_id', $id)->delete();

            DB::table('events')->where('id', $id)->delete();
        });

        return response()->json(['missatge' => 'Esdeveniment eliminat']);
    }

    public function desenvolupaments(): JsonResponse
    {
        $events = DB::table('events')->orderBy('date_time')->get()->map(fn (object $event) => $this->mapEvent($event))->values()->all();

        return response()->json([
            'data' => $events,
            'eventos' => $events,
            'esdeveniments' => $events,
        ]);
    }
}
