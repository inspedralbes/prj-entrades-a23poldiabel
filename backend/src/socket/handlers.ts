import { Server, Socket } from 'socket.io';
import * as reservaService from '../services/reservaService.js';
import * as compraService from '../services/compraService.js';
import * as seientService from '../services/seientService.js';
import { Seient } from '../models/index.js';

export function setupSocketHandlers(io: Server) {
  io.on('connection', (socket: Socket) => {
    console.log(`Client connectat: ${socket.id}`);

    socket.on('join-event', async (data: { esdeveniment_id: string }) => {
      try {
        const { esdeveniment_id } = data;

        socket.join(`event:${esdeveniment_id}`);

        const seients = await seientService.obtenirSeientsPerEsdeveniment(esdeveniment_id);

        socket.emit('event-joined', {
          esdeveniment_id,
          seients,
          reserva_activa: null,
        });
      } catch (error) {
        socket.emit('reservation-error', {
          error: 'ERROR_UNIR_EVENT',
          missatge: 'No s\'ha pogut inicialitzar la sessio de l\'esdeveniment',
        });
      }
    });

    socket.on('leave-event', (data: { esdeveniment_id: string }) => {
      const { esdeveniment_id } = data;
      socket.leave(`event:${esdeveniment_id}`);
    });

    socket.on('reserve-seat', async (data: { seient_id: string; esdeveniment_id: string; reserva_token?: string; usuari_id?: string }) => {
      try {
        const { seient_id, esdeveniment_id, reserva_token, usuari_id } = data;
        let result;
        
        if (reserva_token) {
          const reserva = await reservaService.obtenirReservaPerToken(reserva_token);
          if (reserva && reserva.estat === 'activa') {
            result = await reservaService.afegirSeientAReserva(reserva.id, seient_id);
          } else {
            result = await reservaService.crearReserva(esdeveniment_id, [seient_id], usuari_id, io);
          }
        } else {
          result = await reservaService.crearReserva(esdeveniment_id, [seient_id], usuari_id, io);
        }
        
        const seientActualitzat = result.seients[0];
        
        io.to(`event:${esdeveniment_id}`).emit('seat-selected', {
          seient_id: seientActualitzat.id,
          reserva: {
            id: result.reserva.id,
            token: result.reserva.token,
            data_expiracio: result.reserva.data_expiracio,
          },
        });

        io.to(`event:${esdeveniment_id}`).emit('seat-reserved', {
          seient_id: seientActualitzat.id,
          estat: 'seleccionat',
        });
      } catch (error) {
        if (error instanceof Error && error.message.includes('SEIENTS_NO_DISPONIBLES')) {
          socket.emit('reservation-error', {
            error: 'SEIENT_NO_DISPONIBLE',
            missatge: 'El seient ja no està disponible',
            seient_id: data.seient_id,
          });
        } else if (error instanceof Error && error.message === 'MAX_SEIENTS_ASSOLIT') {
          socket.emit('reservation-error', {
            error: 'MAX_SEIENTS_ASSOLIT',
            missatge: 'Ja has arribat al límit de seients per reserva',
          });
        } else {
          socket.emit('reservation-error', {
            error: 'ERROR_RESERVA',
            missatge: 'Error en fer la reserva',
          });
        }
      }
    });

    socket.on('release-seat', async (data: { seient_id: string; esdeveniment_id: string; reserva_token?: string }) => {
      try {
        const { seient_id, esdeveniment_id, reserva_token } = data;
        
        // Si hi ha token de reserva, validar i alliberar els seients de la reserva
        if (reserva_token) {
          const reserva = await reservaService.obtenirReservaPerToken(reserva_token);
          if (reserva && reserva.estat === 'activa') {
            await reservaService.alliberarReserva(reserva.id);
            
            // Alliberar tots els seients de la reserva
            for (const seient of reserva.seients || []) {
              io.to(`event:${esdeveniment_id}`).emit('seat-released', {
                seient_id: seient.id,
                estat: 'disponible',
              });
            }
          }
        } else {
          // Alliberar un seient individual (per compatibilitat)
          await seientService.obtenirSeientPerId(seient_id);
          const seient = await Seient.findByPk(seient_id);
          if (seient) {
            await seient.update({ estat: 'disponible' });
            io.to(`event:${esdeveniment_id}`).emit('seat-released', {
              seient_id,
              estat: 'disponible',
            });
          }
        }
      } catch (error) {
        socket.emit('reservation-error', {
          error: 'ERROR_ALLIBERAR',
          missatge: 'Error en alliberar el seient',
        });
      }
    });

    socket.on('confirm-purchase', async (data: { reserva_token: string; usuari: { nom: string; correu: string }; esdeveniment_id: string }) => {
      try {
        const { reserva_token, usuari, esdeveniment_id } = data;
        
        const entrades = await compraService.confirmarCompra(reserva_token, usuari);
        
        const seientIds = entrades.flatMap((e: any) => e.seients?.map((s: any) => s.id) || []);
        
        for (const seientId of seientIds) {
          io.to(`event:${esdeveniment_id}`).emit('seat-sold', {
            seient_id: seientId,
            estat: 'venut',
          });
        }
        
        socket.emit('reservation-confirmed', {
          entrades: entrades.map((entrada: any) => ({
            codi_entrada: entrada.codi_entrada,
            seients: entrada.seients,
          })),
        });
      } catch (error) {
        if (error instanceof Error) {
          if (error.message === 'RESERVA_EXPIRADA') {
            socket.emit('reservation-error', {
              error: 'RESERVA_EXPIRADA',
              missatge: 'La teva reserva ha expirat',
            });
            return;
          }
        }
        socket.emit('reservation-error', {
          error: 'ERROR_COMPRA',
          missatge: 'Error en confirmar la compra',
        });
      }
    });

    socket.on('disconnect', () => {
      console.log(`Client desconnectat: ${socket.id}`);
    });
  });
}
