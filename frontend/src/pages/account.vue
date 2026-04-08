<template>
  <div class="account-page">
    <div class="account-header">
      <h1>El meu compte</h1>
      <div class="user-info">
        <div class="avatar">{{ usuari?.nom?.charAt(0).toUpperCase() }}</div>
        <div class="user-details">
          <h2>{{ usuari?.nom }}</h2>
          <p>{{ usuari?.correu_electronic }}</p>
        </div>
      </div>
    </div>

    <section v-if="reservesActives.length > 0" class="reserves-section">
      <h3>Les meves reserves actives</h3>
      <div class="tickets-list">
        <div v-for="reserva in reservesActives" :key="reserva.id" class="ticket-card reservation">
          <div class="ticket-event">
            <span class="ticket-badge">RESERVA</span>
            <h4>{{ reserva.esdeveniment?.nom }}</h4>
            <p class="ticket-date">Expiració: {{ formatTime(reserva.data_expiracio) }}</p>
          </div>
          <div class="ticket-details">
            <div class="ticket-seats">
              <span class="label">Seients:</span>
              <div class="seats-list">
                <span v-for="seient in reserva.seients" :key="seient.id" class="seat-tag">
                  {{ seient.fila }}{{ seient.numero }} ({{ seient.zona?.nom }})
                </span>
              </div>
            </div>
            <NuxtLink :to="`/events/${reserva.esdeveniment_id}`" class="btn btn-secondary btn-sm">
              Continuar compra
            </NuxtLink>
          </div>
        </div>
      </div>
    </section>

    <section class="tickets-section">
      <h3>Les meves entrades</h3>
      
      <div v-if="carregant" class="loading">Carregant entrades...</div>
      
      <div v-else-if="error" class="error-message">{{ error }}</div>
      
      <div v-else-if="entrades.length === 0" class="empty-state">
        <p>No tens cap entrada encara.</p>
        <NuxtLink to="/events" class="btn btn-primary">Veure esdeveniments</NuxtLink>
      </div>
      
      <div v-else class="tickets-list">
        <div v-for="entrada in entrades" :key="entrada.id" class="ticket-card">
          <div class="ticket-event">
            <span class="ticket-badge">ENTRADA</span>
            <h4>{{ entrada.esdeveniment?.nom }}</h4>
            <p class="ticket-date">{{ formatDate(entrada.esdeveniment?.data_hora) }}</p>
            <p class="ticket-venue">{{ entrada.esdeveniment?.recinte }}</p>
          </div>
          <div class="ticket-details">
            <div class="ticket-code">
              <span class="label">Codi:</span>
              <span class="code">{{ entrada.codi_entrada }}</span>
            </div>
            <div class="ticket-seats">
              <span class="label">Seients:</span>
              <div class="seats-list">
                <span v-for="seient in entrada.seients" :key="seient.id" class="seat-tag">
                  {{ seient.fila }}{{ seient.numero }} ({{ seient.zona }})
                </span>
              </div>
            </div>
            <div class="ticket-purchase-date">
              <span class="label">Data compra:</span>
              <span>{{ formatDate(entrada.data_compra) }}</span>
            </div>
          </div>
          <div class="ticket-qr">
            <div class="qr-placeholder">QR</div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '~/stores/authStore';
import { apiClient } from '~/services/apiClient';

definePageMeta({
  middleware: 'auth'
});

const router = useRouter();
const authStore = useAuthStore();

interface Entrada {
  id: string;
  codi_entrada: string;
  data_compra: string;
  esdeveniment?: {
    nom: string;
    data_hora: string;
    recinte: string;
  };
  seients: Array<{
    id: string;
    numero: string;
    fila: string;
    zona: string;
  }>;
}

interface Reserva {
  id: string;
  token: string;
  esdeveniment_id: string;
  data_expiracio: string;
  esdeveniment?: {
    nom: string;
  };
  seients: Array<{
    id: string;
    numero: string;
    fila: string;
    zona?: { nom: string };
  }>;
}

const entrades = ref<Entrada[]>([]);
const reservesActives = ref<Reserva[]>([]);
const carregant = ref(true);
const error = ref<string | null>(null);

const usuari = computed(() => authStore.usuari);

onMounted(async () => {
  try {
    const [entradesDades, reservesDades] = await Promise.all([
      apiClient.get('/entrades/usuari'),
      apiClient.get('/reserves/usuari')
    ]);
    entrades.value = (entradesDades as any).entrades;
    reservesActives.value = (reservesDades as any).reserves;
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Error carregant dades';
  } finally {
    carregant.value = false;
  }
});

function formatDate(data?: string) {
  if (!data) return '';
  return new Date(data).toLocaleDateString('ca-ES', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatTime(data?: string) {
  if (!data) return '';
  return new Date(data).toLocaleTimeString('ca-ES', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}
</script>

<style scoped>
.reserves-section {
  margin-bottom: 3rem;
}

.ticket-card.reservation {
  border-left: 4px solid #f1c40f;
}

.ticket-card.reservation .ticket-event {
  background: #f1c40f;
  color: #1a1a2e;
}

.btn-sm {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
}
.account-page {
  padding: 2rem;
  max-width: 900px;
  margin: 0 auto;
}

.account-header {
  margin-bottom: 2rem;
}

.account-header h1 {
  color: #1a1a2e;
  margin-bottom: 1.5rem;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: #fff;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.avatar {
  width: 60px;
  height: 60px;
  background: #4a90d9;
  color: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: bold;
}

.user-details h2 {
  color: #1a1a2e;
  margin-bottom: 0.25rem;
}

.user-details p {
  color: #666;
}

.tickets-section h3 {
  color: #1a1a2e;
  margin-bottom: 1.5rem;
}

.loading, .error-message {
  text-align: center;
  padding: 2rem;
  color: #666;
}

.error-message {
  color: #e74c3c;
}

.empty-state {
  text-align: center;
  padding: 3rem;
  background: #fff;
  border-radius: 12px;
}

.empty-state p {
  color: #666;
  margin-bottom: 1.5rem;
}

.btn {
  display: inline-block;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 600;
  transition: all 0.2s;
}

.btn-primary {
  background: #4a90d9;
  color: #fff;
}

.btn-primary:hover {
  background: #357abd;
}

.tickets-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.ticket-card {
  display: flex;
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.ticket-event {
  background: #4a90d9;
  color: #fff;
  padding: 1.5rem;
  min-width: 200px;
  position: relative;
}

.ticket-badge {
  position: absolute;
  top: 1rem;
  left: 1rem;
  font-size: 0.7rem;
  font-weight: bold;
  opacity: 0.8;
}

.ticket-event h4 {
  margin-top: 1.5rem;
  font-size: 1.1rem;
}

.ticket-date, .ticket-venue {
  font-size: 0.85rem;
  opacity: 0.9;
  margin-top: 0.25rem;
}

.ticket-details {
  flex: 1;
  padding: 1.5rem;
}

.ticket-code, .ticket-seats, .ticket-purchase-date {
  margin-bottom: 0.75rem;
}

.label {
  color: #666;
  font-size: 0.85rem;
  display: block;
  margin-bottom: 0.25rem;
}

.code {
  font-family: monospace;
  font-size: 1.1rem;
  color: #1a1a2e;
  font-weight: 600;
}

.seats-list {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.seat-tag {
  background: #f0f4f8;
  color: #4a90d9;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 500;
}

.ticket-qr {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  background: #f9f9f9;
  min-width: 100px;
}

.qr-placeholder {
  width: 60px;
  height: 60px;
  background: #1a1a2e;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  border-radius: 4px;
}
</style>
