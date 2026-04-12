import { defineNuxtRouteMiddleware, navigateTo } from '#app';
import { useAuthStore } from '~/stores/authStore';

export default defineNuxtRouteMiddleware((to, from) => {
  const authStore = useAuthStore();
  
  // Public pages
  const isPublicPage = to.path === '/' || to.path === '/login' || to.path === '/register';

  if (!authStore.isAuthenticated && !isPublicPage) {
    return navigateTo('/login');
  }

  // Redirect to events if already logged in and trying to access login/register
  if (authStore.isAuthenticated && (to.path === '/login' || to.path === '/register')) {
    return navigateTo('/events');
  }
});
