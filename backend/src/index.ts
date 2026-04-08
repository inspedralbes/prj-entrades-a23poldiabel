import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDatabase } from './config/database.js';
import { errorHandler } from './middleware/errorHandler.js';
import desenvolupamentRouter from './api/desenvolupamentController.js';
import esdevenimentRouter from './api/esdevenimentController.js';
import reservaRouter from './api/reservaController.js';
import compraRouter from './api/compraController.js';
import entradaRouter from './api/entradaController.js';
import authRouter from './api/authController.js';
import entradaTypeRouter from './api/entradaTypeController.js';
import { setupSocketHandlers } from './socket/handlers.js';
import { Esdeveniment, Zona, Seient } from './models/index.js';
import adminRouter from './api/adminController.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000', 'http://0.0.0.0:5173'],
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000', 'http://0.0.0.0:5173'],
  credentials: true,
}));
app.use(express.json());

app.use('/api/auth', authRouter);
app.use('/api/admin', adminRouter);app.use('/api/desenvolupaments', desenvolupamentRouter);app.use('/api/esdeveniments', esdevenimentRouter);
app.use('/api/reserves', reservaRouter);
app.use('/api/compres', compraRouter);
app.use('/api/entrades', entradaRouter);
app.use('/api/entrada-types', entradaTypeRouter);

app.use(errorHandler);

setupSocketHandlers(io);

const PORT = process.env.PORT || 3000;

async function crearEsdevenimentsDemo() {
  const count = await Esdeveniment.count();
  if (count > 0) return;

  const esdeveniments = [
    { nom: 'Coldplay - Music of the Spheres', data_hora: new Date('2026-06-15T20:00:00'), recinte: 'Estadi Olímpic', descripcio: 'Gira mundial 2026' },
    { nom: 'Taylor Swift - Eras Tour', data_hora: new Date('2026-07-20T21:00:00'), recinte: 'Camp Nou', descripcio: 'El concert definitiu' },
    { nom: 'Festival de Cap d\'Any', data_hora: new Date('2026-12-31T22:00:00'), recinte: 'Fira Barcelona', descripcio: 'Els millors artists' },
    { nom: 'Rock Fest Barcelona', data_hora: new Date('2026-08-10T18:00:00'), recinte: 'Castelldefels', descripcio: 'Rock fins morts' },
  ];

  for (const esd of esdeveniments) {
    const esdeveniment = await Esdeveniment.create(esd);
    
    const zones = [
      { nom: 'VIP', preu: 250, capacitat: 50 },
      { nom: 'Platea', preu: 120, capacitat: 200 },
      { nom: 'General', preu: 60, capacitat: 500 },
    ];

    for (const zona of zones) {
      const z = await Zona.create({ ...zona, esdeveniment_id: esdeveniment.id });
      
      for (let fila = 1; fila <= 10; fila++) {
        for (let numero = 1; numero <= Math.ceil(zona.capacitat / 10); numero++) {
          await Seient.create({
            zona_id: z.id,
            fila: String(fila),
            numero: String(numero),
            estat: 'disponible',
          });
        }
      }
    }
  }
  console.log('Esdeveniments demo creats!');
}

async function iniciarServidor() {
  try {
    await connectDatabase();
    await crearEsdevenimentsDemo();
    
    httpServer.listen(PORT, () => {
      console.log(`Servidor escoltant al port ${PORT}`);
      console.log(`API REST: http://localhost:${PORT}/api`);
      console.log(`Socket.io: ws://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Error en iniciar el servidor:', error);
    process.exit(1);
  }
}

iniciarServidor();

export { io };
