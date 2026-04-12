import { defineStore } from 'pinia';
import { ref } from 'vue';
import { apiClient } from '~/services/apiClient';

export interface AdminStats {
  seients: {
    disponibles: number;
    seleccionats: number;
    venuts: number;
    reservats: number;
    total: number;
  };
  ocupacio_percentatge: string;
  reserves_actives: number;
  compres_totals: number;
  recaptacio_total: number;
}

export interface AdminEvent {
  id: string;
  nom: string;
  data_hora: string;
  recinte: string;
  descripcio?: string;
  estat?: string;
  zones?: Array<{ id: string; nom: string; preu: number }>;
}

export const useAdminStore = defineStore('admin', () => {
  const stats = ref<AdminStats | null>(null);
  const events = ref<AdminEvent[]>([]);
  const carregant = ref(false);
  const error = ref<string | null>(null);
  const connectedUsers = ref(0);

  async function obtenirEvents() {
    carregant.value = true;
    error.value = null;
    try {
      const resposta = await apiClient.get<{ events: AdminEvent[] }>('/admin/events');
      events.value = resposta.events || [];
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Error desconegut';
    } finally {
      carregant.value = false;
    }
  }

  async function obtenirStats(eventId: string) {
    carregant.value = true;
    error.value = null;
    try {
      const dades = await apiClient.get<{ stats: AdminStats }>(`/admin/events/${eventId}/stats`);
      stats.value = dades.stats;
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Error desconegut';
    } finally {
      carregant.value = false;
    }
  }

  async function obtenirInforme(eventId: string) {
    try {
      return await apiClient.get(`/admin/events/${eventId}/report`);
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Error desconegut';
      return null;
    }
  }

  async function crearEvent(payload: {
    nom: string;
    data_hora: string;
    recinte: string;
    descripcio?: string;
  }) {
    carregant.value = true;
    error.value = null;
    try {
      await apiClient.post('/admin/events', {
        ...payload,
        zones: [
          { nom: 'General', preu: 35, color: 'rgba(33,150,243,0.8)', files: 5, seientsPerFila: 12 },
        ],
      });
      await obtenirEvents();
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Error desconegut';
      throw e;
    } finally {
      carregant.value = false;
    }
  }

  async function actualitzarEvent(eventId: string, payload: {
    nom: string;
    data_hora: string;
    recinte: string;
    descripcio?: string;
    estat?: string;
  }) {
    carregant.value = true;
    error.value = null;
    try {
      await apiClient.put(`/admin/events/${eventId}`, payload);
      await obtenirEvents();
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Error desconegut';
      throw e;
    } finally {
      carregant.value = false;
    }
  }

  async function eliminarEvent(eventId: string) {
    carregant.value = true;
    error.value = null;
    try {
      await apiClient.delete(`/admin/events/${eventId}`);
      await obtenirEvents();
      if (stats.value) {
        stats.value = null;
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Error desconegut';
      throw e;
    } finally {
      carregant.value = false;
    }
  }

  function actualitzarStats(nouStats: Partial<AdminStats>) {
    if (stats.value) {
      stats.value = { ...stats.value, ...nouStats };
    }
  }

  function clearStats() {
    stats.value = null;
    connectedUsers.value = 0;
  }

  return {
    stats,
    events,
    carregant,
    error,
    connectedUsers,
    obtenirEvents,
    obtenirStats,
    obtenirInforme,
    crearEvent,
    actualitzarEvent,
    eliminarEvent,
    actualitzarStats,
    clearStats,
  };
});
