<template>
  <div class="auth-page">
    <div class="auth-container card page-enter">
      <p class="brand">a23poldiabel</p>
      <h1>Iniciar Sessió</h1>
      <form @submit.prevent="handleLogin" class="auth-form">
        <div class="form-group">
          <label for="email">Correu electrònic</label>
          <input
            id="email"
            v-model="email"
            type="email"
            required
            placeholder="exemple@correu.com"
          />
        </div>
        <div class="form-group">
          <label for="password">Contrasenya</label>
          <input
            id="password"
            v-model="password"
            type="password"
            required
            placeholder="La teva contrasenya"
          />
        </div>
        <p v-if="error" class="error">{{ error }}</p>
        <button type="submit" :disabled="carregant">
          {{ carregant ? 'Iniciant...' : 'Iniciar Sessió' }}
        </button>
      </form>
      <p class="auth-link">
        No tens compte? <NuxtLink to="/register">Registra't</NuxtLink>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '~/stores/authStore';

const router = useRouter();
const authStore = useAuthStore();

const email = ref('');
const password = ref('');

const carregant = computed(() => authStore.carregant);
const error = computed(() => authStore.error);

async function handleLogin() {
  try {
    await authStore.login(email.value, password.value);
    router.push('/events');
  } catch (e) {
    // Error already handled in store
  }
}
</script>

<style scoped>
.auth-page {
  min-height: calc(100vh - 5rem);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.2rem;
}

.auth-container {
  padding: 2.5rem;
  width: 100%;
  max-width: 460px;
  border: 1px solid rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(8px);
}

h1 {
  text-align: center;
  color: #182027;
  margin-bottom: 1.5rem;
  font-size: 1.75rem;
}

.brand {
  text-align: center;
  font-size: 0.82rem;
  text-transform: uppercase;
  letter-spacing: 0.18em;
  color: #0f7b7f;
  margin-bottom: 0.55rem;
  font-weight: 800;
}

.form-group {
  margin-bottom: 1.25rem;
}

label {
  display: block;
  margin-bottom: 0.5rem;
  color: #2f3b46;
  font-weight: 700;
}

input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #cfdae4;
  border-radius: 0.8rem;
  font-size: 1rem;
  transition: border-color 0.2s, box-shadow 0.2s;
  box-sizing: border-box;
}

input:focus {
  outline: none;
  border-color: #0f7b7f;
  box-shadow: 0 0 0 4px rgba(15, 123, 127, 0.14);
}

button {
  width: 100%;
  padding: 0.875rem;
  background: linear-gradient(120deg, #ff6b4a, #ff8f58 65%, #ffc857);
  color: #fff;
  border: none;
  border-radius: 999px;
  font-size: 1rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  cursor: pointer;
  transition: transform 0.2s;
}

button:hover:not(:disabled) {
  transform: translateY(-1px);
}

button:disabled {
  background: #f1beaf;
  cursor: not-allowed;
}

.error {
  color: #e74c3c;
  margin-bottom: 1rem;
  text-align: center;
}

.auth-link {
  text-align: center;
  margin-top: 1.5rem;
  color: #5f6c78;
}

.auth-link a {
  color: #0f7b7f;
  font-weight: 600;
}
</style>
