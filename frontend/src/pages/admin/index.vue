<template>
  <div class="admin-panel">
    <header class="admin-header">
      <h1>🎵 Panell d'Administració d'Entrades</h1>
      <NuxtLink to="/events" class="btn btn-secondary">Tornar</NuxtLink>
    </header>

    <div v-if="carregant" class="loading">Carregant dades...</div>

    <div v-else-if="error" class="error-message">{{ error }}</div>

    <div v-else class="admin-content">
      <!-- Buscador d'event -->
      <div class="search-section card">
        <h2>Selecciona un Esdeveniment</h2>
        <div class="search-grid">
          <div v-for="event in events" :key="event.id" class="event-card" @click="selectEvent(event.id)">
            <h3>{{ event.nom }}</h3>
            <p class="event-date">{{ formatDate(event.data_hora) }}</p>
            <p class="event-venue">{{ event.recinte }}</p>
            <button class="btn btn-primary btn-small" @click.stop="loadStats(event.id)">
              Veure estadístiques
            </button>
          </div>
        </div>
      </div>

      <!-- Estadístiques en temps real -->
      <div v-if="selectedEventId && adminStats" class="stats-section">
        <div class="stats-grid">
          <!-- Distribució de seients -->
          <div class="card stats-card">
            <h2>Distribució de Seients</h2>
            <div class="seat-stats">
              <div class="stat-row disponibles">
                <span class="label">Disponibles</span>
                <span class="value">{{ adminStats.seients.disponibles }}</span>
              </div>
              <div class="stat-row seleccionats">
                <span class="label">Seleccionats</span>
                <span class="value">{{ adminStats.seients.seleccionats }}</span>
              </div>
              <div class="stat-row venuts">
                <span class="label">Venuts</span>
                <span class="value">{{ adminStats.seients.venuts }}</span>
              </div>
              <div class="stat-row reservats">
                <span class="label">Reservats</span>
                <span class="value">{{ adminStats.seients.reservats }}</span>
              </div>
            </div>
            <div class="total">
              Aforament total: <strong>{{ adminStats.seients.total }}</strong>
            </div>
          </div>

          <!-- Ocupació -->
          <div class="card stats-card">
            <h2>Ocupació</h2>
            <div class="occupancy-meter">
              <div class="occupancy-bar">
                <div class="occupancy-fill" :style="{ width: adminStats.ocupacio_percentatge + '%' }"></div>
              </div>
              <p class="occupancy-text">{{ adminStats.ocupacio_percentatge }}% ocupat</p>
            </div>
          </div>

          <!-- Reserves i compres -->
          <div class="card stats-card">
            <h2>Activitat en Temps Real</h2>
            <div class="activity-stats">
              <div class="activity-item">
                <span class="label">Reserves Actives</span>
                <span class="value">{{ adminStats.reserves_actives }}</span>
              </div>
              <div class="activity-item">
                <span class="label">Compres Confirmades</span>
                <span class="value">{{ adminStats.compres_totals }}</span>
              </div>
            </div>
          </div>

          <!-- Recaptació -->
          <div class="card stats-card">
            <h2>Recaptació</h2>
            <p class="big-number">{{ adminStats.recaptacio_total }}€</p>
          </div>
        </div>

        <!-- Botó per veure informe detallat -->
        <div class="card action-card">
          <button class="btn btn-primary" @click="carregarInforme">
            📊 Veure Informe Detallat
          </button>
        </div>

        <!-- Informe detallat (si es carrega) -->
        <div v-if="informe" class="card informe-section">
          <h2>Informe de Vendes</h2>
          <table class="informe-table">
            <thead>
              <tr>
                <th>Zona</th>
                <th>Preu Unitari</th>
                <th>Quantitat Venuda</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="zona in informe.report.recaptacio_per_zona" :key="zona.nom">
                <td>{{ zona.nom }}</td>
                <td>{{ zona.preu }}€</td>
                <td>{{ zona.quantitat }}</td>
                <td><strong>{{ zona.total }}€</strong></td>
              </tr>
            </tbody>
          </table>
          <div class="informe-total">
            <h3>Recaptació Total: {{ informe.report.recaptacio_total }}€</h3>
            <p>Entrades venudes: {{ informe.report.entrades_venudes }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAdminStore } from '~/stores/adminStore';
import { useEventStore } from '~/stores/eventStore';

definePageMeta({
  middleware: 'auth'
});

const router = useRouter();
const adminStore = useAdminStore();
const eventStore = useEventStore();

const selectedEventId = ref<string | null>(null);
const informe = ref<any>(null);

