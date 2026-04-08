import { Router, Request, Response, NextFunction } from 'express';
import { Esdeveniment, Zona, Seient, Reserva, Entrada, Op } from '../models/index.js';
import { crearZonesISeients } from '../services/seientService.js';

const router = Router();

// Middleware per verificar que l'usuari és admin
async function verificarAdmin(req: Request, res: Response, next: NextFunction) {
  // En una aplicació real, esto validaria JWT i rol
  // Per ara, deixarem pasar tots els requests (a millorar)
  next();
}

// POST /api/admin/events - Crear nou event
router.post('/events', verificarAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { nom, data_hora, recinte, descripcio, imatge, zones } = req.body;

    if (!nom || !data_hora || !recinte) {
      return res.status(400).json({ error: 'DADES_INCOMPLETES', message: 'Falten dades obligatòries' });
    }

    const event = await Esdeveniment.create({
      nom,
      data_hora: new Date(data_hora),
      recinte,
      descripcio,
      imatge,
      estat: 'actiu',
    });

    // Crear zones i seients si es defineixen
    if (zones && Array.isArray(zones)) {
      await crearZonesISeients(event.id, zones);
    }

    const eventAmbZones = await Esdeveniment.findByPk(event.id, {
      include: [{ model: Zona, as: 'zones' }]
    });

    res.status(201).json({ event: eventAmbZones });
  } catch (error) {
    next(error);
  }
});

// PUT /api/admin/events/:id - Editar event
router.put('/events/:id', verificarAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { nom, data_hora, recinte, descripcio, imatge, estat } = req.body;

    const event = await Esdeveniment.findByPk(id);
    if (!event) {
      return res.status(404).json({ error: 'EVENT_NO_TROBAT' });
    }

    await event.update({
      nom: nom || event.nom,
      data_hora: data_hora ? new Date(data_hora) : event.data_hora,
      recinte: recinte || event.recinte,
      descripcio: descripcio || event.descripcio,
      imatge: imatge || event.imatge,
      estat: estat || event.estat,
    });

    const updatedEvent = await Esdeveniment.findByPk(id, {
      include: [{ model: Zona, as: 'zones' }]
    });

    res.json({ event: updatedEvent });
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/events/:id/stats - Estadístiques en temps real
router.get('/events/:id/stats', verificarAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const event = await Esdeveniment.findByPk(id);
    if (!event) {
      return res.status(404).json({ error: 'EVENT_NO_TROBAT' });
    }

    // Contar seients per estat
    const seientsPerZona = await Zona.findAll({
      where: { esdeveniment_id: id },
      include: [{
        model: Seient,
        as: 'seients',
        attributes: ['id', 'estat'],
      }]
    });

    let disponibles = 0, seleccionats = 0, venuts = 0, reservats = 0;
    seientsPerZona.forEach(zona => {
      zona.seients?.forEach(seient => {
        if (seient.estat === 'disponible') disponibles++;
        else if (seient.estat === 'seleccionat') seleccionats++;
        else if (seient.estat === 'venut') venuts++;
        else if (seient.estat === 'reservat') reservats++;
      });
    });

    // Comptar reserves actives
    const reservesActives = await Reserva.count({
      where: {
        esdeveniment_id: id,
        estat: 'activa',
        data_expiracio: { [Op.gt]: new Date() }
      }
    });

    // Comptar compres
    const compres = await Entrada.count({
      where: { esdeveniment_id: id }
    });

    // Calcular recaptació
    const entrades = await Entrada.findAll({
      where: { esdeveniment_id: id },
      include: [{
        model: Seient,
        as: 'seients',
        attributes: [],
        through: { attributes: [] }
      }]
    });

    const recaptacioTotal = 0; // Aquí caldria relacionar amb preus de zones

    res.json({
      stats: {
        seients: {
          disponibles,
          seleccionats,
          venuts,
          reservats,
          total: disponibles + seleccionats + venuts + reservats
        },
        ocupacio_percentatge: ((venuts + seleccionats) / (disponibles + seleccionats + venuts + reservats) * 100).toFixed(2),
        reserves_actives: reservesActives,
        compres_totals: compres,
        recaptacio_total: recaptacioTotal,
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/events/:id/report - Informes de vendes
router.get('/events/:id/report', verificarAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const event = await Esdeveniment.findByPk(id, {
      include: [{
        model: Entrada,
        as: 'entrades',
        include: [{
          model: Seient,
          as: 'seients',
          include: [{
            model: Zona,
            as: 'zona',
            attributes: ['nom', 'preu']
          }]
        }]
      }]
    });

    if (!event) {
      return res.status(404).json({ error: 'EVENT_NO_TROBAT' });
    }

    // Agrupar recaptació per zona
    const recaptacioPerZona: Record<string, { nom: string; preu: number; quantitat: number; total: number }> = {};

    event.entrades?.forEach(entrada => {
      entrada.seients?.forEach(seient => {
        const zona = (seient as any).zona;
        if (zona) {
          if (!recaptacioPerZona[zona.nom]) {
            recaptacioPerZona[zona.nom] = { nom: zona.nom, preu: zona.preu, quantitat: 0, total: 0 };
          }
          recaptacioPerZona[zona.nom].quantitat++;
          recaptacioPerZona[zona.nom].total = recaptacioPerZona[zona.nom].quantitat * zona.preu;
        }
      });
    });

    const recaptacioTotal = Object.values(recaptacioPerZona).reduce((sum, z) => sum + z.total, 0);

    res.json({
      report: {
        event_nom: event.nom,
        recaptacio_per_zona: Object.values(recaptacioPerZona),
        recaptacio_total: recaptacioTotal,
        entrades_venudes: event.entrades?.length || 0,
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/events - Llistar tots els events
router.get('/events', verificarAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const events = await Esdeveniment.findAll({
      include: [{ model: Zona, as: 'zones' }]
    });
    res.json({ events });
  } catch (error) {
    next(error);
  }
});

export default router;
