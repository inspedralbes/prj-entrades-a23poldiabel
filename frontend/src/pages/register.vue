<template>
  <div class="auth-page">
    <div class="auth-container">
      <h1>Crear Compte</h1>
      <form @submit.prevent="handleRegister" class="auth-form">
        <div class="form-group">
          <label for="name">Nom complet</label>
          <input
            id="name"
            v-model="nom"
            type="text"
            required
            placeholder="El teu nom"
          />
        </div>
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
            placeholder="Mínim 6 caràcters"
          />
        </div>
        <p v-if="error" class="error">{{ error }}</p>
        <button type="submit" :disabled="carregant">
          {{ carregant ? 'Creant compte...' : 'Registrar-se' }}
        </button>
      </form>
      <p class="auth-link">
        Ja tens compte? <NuxtLink to="/login">Inicia sessió</NuxtLink>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '~/stores/authStore';

definePageMeta({
  middleware: 'auth'
});

const router = useRouter();
const authStore = useAuthStore();

const nom = ref('');
const email = ref('');
const password = ref('');

const carregant = computed(() => authStore.carregant);
const error = computed(() => authStore.error);

async function handleRegister() {
  if (password.value.length < 6) {
    return;
  }
  try {
    await authStore.register(email.value, nom.value, password.value);
    router.push('/events');
  } catch (e) {
    // Error already handled in store
  }
}
</script>

<style scoped>
.auth-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
}

.auth-container {
  background: #fff;
  padding: 2.5rem;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  width: 100%;
  max-width: 400px;
}

h1 {
  text-align: center;
  color: #1a1a2e;
  margin-bottom: 1.5rem;
  font-size: 1.75rem;
}

.form-group {
  margin-bottom: 1.25rem;
}

label {
  display: block;
  margin-bottom: 0.5rem;
  color: #333;
  font-weight: 500;
}

input {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.2s;
  box-sizing: border-box;
}

input:focus {
  outline: none;
  border-color: #4a90d9;
}

button {
  width: 100%;
  padding: 0.875rem;
  background: #4a90d9;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

button:hover:not(:disabled) {
  background: #357abd;
}

button:disabled {
  background: #a0c4e8;
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
  color: #666;
}

.auth-link a {
  color: #4a90d9;
  font-weight: 600;
}
</style>
