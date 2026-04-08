import { Entrada, Seient, Esdeveniment, Usuari, Zona, Op } from '../models/index.js';

export async function cercarEntradesPerCorreu(correu: string) {
  const usuari = await Usuari.findOne({
    where: { correu_electronic: correu },
  });

  if (!usuari) {
    return [];
  }

  const entrades = await Entrada.findAll({
    where: { usuari_id: usuari.id },
    include: [
      {
        model: Esdeveniment,
        as: 'esdeveniment',
      },
      {
        model: Seient,
        as: 'seients',
      },
    ],
    order: [['data_compra', 'DESC']],
  });

  return entrades;
}

export async function obtenirEntradesPerUsuari(usuariId: string) {
  return Entrada.findAll({
    where: { usuari_id: usuariId },
    include: [
      {
        model: Esdeveniment,
        as: 'esdeveniment',
      },
      {
        model: Seient,
        as: 'seients',
        include: [
          {
            model: Zona,
            as: 'zona',
            attributes: ['nom'],
          },
        ],
      },
    ],
    order: [['data_compra', 'DESC']],
  });
}

export async function obtenirEntradaPerCodi(codi: string) {
  return Entrada.findOne({
    where: { codi_entrada: codi },
    include: [
      {
        model: Esdeveniment,
        as: 'esdeveniment',
      },
      {
        model: Seient,
        as: 'seients',
      },
      {
        model: Usuari,
        as: 'usuari',
        attributes: ['nom', 'correu_electronic'],
      },
    ],
  });
}
