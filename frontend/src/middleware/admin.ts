import { defineNuxtRouteMiddleware, navigateTo } from '#app';
import { useAuthStore } from '~/stores/authStore';

const ADMIN_EMAIL = 'admin@gmail.com';

export default defineNuxtRouteMiddleware(() => {
  const authStore = useAuthStore();
  const user = authStore.usuari;

  if (!user) {
    return navigateTo('/login');
  }

  if (user.correu_electronic.toLowerCase() !== ADMIN_EMAIL || user.rol !== 'administrador') {
    return navigateTo('/events');
  }
});
