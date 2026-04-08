<template>
  <div class="container">
    <NuxtLink to="/" class="torna">&larr; Tornar als esdeveniments</NuxtLink>

    <h1>Checkout</h1>

    <div v-if="compraExitosa" class="success-message card">
      Compra realitzada amb èxit! Les teves entrades s'han enviat al teu correu.
    </div>

    <div v-else-if="!reservaActiva" class="error-message">
      No tens cap reserva activa. Si us plau, selecciona uns seients primer.
    </div>

    <div v-else class="checkout-contingut">
      <div class="resum-compra card">
        <h2>Resum de la compra</h2>
        <div class="seients-seleccionats">
          <h3>Seients seleccionats:</h3>
          <ul>
            <li v-for="seient in seientsResum" :key="seient.id">
              {{ seient.etiqueta }}
            </li>
          </ul>
        </div>
        <div class="temps-restant">
          Temps restant: {{ tempsRestantFormatat }}
        </div>
      </div>

      <form class="formulari-compra card" @submit.prevent="confirmarCompra">
        <h2>Dades del compte</h2>

        <div class="form-group info-group">
          <label>Nom</label>
          <p>{{ usuariSessio?.nom || '-' }}</p>
        </div>

        <div class="form-group info-group">
          <label>Correu electrònic</label>
          <p>{{ usuariSessio?.correu_electronic || '-' }}</p>
        </div>

        <div v-if="error" class="error-message">{{ error }}</div>
        <button type="submit" class="btn btn-primary" :disabled="carregant || !usuariSessio">
          {{ carregant ? 'Processant...' : 'Confirmar compra' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useReservaStore } from '~/stores/reservaStore';
import { useSeientStore } from '~/stores/seientStore';
import { useAuthStore } from '~/stores/authStore';
import { apiClient } from '~/services/apiClient';

definePageMeta({
  middleware: 'auth'
});

const router = useRouter();
const reservaStore = useReservaStore();
const seientStore = useSeientStore();
const authStore = useAuthStore();

const carregant = ref(false);
const error = ref<string | null>(null);
const compraExitosa = ref(false);

const reservaActiva = computed(() => reservaStore.reservaActiva);
const seientsSeleccionats = computed(() => seientStore.seientsSeleccionats);
const tempsRestant = computed(() => reservaStore.tempsRestant);
const usuariSessio = computed(() => authStore.usuari);
const tempsRestantFormatat = computed(() => {
  const minuts = Math.floor(tempsRestant.value / 60);
  const segons = tempsRestant.value % 60;
  return `${String(minuts).padStart(2, '0')}:${String(segons).padStart(2, '0')}`;
});

const seientsResum = computed(() => {
  return seientsSeleccionats.value.map((seientId) => {
    const seient = seientStore.seients.find((s) => s.id === seientId);
    if (!seient) {
      return {
        id: seientId,
        etiqueta: `Seient ${seientId.slice(0, 8)}...`,
      };
    }

    const zona = seient.zona?.nom ? ` (${seient.zona.nom})` : '';
    return {
      id: seientId,
      etiqueta: `Fila ${seient.fila} - Seient ${seient.numero}${zona}`,
    };
  });
});

watch(tempsRestant, (valor) => {
  if (compraExitosa.value) {
    return;
  }

  if (valor <= 0 && reservaActiva.value) {
    error.value = 'La teva reserva ha expirat!';
    reservaStore.clearReserva();
    seientStore.clearSeleccionats();
    router.push('/events');
  }
}, { immediate: true });

async function confirmarCompra() {
  if (!reservaActiva.value) return;
  if (!usuariSessio.value) {
    error.value = 'No hi ha cap usuari autenticat';
    return;
  }
  
  carregant.value = true;
  error.value = null;

  try {
    await apiClient.post('/compres', {
      reserva_token: reservaActiva.value.token,
      usuari: {
        nom: usuariSessio.value.nom,
        correu: usuariSessio.value.correu_electronic,
      },
    });

    compraExitosa.value = true;
    carregant.value = false;

    setTimeout(() => {
      reservaStore.clearReserva();
      seientStore.clearSeleccionats();
      router.push('/events');
    }, 1800);
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Error en confirmar la compra';
    carregant.value = false;
  }
}
</script>

<style scoped>
.torna {
  display: inline-block;
  margin-bottom: var(--spacing-lg);
  color: var(--color-primary);
  text-decoration: none;
}

.checkout-contingut {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-xl);
  margin-top: var(--spacing-lg);
}

@media (max-width: 768px) {
  .checkout-contingut {
    grid-template-columns: 1fr;
  }
}

.seients-seleccionats {
  margin: var(--spacing-md) 0;
}

.temps-restant {
  font-size: 1.25rem;
  font-weight: bold;
  color: var(--color-warning);
}

.formulari-compra .form-group {
  margin-bottom: var(--spacing-md);
}

.formulari-compra label {
  display: block;
  margin-bottom: var(--spacing-xs);
  font-weight: 500;
}

.info-group p {
  margin: 0;
  padding: 0.7rem 0.8rem;
  border: 1px solid #dbe3ef;
  border-radius: 8px;
  background: #f8fafc;
  color: #1f2937;
}
</style>
