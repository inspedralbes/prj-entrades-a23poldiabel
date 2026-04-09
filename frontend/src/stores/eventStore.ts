import { defineStore } from 'pinia';
import { ref } from 'vue';
import { useRuntimeConfig } from '#app';

export interface Zona {
  id: string;
  nom: string;
  preu: number;
  color?: string;
}

export interface Esdeveniment {
  id: string;
  nom: string;
  data_hora: string;
  recinte: string;
  descripcio?: string;
  imatge?: string;
  estat: string;
  zones?: Zona[];
  seients?: any[];
}

export const useEventStore = defineStore('event', () => {
  const esdeveniments = ref<Esdeveniment[]>([]);
  const esdevenimentActual = ref<Esdeveniment | null>(null);
  const carregant = ref(false);
  const error = ref<string | null>(null);

  function getApiBaseUrl() {
    const config = useRuntimeConfig();
    const base = (config.public.apiUrl || 'http://localhost:3000').replace(/\/$/, '');
    return base.endsWith('/api') ? base.slice(0, -4) : base;
  }

  async function obtenirEsdeveniments() {
    carregant.value = true;
    error.value = null;
    try {
      const resposta = await fetch(`${getApiBaseUrl()}/api/events`);
      if (!resposta.ok) {
        throw new Error('Error en obtenir esdeveniments');
      }
      const dades = await resposta.json();
      // El backend retorna múltiples aliases per compatibilitat
      const llista = dades.data || dades.esdeveniments || dades.events || dades.eventos || [];
      esdeveniments.value = Array.isArray(llista) ? llista : [];
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Error desconegut';
    } finally {
      carregant.value = false;
    }
  }

  async function obtenirEsdevenimentPerId(id: string) {
    carregant.value = true;
    error.value = null;
    try {
      const resposta = await fetch(`${getApiBaseUrl()}/api/events/${id}`);
      if (!resposta.ok) {
        throw new Error('Error en obtenir esdeveniment');
      }
      const dades = await resposta.json();
      // El backend retorna directament l'objecte event (no embolcallat)
      const event = dades.data || dades;
      esdevenimentActual.value = event;
      return event;
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Error desconegut';
      return null;
    } finally {
      carregant.value = false;
    }
  }

  function setEsdevenimentActual(esd: Esdeveniment) {
    esdevenimentActual.value = esd;
  }

  return {
    esdeveniments,
    esdevenimentActual,
    carregant,
    error,
    obtenirEsdeveniments,
    obtenirEsdevenimentPerId,
    setEsdevenimentActual,
  };
});
