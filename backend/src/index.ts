import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import jwt from 'jsonwebtoken';
import { connectDatabase, getSequelize } from './config/database.js';
import {
  attemptSeatReservation,
  releaseSeatReservation,
  getEventSeatsWithStatus,
  expireOldReservations
} from './services/reservaService.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000'],
    credentials: true
  }
});

const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'secret-key-change-in-production';
const MAX_SEATS_PER_RESERVATION = parseInt(process.env.MAX_SEIENTS_PER_RESERVA || '6');

app.use(
  cors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000'],
    credentials: true
  })
);

app.use(express.json());

// ==================== HELPERS ====================

function generateToken(user: any): string {
  return jwt.sign(
    { id: user.id, email: user.email, role: 'comprador' },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function verifyToken(authHeader: string | undefined): { id: number; email: string } | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  try {
    const token = authHeader.split(' ')[1];
    return jwt.verify(token, JWT_SECRET) as { id: number; email: string };
  } catch {
    return null;
  }
}

// Global per tracking user sessions
const userSessions = new Map(); // socket_id -> { userId, eventId, seatIds[] }

// ==================== DATABASE INITIALIZATION ====================
let models: any = {};

async function initializeApp() {
  try {
    // Connecta BD i inicialitza models
    const dbConnection = await connectDatabase();
    models = dbConnection.models;
    const sequelize = dbConnection.sequelize;

    console.log('📊 Models carregats:', Object.keys(models));

    // Sincronitza BD en dev (crea taules si no existeixen)
    await sequelize.sync({ alter: false });
    console.log('✓ Base de dades sincronitzada');

    // ==================== AUTH ROUTES ====================

    // POST /api/auth/register
    app.post('/api/auth/register', async (req, res) => {
      try {
        const { email, password, full_name, phone, correu_electronic, nom, contrasenya } = req.body;

        // Accepta tant format anglès com català
        const userEmail = email || correu_electronic;
        const userPassword = password || contrasenya;
        const userName = full_name || nom;

        if (!userEmail || !userPassword || !userName) {
          return res.status(400).json({ 
            error: 'DADES_FALTEN', 
            missatge: 'Falten dades obligatòries (email, password, full_name)' 
          });
        }

        // Comprova si l'email ja existeix
        const existing = await models.User.findOne({ where: { email: userEmail } });
        if (existing) {
          return res.status(400).json({ 
            error: 'CORREU_EXIST', 
            missatge: 'El correu electrònic ja està registrat' 
          });
        }

        const user = await models.User.create({
          email: userEmail,
          password_hash: userPassword, // En producció, hash amb bcrypt
          full_name: userName,
          phone: phone || null
        });

        const token = generateToken(user);

        res.status(201).json({
          token,
          usuari: {
            id: user.id,
            correu_electronic: user.email,
            nom: user.full_name,
            rol: 'comprador',
          },
        });
      } catch (error) {
        console.error('[API] Error register:', error);
        res.status(500).json({ error: 'ERROR_INTERN', missatge: 'Error en el registre' });
      }
    });

    // POST /api/auth/login
    app.post('/api/auth/login', async (req, res) => {
      try {
        const { email, password, correu_electronic, contrasenya } = req.body;

        const userEmail = email || correu_electronic;
        const userPassword = password || contrasenya;

        if (!userEmail || !userPassword) {
          return res.status(400).json({ 
            error: 'DADES_FALTEN', 
            missatge: 'Falten dades obligatòries' 
          });
        }

        const user = await models.User.findOne({ where: { email: userEmail } });
        if (!user || user.password_hash !== userPassword) {
          return res.status(401).json({ 
            error: 'CREDENCIALS_INCORRECTES', 
            missatge: 'Credencials incorrectes' 
          });
        }

        const token = generateToken(user);

        res.json({
          token,
          usuari: {
            id: user.id,
            correu_electronic: user.email,
            nom: user.full_name,
            rol: 'comprador',
          },
        });
      } catch (error) {
        console.error('[API] Error login:', error);
        res.status(500).json({ error: 'ERROR_INTERN', missatge: 'Error en el login' });
      }
    });

    // GET /api/auth/me
    app.get('/api/auth/me', async (req, res) => {
      try {
        const decoded = verifyToken(req.headers.authorization);
        if (!decoded) {
          return res.status(401).json({ error: 'TOKEN_INVALID', missatge: 'Token invàlid o expirat' });
        }

        const user = await models.User.findByPk(decoded.id);
        if (!user) {
          return res.status(404).json({ error: 'USUARI_NO_TROBAT', missatge: 'Usuari no trobat' });
        }

        res.json({
          id: user.id,
          correu_electronic: user.email,
          nom: user.full_name,
          rol: 'comprador',
        });
      } catch (error) {
        res.status(500).json({ error: 'ERROR_INTERN', missatge: 'Error obtenint usuari' });
      }
    });

    // ==================== EVENTS ROUTES ====================

    // GET /api/events - Tots els events de la BD
    app.get('/api/events', async (req, res) => {
      try {
        const events = await models.Event.findAll({
          include: [{ model: models.Zone }],
          order: [['date_time', 'ASC']]
        });

        // Mapejar a format que espera el frontend
        const mapped = events.map((e: any) => ({
          id: e.id,
          nom: e.name,
          data_hora: e.date_time,
          recinte: e.venue,
          descripcio: e.description || '',
          imatge: e.image_url || null,
          estat: e.status === 'active' ? 'actiu' : e.status,
          zones: e.Zones?.map((z: any) => ({
            id: z.id,
            nom: z.zone_name,
            preu: parseFloat(z.price),
            color: z.color,
          })) || [],
        }));

        res.json({ 
          data: mapped,
          eventos: mapped,
          esdeveniments: mapped,
          events: mapped,
          total: mapped.length 
        });
      } catch (error) {
        console.error('[API] Error events:', error);
        res.status(500).json({ error: 'Error obtenint esdeveniments' });
      }
    });

    // GET /api/events/:id - Un event amb seients i zones
    app.get('/api/events/:id', async (req, res) => {
      try {
        const event = await models.Event.findByPk(req.params.id, {
          include: [{ model: models.Zone }]
        });

        if (!event) {
          return res.status(404).json({ error: 'Event no trobat' });
        }

        // Obtenir seients amb estat actual
        const seats = await getEventSeatsWithStatus(parseInt(req.params.id));

        // Mapejar a format frontend
        const zones = event.Zones?.map((z: any) => ({
          id: z.id,
          nom: z.zone_name,
          preu: parseFloat(z.price),
          color: z.color,
        })) || [];

        // Mapejar seients a format frontend (català)
        const seients = seats.map((s: any) => ({
          id: String(s.id),
          zona_id: String(s.zone_id),
          numero: String(s.seat_number),
          fila: s.row,
          estat: mapSeatStatus(s.status),
          zona: {
            id: String(s.zone_id),
            nom: s.zone || '',
            preu: s.price || 0,
          },
        }));

        const data = {
          id: event.id,
          nom: event.name,
          data_hora: event.date_time,
          recinte: event.venue,
          descripcio: event.description || '',
          imatge: event.image_url || null,
          estat: event.status === 'active' ? 'actiu' : event.status,
          zones,
          seients,
        };

        res.json(data);
      } catch (error) {
        console.error('[API] Error event detail:', error);
        res.status(500).json({ error: 'Error obtenint wydarzenie' });
      }
    });

    // GET /api/seients/:eventId - Seients d'un event
    app.get('/api/seients/:eventId', async (req, res) => {
      try {
        const seats = await getEventSeatsWithStatus(parseInt(req.params.eventId));
        res.json({
          data: seats,
          total: seats.length,
          disponibles: seats.filter((s: any) => s.status === 'AVAILABLE').length,
          reservats: seats.filter((s: any) => s.status === 'RESERVED').length,
          venuts: seats.filter((s: any) => s.status === 'SOLD').length
        });
      } catch (error) {
        res.status(500).json({ error: 'Error obtenint seients' });
      }
    });

    // GET /api/zones
    app.get('/api/zones', async (req, res) => {
      try {
        const zones = await models.Zone.findAll({
          attributes: ['id', 'zone_key', 'zone_name', 'price', 'color']
        });
        res.json({ data: zones });
      } catch (error) {
        res.status(500).json({ error: 'Error obtenint zones' });
      }
    });

    // ==================== ENTRADES (TICKETS) ROUTES ====================

    // GET /api/entrades/usuari - Entrades comprades per l'usuari
    app.get('/api/entrades/usuari', async (req, res) => {
      try {
        const decoded = verifyToken(req.headers.authorization);
        if (!decoded) {
          return res.status(401).json({ error: 'TOKEN_INVALID' });
        }

        // Buscar compres completades de l'usuari
        const purchases = await models.Purchase.findAll({
          where: { user_id: decoded.id, status: 'COMPLETED' },
          include: [
            { model: models.Event },
            { 
              model: models.PurchaseItem,
              include: [{ 
                model: models.Seat,
                include: [{ model: models.Zone }]
              }]
            }
          ],
          order: [['created_at', 'DESC']]
        });

        const entrades = purchases.map((p: any) => ({
          id: p.id,
          codi_entrada: `ENT-${String(p.id).padStart(6, '0')}`,
          data_compra: p.completed_at || p.created_at,
          esdeveniment: p.Event ? {
            nom: p.Event.name,
            data_hora: p.Event.date_time,
            recinte: p.Event.venue,
          } : null,
          seients: p.PurchaseItems?.map((item: any) => ({
            id: String(item.Seat?.id || item.seat_id),
            numero: String(item.Seat?.seat_number || ''),
            fila: item.Seat?.row || '',
            zona: item.zone_name || item.Seat?.Zone?.zone_name || '',
          })) || [],
        }));

        res.json({ entrades });
      } catch (error) {
        console.error('[API] Error entrades:', error);
        res.status(500).json({ error: 'Error obtenint entrades' });
      }
    });

    // ==================== RESERVES ROUTES ====================

    // GET /api/reserves/usuari - Reserves actives de l'usuari
    app.get('/api/reserves/usuari', async (req, res) => {
      try {
        const decoded = verifyToken(req.headers.authorization);
        if (!decoded) {
          return res.status(401).json({ error: 'TOKEN_INVALID' });
        }

        const now = new Date();
        const reservations = await models.Reservation.findAll({
          where: {
            user_id: decoded.id,
            status: 'PENDING',
          },
          include: [
            { model: models.Event },
            { 
              model: models.Seat,
              include: [{ model: models.Zone }]
            }
          ]
        });

        // Filtrar les que no han expirat
        const activeReservations = reservations.filter((r: any) => 
          new Date(r.expires_at) > now
        );

        const reserves = activeReservations.map((r: any) => ({
          id: r.id,
          token: String(r.id), // Usem l'ID com a token
          esdeveniment_id: String(r.event_id),
          data_inici: r.reserved_at,
          data_expiracio: r.expires_at,
          esdeveniment: r.Event ? {
            nom: r.Event.name,
          } : null,
          seients: [{
            id: String(r.Seat?.id || r.seat_id),
            numero: String(r.Seat?.seat_number || ''),
            fila: r.Seat?.row || '',
            zona: r.Seat?.Zone ? { nom: r.Seat.Zone.zone_name } : null,
          }],
        }));

        res.json({ reserves });
      } catch (error) {
        console.error('[API] Error reserves:', error);
        res.status(500).json({ error: 'Error obtenint reserves' });
      }
    });

    // DELETE /api/reserves/:id - Cancel·lar reserva
    app.delete('/api/reserves/:id', async (req, res) => {
      try {
        const decoded = verifyToken(req.headers.authorization);
        if (!decoded) {
          return res.status(401).json({ error: 'TOKEN_INVALID' });
        }

        const reservation = await models.Reservation.findByPk(req.params.id);
        if (!reservation) {
          return res.status(404).json({ error: 'RESERVA_NO_TROBADA' });
        }

        if (reservation.user_id !== decoded.id) {
          return res.status(403).json({ error: 'NO_TE_PERMIS' });
        }

        // Alliberar el seient
        const success = await releaseSeatReservation(reservation.seat_id, decoded.id);
        
        res.json({ missatge: 'Reserva alliberada' });
      } catch (error) {
        console.error('[API] Error cancel reserva:', error);
        res.status(500).json({ error: 'Error cancel·lant reserva' });
      }
    });

    // ==================== COMPRES (PURCHASES) ROUTES ====================

    // POST /api/compres - Confirmar compra
    app.post('/api/compres', async (req, res) => {
      try {
        const decoded = verifyToken(req.headers.authorization);
        if (!decoded) {
          return res.status(401).json({ error: 'TOKEN_INVALID' });
        }

        const { reserva_token, usuari } = req.body;

        if (!reserva_token) {
          return res.status(400).json({ error: 'TOKEN_OBLIGATORI' });
        }

        const now = new Date();

        // Reserva objectiu (la que ve del checkout)
        const targetReservation = await models.Reservation.findOne({
          where: {
            id: Number(reserva_token),
            user_id: decoded.id,
            status: 'PENDING',
          },
          include: [{ model: models.Seat, include: [{ model: models.Zone }] }]
        });

        if (!targetReservation) {
          return res.status(404).json({ error: 'RESERVA_NO_TROBADA', missatge: 'Reserva no trobada o no activa' });
        }

        if (new Date(targetReservation.expires_at) <= now) {
          return res.status(400).json({ error: 'RESERVA_EXPIRADA', missatge: 'La reserva ha expirat' });
        }

        // Comprem totes les reserves actives del mateix event per aquest usuari
        const reservations = await models.Reservation.findAll({
          where: {
            user_id: decoded.id,
            event_id: targetReservation.event_id,
            status: 'PENDING',
          },
          include: [{ model: models.Seat, include: [{ model: models.Zone }] }]
        });

        const activeReservations = reservations.filter((r: any) => new Date(r.expires_at) > now);

        if (activeReservations.length === 0) {
          return res.status(400).json({ error: 'RESERVA_EXPIRADA', missatge: 'No tens reserves actives' });
        }

        // Crear la compra
        const sequelize = getSequelize();
        const transaction = await sequelize.transaction();

        try {
          let totalPrice = 0;
          const seatDetails: any[] = [];

          for (const reservation of activeReservations) {
            const zone = reservation.Seat?.Zone;
            const price = zone ? parseFloat(zone.price) : 0;
            totalPrice += price;
            seatDetails.push({
              seat_id: reservation.seat_id,
              zone_name: zone?.zone_name || '',
              price,
            });
          }

          const purchase = await models.Purchase.create({
            user_id: decoded.id,
            event_id: targetReservation.event_id,
            total_price: totalPrice,
            status: 'COMPLETED',
            first_name: usuari?.nom || '',
            last_name: '',
            email: usuari?.correu || decoded.email,
            completed_at: new Date(),
          }, { transaction });

          // Crear items de compra, marcar seients venuts i reserves completades en la mateixa transacció
          for (const reservation of activeReservations) {
            const seat = await models.Seat.findByPk(reservation.seat_id, {
              transaction,
              lock: 'UPDATE'
            });

            if (!seat || seat.status !== 'RESERVED' || seat.reserved_by !== decoded.id) {
              throw new Error(`SEIENT_INVALID_${reservation.seat_id}`);
            }

            seat.status = 'SOLD';
            seat.reserved_by = null;
            seat.sold_by = decoded.id;
            seat.updated_at = new Date();
            await seat.save({ transaction });

            reservation.status = 'COMPLETED';
            reservation.confirmed_at = new Date();
            reservation.completed_at = new Date();
            await reservation.save({ transaction });

            const zone = reservation.Seat?.Zone;
            await models.PurchaseItem.create({
              purchase_id: purchase.id,
              seat_id: reservation.seat_id,
              zone_name: zone?.zone_name || '',
              price: zone ? parseFloat(zone.price) : 0,
            }, { transaction });
          }

          await transaction.commit();

          res.status(201).json({
            compres: [{
              codi_entrada: `ENT-${String(purchase.id).padStart(6, '0')}`,
              seients: seatDetails.map((d: any) => ({
                numero: String(d.seat_id),
                zona: d.zone_name,
              })),
            }],
          });
        } catch (innerError) {
          await transaction.rollback();
          throw innerError;
        }
      } catch (error) {
        console.error('[API] Error compra:', error);
        res.status(500).json({ error: 'ERROR_COMPRA', missatge: 'Error en confirmar la compra' });
      }
    });

    // ==================== ADMIN ROUTES ====================

    // GET /api/admin/events
    app.get('/api/admin/events', async (req, res) => {
      try {
        const events = await models.Event.findAll({
          include: [{ model: models.Zone }],
          order: [['date_time', 'ASC']]
        });

        const mapped = events.map((e: any) => ({
          id: e.id,
          nom: e.name,
          data_hora: e.date_time,
          recinte: e.venue,
          descripcio: e.description || '',
          estat: e.status,
          zones: e.Zones?.map((z: any) => ({
            id: z.id,
            nom: z.zone_name,
            preu: parseFloat(z.price),
          })) || [],
        }));

        res.json({ events: mapped });
      } catch (error) {
        res.status(500).json({ error: 'Error obtenint events' });
      }
    });

    // GET /api/admin/events/:id/stats
    app.get('/api/admin/events/:id/stats', async (req, res) => {
      try {
        const eventId = parseInt(req.params.id);
        const seats = await getEventSeatsWithStatus(eventId);

        const disponibles = seats.filter((s: any) => s.status === 'AVAILABLE').length;
        const reservats = seats.filter((s: any) => s.status === 'RESERVED').length;
        const venuts = seats.filter((s: any) => s.status === 'SOLD').length;
        const total = seats.length;

        // Reserves actives
        const now = new Date();
        const activeReservations = await models.Reservation.count({
          where: {
            event_id: eventId,
            status: 'PENDING',
          }
        });

        // Compres totals
        const totalPurchases = await models.Purchase.count({
          where: { event_id: eventId, status: 'COMPLETED' }
        });

        // Recaptació
        const purchases = await models.Purchase.findAll({
          where: { event_id: eventId, status: 'COMPLETED' },
          attributes: ['total_price']
        });
        const recaptacioTotal = purchases.reduce((sum: number, p: any) => sum + parseFloat(p.total_price || 0), 0);

        res.json({
          stats: {
            seients: {
              disponibles,
              seleccionats: 0,
              venuts,
              reservats,
              total,
            },
            ocupacio_percentatge: total > 0 ? ((venuts / total) * 100).toFixed(2) : '0.00',
            reserves_actives: activeReservations,
            compres_totals: totalPurchases,
            recaptacio_total: recaptacioTotal,
          }
        });
      } catch (error) {
        console.error('[API] Error stats:', error);
        res.status(500).json({ error: 'Error obtenint estadístiques' });
      }
    });

    // GET /api/admin/events/:id/report
    app.get('/api/admin/events/:id/report', async (req, res) => {
      try {
        const eventId = parseInt(req.params.id);

        const purchaseItems = await models.PurchaseItem.findAll({
          include: [{
            model: models.Purchase,
            where: { event_id: eventId, status: 'COMPLETED' }
          }]
        });

        // Agrupar per zona
        const perZona: Record<string, { nom: string; preu: number; quantitat: number; total: number }> = {};
        for (const item of purchaseItems) {
          const zonaNom = item.zone_name || 'Desconeguda';
          const preu = parseFloat(item.price);
          if (!perZona[zonaNom]) {
            perZona[zonaNom] = { nom: zonaNom, preu, quantitat: 0, total: 0 };
          }
          perZona[zonaNom].quantitat++;
          perZona[zonaNom].total += preu;
        }

        const recaptacioTotal = Object.values(perZona).reduce((sum, z) => sum + z.total, 0);

        res.json({
          report: {
            recaptacio_per_zona: Object.values(perZona),
            recaptacio_total: recaptacioTotal,
            entrades_venudes: purchaseItems.length,
          }
        });
      } catch (error) {
        console.error('[API] Error report:', error);
        res.status(500).json({ error: 'Error obtenint informe' });
      }
    });

    // POST /api/admin/events - Crear event
    app.post('/api/admin/events', async (req, res) => {
      try {
        const { nom, data_hora, recinte, descripcio, zones } = req.body;

        if (!nom || !data_hora || !recinte) {
          return res.status(400).json({ error: 'Falten dades obligatòries' });
        }

        const event = await models.Event.create({
          name: nom,
          date_time: new Date(data_hora),
          venue: recinte,
          description: descripcio || '',
          status: 'active',
        });

        // Crear zones i seients si es defineixen
        if (zones && Array.isArray(zones)) {
          for (const zona of zones) {
            const createdZone = await models.Zone.create({
              event_id: event.id,
              zone_key: zona.nom.toLowerCase().replace(/\s+/g, '_'),
              zone_name: zona.nom,
              price: zona.preu,
              color: zona.color || 'rgba(33, 150, 243, 0.8)',
            });

            const files = zona.files || 5;
            const seientsPerFila = zona.seientsPerFila || 15;
            for (let fila = 0; fila < files; fila++) {
              const filaLletra = String.fromCharCode(65 + fila);
              for (let num = 1; num <= seientsPerFila; num++) {
                await models.Seat.create({
                  event_id: event.id,
                  zone_id: createdZone.id,
                  row: filaLletra,
                  seat_number: num,
                  status: 'AVAILABLE',
                });
              }
            }
          }
        }

        res.status(201).json({ event: { id: event.id, nom: event.name } });
      } catch (error) {
        console.error('[API] Error crear event:', error);
        res.status(500).json({ error: 'Error creant event' });
      }
    });

    // ==================== DESENVOLUPAMENTS ROUTE (compatibility) ====================
    // El frontend crida /api/desenvolupaments - redirigim a la llista d'events de la BD
    app.get('/api/desenvolupaments', async (req, res) => {
      try {
        const events = await models.Event.findAll({
          include: [{ model: models.Zone }],
          order: [['date_time', 'ASC']]
        });

        const mapped = events.map((e: any) => ({
          id: e.id,
          nom: e.name,
          data_hora: e.date_time,
          recinte: e.venue,
          descripcio: e.description || '',
          imatge: e.image_url || null,
          estat: e.status === 'active' ? 'actiu' : e.status,
        }));

        res.json({
          data: mapped,
          eventos: mapped,
          esdeveniments: mapped,
        });
      } catch (error) {
        res.status(500).json({ error: 'Error obtenint esdeveniments' });
      }
    });

    // ==================== SOCKET.IO HANDLERS ====================
    io.on('connection', (socket) => {
      console.log(`[socket] Nova connexió: ${socket.id}`);

      socket.on('join-event', async (data) => {
        const eventId = data.eventId || data.esdeveniment_id;
        const userId = data.userId || data.usuari_id;
        
        if (!eventId) {
          socket.emit('error', { message: 'eventId és obligatori' });
          return;
        }

        socket.join(`event-${eventId}`);

        // Registra user session
        userSessions.set(socket.id, {
          userId: userId || null,
          eventId,
          seatIds: []
        });

        console.log(`[socket] User ${userId || 'anon'} unit a event ${eventId}`);

        try {
          // Envia estat actual dels seients (format frontend català)
          const seats = await getEventSeatsWithStatus(parseInt(eventId));
          const seients = seats.map((s: any) => ({
            id: String(s.id),
            zona_id: String(s.zone_id),
            numero: String(s.seat_number),
            fila: s.row,
            estat: mapSeatStatus(s.status),
            zona: {
              id: String(s.zone_id),
              nom: s.zone || '',
              preu: s.price || 0,
            },
          }));

          socket.emit('event-joined', {
            esdeveniment_id: eventId,
            seients,
            reserva_activa: null,
          });

          // També envia format antic per compatibilitat
          socket.emit('seats-state', { seats });

          // Notifica nombre d'usuaris connectats
          const roomSize = io.sockets.adapter.rooms.get(`event-${eventId}`)?.size || 0;
          io.to(`event-${eventId}`).emit('user-joined', { userCount: roomSize });
        } catch (error) {
          console.error('[socket] Error join-event:', error);
          socket.emit('error', { message: 'Error carregant seients' });
        }
      });

      socket.on('leave-event', (data) => {
        const eventId = data?.eventId || data?.esdeveniment_id;
        if (eventId) {
          socket.leave(`event-${eventId}`);
        }
      });

      // reserve-seat (format frontend català)
      socket.on('reserve-seat', async (data) => {
        const seatId = parseInt(data.seient_id || data.seatId);
        const eventId = parseInt(data.esdeveniment_id || data.eventId);
        const userId = parseInt(data.usuari_id || data.userId) || 1;

        console.log(`[socket] User ${userId} intent reservar seient ${seatId} (event ${eventId})`);

        try {
          // Comprovar límit de seients per usuari
          const session = userSessions.get(socket.id);
          if (session && session.seatIds.length >= MAX_SEATS_PER_RESERVATION) {
            socket.emit('reservation-error', {
              error: 'MAX_SEIENTS_ASSOLIT',
              missatge: `Ja has arribat al límit de ${MAX_SEATS_PER_RESERVATION} seients per reserva`,
            });
            return;
          }

          const result = await attemptSeatReservation(userId, eventId, seatId);

          if (result.success) {
            if (session) {
              session.seatIds.push(seatId);
            }

            // Format antic (select-seat handler del backend original)
            socket.emit('reservation-confirmed', {
              seatId,
              reservation: result.reservation
            });

            // Format nou per frontend català
            socket.emit('seat-selected', {
              seient_id: String(seatId),
              reserva: {
                id: result.reservation?.id,
                token: String(result.reservation?.id || ''),
                data_expiracio: result.reservation?.expires_at,
              },
            });

            // Broadcast a tots
            io.to(`event-${eventId}`).emit('seat-reserved', {
              seient_id: String(seatId),
              seatId,
              estat: 'reservat',
              reserved_by: userId,
              expires_at: result.reservation?.expires_at,
            });

            console.log(`[socket] ✓ Seient ${seatId} reservat per user ${userId}`);
          } else {
            socket.emit('reservation-error', {
              error: 'SEIENT_NO_DISPONIBLE',
              missatge: result.message || 'El seient ja no està disponible',
              seient_id: String(seatId),
            });
            socket.emit('reservation-failed', {
              seatId,
              message: result.message
            });

            console.log(`[socket] ❌ Reserva fallida: ${result.message}`);
          }
        } catch (error) {
          console.error('[socket] Error reserve-seat:', error);
          socket.emit('reservation-error', {
            error: 'ERROR_RESERVA',
            missatge: 'Error en fer la reserva',
          });
        }
      });

      // select-seat (format backend original anglès)
      socket.on('select-seat', async (data) => {
        const { eventId, seatId, userId } = data;
        console.log(`[socket] User ${userId} trying to select seat ${seatId}`);

        try {
          const result = await attemptSeatReservation(userId, eventId, seatId);

          if (result.success) {
            const session = userSessions.get(socket.id);
            if (session) {
              session.seatIds.push(seatId);
            }

            socket.emit('reservation-confirmed', {
              seatId,
              reservation: result.reservation
            });

            io.to(`event-${eventId}`).emit('seat-reserved', {
              seatId,
              seient_id: String(seatId),
              estat: 'reservat',
              reserved_by: userId,
              expires_at: result.reservation?.expires_at
            });
          } else {
            socket.emit('reservation-failed', {
              seatId,
              message: result.message
            });
          }
        } catch (error) {
          console.error('[socket] Error:', error);
          socket.emit('error', { message: 'Error reserving seat' });
        }
      });

      socket.on('release-seat', async (data) => {
        const seatId = parseInt(data.seatId || data.seient_id);
        const eventId = data.eventId || data.esdeveniment_id;
        const userId = parseInt(data.userId || data.usuari_id) || 1;

        console.log(`[socket] User ${userId} alliberant seient ${seatId}`);

        try {
          const success = await releaseSeatReservation(seatId, userId);

          if (success) {
            const session = userSessions.get(socket.id);
            if (session) {
              session.seatIds = session.seatIds.filter((s: number) => s !== seatId);
            }

            io.to(`event-${eventId}`).emit('seat-released', { 
              seatId,
              seient_id: String(seatId),
              estat: 'disponible',
            });
            console.log(`[socket] ✓ Seient ${seatId} alliberat`);
          }
        } catch (error) {
          console.error('[socket] Error release:', error);
          socket.emit('reservation-error', {
            error: 'ERROR_ALLIBERAR',
            missatge: 'Error en alliberar el seient',
          });
        }
      });

      socket.on('purchase-confirm', async (data) => {
        const seatId = parseInt(data.seatId || data.seient_id);
        const eventId = data.eventId || data.esdeveniment_id;
        const userId = parseInt(data.userId || data.usuari_id) || 1;

        console.log(`[socket] User ${userId} confirmant compra seient ${seatId}`);

        try {
          const result = await confirmSeatPurchase(seatId, userId);

          if (result.success) {
            const session = userSessions.get(socket.id);
            if (session) {
              session.seatIds = session.seatIds.filter((s: number) => s !== seatId);
            }

            socket.emit('purchase-completed', { seatId });

            io.to(`event-${eventId}`).emit('seat-sold', { 
              seatId,
              seient_id: String(seatId),
              estat: 'venut',
              purchased_by: userId,
            });
            console.log(`[socket] ✓ Seient ${seatId} venut a user ${userId}`);
          } else {
            socket.emit('purchase-failed', { seatId, message: result.message });
          }
        } catch (error) {
          console.error('[socket] Error purchase:', error);
          socket.emit('error', { message: 'Error confirmant compra' });
        }
      });

      // confirm-purchase (format català del frontend)
      socket.on('confirm-purchase', async (data) => {
        const { reserva_token, usuari, esdeveniment_id } = data;
        console.log(`[socket] Confirmant compra amb token ${reserva_token}`);
        
        // Buscar les reserves de l'usuari per a aquest event
        const session = userSessions.get(socket.id);
        if (session && session.seatIds.length > 0) {
          for (const seatId of [...session.seatIds]) {
            try {
              const result = await confirmSeatPurchase(seatId, session.userId || 1);
              if (result.success) {
                io.to(`event-${esdeveniment_id}`).emit('seat-sold', {
                  seient_id: String(seatId),
                  estat: 'venut',
                });
              }
            } catch (error) {
              console.error('[socket] Error confirm-purchase seat:', error);
            }
          }
          session.seatIds = [];
          
          socket.emit('reservation-confirmed', {
            entrades: [{ codi_entrada: `ENT-${Date.now()}` }],
          });
        } else {
          socket.emit('reservation-error', {
            error: 'ERROR_COMPRA',
            missatge: 'No hi ha seients reservats',
          });
        }
      });

      socket.on('disconnect', async () => {
        console.log(`[socket] Desconnectat: ${socket.id}`);

        const session = userSessions.get(socket.id);
        if (session) {
          const { eventId, seatIds, userId } = session;

          // Allibera totes les reserves
          for (const seatId of seatIds) {
            try {
              await releaseSeatReservation(seatId, userId || 1);
              if (eventId) {
                io.to(`event-${eventId}`).emit('seat-released', { 
                  seatId,
                  seient_id: String(seatId),
                  estat: 'disponible',
                });
              }
            } catch (error) {
              console.error('[socket] Error releasing on disconnect:', error);
            }
          }

          userSessions.delete(socket.id);
        }
      });
    });

    // ==================== SERVER STARTUP ====================
    httpServer.listen(PORT, () => {
      console.log(`\n🎪 Servidor escoltant al port ${PORT}`);
      console.log(`📡 API REST: http://localhost:${PORT}/api`);
      console.log(`🔌 Socket.io: ws://localhost:${PORT}\n`);
    });

    // Cleanup per expiració de reserves cada minut
    setInterval(async () => {
      try {
        const expired = await expireOldReservations();
        if (expired > 0) {
          console.log(`[cleanup] Expirades ${expired} reserves antigues`);
          io.emit('reservations-expired', { count: expired });
        }
      } catch (error) {
        console.error('[cleanup] Error:', error);
      }
    }, 60000);

  } catch (error) {
    console.error('❌ Error inicialitzant app:', error);
    process.exit(1);
  }
}

// Helper: Mapejar estat del seient de backend (anglès) a frontend (català)
function mapSeatStatus(status: string): string {
  switch (status) {
    case 'AVAILABLE': return 'disponible';
    case 'RESERVED': return 'reservat';
    case 'SOLD': return 'venut';
    default: return 'disponible';
  }
}

// Comença l'app
initializeApp();
