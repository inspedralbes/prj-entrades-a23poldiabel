import { v4 as uuidv4 } from 'uuid';
import { Seient, Reserva, ReservaSeient, Usuari, Esdeveniment, Zona, Op } from '../models/index.js';
import sequelize from '../config/database.js';
import { Server } from 'socket.io';

const DURADA_RESERVA_MINUTS = parseInt(process.env.RESERVA_DURADA_MINUTS || '5', 10);

interface ReservaResult {
  reserva: Reserva;
  seients: Seient[];
}

export async function crearReserva(
  esdevenimentId: string,
  seientIds: string[],
  usuariId?: string,
  ioInstance?: Server
): Promise<ReservaResult> {
  const transaction = await sequelize.transaction();

  try {
    const seients = await Seient.findAll({
      where: {
        id: { [Op.in]: seientIds },
        estat: 'disponible',
      },
      lock: transaction.LOCK.UPDATE,
      transaction,
    });

    if (seients.length !== seientIds.length) {
      const trobats = new Set(seients.map(s => s.id));
      const noTrobats = seientIds.filter(id => !trobats.has(id));
      throw new Error(`SEIENTS_NO_DISPONIBLES:${noTrobats.join(',')}`);
    }

    const token = uuidv4().substring(0, 8).toUpperCase();
    const ara = new Date();
    const expiracio = new Date(ara.getTime() + DURADA_RESERVA_MINUTS * 60 * 1000);

    const reserva = await Reserva.create(
      {
        usuari_id: usuariId,
        esdeveniment_id: esdevenimentId,
        token,
        data_inici: ara,
        data_expiracio: expiracio,
        estat: 'activa',
      },
      { transaction }
    );

    for (const seient of seients) {
      await seient.update({ estat: 'seleccionat' }, { transaction });
      await ReservaSeient.create(
        {
          reserva_id: reserva.id,
          seient_id: seient.id,
        },
        { transaction }
      );
    }

    await transaction.commit();

    const seientsAmbZona = await Seient.findAll({
      where: { id: { [Op.in]: seientIds } },
      include: [{ model: Zona, as: 'zona' }],
    });

    const reservaAmbSeients = await Reserva.findByPk(reserva.id, {
      include: [{ model: Seient, as: 'seients' }],
    });

    setTimeout(async () => {
      const result = await expirarReserva(reserva.id);
      if (result && ioInstance) {
        // Notificar a tots els clients en aquest event que els seients estan disponibles
        ioInstance.to(`event:${result.esdeveniment_id}`).emit('seat-released', {
          seient_ids: result.seient_ids,
          estat: 'disponible',
          raó: 'reserva_expirada',
        });
        
        // Notificar al client específic que va fer la reserva que ha expirat
        ioInstance.to(`event:${result.esdeveniment_id}`).emit('reservation-expired', {
          token: result.token,
          seient_ids: result.seient_ids,
        });
      }
    }, DURADA_RESERVA_MINUTS * 60 * 1000);

    return {
      reserva: reservaAmbSeients!,
      seients: seientsAmbZona,
    };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

export async function afegirSeientAReserva(
  reservaId: string,
  seientId: string
): Promise<ReservaResult> {
  const transaction = await sequelize.transaction();

  try {
    const reserva = await Reserva.findByPk(reservaId, {
      lock: transaction.LOCK.UPDATE,
      transaction,
    });

    if (!reserva || reserva.estat !== 'activa') {
      throw new Error('RESERVA_NO_TROBADA');
    }

    const seient = await Seient.findOne({
      where: {
        id: seientId,
        estat: 'disponible',
      },
      lock: transaction.LOCK.UPDATE,
      transaction,
    });

    if (!seient) {
      throw new Error('SEIENT_NO_DISPONIBLE');
    }

    await seient.update({ estat: 'seleccionat' }, { transaction });
    await ReservaSeient.create(
      {
        reserva_id: reserva.id,
        seient_id: seient.id,
      },
      { transaction }
    );

    await transaction.commit();

    const seientsAmbZona = await Seient.findAll({
      where: { id: seientId },
      include: [{ model: Zona, as: 'zona' }],
    });

    const reservaAmbSeients = await Reserva.findByPk(reserva.id, {
      include: [{ model: Seient, as: 'seients' }],
    });

    return {
      reserva: reservaAmbSeients!,
      seients: seientsAmbZona,
    };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

export async function obtenirReservesActivesPerUsuari(usuariId: string) {
  return Reserva.findAll({
    where: {
      usuari_id: usuariId,
      estat: 'activa',
      data_expiracio: { [Op.gt]: new Date() },
    },
    include: [
      { model: Esdeveniment, as: 'esdeveniment' },
      { model: Seient, as: 'seients', include: [{ model: Zona, as: 'zona' }] },
    ],
  });
}

export async function alliberarReserva(reservaId: string, usuariId?: string) {
  const reserva = await Reserva.findByPk(reservaId);

  if (!reserva) {
    throw new Error('RESERVA_NO_TROBADA');
  }

  if (usuariId && reserva.usuari_id !== usuariId) {
    throw new Error('NO_TE_PERMIS');
  }

  if (reserva.estat !== 'activa') {
    throw new Error('RESERVA_NO_ACTIVA');
  }

  const reservaSeients = await ReservaSeient.findAll({
    where: { reserva_id: reservaId },
  });

  for (const rs of reservaSeients) {
    await Seient.update(
      { estat: 'disponible' },
      { where: { id: rs.seient_id } }
    );
  }

  await reserva.update({ estat: 'cancelada' });
}

export async function expirarReserva(reservaId: string) {
  const reserva = await Reserva.findByPk(reservaId, {
    include: [{ model: Seient, as: 'seients' }]
  });

  if (!reserva || reserva.estat !== 'activa') {
    return null;
  }

  if (new Date() < reserva.data_expiracio) {
    return null;
  }

  const reservaSeients = await ReservaSeient.findAll({
    where: { reserva_id: reservaId },
  });

  for (const rs of reservaSeients) {
    await Seient.update(
      { estat: 'disponible' },
      { where: { id: rs.seient_id } }
    );
  }

  await reserva.update({ estat: 'expirada' });
  
  return {
    reserva_id: reserva.id,
    token: reserva.token,
    seient_ids: reservaSeients.map(rs => rs.seient_id),
    esdeveniment_id: reserva.esdeveniment_id,
  };
}

export async function obtenirReservaPerToken(token: string) {
  return Reserva.findOne({
    where: { token },
    include: [
      { model: Seient, as: 'seients' },
      { model: Esdeveniment, as: 'esdeveniment' },
    ],
  });
}

export async function obtenirReservesActivesPerEsdeveniment(esdevenimentId: string) {
  return Reserva.count({
    where: {
      esdeveniment_id: esdevenimentId,
      estat: 'activa',
      data_expiracio: { [Op.gt]: new Date() },
    },
  });
}


