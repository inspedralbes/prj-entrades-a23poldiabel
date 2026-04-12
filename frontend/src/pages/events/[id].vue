<template>
  <div class="event-detail page-enter">
    <NuxtLink to="/events" class="back-link">&larr; Tornar als esdeveniments</NuxtLink>

    <div v-if="carregant" class="loading">Carregant...</div>
    
    <div v-else-if="error" class="error-message">{{ error }}</div>
    
    <div v-else-if="esdeveniment" class="event-content">
      <div v-if="avis" class="toast-warning" role="status" aria-live="polite">{{ avis }}</div>

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

      <!-- Barra de connexió Socket.IO -->
      <div class="connection-status" :class="{ connected: isConnected }">
        {{ isConnected ? 'Connectat en temps real' : 'Desconnectat' }}
        <span v-if="usersConnected > 0" class="users-count">
          · {{ usersConnected }} {{ usersConnected === 1 ? 'usuari' : 'usuaris' }} connectats
        </span>
      </div>

      <div v-if="reservaActiva" class="reservation-banner">
        <div class="reservation-info">
          <p class="reservation-title">Reserva activa!</p>
          <p>Seients seleccionats: <strong>{{ seientsSeleccionats.length }}</strong></p>
          <div class="timer">
            Temps restant: <strong>{{ tempsRestantFormatat }}</strong>
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

      <div v-if="esdeveniment.zones && esdeveniment.zones.length > 0" class="zones-legend">
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
const { connect, joinEvent, leaveEvent, reserveSeat, on, off, isConnected } = useSocketClient();
const MAX_SEIENTS_PER_RESERVA = 3;

const error = ref<string | null>(null);
const avis = ref<string | null>(null);
const usersConnected = ref(0);

const carregant = computed(() => eventStore.carregant);
const esdeveniment = computed(() => eventStore.esdevenimentActual);
const seients = computed(() => seientStore.seients);
const reservaActiva = computed(() => reservaStore.reservaActiva);
const seientsSeleccionats = computed(() => seientStore.seientsSeleccionats);
const tempsRestant = computed(() => reservaStore.tempsRestant);
const tempsRestantFormatat = computed(() => {
  const minuts = Math.floor(tempsRestant.value / 60);
  const segons = tempsRestant.value % 60;
  return `${String(minuts).padStart(2, '0')}:${String(segons).padStart(2, '0')}`;
});

const seientsFormatats = computed(() => {
  return seients.value.map(s => ({
    id: s.id,
    numero: s.numero,
    fila: s.fila,
    estat: seientsSeleccionats.value.includes(s.id) ? 'seleccionat' as const : s.estat as 'disponible' | 'reservat' | 'seleccionat' | 'venut',
    zona: {
      id: (s.zona as any)?.id || s.zona_id || '',
      nom: (s.zona as any)?.nom || '',
      preu: (s.zona as any)?.preu || 0,
    },
  }));
});

async function carregarEsdeveniment() {
  const idRuta = route.params.id as string;
  error.value = null;
  avis.value = null;
  
  try {
    // Netejar estat anterior
    seientStore.clearSeleccionats();
    seientStore.clearSeients();
    
    // Obtenir l'esdeveniment (el backend retorna seients inclosos)
    const esdevenimentData = await eventStore.obtenirEsdevenimentPerId(idRuta);
    
    if (esdevenimentData?.seients) {
      seientStore.setSeients(esdevenimentData.seients);
    }

    await recuperarReservaActivaEsdeveniment(idRuta);

    // Connectar socket i unir-se a l'event
    connect();
    joinEvent(idRuta);
    
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Error carregant esdeveniment';
  }
}

