<template>
  <div class="app-shell">
    <div class="mesh mesh-left"></div>
    <div class="mesh mesh-right"></div>

    <nav v-if="authStore.isAuthenticated" class="navbar">
      <NuxtLink to="/events" class="nav-brand">
        <span class="logo-dot"></span>
        <span class="logo-word">a23poldiabel</span>
      </NuxtLink>

      <div class="nav-links">
        <NuxtLink to="/events">Esdeveniments</NuxtLink>
        <NuxtLink to="/account">Compte</NuxtLink>
        <NuxtLink v-if="isAdmin" to="/admin">Admin</NuxtLink>
        <button @click="logout" class="logout-btn">Sortir</button>
      </div>
    </nav>

    <NuxtPage class="page-enter" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '~/stores/authStore';

const router = useRouter();
const authStore = useAuthStore();

const isAdmin = computed(() => {
  const user = authStore.usuari;
  if (!user) {
    return false;
  }

  return user.rol === 'administrador';
});

onMounted(() => {
  authStore.init();
});

function logout() {
  authStore.logout();
  router.push('/login');
}
</script>

<style>
.app-shell {
  min-height: 100vh;
  position: relative;
  isolation: isolate;
}

.mesh {
  position: fixed;
  z-index: -1;
  width: 420px;
  height: 420px;
  border-radius: 42% 58% 60% 40% / 37% 44% 56% 63%;
  filter: blur(2px);
  opacity: 0.35;
  pointer-events: none;
}

.mesh-left {
  top: -140px;
  left: -120px;
  background: linear-gradient(130deg, #0f7b7f, #16a0a5);
  animation: drift-1 14s ease-in-out infinite;
}

.mesh-right {
  top: 20px;
  right: -140px;
  background: linear-gradient(140deg, #ff6b4a, #ffc857);
  animation: drift-2 16s ease-in-out infinite;
}

.navbar {
  position: sticky;
  top: 0.8rem;
  z-index: 20;
  margin: 0.8rem auto 0;
  width: min(1180px, calc(100% - 1.4rem));
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.84);
  border: 1px solid rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  box-shadow: 0 10px 30px rgba(31, 35, 40, 0.12);
}

.nav-brand {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  font-family: var(--font-heading);
  font-size: 1.05rem;
  color: #182027;
  text-decoration: none;
}

.logo-dot {
  width: 0.7rem;
  height: 0.7rem;
  border-radius: 50%;
  background: linear-gradient(120deg, #ff6b4a, #ffc857);
  box-shadow: 0 0 0 6px rgba(255, 107, 74, 0.2);
}

.logo-word {
  letter-spacing: 0.03em;
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.nav-links a {
  color: #334452;
  text-decoration: none;
  font-weight: 700;
  border-radius: 999px;
  padding: 0.45rem 0.9rem;
  transition: background-color 0.2s, color 0.2s;
}

.nav-links a:hover,
.nav-links a.router-link-active {
  color: #0f7b7f;
  background: rgba(15, 123, 127, 0.12);
}

.logout-btn {
  background: #202a33;
  border: none;
  color: #f4f6f8;
  padding: 0.5rem 0.95rem;
  border-radius: 999px;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.logout-btn:hover {
  transform: translateY(-1px);
}

@media (max-width: 900px) {
  .navbar {
    border-radius: 1rem;
    align-items: flex-start;
    flex-direction: column;
    gap: 0.6rem;
  }

  .nav-links {
    width: 100%;
    flex-wrap: wrap;
  }
}

@keyframes drift-1 {
  0%, 100% { transform: translate(0, 0) rotate(0deg); }
  50% { transform: translate(18px, 16px) rotate(8deg); }
}

@keyframes drift-2 {
  0%, 100% { transform: translate(0, 0) rotate(0deg); }
  50% { transform: translate(-12px, 20px) rotate(-9deg); }
}
</style>
