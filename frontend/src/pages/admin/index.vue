<template>
  <div class="admin-panel page-enter">
    <header class="admin-header">
      <h1>Panell Admin · a23poldiabel</h1>
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
            Veure Informe Detallat
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
  padding: 1.4rem;
  max-width: 1400px;
  margin: 0 auto;
}

.admin-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding: 2rem;
  background: linear-gradient(120deg, #0f7b7f, #15a2a8);
  color: #fff;
  border-radius: 1.1rem;
  box-shadow: 0 16px 30px rgba(12, 100, 104, 0.3);
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
  border: 1px solid rgba(255, 255, 255, 0.85);
}

.search-section h2 {
  margin-bottom: 1rem;
  color: #1f2a34;
}

.search-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
}

.event-card {
  padding: 1.5rem;
  border: 1px solid #d8e1ea;
  border-radius: 1rem;
  cursor: pointer;
  transition: all 0.3s;
  background: linear-gradient(165deg, #ffffff, #fbfdff);
}

.event-card:hover {
  border-color: #0f7b7f;
  box-shadow: 0 16px 30px rgba(21, 34, 49, 0.14);
  transform: translateY(-6px);
}

.event-card h3 {
  margin: 0 0 0.5rem 0;
  color: #1f2a34;
}

.event-date {
  color: #0f7b7f;
  font-weight: bold;
  margin: 0.25rem 0;
}

.event-venue {
  color: #5a6672;
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
  background: rgba(255, 255, 255, 0.9);
  border-radius: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.86);
  box-shadow: 0 16px 28px rgba(21, 34, 49, 0.11);
}

.stats-card h2 {
  margin-top: 0;
  color: #1f2a34;
  border-bottom: 2px solid #e8edf2;
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
  background: #fdecef;
  color: #b23946;
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
  background: #eef3f6;
  border-radius: 6px;
  overflow: hidden;
  border: 2px solid #d3dde6;
}

.occupancy-fill {
  height: 100%;
  background: linear-gradient(90deg, #ff6b4a, #ff8f58, #ffc857);
  transition: width 0.3s ease;
}

.occupancy-text {
  text-align: center;
  font-size: 1.25rem;
  font-weight: bold;
  color: #ff6b4a;
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
  background: #f6fafc;
  border-radius: 6px;
  font-weight: 500;
}

.activity-item .value {
  font-size: 1.5rem;
  color: #0f7b7f;
}

.big-number {
  font-size: 3rem;
  font-weight: bold;
  color: #0f7b7f;
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
  background: #f2f6f9;
  font-weight: bold;
  color: #1f2a34;
}

.informe-table tr:hover {
  background: #fafafa;
}

.informe-total {
  padding: 2rem;
  background: #eef8f8;
  border-radius: 8px;
  border-left: 4px solid #0f7b7f;
}

.informe-total h3 {
  margin: 0 0 0.5rem 0;
  color: #1f2a34;
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
  background: rgba(255, 255, 255, 0.9);
  border-radius: 1rem;
  box-shadow: 0 16px 28px rgba(21, 34, 49, 0.11);
}

.btn {
  padding: 0.78rem 1.55rem;
  border: none;
  border-radius: 999px;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.2s;
}

.btn:hover {
  transform: translateY(-1px);
}

.btn-primary {
  background: linear-gradient(120deg, #ff6b4a, #ff8f58 62%, #ffc857);
  color: #fff;
}

.btn-primary:hover {
  opacity: 0.93;
}

.btn-secondary {
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.7);
  color: #fff;
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.1);
}

@media (max-width: 768px) {
  .admin-panel {
    padding: 1rem;
  }

  .admin-header {
    padding: 1.2rem;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.8rem;
  }

  .stats-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
}
</style>
