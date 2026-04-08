import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { useRuntimeConfig } from '#app';

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

export const useAdminStore = defineStore('admin', () => {
  const stats = ref<AdminStats | null>(null);
  const carregant = ref(false);
  const error = ref<string | null>(null);
  const connectedUsers = ref(0);

  function getApiBaseUrl() {
    const config = useRuntimeConfig();
    return (config.public.apiUrl || 'http://localhost:3000/api').replace(/\/$/, '');
  }

  async function obtenirStats(eventos_id: string) {
    carregant.value = true;
    error.value = null;
    try {
      const resposta = await fetch(`${getApiBaseUrl()}/admin/events/${eventos_id}/stats`);
      if (!resposta.ok) {
        throw new Error('Error en obtenir estadístiques');
      }
      const dades = await resposta.json();
      stats.value = dades.stats;
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Error desconegut';
    } finally {
      carregant.value = false;
    }
  }

  async function obtenirInforme(eventos_id: string) {
    try {
      const resposta = await fetch(`${getApiBaseUrl()}/admin/events/${eventos_id}/report`);
      if (!resposta.ok) {
        throw new Error('Error en obtenir informe');
      }
      return await resposta.json();
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Error desconegut';
      return null;
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
    carregant,
    error,
    connectedUsers,
    obtenirStats,
    obtenirInforme,
    actualitzarStats,
    clearStats,
  };
});
