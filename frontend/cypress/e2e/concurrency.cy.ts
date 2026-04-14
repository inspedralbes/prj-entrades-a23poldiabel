/// <reference types="cypress" />

import { io, Socket } from 'socket.io-client';

type RegisterResponse = {
  token: string;
  usuari: { id: string; correu_electronic: string; nom: string; rol: string };
};

type SeatsResponse = {
  data: Array<{ id: number; status: 'AVAILABLE' | 'RESERVED' | 'SOLD' }>;
};

function waitForAnyEvent(socket: Socket, events: string[], timeoutMs = 6000): Promise<{ event: string; data: any }> {
  return new Promise<{ event: string; data: any }>((resolve, reject) => {
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error(`Timeout waiting events: ${events.join(', ')}`));
    }, timeoutMs);

    const handlers = new Map<string, (payload: any) => void>();

    const cleanup = () => {
      clearTimeout(timer);
      for (const [event, handler] of handlers.entries()) {
        socket.off(event, handler);
      }
    };

    for (const event of events) {
      const handler = (data: any) => {
        cleanup();
        resolve({ event, data });
      };
      handlers.set(event, handler);
      socket.on(event, handler);
    }
  });
}

describe('Flux de compra i concurrencia', () => {
  it('flux normal: login, events i navegacio basica', () => {
    cy.visit('/login');
    cy.contains('Iniciar sessio').should('be.visible');
    cy.visit('/events');
    cy.url().should('include', '/login');
  });

  it('concurrencia: dos usuaris intenten reservar el mateix seient i nomes un ho aconsegueix', () => {
    const apiBase = Cypress.env('API_BASE') || 'http://localhost:8000/api';
    const socketBase = Cypress.env('SOCKET_BASE') || 'http://localhost:3000';
    const unique = Date.now();

    const u1 = {
      email: `u1_${unique}@example.com`,
      password: 'Secret123!'
    };
    const u2 = {
      email: `u2_${unique}@example.com`,
      password: 'Secret123!'
    };

    let token1 = '';
    let token2 = '';
    let eventId = 0;
    let seatId = 0;

    cy.request<RegisterResponse>('POST', `${apiBase}/auth/register`, {
      email: u1.email,
      password: u1.password,
      full_name: 'Usuari U1'
    }).then((r) => {
      token1 = r.body.token;
    });

    cy.request<RegisterResponse>('POST', `${apiBase}/auth/register`, {
      email: u2.email,
      password: u2.password,
      full_name: 'Usuari U2'
    }).then((r) => {
      token2 = r.body.token;
    });

    cy.request('GET', `${apiBase}/events`).then((r) => {
      const events = r.body?.data || r.body?.events || [];
      expect(events.length).to.be.greaterThan(0);
      eventId = Number(events[0].id);
    });

    cy.request<SeatsResponse>('GET', `${apiBase}/seients/${eventId}`).then((r) => {
      const available = r.body.data.find((s) => s.status === 'AVAILABLE');
      expect(available, 'Seat AVAILABLE').to.exist;
      seatId = Number(available!.id);
    });

    cy.then(async () => {
      const s1 = io(socketBase, { transports: ['websocket'], auth: { token: token1 } });
      const s2 = io(socketBase, { transports: ['websocket'], auth: { token: token2 } });

      await new Promise<void>((resolve, reject) => {
        let connected = 0;
        const done = () => {
          connected += 1;
          if (connected === 2) {
            resolve();
          }
        };
        const fail = (err: any) => reject(err);
        s1.once('connect', done);
        s2.once('connect', done);
        s1.once('connect_error', fail);
        s2.once('connect_error', fail);
      });

      s1.emit('join-event', { esdeveniment_id: String(eventId), token: token1 });
      s2.emit('join-event', { esdeveniment_id: String(eventId), token: token2 });

      await Promise.all([
        new Promise<void>((resolve) => s1.once('event-joined', () => resolve())),
        new Promise<void>((resolve) => s2.once('event-joined', () => resolve())),
      ]);

      s1.emit('reserve-seat', { seient_id: String(seatId), esdeveniment_id: String(eventId), token: token1 });
      s2.emit('reserve-seat', { seient_id: String(seatId), esdeveniment_id: String(eventId), token: token2 });

      const r1 = await waitForAnyEvent(s1, ['reservation-confirmed', 'reservation-error', 'reservation-failed']);
      const r2 = await waitForAnyEvent(s2, ['reservation-confirmed', 'reservation-error', 'reservation-failed']);

      const winnerCount = [r1, r2].filter((r) => r.event === 'reservation-confirmed').length;
      const loserCount = [r1, r2].filter((r) => r.event !== 'reservation-confirmed').length;

      expect(winnerCount).to.equal(1);
      expect(loserCount).to.equal(1);

      s1.disconnect();
      s2.disconnect();
    });
  });
});
