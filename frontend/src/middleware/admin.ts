import { defineNuxtRouteMiddleware, navigateTo } from '#app';
import { useAuthStore } from '~/stores/authStore';
import { getAdminRedirect } from '~/utils/routeAccess';

export default defineNuxtRouteMiddleware(() => {
  const authStore = useAuthStore();
  const redirectPath = getAdminRedirect(authStore.usuari?.rol);
  if (redirectPath) {
    return navigateTo(redirectPath);
  }
});
