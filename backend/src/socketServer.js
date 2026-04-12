import dotenv from 'dotenv';
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
      const userId = Number(data?.userId || data?.usuari_id) || null;

      if (!eventId) {
        socket.emit('error', { message: 'eventId es obligatori' });
        return;
      }

      socket.join(`event-${eventId}`);
      userSessions.set(socket.id, {
        userId,
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
      const userId = parseInt(String(data?.usuari_id || data?.userId || 1), 10) || 1;

      try {
        const session = userSessions.get(socket.id);
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
      const userId = parseInt(String(data?.userId || 1), 10) || 1;

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
    });

    socket.on('release-seat', async (data) => {
      const seatId = parseInt(String(data?.seatId || data?.seient_id || 0), 10);
      const eventId = parseInt(String(data?.eventId || data?.esdeveniment_id || 0), 10);
      const userId = parseInt(String(data?.userId || data?.usuari_id || 1), 10) || 1;

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
    });

    socket.on('purchase-confirm', async (data) => {
      const seatId = parseInt(String(data?.seatId || data?.seient_id || 0), 10);
      const eventId = parseInt(String(data?.eventId || data?.esdeveniment_id || 0), 10);
      const userId = parseInt(String(data?.userId || data?.usuari_id || 1), 10) || 1;

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

      const userId = session.userId || 1;
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
    });

    socket.on('disconnect', async () => {
      const session = userSessions.get(socket.id);
      if (!session) {
        return;
      }

      const userId = session.userId || 1;
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
