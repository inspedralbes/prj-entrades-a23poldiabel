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

  function getApiUrl(): string {
    const base = (config.public.apiUrl || 'http://localhost:3000').replace(/\/$/, '');
    return base.endsWith('/api') ? base.slice(0, -4) : base;
  }

  async function register(correu_electronic: string, nom: string, contrasenya: string) {
    carregant.value = true;
    error.value = null;
    try {
      const resposta = await fetch(`${getApiUrl()}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: correu_electronic, 
          password: contrasenya, 
          full_name: nom 
        }),
      });
      const dades = await resposta.json();
      if (!resposta.ok) {
        throw new Error(dades.missatge || dades.error || 'Error en el registre');
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
      const resposta = await fetch(`${getApiUrl()}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: correu_electronic, 
          password: contrasenya 
        }),
      });
      const dades = await resposta.json();
      if (!resposta.ok) {
        throw new Error(dades.missatge || dades.error || 'Error en el login');
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

  function getAuthHeader(): Record<string, string> {
    const t = token.value || cookieToken.value;
    return t ? { Authorization: `Bearer ${t}` } : {};
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