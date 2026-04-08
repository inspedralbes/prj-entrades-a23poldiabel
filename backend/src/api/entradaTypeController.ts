import { Router } from 'express';

const router = Router();

// Tipos de entrada disponibles
const tiposEntrada = [
  {
    id: 'vip',
    nom: 'VIP',
    descripcio: 'Accés VIP amb millors vistes i serveis',
    preu: 150,
    icona: '✨',
    avantatges: ['Millors vistes', 'Parking prioritari', 'Accés sala VIP']
  },
  {
    id: 'platea',
    nom: 'Platea',
    descripcio: 'Entrada estàndard amb bona localització',
    preu: 80,
    icona: '🎭',
    avantatges: ['Bona visibilitat', 'Zona còmoda']
  },
  {
    id: 'general',
    nom: 'General',
    descripcio: 'Entrada general a preu assequible',
    preu: 40,
    icona: '🎫',
    avantatges: ['Accés a tot l\'event']
  }
];

router.get('/', async (req, res) => {
  res.json({ tipos: tiposEntrada });
});

router.get('/:id', async (req, res) => {
  const tipo = tiposEntrada.find(t => t.id === req.params.id);
  if (!tipo) {
    return res.status(404).json({ error: 'Tipo de entrada no encontrado' });
  }
  res.json(tipo);
});

export default router;
