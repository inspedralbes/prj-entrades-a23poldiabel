import { Op } from 'sequelize';
import { getModels, getSequelize } from '../config/database.js';

const RESERVATION_TIMEOUT_MINUTES = 5;

function models() {
  const { Seat, Reservation, Zone } = getModels();
  return { Seat, Reservation, Zone };
}

function getSeatZone(seat: any) {
  return seat.Zone ?? seat.zone ?? null;
}

export interface SeatResponse {
  id: number;
  event_id: number;
  zone_id: number;
  row: string;
  seat_number: number;
  status: 'AVAILABLE' | 'RESERVED' | 'SOLD';
  zone: string;
  price: number;
  color: string;
  reserved_by?: number;
  expires_at?: string; // ISO date si està reservat
}

export interface ReservationResponse {
  id: number;
  seat_id: number;
  user_id: number;
  status: string;
  expires_at: string;
  seat: {
    row: string;
    number: number;
    zone: string;
    price: number;
  };
}

/**
 * CRÍTICO: Intenta reservar un seient
 * - Valida disponibilitat al servidor
 * - Si às reservat, torna a estar disponible automàticament en 5 min
 * - Dos usuaris simultainis: només un lo aconsegueix
 */
export async function attemptSeatReservation(
  userId: number,
  eventId: number,
  seatId: number
): Promise<{ success: boolean; message: string; reservation?: ReservationResponse }> {
  const sequelize = getSequelize();
  const { Seat, Reservation, Zone } = models();

  // Transaction - CRÍTICO per concurrència
  const transaction = await sequelize.transaction();

  try {
    // Lock la fila del seient per evitar race conditions
    const seat = await Seat.findByPk(seatId, {
      transaction,
      lock: 'UPDATE' // Pessimistic lock
    });

    if (!seat) {
      await transaction.rollback();
      return { success: false, message: 'Seat not found' };
    }

    // Validació 1: El seient ja està venut?
    if (seat.status === 'SOLD') {
      await transaction.rollback();
      return { success: false, message: 'Seat already sold' };
    }

    // Validació 2: Si està RESERVAT, comprova si ha expirat
    if (seat.status === 'RESERVED') {
      const existingReservation = await Reservation.findOne({
        where: {
          seat_id: seatId,
          status: 'PENDING'
        },
        transaction
      });

      if (existingReservation) {
        // Comprova expiració
        if (new Date(existingReservation.expires_at) > new Date()) {
          // Reserva vàlida - no podem agafar-lo
          await transaction.rollback();
          return {
            success: false,
            message: `Seat reserved by another user until ${existingReservation.expires_at}`
          };
        } else {
          // Reserva expirada - marquem com a expirada
          existingReservation.status = 'EXPIRED';
          await existingReservation.save({ transaction });
        }
      }
    }

    // ✅ EL SEIENT ESTÀ DISPONIBLE - FAM LA RESERVA
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + RESERVATION_TIMEOUT_MINUTES);

    // Actualitza seient a RESERVED
    seat.status = 'RESERVED';
    seat.reserved_by = userId;
    seat.updated_at = new Date();
    await seat.save({ transaction });

    // Crea entrada de reserva
    const reservation = await Reservation.create(
      {
        user_id: userId,
        event_id: eventId,
        seat_id: seatId,
        status: 'PENDING',
        reserved_at: new Date(),
        expires_at: expiresAt,
        confirmed_at: null,
        completed_at: null
      },
      { transaction }
    );

    // Carrega zona després del lock per evitar LEFT JOIN + FOR UPDATE a Postgres
    const seatZone = await Zone.findByPk(seat.zone_id, {
      transaction,
      attributes: ['zone_name', 'price', 'color']
    });

    await transaction.commit();

    return {
      success: true,
      message: 'Seat reserved successfully',
      reservation: {
        id: reservation.id,
        seat_id: seatId,
        user_id: userId,
        status: 'PENDING',
        expires_at: expiresAt.toISOString(),
        seat: {
          row: seat.row,
          number: seat.seat_number,
          zone: seatZone?.zone_name || '',
          price: seatZone?.price || 0
        }
      }
    };
  } catch (error) {
    await transaction.rollback();
    console.error('[ReservationService] Error:', error);
    return { success: false, message: 'Error reserving seat' };
  }
}

/**
 * Allibera un seient reservat (usuari cancela o es desconecta)
 */
export async function releaseSeatReservation(seatId: number, userId: number): Promise<boolean> {
  const sequelize = getSequelize();
  const { Seat, Reservation } = models();
  const transaction = await sequelize.transaction();

  try {
    const seat = await Seat.findByPk(seatId, {
      transaction,
      lock: 'UPDATE'
    });

    if (!seat || seat.status !== 'RESERVED' || seat.reserved_by !== userId) {
      await transaction.rollback();
      return false;
    }

    // Torna a ser disponible
    seat.status = 'AVAILABLE';
    seat.reserved_by = null;
    await seat.save({ transaction });

    // Marca reserva com CANCELLED
    await Reservation.update(
      { status: 'CANCELLED' },
      {
        where: {
          seat_id: seatId,
          user_id: userId,
          status: 'PENDING'
        },
        transaction
      }
    );

    await transaction.commit();
    return true;
  } catch (error) {
    await transaction.rollback();
    console.error('[ReservationService] Error releasing:', error);
    return false;
  }
}

