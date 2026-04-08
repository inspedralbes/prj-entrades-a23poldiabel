import { Router } from 'express';
import * as reservaService from '../services/reservaService.js';
import { validateReserva } from '../middleware/validation.js';
import { createError } from '../middleware/errorHandler.js';

import jwt from 'jsonwebtoken';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'secret-key-change-in-production';

router.get('/usuari', async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw createError('Token no proporcionat', 401, 'TOKEN_FALTANT');
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string };

    const reserves = await reservaService.obtenirReservesActivesPerUsuari(decoded.id);

    res.json({ reserves });
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(createError('Token invàlid', 401, 'TOKEN_INVALID'));
    } else {
      next(error);
    }
  }
});

router.post('/', validateReserva, async (req, res, next) => {
  try {
    const { esdeveniment_id, seient_ids } = req.body;

    const result = await reservaService.crearReserva(esdeveniment_id, seient_ids);

    res.status(201).json({
      id: result.reserva.id,
      token: result.reserva.token,
      data_inici: result.reserva.data_inici,
      data_expiracio: result.reserva.data_expiracio,
      seients: result.seients.map(s => ({
        id: s.id,
        numero: s.numero,
        fila: s.fila,
        estat: s.estat,
      })),
    });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('SEIENTS_NO_DISPONIBLES:')) {
      const ids = error.message.split(':')[1].split(',');
      next(createError('Un o més seients ja no estan disponibles', 409, 'SEIENT_NO_DISPONIBLE'));
      return;
    }
    next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    await reservaService.alliberarReserva(id);
    res.json({ missatge: 'Reserva alliberada' });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'RESERVA_NO_TROBADA') {
        next(createError('Reserva no trobada', 404, 'RESERVA_NO_TROBADA'));
        return;
      }
      if (error.message === 'NO_TE_PERMIS') {
        next(createError('No tens permís per alliberar aquesta reserva', 403, 'NO_TE_PERMIS'));
        return;
      }
    }
    next(error);
  }
});

router.get('/token/:token', async (req, res, next) => {
  try {
    const { token } = req.params;
    const reserva = await reservaService.obtenirReservaPerToken(token);
    
    if (!reserva) {
      throw createError('Reserva no trobada', 404, 'RESERVA_NO_TROBADA');
    }

    res.json(reserva);
  } catch (error) {
    next(error);
  }
});

export default router;
