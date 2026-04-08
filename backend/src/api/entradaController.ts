import { Router } from 'express';
import * as entradaService from '../services/entradaService.js';
import { validateCorreuQuery } from '../middleware/validation.js';
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

    const entrades = await entradaService.obtenirEntradesPerUsuari(decoded.id);

    res.json({
      entrades: entrades.map(entrada => ({
        id: entrada.id,
        codi_entrada: entrada.codi_entrada,
        esdeveniment: (entrada as any).esdeveniment,
        seients: (entrada as any).seients?.map((s: any) => ({
          id: s.id,
          numero: s.numero,
          fila: s.fila,
          zona: s.zona?.nom,
        })),
        data_compra: entrada.data_compra,
      })),
    });
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(createError('Token invàlid', 401, 'TOKEN_INVALID'));
    } else {
      next(error);
    }
  }
});

router.get('/', validateCorreuQuery, async (req, res, next) => {
  try {
    const { correu } = req.query;

    const entrades = await entradaService.cercarEntradesPerCorreu(correu as string);

    res.json({
      entrades: entrades.map(entrada => ({
        codi_entrada: entrada.codi_entrada,
        esdeveniment: (entrada as any).esdeveniment,
        seients: (entrada as any).seients?.map((s: any) => ({
          numero: s.numero,
          fila: s.fila,
          zona: s.zona?.nom,
        })),
        data_compra: entrada.data_compra,
      })),
    });
  } catch (error) {
    next(error);
  }
});

router.get('/:codi', async (req, res, next) => {
  try {
    const { codi } = req.params;
    const entrada = await entradaService.obtenirEntradaPerCodi(codi);

    if (!entrada) {
      res.status(404).json({ error: 'Entrada no trobada' });
      return;
    }

    res.json({
      codi_entrada: entrada.codi_entrada,
      esdeveniment: (entrada as any).esdeveniment,
      seients: (entrada as any).seients,
      comprador: (entrada as any).usuari,
      data_compra: entrada.data_compra,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
