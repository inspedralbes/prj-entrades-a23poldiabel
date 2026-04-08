import { v4 as uuidv4 } from 'uuid';
import { Reserva, Seient, Entrada, EntradaSeient, Usuari, Esdeveniment, Zona, Op } from '../models/index.js';
import { Transaction } from 'sequelize';
import sequelize from '../config/database.js';

interface ReservaAmbSeients extends Reserva {
  seients: Seient[];
}

async function setEntradaSeients(entradaId: string, seientIds: string[], transaction: Transaction) {
  for (const seientId of seientIds) {
    await EntradaSeient.create({
      entrada_id: entradaId,
      seient_id: seientId,
    }, { transaction });
  }
}

export async function confirmarCompra(
  reservaToken: string,
  usuariDades: { nom: string; correu: string }
): Promise<Entrada[]> {
  const transaction = await sequelize.transaction();

  try {
    const reserva = await Reserva.findOne({
      where: { token: reservaToken, estat: 'activa' },
      include: [
        { model: Seient, as: 'seients' },
      ],
    }) as ReservaAmbSeients | null;

    if (!reserva) {
      throw new Error('RESERVA_NO_TROBADA');
    }

    if (new Date() > reserva.data_expiracio) {
      throw new Error('RESERVA_EXPIRADA');
    }

    let usuari = await Usuari.findOne({
      where: { correu_electronic: usuariDades.correu },
    });

    if (!usuari) {
      usuari = await Usuari.create(
        {
          nom: usuariDades.nom,
          correu_electronic: usuariDades.correu,
          rol: 'comprador',
        },
        { transaction }
      );
    }

    await reserva.update(
      { usuari_id: usuari.id, estat: 'comprada' },
      { transaction }
    );

    const entrades: Entrada[] = [];

    for (const seient of reserva.seients) {
      const codiEntrada = `ENT-${uuidv4().substring(0, 8).toUpperCase()}`;

      const entrada = await Entrada.create(
        {
          reserva_id: reserva.id,
          usuari_id: usuari.id,
          esdeveniment_id: reserva.esdeveniment_id,
          codi_entrada: codiEntrada,
          data_compra: new Date(),
        },
        { transaction }
      );

      await setEntradaSeients(entrada.id, [seient.id], transaction);

      await seient.update({ estat: 'venut' }, { transaction });

      entrades.push(entrada);
    }

    await transaction.commit();

    const entradesAmbSeients = await Entrada.findAll({
      where: { id: { [Op.in]: entrades.map(e => e.id) } },
      include: [
        {
          model: Seient,
          as: 'seients',
          include: [
            { model: Zona, as: 'zona' },
          ],
        },
        { model: Esdeveniment, as: 'esdeveniment' },
      ],
    });

    return entradesAmbSeients;
  } catch (error) {
    if (!transaction.finished) {
      await transaction.rollback();
    }
    throw error;
  }
}
