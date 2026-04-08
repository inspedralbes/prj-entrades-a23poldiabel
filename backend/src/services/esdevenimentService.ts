import { Esdeveniment, Zona, Seient } from '../models/index.js';
import * as tmService from './ticketmasterService.js';
import { crearZonesISeients } from './seientService.js';

interface LocalEvent {
  id: string;
  nom: string;
  data_hora: Date;
  recinte: string;
  descripcio?: string;
  imatge?: string;
  estat: string;
  zones?: Zona[];
}

interface ExternalEvent {
  id: string;
  nom: string;
  data_hora: string;
  recinte: string;
  descripcio: string;
  imatge?: string;
  estat: 'actiu';
  isExternal: boolean;
}

function esUuid(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
}

export async function obtenirTotsEsdeveniments(): Promise<(LocalEvent | ExternalEvent)[]> {
  const localEvents = await Esdeveniment.findAll({
    where: { estat: 'actiu' },
    include: [
      {
        model: Zona,
        as: 'zones',
        attributes: ['id', 'nom', 'preu', 'capacitat'],
      },
    ],
    order: [['data_hora', 'ASC']],
  });

  const tmEvents = await tmService.fetchTMEvents();
  
  const combined: (LocalEvent | ExternalEvent)[] = localEvents.map(e => e.toJSON() as LocalEvent);
  
  for (const tm of tmEvents) {
    const exists = combined.find(e => e.nom === tm.name);
    if (!exists) {
      combined.push({
        id: tm.id,
        nom: tm.name,
        data_hora: tm.dates.start.dateTime,
        recinte: tm._embedded?.venues?.[0]?.name || 'Unknown Venue',
        descripcio: tm.description || '',
        imatge: tm.images?.sort((a, b) => b.width - a.width)[0]?.url,
        estat: 'actiu',
        isExternal: true
      });
    }
  }

  return combined;
}

async function importTMEvent(tmId: string) {
  const tm = await tmService.fetchTMEventById(tmId);
  if (!tm) return null;

  const esdeveniment = await Esdeveniment.create({
    nom: tm.name,
    data_hora: new Date(tm.dates.start.dateTime),
    recinte: tm._embedded?.venues?.[0]?.name || 'Unknown Venue',
    descripcio: tm.description || '',
    imatge: tm.images?.sort((a, b) => b.width - a.width)[0]?.url,
    estat: 'actiu'
  });

  await crearZonesISeients(esdeveniment.id, [
    { nom: 'VIP', preu: 150, files: 5, seientsPerFila: 10 },
    { nom: 'Platea', preu: 80, files: 10, seientsPerFila: 15 },
    { nom: 'General', preu: 40, files: 15, seientsPerFila: 20 }
  ]);

  return esdeveniment;
}

export async function obtenirEsdevenimentPerId(id: string) {
  let esdeveniment = null;

  if (esUuid(id)) {
    esdeveniment = await Esdeveniment.findByPk(id, {
      include: [
        {
          model: Zona,
          as: 'zones',
          attributes: ['id', 'nom', 'preu', 'capacitat'],
        },
      ],
    });
  }

  if (!esdeveniment) {
    const imported = await importTMEvent(id);
    if (imported) {
      esdeveniment = await Esdeveniment.findByPk(imported.id, {
        include: [{ model: Zona, as: 'zones' }]
      });
    }
  }

  if (!esdeveniment) {
    return null;
  }

  const seients = await Seient.findAll({
    include: [
      {
        model: Zona,
        as: 'zona',
        where: { esdeveniment_id: esdeveniment.id },
        attributes: ['id', 'nom', 'preu'],
      },
    ],
  });

  return {
    ...esdeveniment.toJSON(),
    seients,
  };
}

export async function crearEsdeveniment(dades: {
  nom: string;
  data_hora: Date;
  recinte: string;
  descripcio?: string;
}) {
  return Esdeveniment.create(dades);
}

export async function actualitzarEsdeveniment(
  id: string,
  dades: Partial<{
    nom: string;
    data_hora: Date;
    recinte: string;
    descripcio: string;
    estat: 'actiu' | 'cancelat' | 'finalitzat';
  }>
) {
  const esdeveniment = await Esdeveniment.findByPk(id);
  if (!esdeveniment) {
    return null;
  }
  await esdeveniment.update(dades);
  return esdeveniment;
}
