import { io, Socket } from 'socket.io-client';
import { ref } from 'vue';

class SocketClient {
  private socket: Socket | null = null;
  private listeners: Map<string, Set<(data: unknown) => void>> = new Map();

  public connectat = ref(false);

  private getSocketUrl() {
    try {
      const config = useRuntimeConfig();
      return config.public.socketUrl || 'http://localhost:3000';
    } catch (e) {
      return 'http://localhost:3000';
    }
  }

  private attachStoredListeners() {
    if (!this.socket) {
      return;
    }

    for (const [event, callbacks] of this.listeners.entries()) {
      for (const callback of callbacks) {
        this.socket.on(event, callback);
      }
    }
  }

  connect() {
    if (this.socket?.connected) {
      return;
    }

    console.log('Connectant a Socket.io:', this.getSocketUrl());
    
    this.socket = io(this.getSocketUrl(), {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      timeout: 5000,
    });

    // Reaplica listeners registrats abans de connectar o després de reconnectar
    this.attachStoredListeners();

    this.socket.on('connect', () => {
      console.log('Connectat al servidor Socket.io');
      this.connectat.value = true;
    });

    this.socket.on('disconnect', () => {
      console.log('Desconnectat del servidor Socket.io');
      this.connectat.value = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('Error de connexió:', error);
      this.connectat.value = false;
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connectat.value = false;
    }
  }

  joinEvent(esdevenimentId: string) {
    this.socket?.emit('join-event', { esdeveniment_id: esdevenimentId });
  }

  leaveEvent(esdevenimentId: string) {
    this.socket?.emit('leave-event', { esdeveniment_id: esdevenimentId });
  }

  reserveSeat(seientId: string, esdevenimentId: string, reservaToken?: string, usuariId?: string) {
    this.socket?.emit('reserve-seat', { 
      seient_id: seientId, 
      esdeveniment_id: esdevenimentId,
      reserva_token: reservaToken,
      usuari_id: usuariId
    });
  }

  releaseSeat(seientId: string, esdevenimentId: string) {
    this.socket?.emit('release-seat', { seient_id: seientId, esdeveniment_id: esdevenimentId });
  }

  confirmPurchase(reservaToken: string, usuari: { nom: string; correu: string }, esdevenimentId: string) {
    this.socket?.emit('confirm-purchase', { reserva_token: reservaToken, usuari, esdeveniment_id: esdevenimentId });
  }

  on(event: string, callback: (data: unknown) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
    this.socket?.on(event, callback);
  }

  off(event: string, callback?: (data: unknown) => void) {
    if (callback) {
      this.listeners.get(event)?.delete(callback);
      this.socket?.off(event, callback);
    } else {
      this.listeners.delete(event);
      this.socket?.off(event);
    }
  }

  getSocket() {
    return this.socket;
  }
}

export const socketClient = new SocketClient();

export function useSocketClient() {
  return {
    connect: () => socketClient.connect(),
    disconnect: () => socketClient.disconnect(),
    joinEvent: (id: string) => socketClient.joinEvent(id),
    leaveEvent: (id: string) => socketClient.leaveEvent(id),
    reserveSeat: (seientId: string, esdevenimentId: string, reservaToken?: string, usuariId?: string) => 
      socketClient.reserveSeat(seientId, esdevenimentId, reservaToken, usuariId),
    releaseSeat: (seientId: string, esdevenimentId: string) => 
      socketClient.releaseSeat(seientId, esdevenimentId),
    confirmPurchase: (reservaToken: string, usuari: { nom: string; correu: string }, esdevenimentId: string) => 
      socketClient.confirmPurchase(reservaToken, usuari, esdevenimentId),
    on: (event: string, callback: (data: unknown) => void) => socketClient.on(event, callback),
    off: (event: string, callback?: (data: unknown) => void) => socketClient.off(event, callback),
    isConnected: socketClient.connectat,
  };
}
