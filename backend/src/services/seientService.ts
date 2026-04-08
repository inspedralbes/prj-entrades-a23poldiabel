import { Seient, Zona, Reserva, ReservaSeient, Op } from '../models/index.js';

export async function obtenirSeientsPerEsdeveniment(esdevenimentId: string) {
  const zones = await Zona.findAll({
    where: { esdeveniment_id: esdevenimentId },
  });

  const zonaIds = zones.map(z => z.id);

  return Seient.findAll({
    where: {
      zona_id: { [Op.in]: zonaIds },
    },
    include: [
      {
        model: Zona,
        as: 'zona',
        attributes: ['id', 'nom', 'preu'],
      },
    ],
  });
}

export async function obtenirSeientPerId(id: string) {
  return Seient.findByPk(id, {
    include: [
      {
        model: Zona,
        as: 'zona',
      },
    ],
  });
}

export async function obtenirSeientsReservatsPerUsuari(usuariId: string, esdevenimentId: string) {
  const reserves = await Reserva.findAll({
    where: {
      usuari_id: usuariId,
      esdeveniment_id: esdevenimentId,
      estat: 'activa',
      data_expiracio: { [Op.gt]: new Date() },
    },
    include: [
      {
        model: Seient,
        as: 'seients',
      },
    ],
  });

  return reserves;
}

export async function crearZonesISeients(
  esdevenimentId: string,
  zones: Array<{ nom: string; preu: number; files: number; seientsPerFila: number }>
) {
  const createdZones = [];

  for (const zona of zones) {
    const createdZona = await Zona.create({
      esdeveniment_id: esdevenimentId,
      nom: zona.nom,
      preu: zona.preu,
      capacitat: zona.files * zona.seientsPerFila,
    });

    for (let fila = 0; fila < zona.files; fila++) {
      const filaLletra = String.fromCharCode(65 + fila);
      for (let seient = 1; seient <= zona.seientsPerFila; seient++) {
        await Seient.create({
          zona_id: createdZona.id,
          numero: seient.toString(),
          fila: filaLletra,
          estat: 'disponible',
        });
      }
    }

    createdZones.push(createdZona);
  }

  return createdZones;
}
