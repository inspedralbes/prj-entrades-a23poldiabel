import { defineStore } from 'pinia';
import { ref } from 'vue';
import { useRuntimeConfig } from '#app';

export interface Esdeveniment {
  id: string;
  nom: string;
  data_hora: string;
  recinte: string;
  descripcio?: string;
  imatge?: string;
  estat: 'actiu' | 'cancelat' | 'finalitzat';
  zones?: Zona[];
}

export interface Zona {
  id: string;
  nom: string;
  preu: number;
  capacitat: number;
}

export const useEventStore = defineStore('event', () => {
  const esdeveniments = ref<Esdeveniment[]>([]);
  const esdevenimentActual = ref<Esdeveniment | null>(null);
  const carregant = ref(false);
  const error = ref<string | null>(null);

  function getApiBaseUrl() {
    const config = useRuntimeConfig();
    return (config.public.apiUrl || 'http://localhost:3000/api').replace(/\/$/, '');
  }

  async function obtenirEsdeveniments() {
    carregant.value = true;
    error.value = null;
    try {
      const resposta = await fetch(`${getApiBaseUrl()}/esdeveniments`);
      if (!resposta.ok) {
        throw new Error('Error en obtenir esdeveniments');
      }
      const dades = await resposta.json();
      esdeveniments.value = dades.esdeveniments;
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
      const resposta = await fetch(`${getApiBaseUrl()}/esdeveniments/${id}`);
      if (!resposta.ok) {
        throw new Error('Error en obtenir esdeveniment');
      }
      const dades = await resposta.json();
      esdevenimentActual.value = dades;
      return dades;
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
