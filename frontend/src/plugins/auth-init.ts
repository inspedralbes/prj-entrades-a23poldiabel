import { defineNuxtPlugin } from '#app';
import { useAuthStore } from '~/stores/authStore';

export default defineNuxtPlugin((nuxtApp) => {
  const authStore = useAuthStore();
  authStore.init();
});