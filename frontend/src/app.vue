<template>
  <div>
    <nav v-if="authStore.isAuthenticated" class="navbar">
      <div class="nav-brand">
        <NuxtLink to="/events">🎵 Entrades</NuxtLink>
      </div>
      <div class="nav-links">
        <NuxtLink to="/events">Esdeveniments</NuxtLink>
        <NuxtLink to="/account">El meu compte</NuxtLink>
        <button @click="logout" class="logout-btn">Tancar sessió</button>
      </div>
    </nav>
    <NuxtPage />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '~/stores/authStore';

const router = useRouter();
const authStore = useAuthStore();

onMounted(() => {
  authStore.init();
});

function logout() {
  authStore.logout();
  router.push('/login');
}
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
  background: #f5f5f5;
  color: #333;
}

.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background: #1a1a2e;
  color: #fff;
}

.nav-brand a {
  font-size: 1.5rem;
  font-weight: bold;
  color: #fff;
  text-decoration: none;
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.nav-links a {
  color: #ccc;
  text-decoration: none;
  transition: color 0.2s;
}

.nav-links a:hover,
.nav-links a.router-link-active {
  color: #fff;
}

.logout-btn {
  background: transparent;
  border: 1px solid #4a90d9;
  color: #4a90d9;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.logout-btn:hover {
  background: #4a90d9;
  color: #fff;
}
</style>