async function recuperarReservaActivaEsdeveniment(eventId: string) {
  try {
    const { apiClient } = await import('~/services/apiClient');
    const resposta = await apiClient.get<{ reserves?: Array<any> }>('/reserves/usuari');
    const reserves = Array.isArray(resposta?.reserves) ? resposta.reserves : [];
    const reservesEvent = reserves.filter((r: any) => String(r.esdeveniment_id) === String(eventId));

    if (reservesEvent.length === 0) {
      return;
    }

    const seients = reservesEvent.flatMap((r: any) => {
      const seat = r.seients?.[0];
      if (!seat) {
        return [];
      }
      return [{
        id: String(seat.id),
        numero: String(seat.numero || ''),
        fila: seat.fila || '',
        estat: 'seleccionat',
      }];
    });

    const expiracions = reservesEvent
      .map((r: any) => new Date(r.data_expiracio).getTime())
      .filter((v: number) => !Number.isNaN(v));
    const primeraExpiracio = expiracions.length > 0 ? new Date(Math.min(...expiracions)).toISOString() : new Date(Date.now() + 5 * 60000).toISOString();

    reservaStore.setReservaActiva({
      id: String(reservesEvent[0].id),
      token: String(reservesEvent[0].token || reservesEvent[0].id),
      esdeveniment_id: String(eventId),
      data_inici: reservesEvent[0].data_inici || new Date().toISOString(),
      data_expiracio: primeraExpiracio,
      seients,
    });

    for (const seat of seients) {
      seientStore.afegirSeientSeleccionat(seat.id);
      const existingSeat = seientsStoreFindById(seat.id);
      if (existingSeat) {
        seientStore.actualitzarSeient({
          ...existingSeat,
          estat: 'seleccionat',
        });
      }
    }
  } catch {
    // Si falla, simplement no restaurem reserva local
  }
}

function seientsStoreFindById(seientId: string) {
  return seients.value.find((s) => s.id === seientId);
}

// Socket.IO handlers
function setupSocketHandlers() {
  on('event-joined', (data: any) => {
    if (data.seients && Array.isArray(data.seients)) {
      seientStore.setSeients(data.seients);
    }
  });

  on('user-joined', (data: any) => {
    usersConnected.value = data.userCount || 0;
  });

  on('seat-reserved', (data: any) => {
    const seientId = String(data.seient_id || data.seatId);
    const existingSeat = seients.value.find(s => s.id === seientId);
    if (existingSeat) {
      seientStore.actualitzarSeient({
        ...existingSeat,
        estat: data.estat || 'reservat',
      });
    }
  });
  
  on('seat-selected', (data: any) => {
    const seientId = String(data.seient_id);
    const existingSeat = seients.value.find(s => s.id === seientId);
    
    if (existingSeat) {
      seientStore.actualitzarSeient({
        ...existingSeat,
        estat: 'seleccionat',
      });
    }
    seientStore.afegirSeientSeleccionat(seientId);

    // Actualitzar la reserva activa
    const seientsActuals = reservaStore.reservaActiva?.seients || [];
    const seientsActualitzats = seientsActuals.some((s) => s.id === seientId)
      ? seientsActuals
      : [...seientsActuals, {
          id: seientId,
          numero: existingSeat?.numero || '',
          fila: existingSeat?.fila || '',
          estat: 'seleccionat',
        }];

    reservaStore.setReservaActiva({
      id: data.reserva?.id || '',
      token: data.reserva?.token || '',
      esdeveniment_id: route.params.id as string,
      data_inici: '',
      data_expiracio: data.reserva?.data_expiracio || new Date(Date.now() + 5 * 60000).toISOString(),
      seients: seientsActualitzats,
    });
  });
  
  on('seat-released', (data: any) => {
    const seientId = String(data.seient_id || data.seatId);
    const existingSeat = seients.value.find(s => s.id === seientId);
    if (existingSeat) {
      seientStore.actualitzarSeient({
        ...existingSeat,
        estat: 'disponible',
      });
    }
    seientStore.treureSeientSeleccionat(seientId);
  });
  
  on('seat-sold', (data: any) => {
    const seientId = String(data.seient_id || data.seatId);
    const existingSeat = seients.value.find(s => s.id === seientId);
    if (existingSeat) {
      seientStore.actualitzarSeient({
        ...existingSeat,
        estat: 'venut',
      });
    }
  });

  on('seats-state', (data: any) => {
    // Format anglès del backend - mapejar a català
    if (data.seats && Array.isArray(data.seats)) {
      const mapped = data.seats.map((s: any) => ({
        id: String(s.id),
        zona_id: String(s.zone_id),
        numero: String(s.seat_number),
        fila: s.row,
        estat: mapStatus(s.status),
        zona: {
          id: String(s.zone_id),
          nom: s.zone || '',
          preu: s.price || 0,
        },
      }));
      seientStore.setSeients(mapped);
    }
  });
  
  on('reservations-expired', () => {
    reservaStore.clearReserva();
    seientStore.clearSeleccionats();
    // Recarregar seients
    const idRuta = route.params.id as string;
    joinEvent(idRuta);
  });
  
  on('reservation-error', (data: any) => {
    avis.value = data.missatge || data.message || 'Error en la reserva';
    setTimeout(() => {
      if (avis.value === (data.missatge || data.message || 'Error en la reserva')) {
        avis.value = null;
      }
    }, 3500);
    setTimeout(() => { error.value = null; }, 5000);
  });

  on('reservation-confirmed', (data: any) => {
    // Compra confirmada via socket
    console.log('Reserva/compra confirmada:', data);
  });
}

