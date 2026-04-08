<template>
  <main class="events-page container">
    <header class="events-header">
      <h1>Esdeveniments</h1>
      <p>Escull un esdeveniment per seleccionar seients i comprar entrades.</p>
    </header>

    <section v-if="carregant" class="state-box">
      <p>Carregant esdeveniments...</p>
    </section>

    <section v-else-if="error" class="state-box state-error">
      <p>{{ error }}</p>
      <button class="btn btn-primary" type="button" @click="carregarEvents">Tornar a provar</button>
    </section>

    <section v-else-if="events.length === 0" class="state-box">
      <p>No hi ha esdeveniments disponibles en aquest moment.</p>
    </section>

    <section v-else class="events-grid">
      <NuxtLink
        v-for="event in eventsVisibles"
        :key="event.id"
        class="event-card"
        :to="`/events/${event.id}`"
      >
        <div class="event-media">
          <img
            v-if="event.imatge && !imatgesFallides.has(event.id)"
            :src="event.imatge"
            :alt="event.nom"
            loading="lazy"
            decoding="async"
            @error="gestionarErrorImatge(event.id)"
          />
          <div v-else class="event-media-fallback">🎵</div>
        </div>

        <div class="event-content">
          <h2>{{ event.nom }}</h2>
          <p class="event-meta">{{ formatDate(event.data_hora) }}</p>
          <p class="event-meta">{{ event.recinte }}</p>
          <p v-if="event.descripcio" class="event-description">{{ resum(event.descripcio) }}</p>
          <span class="event-cta">Veure seients</span>
        </div>
      </NuxtLink>
    </section>

    <div v-if="potMostrarMes" class="more-wrap">
      <button class="btn btn-secondary" type="button" @click="mostrarMes">Mostrar més</button>
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { apiClient } from '~/services/apiClient';

interface EventItem {
  id: string;
  nom: string;
  data_hora: string;
  recinte: string;
  descripcio?: string;
  imatge?: string;
}

definePageMeta({
  middleware: 'auth',
});

const events = ref<EventItem[]>([]);
const carregant = ref(false);
const error = ref<string | null>(null);
const limit = ref(12);
const imatgesFallides = ref(new Set<string>());

const eventsVisibles = computed(() => events.value.slice(0, limit.value));
const potMostrarMes = computed(() => limit.value < events.value.length);

async function carregarEvents() {
  carregant.value = true;
  error.value = null;

  try {
    const response = await apiClient.get('/desenvolupaments');
    const llista =
      (response as any).data ||
      (response as any).eventos ||
      (response as any).acontecimientos ||
      (response as any).events ||
      [];

    events.value = Array.isArray(llista) ? llista : [];
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'No s\'han pogut carregar els esdeveniments';
    events.value = [];
  } finally {
    carregant.value = false;
  }
}

function mostrarMes() {
  limit.value += 12;
}

function resum(text: string) {
  if (text.length <= 110) return text;
  return `${text.slice(0, 110)}...`;
}

function formatDate(data: string) {
  return new Date(data).toLocaleString('ca-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function gestionarErrorImatge(eventId: string) {
  imatgesFallides.value.add(eventId);
}

onMounted(carregarEvents);
</script>

<style scoped>
.events-page {
  padding-top: 2rem;
  padding-bottom: 2rem;
}

.events-header {
  margin-bottom: 1.5rem;
}

.events-header h1 {
  margin: 0;
  font-size: 2rem;
  color: #14213d;
}

.events-header p {
  margin-top: 0.4rem;
  color: #5b667a;
}

.state-box {
  background: #fff;
  border: 1px solid #dfe4ec;
  border-radius: 12px;
  padding: 1.25rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.state-error {
  border-color: #f3b4b4;
  background: #fff7f7;
}

.events-grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
}

.event-card {
  display: flex;
  flex-direction: column;
  text-decoration: none;
  background: #fff;
  border: 1px solid #dfe4ec;
  border-radius: 14px;
  overflow: hidden;
  min-height: 340px;
  transition: transform 0.18s ease, box-shadow 0.18s ease;
}

.event-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 22px rgba(16, 33, 61, 0.08);
}

.event-media {
  height: 150px;
  background: #edf2fb;
}

.event-media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.event-media-fallback {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  color: #2b4f97;
}

.event-content {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  padding: 1rem;
  color: #1e2b42;
}

.event-content h2 {
  margin: 0;
  font-size: 1rem;
  line-height: 1.35;
}

.event-meta {
  margin: 0;
  font-size: 0.9rem;
  color: #5b667a;
}

.event-description {
  margin: 0.25rem 0 0;
  color: #4a5568;
  font-size: 0.9rem;
  line-height: 1.4;
  min-height: 2.8em;
}

.event-cta {
  margin-top: auto;
  display: inline-block;
  font-weight: 600;
  color: #1f4ec4;
}

.more-wrap {
  margin-top: 1rem;
  display: flex;
  justify-content: center;
}
</style>
