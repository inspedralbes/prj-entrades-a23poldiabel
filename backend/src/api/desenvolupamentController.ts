import { Router } from 'express';
import * as desenvolupamentService from '../services/desenvolupamentService.js';
import { createError } from '../middleware/errorHandler.js';

const router = Router();

// Obtener todos los eventos de Ticketmaster
router.get('/', async (req, res, next) => {
  try {
    const eventos = await desenvolupamentService.obtenirTotsEsdeveniments();
    res.json({ 
      data: eventos,
      eventos: eventos, // Para compatibilidad
      acontecimientos: eventos // También alias para Ticketmaster
    });
  } catch (error) {
    next(error);
  }
});

// Obtener evento específico de Ticketmaster
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const event = await desenvolupamentService.obtenirEsdevenimentPerId(id);
    
    if (!event) {
      throw createError('Event no encontrado', 404, 'EVENT_NOT_FOUND');
    }

    res.json({ 
      data: event,
      event: event // Para compatibilidad
    });
  } catch (error) {
    next(error);
  }
});

export default router;