function mapStatus(status: string): string {
  switch (status) {
    case 'AVAILABLE': return 'disponible';
    case 'RESERVED': return 'reservat';
    case 'SOLD': return 'venut';
    default: return status;
  }
}

onMounted(() => {
  setupSocketHandlers();
  carregarEsdeveniment();
});

watch(
  () => route.params.id,
  (newId, oldId) => {
    if (newId !== oldId) {
      carregarEsdeveniment();
    }
  }
);

onUnmounted(() => {
  leaveEvent(route.params.id as string);
  off('event-joined');
  off('user-joined');
  off('seat-reserved');
  off('seat-selected');
  off('seat-released');
  off('seat-sold');
  off('seats-state');
  off('reservations-expired');
  off('reservation-error');
  off('reservation-confirmed');
});

function reservarSeient(seientId: string) {
  if (seientsSeleccionats.value.includes(seientId)) {
    return;
  }

  if (seientsSeleccionats.value.length >= MAX_SEIENTS_PER_RESERVA) {
    avis.value = `Només pots seleccionar fins a ${MAX_SEIENTS_PER_RESERVA} seients per reserva.`;
    setTimeout(() => {
      if (avis.value?.includes('Només pots seleccionar fins a')) {
        avis.value = null;
      }
    }, 3500);
    return;
  }

  const eventId = route.params.id as string;
  reserveSeat(seientId, eventId, reservaActiva.value?.token);
}

async function cancelarReserva() {
  if (!reservaActiva.value) return;
  
  try {
    const { apiClient } = await import('~/services/apiClient');
    await apiClient.delete(`/reserves/${reservaActiva.value.id}`);
  } catch (e) {
    // Si falla REST, alliberem via socket
    console.warn('Error cancel·lant via REST, intentant socket');
  }
  
  reservaStore.clearReserva();
  seientStore.clearSeleccionats();
  
  // Recarregar estat dels seients
  const idRuta = route.params.id as string;
  joinEvent(idRuta);
}

function anarCheckout() {
  router.push('/checkout');
}

function getDay(data: string) {
  return new Date(data).getDate();
}

function getMonth(data: string) {
  return new Date(data).toLocaleDateString('ca-ES', { month: 'short' }).toUpperCase();
}

function getTime(data: string) {
  return new Date(data).toLocaleTimeString('ca-ES', { hour: '2-digit', minute: '2-digit' });
}
</script>

<style scoped>
.event-detail {
  padding: 1.5rem;
  max-width: 1200px;
  margin: 0 auto;
}

.back-link {
  display: inline-block;
  margin-bottom: 1.5rem;
  color: #0f7b7f;
  text-decoration: none;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  font-size: 0.74rem;
}

