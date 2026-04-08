import { Router } from 'express';
import * as compraService from '../services/compraService.js';
import { validateCompra } from '../middleware/validation.js';
import { createError } from '../middleware/errorHandler.js';

const router = Router();

router.post('/', validateCompra, async (req, res, next) => {
  try {
    const { reserva_token, usuari } = req.body;

    const entrades = await compraService.confirmarCompra(reserva_token, usuari);

    res.status(201).json({
      compres: entrades.map(entrada => ({
        codi_entrada: entrada.codi_entrada,
        esdeveniment: (entrada as any).esdeveniment,
        seients: (entrada as any).seients?.map((s: any) => ({
          numero: s.numero,
          fila: s.fila,
          zona: s.zona?.nom,
        })),
      })),
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'RESERVA_NO_TROBADA') {
        next(createError('Reserva no trobada', 404, 'RESERVA_NO_TROBADA'));
        return;
      }
      if (error.message === 'RESERVA_EXPIRADA') {
        next(createError('La reserva ha expirat', 400, 'RESERVA_EXPIRADA'));
        return;
      }
    }
    next(error);
  }
});

export default router;
