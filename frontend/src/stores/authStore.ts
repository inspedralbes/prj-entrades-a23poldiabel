import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { useRuntimeConfig, useCookie } from '#app';

export interface Usuari {
  id: string;
  correu_electronic: string;
  nom: string;
  rol: 'comprador' | 'administrador';
}

export const useAuthStore = defineStore('auth', () => {
  const config = useRuntimeConfig();
  const usuari = ref<Usuari | null>(null);
  const token = ref<string | null>(null);
  const carregant = ref(false);
  const error = ref<string | null>(null);

  const cookieToken = useCookie('auth_token');
  const cookieUsuari = useCookie<Usuari>('auth_usuari');

  const isAuthenticated = computed(() => !!token.value || !!cookieToken.value);

  function init() {
    if (cookieToken.value) {
      token.value = cookieToken.value;
    }
    if (cookieUsuari.value) {
      usuari.value = cookieUsuari.value;
    }
  }

  async function register(correu_electronic: string, nom: string, contrasenya: string) {
    carregant.value = true;
    error.value = null;
    try {
      const resposta = await fetch(`${config.public.apiUrl}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correu_electronic, nom, contrasenya }),
      });
      const dades = await resposta.json();
      if (!resposta.ok) {
        throw new Error(dades.missatge || 'Error en el registre');
      }
      token.value = dades.token;
      usuari.value = dades.usuari;
      cookieToken.value = dades.token;
      cookieUsuari.value = dades.usuari;
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Error desconegut';
      throw e;
    } finally {
      carregant.value = false;
    }
  }

  async function login(correu_electronic: string, contrasenya: string) {
    carregant.value = true;
    error.value = null;
    try {
      const resposta = await fetch(`${config.public.apiUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correu_electronic, contrasenya }),
      });
      const dades = await resposta.json();
      if (!resposta.ok) {
        throw new Error(dades.missatge || 'Error en el login');
      }
      token.value = dades.token;
      usuari.value = dades.usuari;
      cookieToken.value = dades.token;
      cookieUsuari.value = dades.usuari;
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Error desconegut';
      throw e;
    } finally {
      carregant.value = false;
    }
  }

  function logout() {
    token.value = null;
    usuari.value = null;
    cookieToken.value = null;
    cookieUsuari.value = null;
  }

  function getAuthHeader() {
    return token.value ? { Authorization: `Bearer ${token.value}` } : {};
  }

  return {
    usuari,
    token,
    carregant,
    error,
    isAuthenticated,
    init,
    register,
    login,
    logout,
    getAuthHeader,
  };
});