/**
 * Confirma la compra d'un seient reservat
 * - Valida que el userId és el propietari de la reserva
 * - Comprova que no ha expirat
 * - Marca seient com SOLD
 */
export async function confirmSeatPurchase(
  seatId: number,
  userId: number
): Promise<{ success: boolean; message: string }> {
  const sequelize = getSequelize();
  const { Seat, Reservation } = models();
  const transaction = await sequelize.transaction();

  try {
    const seat = await Seat.findByPk(seatId, {
      transaction,
      lock: 'UPDATE'
    });

    if (!seat) {
      await transaction.rollback();
      return { success: false, message: 'Seat not found' };
    }

    // Validació 1: L'usuari actual és qui va reservar?
    if (seat.reserved_by !== userId) {
      await transaction.rollback();
      return { success: false, message: 'You do not own this reservation' };
    }

    // Validació 2: Comprova reserva i expiració
    const reservation = await Reservation.findOne({
      where: {
        seat_id: seatId,
        user_id: userId,
        status: 'PENDING'
      },
      transaction
    });

    if (!reservation) {
      await transaction.rollback();
      return { success: false, message: 'No active reservation found' };
    }

    if (new Date(reservation.expires_at) <= new Date()) {
      await transaction.rollback();
      return { success: false, message: 'Reservation expired' };
    }

    // ✅ TOT VALIDAT - MARCAM COM VENUT
    seat.status = 'SOLD';
    seat.reserved_by = null;
    seat.sold_by = userId;
    seat.updated_at = new Date();
    await seat.save({ transaction });

    // Actualitza reserva
    reservation.status = 'COMPLETED';
    reservation.confirmed_at = new Date();
    reservation.completed_at = new Date();
    await reservation.save({ transaction });

    await transaction.commit();
    return { success: true, message: 'Purchase confirmed' };
  } catch (error) {
    await transaction.rollback();
    console.error('[ReservationService] Error confirming:', error);
    return { success: false, message: 'Error confirming purchase' };
  }
}

/**
 * Obté tots els seients d'un evento amb estat actual
 */
export async function getEventSeatsWithStatus(eventId: number): Promise<SeatResponse[]> {
  const { Seat, Reservation, Zone } = models();
  const seats = await Seat.findAll({
    where: { event_id: eventId },
    include: [{ model: Zone, attributes: ['zone_name', 'price', 'color'] }],
    order: [['row', 'ASC'], ['seat_number', 'ASC']]
  });

  // Verifica reservations expirades
  const pendingReservations = await Reservation.findAll({
    where: {
      event_id: eventId,
      status: 'PENDING'
    }
  });

  const result: SeatResponse[] = [];

  for (const seat of seats) {
    const zone = getSeatZone(seat);

    // Comprova si hi ha reserva vàlida
    let isReserved = false;
    let reservationExpired = false;

    if (seat.status === 'RESERVED') {
      const reservation = pendingReservations.find(r => r.seat_id === seat.id);
      if (reservation) {
        if (new Date(reservation.expires_at) > new Date()) {
          isReserved = true;
        } else {
          reservationExpired = true;
        }
      }
    }

    result.push({
      id: seat.id,
      event_id: seat.event_id,
      zone_id: seat.zone_id,
      row: seat.row,
      seat_number: seat.seat_number,
      status: reservationExpired ? 'AVAILABLE' : seat.status,
      zone: zone?.zone_name || '',
      price: zone?.price || 0,
      color: zone?.color || '',
      reserved_by: isReserved ? seat.reserved_by : undefined,
      expires_at: isReserved ? seat.updated_at?.toISOString() : undefined
    });
  }

  return result;
}

/**
 * Expira automàticament reserves velles
 */
export async function expireOldReservations(): Promise<number> {
  const { Seat, Reservation } = models();
  const now = new Date();

  // Busca reserves expirades
  const expired = await Reservation.findAll({
    where: {
      status: 'PENDING',
      expires_at: {
        [Op.lt]: now
      }
    }
  });

  for (const reservation of expired) {
    const seat = await Seat.findByPk(reservation.seat_id);
    if (seat && seat.status === 'RESERVED' && seat.reserved_by === reservation.user_id) {
      const transaction = await getSequelize().transaction();
      try {
        seat.status = 'AVAILABLE';
        seat.reserved_by = null;
        await seat.save({ transaction });

        reservation.status = 'EXPIRED';
        await reservation.save({ transaction });

        await transaction.commit();
      } catch (error) {
        await transaction.rollback();
        console.error('[ReservationService] Error expiring:', error);
      }
    }
  }

  return expired.length;
}
