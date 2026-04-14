import { defineNuxtRouteMiddleware, navigateTo } from '#app';
import { useAuthStore } from '~/stores/authStore';
import { getAuthRedirect } from '~/utils/routeAccess';

export default defineNuxtRouteMiddleware((to, from) => {
  const authStore = useAuthStore();

  const redirectPath = getAuthRedirect(to.path, authStore.isAuthenticated);
  if (redirectPath) {
    return navigateTo(redirectPath);
  }
});
