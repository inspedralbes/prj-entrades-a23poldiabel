<template>
  <main class="events-page container page-enter">
    <header class="events-header">
      <h1>a23poldiabel · Esdeveniments</h1>
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
            v-if="event.imatge && !imatgesFallides.has(String(event.id))"
            :src="event.imatge"
            :alt="event.nom"
            loading="lazy"
            decoding="async"
            @error="gestionarErrorImatge(String(event.id))"
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
import { useEventStore } from '~/stores/eventStore';

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

const eventStore = useEventStore();

const events = computed(() => eventStore.esdeveniments);
const carregant = computed(() => eventStore.carregant);
const error = computed(() => eventStore.error);
const limit = ref(12);
const imatgesFallides = ref(new Set<string>());

const eventsVisibles = computed(() => events.value.slice(0, limit.value));
const potMostrarMes = computed(() => limit.value < events.value.length);

async function carregarEvents() {
  await eventStore.obtenirEsdeveniments();
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
  margin-bottom: 1.2rem;
  background: linear-gradient(130deg, rgba(15, 123, 127, 0.12), rgba(255, 107, 74, 0.12));
  border: 1px solid rgba(255, 255, 255, 0.85);
  border-radius: 1.2rem;
  padding: 1.2rem 1.3rem;
}

.events-header h1 {
  margin: 0;
  font-size: clamp(1.8rem, 3.5vw, 2.5rem);
  color: #182027;
}

.events-header p {
  margin-top: 0.4rem;
  color: #45515d;
}

.state-box {
  background: rgba(255, 255, 255, 0.82);
  border: 1px solid #d4dde6;
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
  gap: 1.2rem;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
}

.event-card {
  display: flex;
  flex-direction: column;
  text-decoration: none;
  background: linear-gradient(160deg, #ffffff, #fbfcfd);
  border: 1px solid #d5dee7;
  border-radius: 1rem;
  overflow: hidden;
  min-height: 360px;
  transition: transform 0.25s ease, box-shadow 0.25s ease;
  position: relative;
}

.event-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 20px 34px rgba(21, 34, 49, 0.15);
}

.event-media {
  height: 170px;
  background: linear-gradient(130deg, #e6f2f2, #ffe8df);
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
  color: #0f7b7f;
}

.event-content {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  padding: 1rem;
  color: #1f2a34;
}

.event-content h2 {
  margin: 0;
  font-size: 1.06rem;
  line-height: 1.35;
}

.event-meta {
  margin: 0;
  font-size: 0.9rem;
  color: #5a6671;
}

.event-description {
  margin: 0.25rem 0 0;
  color: #46515d;
  font-size: 0.9rem;
  line-height: 1.4;
  min-height: 2.8em;
}

.event-cta {
  margin-top: auto;
  display: inline-block;
  font-weight: 600;
  color: #0f7b7f;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-size: 0.8rem;
}

.more-wrap {
  margin-top: 1rem;
  display: flex;
  justify-content: center;
}
</style>