.back-link:hover {
  opacity: 0.85;
}

.loading, .error-message {
  text-align: center;
  padding: 3rem;
  color: #5e6974;
}

.error-message {
  color: #e74c3c;
  background: #fff2ef;
  border-radius: 0.8rem;
}

.toast-warning {
  margin-bottom: 1rem;
  padding: 0.7rem 0.9rem;
  border-radius: 10px;
  border: 1px solid #f7d68a;
  background: #fff7e6;
  color: #8a5a00;
  font-size: 0.95rem;
}

.connection-status {
  padding: 0.5rem 1rem;
  border-radius: 999px;
  font-size: 0.85rem;
  margin-bottom: 1rem;
  background: #fff2ef;
  color: #ac2f2d;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
}

.connection-status::before {
  content: '';
  width: 0.55rem;
  height: 0.55rem;
  border-radius: 50%;
  background: currentColor;
}

.connection-status.connected {
  background: #e9f8f0;
  color: #1d8f58;
}

.users-count {
  opacity: 0.8;
}

.event-content {
  background: rgba(255, 255, 255, 0.9);
  border-radius: 1.2rem;
  padding: 2rem;
  border: 1px solid rgba(255, 255, 255, 0.88);
  box-shadow: 0 20px 40px rgba(21, 34, 49, 0.14);
}

.event-banner {
  width: 100%;
  height: 320px;
  border-radius: 1rem;
  overflow: hidden;
  margin-bottom: 2rem;
}

.event-banner img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.event-header {
  display: flex;
  gap: 1.5rem;
  margin-bottom: 2rem;
  padding-bottom: 2rem;
  border-bottom: 1px solid #e3e8ef;
}

.event-date-badge {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(160deg, #0f7b7f, #15a2a8);
  color: #fff;
  padding: 1rem;
  border-radius: 8px;
  min-width: 70px;
  height: fit-content;
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

.event-info {
  flex: 1;
}

.event-info h1 {
  color: #182027;
  margin-bottom: 0.5rem;
  font-size: clamp(1.6rem, 3vw, 2.4rem);
}

.venue, .time {
  color: #4f5d69;
  margin-bottom: 0.25rem;
}

.description {
  margin-top: 1rem;
  color: #3f4a55;
  line-height: 1.6;
}

.reservation-banner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(125deg, #ff6b4a, #ff8f58 62%, #ffc857);
  color: #fff;
  padding: 1.5rem;
  border-radius: 1rem;
  margin-bottom: 2rem;
  box-shadow: 0 18px 30px rgba(255, 107, 74, 0.25);
}

.reservation-info {
  flex: 1;
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
  border-radius: 999px;
  font-weight: 700;
  cursor: pointer;
  border: none;
  transition: transform 0.2s;
}

.btn:hover {
  transform: translateY(-1px);
}

.btn-primary {
  background: #fff;
  color: #ff6b4a;
}

.btn-primary:hover {
  background: #f0f0f0;
}

.btn-secondary {
  background: transparent;
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.8);
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.1);
}

.zones-legend {
  margin-bottom: 2rem;
}

.zones-legend h3 {
  color: #1f2a34;
  margin-bottom: 1rem;
}

.zones-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.zone-item {
  display: flex;
  justify-content: space-between;
  padding: 1rem;
  background: #f8fbfd;
  border-radius: 0.8rem;
  border-left: 4px solid #0f7b7f;
}

.zone-name {
  font-weight: 600;
  color: #1f2a34;
}

.zone-price {
  color: #0f7b7f;
  font-weight: bold;
}

@media (max-width: 768px) {
  .event-detail {
    padding: 1rem;
  }

  .event-content {
    padding: 1.1rem;
  }

  .event-banner {
    height: 220px;
  }

  .event-header {
    flex-direction: column;
    gap: 1rem;
  }

  .reservation-banner {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .reservation-actions {
    width: 100%;
  }

  .btn {
    width: 100%;
  }
}
</style>