const carregant = computed(() => eventStore.carregant);
const error = computed(() => eventStore.error || adminStore.error);
const events = computed(() => eventStore.esdeveniments);
const adminStats = computed(() => adminStore.stats);

onMounted(async () => {
  await eventStore.obtenirEsdeveniments();
});

// El adminStore ja crida /api/admin/events/:id/stats correctament

function selectEvent(id: string) {
  selectedEventId.value = id;
  informe.value = null;
}

async function loadStats(id: string) {
  selectedEventId.value = id;
  await adminStore.obtenirStats(id);
  informe.value = null;
}

async function carregarInforme() {
  if (!selectedEventId.value) return;
  informe.value = await adminStore.obtenirInforme(selectedEventId.value);
}

function formatDate(data: string) {
  return new Date(data).toLocaleDateString('ca-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
</script>

<style scoped>
.admin-panel {
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
  background: #f9f9f9;
  min-height: 100vh;
}

.admin-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding: 2rem;
  background: #1a1a2e;
  color: #fff;
  border-radius: 12px;
}

.admin-header h1 {
  margin: 0;
}

.admin-content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.search-section {
  padding: 2rem;
}

.search-section h2 {
  margin-bottom: 1rem;
  color: #1a1a2e;
}

.search-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
}

.event-card {
  padding: 1.5rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
}

.event-card:hover {
  border-color: #4a90d9;
  box-shadow: 0 4px 12px rgba(74, 144, 217, 0.2);
  transform: translateY(-2px);
}

.event-card h3 {
  margin: 0 0 0.5rem 0;
  color: #1a1a2e;
}

.event-date {
  color: #4a90d9;
  font-weight: bold;
  margin: 0.25rem 0;
}

.event-venue {
  color: #666;
  margin: 0.5rem 0 1rem 0;
}

.btn-small {
  width: 100%;
}

.stats-section {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 2rem;
}

.stats-card {
  padding: 2rem;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.stats-card h2 {
  margin-top: 0;
  color: #1a1a2e;
  border-bottom: 2px solid #eee;
  padding-bottom: 1rem;
}

.seat-stats {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.stat-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  border-radius: 6px;
  font-weight: 500;
}

.stat-row.disponibles {
  background: #e8f5e9;
  color: #2e7d32;
}

.stat-row.seleccionats {
  background: #fff3e0;
  color: #f57c00;
}

.stat-row.venuts {
  background: #e3f2fd;
  color: #1565c0;
}

.stat-row.reservats {
  background: #ede7f6;
  color: #512da8;
}

.total {
  padding-top: 1rem;
  border-top: 2px solid #eee;
  text-align: center;
  color: #666;
}

.occupancy-meter {
  margin: 1rem 0;
}

.occupancy-bar {
  width: 100%;
  height: 30px;
  background: #f0f0f0;
  border-radius: 6px;
  overflow: hidden;
  border: 2px solid #ddd;
}

.occupancy-fill {
  height: 100%;
  background: linear-gradient(90deg, #4a90d9, #2196f3);
  transition: width 0.3s ease;
}

.occupancy-text {
  text-align: center;
  font-size: 1.25rem;
  font-weight: bold;
  color: #4a90d9;
  margin-top: 0.75rem;
}

.activity-stats {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.activity-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: #f5f5f5;
  border-radius: 6px;
  font-weight: 500;
}

.activity-item .value {
  font-size: 1.5rem;
  color: #4a90d9;
}

.big-number {
  font-size: 3rem;
  font-weight: bold;
  color: #2e7d32;
  margin: 0;
  text-align: center;
}

.action-card {
  display: flex;
  justify-content: center;
  padding: 2rem;
}

.informe-section {
  padding: 2rem;
}

.informe-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 1rem;
}

.informe-table th,
.informe-table td {
  padding: 1rem;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.informe-table th {
  background: #f5f5f5;
  font-weight: bold;
  color: #1a1a2e;
}

.informe-table tr:hover {
  background: #fafafa;
}

.informe-total {
  padding: 2rem;
  background: #f0f7ff;
  border-radius: 8px;
  border-left: 4px solid #4a90d9;
}

.informe-total h3 {
  margin: 0 0 0.5rem 0;
  color: #1a1a2e;
}

.loading,
.error-message {
  text-align: center;
  padding: 3rem;
  font-size: 1.1rem;
  color: #666;
}

.error-message {
  color: #e74c3c;
}

.card {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: #4a90d9;
  color: #fff;
}

.btn-primary:hover {
  background: #2e5c9e;
}

.btn-secondary {
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.5);
  color: #fff;
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.1);
}
</style>
