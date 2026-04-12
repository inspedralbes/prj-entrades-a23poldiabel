import dotenv from 'dotenv';
import crypto from 'crypto';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { connectDatabase } from './config/database.js';
import {
  attemptSeatReservation,
  confirmSeatPurchase,
  expireOldReservations,
  getEventSeatsWithStatus,
  releaseSeatReservation,
} from './services/reservaService.js';

dotenv.config();

const SOCKET_PORT = parseInt(process.env.SOCKET_PORT || process.env.PORT || '3000', 10);
const MAX_SEATS_PER_RESERVATION = parseInt(process.env.MAX_SEIENTS_PER_RESERVA || '6', 10);
const JWT_SECRET = process.env.JWT_SECRET || process.env.APP_KEY || 'dev-secret';
const corsOrigins = (process.env.SOCKET_CORS_ORIGINS || process.env.CORS_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const httpServer = createServer();
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: corsOrigins,
    credentials: true,
  },
});

const userSessions = new Map();
const actionWindow = new Map();

function base64UrlEncode(buffer) {
  return buffer.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function base64UrlDecode(payload) {
  const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
  const padding = normalized.length % 4;
  const withPadding = padding === 0 ? normalized : normalized + '='.repeat(4 - padding);
  return Buffer.from(withPadding, 'base64').toString('utf8');
}

function verifyToken(rawToken) {
  if (!rawToken || typeof rawToken !== 'string') {
    return null;
  }

  const token = rawToken.startsWith('Bearer ') ? rawToken.slice(7) : rawToken;
  const parts = token.split('.');
  if (parts.length !== 3) {
    return null;
  }

  const [header, payload, signature] = parts;
  const expected = base64UrlEncode(
    crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${payload}`).digest()
  );

  if (expected !== signature) {
    return null;
  }

  try {
    const data = JSON.parse(base64UrlDecode(payload));
    if (!data?.id) {
      return null;
    }
    if (data.exp && Number(data.exp) < Math.floor(Date.now() / 1000)) {
      return null;
    }
    return {
      id: Number(data.id),
      role: data.role || 'comprador',
      email: data.email || '',
    };
  } catch {
    return null;
  }
}

function getUserFromSocket(socket, data) {
  const token =
    data?.token
    || socket.handshake?.auth?.token
    || socket.handshake?.headers?.authorization
    || null;

  return verifyToken(token);
}

function isRateLimited(userId, action, limit, windowMs) {
  const now = Date.now();
  const key = `${userId}:${action}`;
  const timestamps = actionWindow.get(key) || [];
  const fresh = timestamps.filter((t) => now - t < windowMs);

  if (fresh.length >= limit) {
    actionWindow.set(key, fresh);
    return true;
  }

  fresh.push(now);
  actionWindow.set(key, fresh);
  return false;
}

function mapSeatStatus(status) {
  switch (status) {
    case 'AVAILABLE':
      return 'disponible';
    case 'RESERVED':
      return 'reservat';
    case 'SOLD':
      return 'venut';
    default:
      return 'disponible';
  }
}

async function bootstrap() {
  await connectDatabase();

  io.on('connection', (socket) => {
    console.log(`[socket] Nova connexio: ${socket.id}`);

    socket.on('join-event', async (data) => {
      const eventId = data?.eventId || data?.esdeveniment_id;
      const user = getUserFromSocket(socket, data);

      if (!eventId) {
        socket.emit('error', { message: 'eventId es obligatori' });
        return;
      }

      if (!user?.id) {
        socket.emit('auth-error', {
          error: 'NO_AUTENTICAT',
          missatge: 'Cal iniciar sessio per accedir al temps real',
        });
        return;
      }

      socket.join(`event-${eventId}`);
      userSessions.set(socket.id, {
        userId: user.id,
        role: user.role,
        eventId: String(eventId),
        seatIds: [],
      });

      try {
        const seats = await getEventSeatsWithStatus(parseInt(String(eventId), 10));
        const seients = seats.map((s) => ({
          id: String(s.id),
          zona_id: String(s.zone_id),
          numero: String(s.seat_number),
          fila: s.row,
          estat: mapSeatStatus(s.status),
          zona: {
            id: String(s.zone_id),
            nom: s.zone || '',
            preu: s.price || 0,
          },
        }));

        socket.emit('event-joined', {
          esdeveniment_id: eventId,
          seients,
          reserva_activa: null,
        });

        socket.emit('seats-state', { seats });

        const roomSize = io.sockets.adapter.rooms.get(`event-${eventId}`)?.size || 0;
        io.to(`event-${eventId}`).emit('user-joined', { userCount: roomSize });
      } catch (error) {
        console.error('[socket] Error join-event:', error);
        socket.emit('error', { message: 'Error carregant seients' });
      }
    });

    socket.on('leave-event', (data) => {
      const eventId = data?.eventId || data?.esdeveniment_id;
      if (eventId) {
        socket.leave(`event-${eventId}`);
      }
    });

    socket.on('reserve-seat', async (data) => {
      const seatId = parseInt(String(data?.seient_id || data?.seatId || 0), 10);
      const eventId = parseInt(String(data?.esdeveniment_id || data?.eventId || 0), 10);
      const session = userSessions.get(socket.id);
      const userId = Number(session?.userId || 0);

      try {
        if (!session || !userId || String(session.eventId) !== String(eventId)) {
          socket.emit('auth-error', {
            error: 'NO_AUTENTICAT',
            missatge: 'Sessio de temps real invalida o caducada',
          });
          return;
        }

        if (isRateLimited(userId, 'reserve-seat', 20, 10000)) {
          socket.emit('reservation-error', {
            error: 'MASSA_SOL_LICITUDS',
            missatge: 'Massa intents de reserva. Torna-ho a provar en uns segons.',
          });
          return;
        }

        if (session && session.seatIds.length >= MAX_SEATS_PER_RESERVATION) {
          socket.emit('reservation-error', {
            error: 'MAX_SEIENTS_ASSOLIT',
            missatge: `Ja has arribat al limit de ${MAX_SEATS_PER_RESERVATION} seients per reserva`,
          });
          return;
        }

        const result = await attemptSeatReservation(userId, eventId, seatId);

        if (!result.success) {
          socket.emit('reservation-error', {
            error: 'SEIENT_NO_DISPONIBLE',
            missatge: result.message || 'El seient ja no esta disponible',
            seient_id: String(seatId),
          });
          socket.emit('reservation-failed', {
            seatId,
            message: result.message,
          });
          return;
        }

        if (session) {
          session.userId = userId;
          session.eventId = String(eventId);
          session.seatIds.push(seatId);
        }

        socket.emit('reservation-confirmed', {
          seatId,
          reservation: result.reservation,
        });

        socket.emit('seat-selected', {
          seient_id: String(seatId),
          reserva: {
            id: result.reservation?.id,
            token: String(result.reservation?.id || ''),
            data_expiracio: result.reservation?.expires_at,
          },
        });

        io.to(`event-${eventId}`).emit('seat-reserved', {
          seient_id: String(seatId),
          seatId,
          estat: 'reservat',
          reserved_by: userId,
          expires_at: result.reservation?.expires_at,
        });
      } catch (error) {
        console.error('[socket] Error reserve-seat:', error);
        socket.emit('reservation-error', {
          error: 'ERROR_RESERVA',
          missatge: 'Error en fer la reserva',
        });
      }
    });

    socket.on('select-seat', async (data) => {
      const seatId = parseInt(String(data?.seatId || 0), 10);
      const eventId = parseInt(String(data?.eventId || 0), 10);
      const session = userSessions.get(socket.id);
      const userId = Number(session?.userId || 0);

      try {
        if (!session || !userId || String(session.eventId) !== String(eventId)) {
          socket.emit('auth-error', {
            error: 'NO_AUTENTICAT',
            missatge: 'Sessio de temps real invalida o caducada',
          });
          return;
        }

        if (isRateLimited(userId, 'select-seat', 20, 10000)) {
          socket.emit('reservation-failed', {
            seatId,
            message: 'Massa intents seguits. Torna-ho a provar en uns segons.',
          });
          return;
        }

        const result = await attemptSeatReservation(userId, eventId, seatId);
        if (result.success) {
          socket.emit('reservation-confirmed', {
            seatId,
            reservation: result.reservation,
          });

          io.to(`event-${eventId}`).emit('seat-reserved', {
            seient_id: String(seatId),
            seatId,
            estat: 'reservat',
            reserved_by: userId,
            expires_at: result.reservation?.expires_at,
          });
        } else {
          socket.emit('reservation-failed', {
            seatId,
            message: result.message,
          });
        }
      } catch (error) {
        console.error('[socket] Error select-seat:', error);
        socket.emit('reservation-failed', {
          seatId,
          message: 'Error en seleccionar seient',
        });
      }
    });

    socket.on('release-seat', async (data) => {
      const seatId = parseInt(String(data?.seatId || data?.seient_id || 0), 10);
      const eventId = parseInt(String(data?.eventId || data?.esdeveniment_id || 0), 10);
      const session = userSessions.get(socket.id);
      const userId = Number(session?.userId || 0);

      try {
        if (!session || !userId || String(session.eventId) !== String(eventId)) {
          socket.emit('auth-error', {
            error: 'NO_AUTENTICAT',
            missatge: 'Sessio de temps real invalida o caducada',
          });
          return;
        }

        if (isRateLimited(userId, 'release-seat', 25, 10000)) {
          socket.emit('reservation-error', {
            error: 'MASSA_SOL_LICITUDS',
            missatge: 'Massa intents d\'alliberament. Torna-ho a provar en uns segons.',
          });
          return;
        }

        const success = await releaseSeatReservation(seatId, userId);
        if (success) {
          const session = userSessions.get(socket.id);
          if (session) {
            session.seatIds = session.seatIds.filter((id) => id !== seatId);
          }

          io.to(`event-${eventId}`).emit('seat-released', {
            seatId,
            seient_id: String(seatId),
            estat: 'disponible',
          });
        }
      } catch (error) {
        console.error('[socket] Error release-seat:', error);
        socket.emit('reservation-error', {
          error: 'ERROR_ALLIBERAR',
          missatge: 'No s\'ha pogut alliberar el seient',
        });
      }
    });

    socket.on('purchase-confirm', async (data) => {
      const seatId = parseInt(String(data?.seatId || data?.seient_id || 0), 10);
      const eventId = parseInt(String(data?.eventId || data?.esdeveniment_id || 0), 10);
      const session = userSessions.get(socket.id);
      const userId = Number(session?.userId || 0);

      try {
        if (!session || !userId || String(session.eventId) !== String(eventId)) {
          socket.emit('auth-error', {
            error: 'NO_AUTENTICAT',
            missatge: 'Sessio de temps real invalida o caducada',
          });
          return;
        }

        if (isRateLimited(userId, 'purchase-confirm', 10, 10000)) {
          socket.emit('purchase-failed', {
            seatId,
            message: 'Massa intents de compra. Torna-ho a provar en uns segons.',
          });
          return;
        }

        const result = await confirmSeatPurchase(seatId, userId);
        if (!result.success) {
          socket.emit('purchase-failed', { seatId, message: result.message });
          return;
        }

        const session = userSessions.get(socket.id);
        if (session) {
          session.seatIds = session.seatIds.filter((id) => id !== seatId);
        }

        socket.emit('purchase-completed', { seatId });
        io.to(`event-${eventId}`).emit('seat-sold', {
          seatId,
          seient_id: String(seatId),
          estat: 'venut',
          purchased_by: userId,
        });
      } catch (error) {
        console.error('[socket] Error purchase-confirm:', error);
        socket.emit('purchase-failed', { seatId, message: 'Error en confirmar compra' });
      }
    });

    socket.on('confirm-purchase', async (data) => {
      const eventId = String(data?.esdeveniment_id || '');
      const session = userSessions.get(socket.id);

      if (!session || session.seatIds.length === 0) {
        socket.emit('reservation-error', {
          error: 'ERROR_COMPRA',
          missatge: 'No hi ha seients reservats',
        });
        return;
      }

      try {
        const userId = Number(session.userId || 0);
        if (!userId) {
          socket.emit('reservation-error', {
            error: 'NO_AUTENTICAT',
            missatge: 'Sessio de temps real invalida o caducada',
          });
          return;
        }

        if (isRateLimited(userId, 'confirm-purchase', 10, 10000)) {
          socket.emit('reservation-error', {
            error: 'MASSA_SOL_LICITUDS',
            missatge: 'Massa intents de compra. Torna-ho a provar en uns segons.',
          });
          return;
        }

        for (const seatId of [...session.seatIds]) {
          const result = await confirmSeatPurchase(seatId, userId);
          if (result.success) {
            io.to(`event-${eventId}`).emit('seat-sold', {
              seient_id: String(seatId),
              estat: 'venut',
            });
          }
        }

        session.seatIds = [];
        socket.emit('reservation-confirmed', {
          entrades: [{ codi_entrada: `ENT-${Date.now()}` }],
        });
      } catch (error) {
        console.error('[socket] Error confirm-purchase:', error);
        socket.emit('reservation-error', {
          error: 'ERROR_COMPRA',
          missatge: 'Error en confirmar la compra',
        });
      }
    });

    socket.on('disconnect', async () => {
      const session = userSessions.get(socket.id);
      if (!session) {
        return;
      }

      const userId = Number(session.userId || 0);
      if (!userId) {
        userSessions.delete(socket.id);
        return;
      }
      for (const seatId of session.seatIds) {
        try {
          const released = await releaseSeatReservation(seatId, userId);
          if (released && session.eventId) {
            io.to(`event-${session.eventId}`).emit('seat-released', {
              seatId,
              seient_id: String(seatId),
              estat: 'disponible',
            });
          }
        } catch (error) {
          console.error('[socket] Error releasing on disconnect:', error);
        }
      }

      userSessions.delete(socket.id);
    });
  });

  setInterval(async () => {
    try {
      const expired = await expireOldReservations();
      if (expired > 0) {
        io.emit('reservations-expired', { count: expired });
      }
    } catch (error) {
      console.error('[socket] Cleanup error:', error);
    }
  }, 60000);

  httpServer.listen(SOCKET_PORT, () => {
    console.log(`Socket server escoltant al port ${SOCKET_PORT}`);
  });
}

bootstrap().catch((error) => {
  console.error('Error inicialitzant servidor de sockets:', error);
  process.exit(1);
});
