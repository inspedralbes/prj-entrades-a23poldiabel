import { defineNuxtRouteMiddleware, navigateTo } from '#app';
import { useAuthStore } from '~/stores/authStore';

export default defineNuxtRouteMiddleware(() => {
  const authStore = useAuthStore();
  const user = authStore.usuari;

  if (!user) {
    return navigateTo('/login');
  }

  if (user.rol !== 'administrador') {
    return navigateTo('/events');
  }
});
