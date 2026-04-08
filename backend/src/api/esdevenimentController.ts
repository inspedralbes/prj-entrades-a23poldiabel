import { Router } from 'express';
import * as esdevenimentService from '../services/esdevenimentService.js';
import { validateEsdeveniment } from '../middleware/validation.js';
import { createError } from '../middleware/errorHandler.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const esdeveniments = await esdevenimentService.obtenirTotsEsdeveniments();
    res.json({ esdeveniments });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const esdeveniment = await esdevenimentService.obtenirEsdevenimentPerId(id);
    
    if (!esdeveniment) {
      throw createError('Esdeveniment no trobat', 404, 'ESDEVENIMENT_NO_TROBAT');
    }

    res.json(esdeveniment);
  } catch (error) {
    next(error);
  }
});

router.post('/', validateEsdeveniment, async (req, res, next) => {
  try {
    const { nom, data_hora, recinte, descripcio } = req.body;
    const esdeveniment = await esdevenimentService.crearEsdeveniment({
      nom,
      data_hora: new Date(data_hora),
      recinte,
      descripcio,
    });
    res.status(201).json(esdeveniment);
  } catch (error) {
    next(error);
  }
});

router.put('/:id', validateEsdeveniment, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { nom, data_hora, recinte, descripcio, estat } = req.body;
    
    const esdeveniment = await esdevenimentService.actualitzarEsdeveniment(id, {
      nom,
      data_hora: new Date(data_hora),
      recinte,
      descripcio,
      estat,
    });

    if (!esdeveniment) {
      throw createError('Esdeveniment no trobat', 404, 'ESDEVENIMENT_NO_TROBAT');
    }

    res.json(esdeveniment);
  } catch (error) {
    next(error);
  }
});

export default router;
