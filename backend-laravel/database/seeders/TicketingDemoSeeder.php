<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class TicketingDemoSeeder extends Seeder
{
    /**
     * Seed demo events, zones and seats if no events exist.
     */
    public function run(): void
    {
        $eventsCount = DB::table('events')->count();
        if ($eventsCount > 0) {
            return;
        }

        $demoEvents = [
            [
                'name' => 'Nit Indie Barcelona',
                'date_time' => now()->addDays(15)->setTime(21, 0),
                'venue' => 'Sala Pedralbes',
                'description' => 'Concert amb bandes indie emergents i artistes convidats.',
                'image_url' => null,
            ],
            [
                'name' => 'Festival Electro Summer',
                'date_time' => now()->addDays(28)->setTime(22, 30),
                'venue' => 'Recinte Firal Barcelona',
                'description' => 'Sessio especial de DJ amb escenari immersiu i visuals en directe.',
                'image_url' => null,
            ],
            [
                'name' => 'Simfonica del Capvespre',
                'date_time' => now()->addDays(40)->setTime(19, 30),
                'venue' => 'Auditori Central',
                'description' => 'Repertori de bandes sonores i peces classiques contemporanies.',
                'image_url' => null,
            ],
        ];

        foreach ($demoEvents as $event) {
            $eventId = DB::table('events')->insertGetId([
                'name' => $event['name'],
                'date_time' => $event['date_time'],
                'venue' => $event['venue'],
                'description' => $event['description'],
                'image_url' => $event['image_url'],
                'status' => 'active',
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $zones = [
                ['key' => 'platea', 'name' => 'Platea', 'price' => 55.00, 'color' => 'rgba(33,150,243,0.8)', 'rows' => 5, 'seats_per_row' => 12],
                ['key' => 'graderia', 'name' => 'Graderia', 'price' => 35.00, 'color' => 'rgba(76,175,80,0.8)', 'rows' => 4, 'seats_per_row' => 14],
                ['key' => 'vip', 'name' => 'VIP', 'price' => 95.00, 'color' => 'rgba(255,193,7,0.8)', 'rows' => 2, 'seats_per_row' => 8],
            ];

            foreach ($zones as $zone) {
                $zoneId = DB::table('zones')->insertGetId([
                    'event_id' => $eventId,
                    'zone_key' => $zone['key'],
                    'zone_name' => $zone['name'],
                    'price' => $zone['price'],
                    'color' => $zone['color'],
                ]);

                for ($r = 0; $r < $zone['rows']; $r++) {
                    $rowLetter = chr(65 + $r);

                    for ($seat = 1; $seat <= $zone['seats_per_row']; $seat++) {
                        DB::table('seats')->insert([
                            'event_id' => $eventId,
                            'zone_id' => $zoneId,
                            'row' => $rowLetter,
                            'seat_number' => $seat,
                            'status' => 'AVAILABLE',
                            'created_at' => now(),
                            'updated_at' => now(),
                        ]);
                    }
                }
            }
        }
    }
}
