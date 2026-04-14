<template>
  <div class="event-detail">
    <NuxtLink to="/events" class="back-link">&larr; Tornar als esdeveniments</NuxtLink>

    <div v-if="carregant" class="loading">Carregant...</div>
    
    <div v-else-if="error" class="error-message">{{ error }}</div>
    
    <div v-else-if="esdeveniment" class="event-content">
      <div class="event-banner" v-if="esdeveniment.imatge">
        <img :src="esdeveniment.imatge" :alt="esdeveniment.nom" />
      </div>
      <header class="event-header">
        <div class="event-date-badge">
          <span class="day">{{ getDay(esdeveniment.data_hora) }}</span>
          <span class="month">{{ getMonth(esdeveniment.data_hora) }}</span>
        </div>
        <div class="event-info">
          <h1>{{ esdeveniment.nom }}</h1>
          <p class="venue">{{ esdeveniment.recinte }}</p>
          <p class="time">{{ getTime(esdeveniment.data_hora) }}</p>
          <p v-if="esdeveniment.descripcio" class="description">{{ esdeveniment.descripcio }}</p>
        </div>
      </header>

      <div v-if="reservaActiva" class="reservation-banner">
        <div class="reservation-info">
          <p class="reservation-title">Reserva activa!</p>
          <p>Seients seleccionats: <strong>{{ seientsSeleccionats.length }}</strong></p>
          <div class="timer">
            Temps restant: <strong>{{ tempsRestant }}s</strong>
          </div>
        </div>
        <div class="reservation-actions">
          <button class="btn btn-primary" @click="anarCheckout">
            Comprar ara
          </button>
          <button class="btn btn-secondary" @click="cancelarReserva">
            Cancel·lar
          </button>
        </div>
      </div>

      <div class="zones-legend">
        <h3>Zones i preus</h3>
        <div class="zones-list">
          <div v-for="zona in esdeveniment.zones" :key="zona.id" class="zone-item">
            <span class="zone-name">{{ zona.nom }}</span>
            <span class="zone-price">{{ zona.preu }}€</span>
          </div>
        </div>
      </div>

      <SeatMap
        :seients="seientsFormatats"
        :reserva-activa="false"
        @seleccionar-seient="reservarSeient"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '~/stores/authStore';
import { useEventStore } from '~/stores/eventStore';
import { useSeientStore } from '~/stores/seientStore';
import { useReservaStore } from '~/stores/reservaStore';
import { useSocketClient } from '~/services/socketClient';
import { apiClient } from '~/services/apiClient';
import SeatMap from '~/components/SeatMap.vue';

definePageMeta({
  middleware: 'auth'
});

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const eventStore = useEventStore();
const seientStore = useSeientStore();
const reservaStore = useReservaStore();
const { connect, joinEvent, leaveEvent, reserveSeat, on, off } = useSocketClient();

const carregant = ref(true);
const error = ref<string | null>(null);

const esdeveniment = computed(() => eventStore.esdevenimentActual);
const seients = computed(() => seientStore.seients);
const reservaActiva = computed(() => reservaStore.reservaActiva);
const seientsSeleccionats = computed(() => seientStore.seientsSeleccionats);
const tempsRestant = computed(() => reservaStore.tempsRestant);

const seientsFormatats = computed(() => {
  return seients.value.map(s => ({
    id: s.id,
    numero: s.numero,
    fila: s.fila,
    estat: s.estat as 'disponible' | 'reservat' | 'seleccionat' | 'venut',
    zona: {
      id: (s.zona as any)?.id || '',
      nom: (s.zona as any)?.nom || '',
      preu: (s.zona as any)?.preu || 0,
    },
  }));
});

async function carregarEsdeveniment() {
  const id = route.params.id as string;
  carregant.value = true;
  error.value = null;
  
  try {
    // Netejar estado anterior
    seientStore.clearSeleccionats();
    seientStore.clearSeients();
    
    await eventStore.obtenirEsdevenimentPerId(id);
    seientStore.setSeients((evenimente.value as any)?.seients || []);
    
    // Check for existing reservation for this event
    const reservesDades = await apiClient.get('/api/reserves/usuari');
    const existingReserva = (reservesDades as any).reserves.find((r: any) => r.esdeveniment_id === id);
    
    if (existingReserva) {
      reservaStore.setReservaActiva({
        id: existingReserva.id,
        token: existingReserva.token,
        esdeveniment_id: id,
        data_inici: existingReserva.data_inici,
        data_expiracio: existingReserva.data_expiracio,
        seients: existingReserva.seients,
      });
      
      // Update seats in store to show as selected
      existingReserva.seients.forEach((s: any) => {
        seientStore.afegirSeientSeleccionat(s.id);
        seientStore.actualitzarSeient({
          ...s,
          estat: 'seleccionat'
        });
      });
    }

    connect();
    joinEvent(id);
    
    on('seat-reserved', (data: any) => {
      seientStore.actualitzarSeient({
        id: data.seient_id,
        zona_id: '',
        numero: '',
        fila: '',
        estat: data.estat,
      });
    });
    
    on('seat-selected', (data: any) => {
      // Find the seat in the local store to keep its zona data
      const existingSeat = seients.value.find(s => s.id === data.seient_id);
      seientStore.actualitzarSeient({
        id: data.seient_id,
        zona_id: existingSeat?.zona_id || '',
        numero: existingSeat?.numero || '',
        fila: existingSeat?.fila || '',
        estat: 'seleccionat',
        zona: existingSeat?.zona
      });
      seientStore.afegirSeientSeleccionat(data.seient_id);
      reservaStore.setReservaActiva({
        id: data.reserva.id,
        token: data.reserva.token,
        esdeveniment_id: id,
        data_inici: '',
        data_expiracio: data.reserva.data_expiracio,
        seients: [],
      });
    });
    
    on('seat-released', (data: any) => {
      const existingSeat = seients.value.find(s => s.id === data.seient_id);
      seientStore.actualitzarSeient({
        id: data.seient_id,
        zona_id: existingSeat?.zona_id || '',
        numero: existingSeat?.numero || '',
        fila: existingSeat?.fila || '',
        estat: 'disponible',
        zona: existingSeat?.zona
      });
    });
    
    on('seat-sold', (data: any) => {
      const existingSeat = seients.value.find(s => s.id === data.seient_id);
      seientStore.actualitzarSeient({
        id: data.seient_id,
        zona_id: existingSeat?.zona_id || '',
        numero: existingSeat?.numero || '',
        fila: existingSeat?.fila || '',
        estat: 'venut',
        zona: existingSeat?.zona
      });
    });
    
    on('reservation-expired', () => {
      reservaStore.clearReserva();
      seientStore.clearSeleccionats();
      seientStore.clearSeients();
    });
    
    on('reservation-error', (data: any) => {
      error.value = data.missatge;
      setTimeout(() => { error.value = null; }, 5000);
    });
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Error carregant esdeveniment';
  } finally {
    carregant.value = false;
  }
}

