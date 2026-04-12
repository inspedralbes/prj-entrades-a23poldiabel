<template>
  <div class="account-page page-enter">
    <div class="account-header">
      <h1>a23poldiabel · El meu compte</h1>
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
                  {{ seient.fila }}{{ seient.numero }} ({{ seient.zona?.nom || 'General' }})
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
import { useAuthStore } from '~/stores/authStore';

definePageMeta({
  middleware: 'auth'
});

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
    const { apiClient } = await import('~/services/apiClient');
    
    const [entradesDades, reservesDades] = await Promise.allSettled([
      apiClient.get('/entrades/usuari'),
      apiClient.get('/reserves/usuari')
    ]);

    if (entradesDades.status === 'fulfilled') {
      entrades.value = (entradesDades.value as any).entrades || [];
    }
    
    if (reservesDades.status === 'fulfilled') {
      reservesActives.value = (reservesDades.value as any).reserves || [];
    }
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
  border-left: 4px solid #ffc857;
}

.ticket-card.reservation .ticket-event {
  background: linear-gradient(150deg, #ffc857, #ff8f58);
  color: #2f1e12;
}

.btn-sm {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
}
.account-page {
  padding: 1.4rem;
  max-width: 900px;
  margin: 0 auto;
}

.account-header {
  margin-bottom: 2rem;
}

.account-header h1 {
  color: #1f2a34;
  margin-bottom: 1.5rem;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: rgba(255, 255, 255, 0.88);
  padding: 1.5rem;
  border-radius: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.85);
  box-shadow: 0 18px 34px rgba(21, 34, 49, 0.11);
}

.avatar {
  width: 60px;
  height: 60px;
  background: linear-gradient(140deg, #0f7b7f, #15a2a8);
  color: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: bold;
}

.user-details h2 {
  color: #1f2a34;
  margin-bottom: 0.25rem;
}

.user-details p {
  color: #586571;
}

.tickets-section h3 {
  color: #1f2a34;
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
  background: rgba(255, 255, 255, 0.86);
  border-radius: 1rem;
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
  background: linear-gradient(120deg, #ff6b4a, #ff8f58 62%, #ffc857);
  color: #fff;
}

.btn-primary:hover {
  transform: translateY(-1px);
}

.tickets-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.ticket-card {
  display: flex;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 1rem;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.86);
  box-shadow: 0 16px 28px rgba(21, 34, 49, 0.11);
}

.ticket-event {
  background: linear-gradient(150deg, #0f7b7f, #15a2a8);
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
  color: #34404c;
}

.ticket-code, .ticket-seats, .ticket-purchase-date {
  margin-bottom: 0.75rem;
}

.label {
  color: #5a6672;
  font-size: 0.85rem;
  display: block;
  margin-bottom: 0.25rem;
}

.code {
  font-family: monospace;
  font-size: 1.1rem;
  color: #1f2a34;
  font-weight: 600;
}

.seats-list {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.seat-tag {
  background: #e9f6f6;
  color: #0f7b7f;
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
  background: #f7fafc;
  min-width: 100px;
}

.qr-placeholder {
  width: 60px;
  height: 60px;
  background: #1f2a34;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  border-radius: 4px;
}

@media (max-width: 768px) {
  .account-page {
    padding: 1rem;
  }

  .ticket-card {
    flex-direction: column;
  }

  .ticket-event,
  .ticket-qr {
    min-width: auto;
  }
}
</style>
