import { Request, Response, NextFunction } from 'express';
import { createError } from './errorHandler.js';

export function validateEsdeveniment(req: Request, res: Response, next: NextFunction): void {
  const { nom, data_hora, recinte } = req.body;

  if (!nom || typeof nom !== 'string' || nom.trim().length === 0) {
    throw createError('El nom de l\'esdeveniment és obligatori', 400, 'NOM_OBLIGATORI');
  }

  if (!data_hora) {
    throw createError('La data i hora de l\'esdeveniment és obligatòria', 400, 'DATA_OBLIGATORIA');
  }

  if (!recinte || typeof recinte !== 'string' || recinte.trim().length === 0) {
    throw createError('El recinte és obligatori', 400, 'RECINTE_OBLIGATORI');
  }

  next();
}

export function validateReserva(req: Request, res: Response, next: NextFunction): void {
  const { esdeveniment_id, seient_ids } = req.body;

  if (!esdeveniment_id) {
    throw createError('L\'ID de l\'esdeveniment és obligatori', 400, 'ESDEVENIMENT_OBLIGATORI');
  }

  if (!seient_ids || !Array.isArray(seient_ids) || seient_ids.length === 0) {
    throw createError('Cal seleccionar almenys un seient', 400, 'SEIENT_OBLIGATORI');
  }

  next();
}

export function validateCompra(req: Request, res: Response, next: NextFunction): void {
  const { reserva_token, usuari } = req.body;

  if (!reserva_token) {
    throw createError('El token de reserva és obligatori', 400, 'TOKEN_OBLIGATORI');
  }

  if (!usuari || !usuari.nom || !usuari.correu) {
    throw createError('Les dades de l\'usuari són obligatòries', 400, 'DADES_USUARI_OBLIGATORIES');
  }

  if (!isValidEmail(usuari.correu)) {
    throw createError('El correu electrònic no és vàlid', 400, 'CORREU_INVALID');
  }

  next();
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validateCorreuQuery(req: Request, res: Response, next: NextFunction): void {
  const { correu } = req.query;

  if (!correu || typeof correu !== 'string') {
    throw createError('El correu electrònic és obligatori', 400, 'CORREU_OBLIGATORI');
  }

  if (!isValidEmail(correu)) {
    throw createError('El correu electrònic no és vàlid', 400, 'CORREU_INVALID');
  }

  next();
}