onMounted(() => {
  connect();
  carregarEsdeveniment();
});

// Watch per a detectar canvis de ruta i recarregar l'event
watch(
  () => route.params.id,
  (newId, oldId) => {
    if (newId !== oldId) {
      carregarEsdeveniment();
    }
  }
);

onUnmounted(() => {
  const id = route.params.id as string;
  leaveEvent(id);
  off('seat-reserved');
  off('seat-selected');
  off('seat-released');
  off('seat-sold');
  off('reservation-expired');
  off('reservation-error');
});

function getDay(data: string) {
  return new Date(data).getDate();
}

function getMonth(data: string) {
  return new Date(data).toLocaleDateString('ca-ES', { month: 'short' }).toUpperCase();
}

function getTime(data: string) {
  return new Date(data).toLocaleTimeString('ca-ES', { hour: '2-digit', minute: '2-digit' });
}

function reservarSeient(seientId: string) {
  const esdevenimentId = route.params.id as string;
  const token = reservaActiva.value?.token;
  const usuariId = authStore.usuari?.id;
  reserveSeat(seientId, esdevenimentId, token, usuariId);
}

async function cancelarReserva() {
  if (!reservaActiva.value) return;
  
  try {
    await apiClient.delete(`/api/reserves/${reservaActiva.value.id}`);
    reservaStore.clearReserva();
    seientStore.clearSeleccionats();
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Error cancelant reserva';
  }
}

function anarCheckout() {
  router.push('/checkout');
}
</script>

<style scoped>
.event-detail {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.back-link {
  display: inline-block;
  margin-bottom: 1.5rem;
  color: #4a90d9;
  text-decoration: none;
  font-weight: 500;
}

.back-link:hover {
  text-decoration: underline;
}

.loading, .error-message {
  text-align: center;
  padding: 3rem;
  color: #666;
}

.error-message {
  color: #e74c3c;
}

.event-content {
  background: #fff;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.event-header {
  display: flex;
  gap: 1.5rem;
  margin-bottom: 2rem;
  padding-bottom: 2rem;
  border-bottom: 1px solid #eee;
}

.event-date-badge {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #4a90d9;
  color: #fff;
  padding: 1rem;
  border-radius: 8px;
  min-width: 70px;
}

.event-date-badge .day {
  font-size: 1.75rem;
  font-weight: bold;
  line-height: 1;
}

.event-date-badge .month {
  font-size: 0.75rem;
  margin-top: 0.25rem;
}

.event-info h1 {
  color: #1a1a2e;
  margin-bottom: 0.5rem;
}

.venue, .time {
  color: #666;
  margin-bottom: 0.25rem;
}

.description {
  margin-top: 1rem;
  color: #444;
  line-height: 1.6;
}

.reservation-banner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(135deg, #4a90d9 0%, #357abd 100%);
  color: #fff;
  padding: 1.5rem;
  border-radius: 12px;
  margin-bottom: 2rem;
}

.reservation-title {
  font-size: 1.25rem;
  font-weight: bold;
  margin-bottom: 0.5rem;
}

.timer {
  margin-top: 0.5rem;
}

.timer strong {
  font-size: 1.5rem;
}

.reservation-actions {
  display: flex;
  gap: 1rem;
}

.btn {
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
}

.btn-primary {
  background: #fff;
  color: #4a90d9;
}

.btn-primary:hover {
  background: #f0f0f0;
}

.btn-secondary {
  background: transparent;
  color: #fff;
  border: 2px solid #fff;
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.1);
}

.zones-legend {
  margin-bottom: 2rem;
}

.zones-legend h3 {
  color: #1a1a2e;
  margin-bottom: 1rem;
}

.zones-list {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.zone-item {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  background: #f5f5f5;
  padding: 0.75rem 1.25rem;
  border-radius: 8px;
  min-width: 150px;
}

.zone-name {
  font-weight: 500;
}

.zone-price {
  color: #4a90d9;
  font-weight: bold;
}
</style>
