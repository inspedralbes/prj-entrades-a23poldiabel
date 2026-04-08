import { Router } from 'express';
import { Usuari } from '../models/index.js';
import { createError } from '../middleware/errorHandler.js';
import jwt from 'jsonwebtoken';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'secret-key-change-in-production';

router.post('/register', async (req, res, next) => {
  try {
    const { correu_electronic, nom, contrasenya } = req.body;
    console.log('Intent de registre:', { correu_electronic, nom });

    if (!correu_electronic || !nom || !contrasenya) {
      console.log('Error de registre: Falten dades');
      throw createError('Falten dades obligatòries', 400, 'DADES_FALTEN');
    }

    const usuariExist = await Usuari.findOne({ where: { correu_electronic } });
    if (usuariExist) {
      console.log('Error de registre: Correu ja existent', correu_electronic);
      throw createError('El correu electrònic ja està registrat', 400, 'CORREU_EXIST');
    }

    const usuari = await Usuari.create({
      correu_electronic,
      nom,
      contrasenya,
      rol: 'comprador',
    });

    console.log('Usuari creat amb èxit:', usuari.id);

    const token = jwt.sign(
      { id: usuari.id, correu: usuari.correu_electronic, rol: usuari.rol },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      usuari: {
        id: usuari.id,
        correu_electronic: usuari.correu_electronic,
        nom: usuari.nom,
        rol: usuari.rol,
      },
    });
  } catch (error) {
    console.error('Error en el registre:', error);
    next(error);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { correu_electronic, contrasenya } = req.body;
    console.log('Intent de login:', correu_electronic);

    if (!correu_electronic || !contrasenya) {
      throw createError('Falten dades obligatòries', 400, 'DADES_FALTEN');
    }

    const usuari = await Usuari.findOne({ where: { correu_electronic } });
    if (!usuari) {
      console.log('Error de login: Usuari no trobat', correu_electronic);
      throw createError('Credencials incorrectes', 401, 'CREDENCIALS_INCORRECTES');
    }

    const esContrasenyaValida = usuari.contrasenya === contrasenya;
    if (!esContrasenyaValida) {
      console.log('Error de login: Contrasenya incorrecta per a', correu_electronic);
      throw createError('Credencials incorrectes', 401, 'CREDENCIALS_INCORRECTES');
    }

    console.log('Login exitós:', usuari.id);

    const token = jwt.sign(
      { id: usuari.id, correu: usuari.correu_electronic, rol: usuari.rol },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      usuari: {
        id: usuari.id,
        correu_electronic: usuari.correu_electronic,
        nom: usuari.nom,
        rol: usuari.rol,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/me', async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw createError('Token no proporcionat', 401, 'TOKEN_FALTANT');
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string };

    const usuari = await Usuari.findByPk(decoded.id, {
      attributes: ['id', 'correu_electronic', 'nom', 'rol'],
    });

    if (!usuari) {
      throw createError('Usuari no trobat', 404, 'USUARI_NO_TROBAT');
    }

    res.json(usuari);
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(createError('Token invàlid', 401, 'TOKEN_INVALID'));
    } else {
      next(error);
    }
  }
});

export default router;
