import { getPool } from '../config/database.js';

function pool() {
  return getPool();
}

export async function getEventSeatsWithStatus(eventId) {
  const sql = `
    SELECT
      s.id,
      s.event_id,
      s.zone_id,
      s.row,
      s.seat_number,
      CASE
        WHEN s.status = 'RESERVED' AND r.id IS NULL THEN 'AVAILABLE'
        ELSE s.status
      END AS status,
      z.zone_name AS zone,
      z.price,
      z.color,
      s.reserved_by,
      r.expires_at
    FROM seats s
    JOIN zones z ON z.id = s.zone_id
    LEFT JOIN reservations r
      ON r.seat_id = s.id
      AND r.status = 'PENDING'
      AND r.expires_at > NOW()
    WHERE s.event_id = $1
    ORDER BY s.row, s.seat_number
  `;

  const result = await pool().query(sql, [eventId]);
  return result.rows;
}

export async function attemptSeatReservation(userId, eventId, seatId) {
  const client = await pool().connect();

  try {
    await client.query('BEGIN');

    const seatResult = await client.query(
      `SELECT id, event_id, status, reserved_by
       FROM seats
       WHERE id = $1 AND event_id = $2
       FOR UPDATE`,
      [seatId, eventId]
    );

    if (seatResult.rowCount === 0) {
      await client.query('ROLLBACK');
      return { success: false, message: 'Seient no trobat per aquest esdeveniment' };
    }

    const seat = seatResult.rows[0];
    if (seat.status !== 'AVAILABLE') {
      await client.query('ROLLBACK');
      return { success: false, message: 'El seient ja no esta disponible' };
    }

    await client.query(
      `UPDATE seats
       SET status = 'RESERVED', reserved_by = $2, updated_at = NOW()
       WHERE id = $1`,
      [seatId, userId]
    );

    const reservationResult = await client.query(
      `INSERT INTO reservations (seat_id, user_id, event_id, status, reserved_at, expires_at)
       VALUES ($1, $2, $3, 'PENDING', NOW(), NOW() + INTERVAL '5 minutes')
       RETURNING id, seat_id, user_id, event_id, expires_at`,
      [seatId, userId, eventId]
    );

    await client.query('COMMIT');

    return {
      success: true,
      reservation: reservationResult.rows[0],
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function releaseSeatReservation(seatId, userId) {
  const client = await pool().connect();

  try {
    await client.query('BEGIN');

    const reservationResult = await client.query(
      `SELECT id
       FROM reservations
       WHERE seat_id = $1
         AND user_id = $2
         AND status = 'PENDING'
         AND expires_at > NOW()
       ORDER BY reserved_at DESC
       LIMIT 1
       FOR UPDATE`,
      [seatId, userId]
    );

    if (reservationResult.rowCount === 0) {
      await client.query('ROLLBACK');
      return false;
    }

    await client.query(
      `UPDATE seats
       SET status = 'AVAILABLE', reserved_by = NULL, updated_at = NOW()
       WHERE id = $1`,
      [seatId]
    );

    await client.query(
      `UPDATE reservations
       SET status = 'CANCELLED'
       WHERE id = $1`,
      [reservationResult.rows[0].id]
    );

    await client.query('COMMIT');
    return true;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function confirmSeatPurchase(seatId, userId) {
  const client = await pool().connect();

  try {
    await client.query('BEGIN');

    const reservationResult = await client.query(
      `SELECT id
       FROM reservations
       WHERE seat_id = $1
         AND user_id = $2
         AND status = 'PENDING'
         AND expires_at > NOW()
       ORDER BY reserved_at DESC
       LIMIT 1
       FOR UPDATE`,
      [seatId, userId]
    );

    if (reservationResult.rowCount === 0) {
      await client.query('ROLLBACK');
      return { success: false, message: 'No hi ha reserva activa per aquest seient' };
    }

    await client.query(
      `UPDATE seats
       SET status = 'SOLD', reserved_by = NULL, sold_by = $2, updated_at = NOW()
       WHERE id = $1`,
      [seatId, userId]
    );

    await client.query(
      `UPDATE reservations
       SET status = 'COMPLETED', confirmed_at = NOW(), completed_at = NOW()
       WHERE id = $1`,
      [reservationResult.rows[0].id]
    );

    await client.query('COMMIT');
    return { success: true };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function expireOldReservations() {
  const client = await pool().connect();

  try {
    await client.query('BEGIN');

    const expiredResult = await client.query(
      `SELECT id, seat_id
       FROM reservations
       WHERE status = 'PENDING' AND expires_at <= NOW()
       FOR UPDATE`
    );

    if (expiredResult.rowCount === 0) {
      await client.query('COMMIT');
      return 0;
    }

    const seatIds = expiredResult.rows.map((row) => row.seat_id);
    const reservationIds = expiredResult.rows.map((row) => row.id);

    await client.query(
      `UPDATE seats
       SET status = 'AVAILABLE', reserved_by = NULL, updated_at = NOW()
       WHERE id = ANY($1::bigint[])`,
      [seatIds]
    );

    await client.query(
      `UPDATE reservations
       SET status = 'CANCELLED'
       WHERE id = ANY($1::bigint[])`,
      [reservationIds]
    );

    await client.query('COMMIT');
    return reservationIds.length;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
