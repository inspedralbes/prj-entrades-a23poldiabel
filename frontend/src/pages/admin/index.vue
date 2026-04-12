<template>
  <div class="admin-panel page-enter">
    <header class="admin-header">
      <h1>Panell Admin · a23poldiabel</h1>
      <NuxtLink to="/events" class="btn btn-secondary">Tornar</NuxtLink>
    </header>

    <div class="admin-content">
      <section class="card crud-section">
        <h2>CRUD d'Esdeveniments</h2>

        <form class="crud-form" @submit.prevent="submitForm">
          <div class="form-grid">
            <div class="field">
              <label>Nom</label>
              <input v-model="form.nom" required />
            </div>
            <div class="field">
              <label>Data i hora</label>
              <input v-model="form.data_hora" type="datetime-local" required />
            </div>
            <div class="field">
              <label>Recinte</label>
              <input v-model="form.recinte" required />
            </div>
            <div class="field">
              <label>Estat</label>
              <select v-model="form.estat">
                <option value="active">Actiu</option>
                <option value="cancelled">Cancel·lat</option>
              </select>
            </div>
          </div>
          <div class="field">
            <label>Descripció</label>
            <textarea v-model="form.descripcio" rows="3" />
          </div>

          <div class="crud-actions">
            <button class="btn btn-primary" type="submit">{{ form.id ? 'Guardar canvis' : 'Crear esdeveniment' }}</button>
            <button v-if="form.id" class="btn btn-ghost" type="button" @click="resetForm">Cancel·lar edició</button>
          </div>
        </form>
      </section>

      <div v-if="carregant" class="loading">Carregant dades...</div>
      <div v-if="error" class="error-message">{{ error }}</div>

      <section class="card list-section">
        <h2>Llista d'esdeveniments</h2>
        <div class="search-grid">
          <article v-for="event in events" :key="event.id" class="event-card" @click="loadStats(event.id)">
            <h3>{{ event.nom }}</h3>
            <p class="event-date">{{ formatDate(event.data_hora) }}</p>
            <p class="event-venue">{{ event.recinte }}</p>
            <div class="event-actions">
              <button class="btn btn-ghost" @click.stop="editEvent(event)">Editar</button>
              <button class="btn btn-danger" @click.stop="deleteEvent(event.id)">Eliminar</button>
            </div>
          </article>
        </div>
      </section>

      <section v-if="selectedEventId && adminStats" class="stats-section">
        <div class="stats-grid">
          <div class="card stats-card">
            <h2>Distribució de Seients</h2>
            <div class="seat-stats">
              <div class="stat-row disponibles"><span>Disponibles</span><span>{{ adminStats.seients.disponibles }}</span></div>
              <div class="stat-row reservats"><span>Reservats</span><span>{{ adminStats.seients.reservats }}</span></div>
              <div class="stat-row venuts"><span>Venuts</span><span>{{ adminStats.seients.venuts }}</span></div>
            </div>
          </div>

          <div class="card stats-card">
            <h2>Recaptació</h2>
            <p class="big-number">{{ adminStats.recaptacio_total }}€</p>
            <p>{{ adminStats.compres_totals }} compres confirmades</p>
          </div>
        </div>

        <div class="card action-card">
          <button class="btn btn-primary" @click="carregarInforme">Veure Informe Detallat</button>
        </div>

        <div v-if="informe" class="card informe-section">
          <h2>Informe de Vendes</h2>
          <table class="informe-table">
            <thead>
              <tr>
                <th>Zona</th>
                <th>Preu</th>
                <th>Quantitat</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="zona in informe.report.recaptacio_per_zona" :key="zona.nom">
                <td>{{ zona.nom }}</td>
                <td>{{ zona.preu }}€</td>
                <td>{{ zona.quantitat }}</td>
                <td>{{ zona.total }}€</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import type { AdminEvent } from '~/stores/adminStore';
import { useAdminStore } from '~/stores/adminStore';

definePageMeta({
  middleware: ['auth', 'admin'],
});

const adminStore = useAdminStore();
const selectedEventId = ref<string | null>(null);
const informe = ref<any>(null);

const form = reactive({
  id: '' as string,
  nom: '',
  data_hora: '',
  recinte: '',
  descripcio: '',
  estat: 'active',
});

const carregant = computed(() => adminStore.carregant);
const error = computed(() => adminStore.error);
const events = computed(() => adminStore.events);
const adminStats = computed(() => adminStore.stats);

onMounted(async () => {
  await adminStore.obtenirEvents();
});

function formatDate(data: string) {
  return new Date(data).toLocaleDateString('ca-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function toInputDatetime(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function toBackendDatetime(value: string) {
  if (!value) return '';
  return `${value.replace('T', ' ')}:00`;
}

function resetForm() {
  form.id = '';
  form.nom = '';
  form.data_hora = '';
  form.recinte = '';
  form.descripcio = '';
  form.estat = 'active';
}

function editEvent(event: AdminEvent) {
  form.id = event.id;
  form.nom = event.nom;
  form.data_hora = toInputDatetime(event.data_hora);
  form.recinte = event.recinte;
  form.descripcio = event.descripcio || '';
  form.estat = event.estat || 'active';
}

async function submitForm() {
  const payload = {
    nom: form.nom,
    data_hora: toBackendDatetime(form.data_hora),
    recinte: form.recinte,
    descripcio: form.descripcio,
    estat: form.estat,
  };

  if (form.id) {
    await adminStore.actualitzarEvent(form.id, payload);
  } else {
    await adminStore.crearEvent(payload);
  }

  resetForm();
}

async function loadStats(id: string) {
  selectedEventId.value = id;
  informe.value = null;
  await adminStore.obtenirStats(id);
}

async function carregarInforme() {
  if (!selectedEventId.value) return;
  informe.value = await adminStore.obtenirInforme(selectedEventId.value);
}

async function deleteEvent(id: string) {
  if (!confirm('Vols eliminar aquest esdeveniment?')) {
    return;
  }

  await adminStore.eliminarEvent(id);

  if (selectedEventId.value === id) {
    selectedEventId.value = null;
    informe.value = null;
  }
}
</script>

<style scoped>
.admin-panel { padding: 1.4rem; max-width: 1400px; margin: 0 auto; }
.admin-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; padding: 2rem; background: linear-gradient(120deg, #0f7b7f, #15a2a8); color: #fff; border-radius: 1.1rem; }
.admin-content { display: flex; flex-direction: column; gap: 1.2rem; }
.card { background: rgba(255, 255, 255, 0.9); border-radius: 1rem; box-shadow: 0 16px 28px rgba(21, 34, 49, 0.11); }
.crud-section, .list-section, .informe-section { padding: 1.2rem; }
.crud-form { display: flex; flex-direction: column; gap: 0.8rem; }
.form-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.8rem; }
.field { display: flex; flex-direction: column; gap: 0.35rem; }
.field input, .field textarea, .field select { border: 1px solid #d8e1ea; border-radius: 0.7rem; padding: 0.65rem; }
.crud-actions { display: flex; gap: 0.7rem; }
.search-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 1rem; }
.event-card { padding: 1rem; border: 1px solid #d8e1ea; border-radius: 1rem; background: linear-gradient(165deg, #ffffff, #fbfdff); }
.event-date { color: #0f7b7f; font-weight: bold; margin: 0.25rem 0; }
.event-venue { color: #5a6672; margin-bottom: 0.8rem; }
.event-actions { display: flex; gap: 0.5rem; }
.stats-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; }
.stats-card { padding: 1rem; }
.seat-stats { display: flex; flex-direction: column; gap: 0.45rem; }
.stat-row { display: flex; justify-content: space-between; padding: 0.55rem; border-radius: 0.5rem; }
.stat-row.disponibles { background: #e8f5e9; }
.stat-row.reservats { background: #fdecef; }
.stat-row.venuts { background: #e3f2fd; }
.big-number { font-size: 2rem; color: #0f7b7f; margin: 0.4rem 0; }
.action-card { padding: 1rem; display: flex; justify-content: center; }
.informe-table { width: 100%; border-collapse: collapse; }
.informe-table th, .informe-table td { padding: 0.6rem; border-bottom: 1px solid #e9edf1; }
.loading, .error-message { padding: 1rem; }
.error-message { color: #b61d3c; }
.btn { padding: 0.6rem 1rem; border: none; border-radius: 999px; font-weight: 700; cursor: pointer; }
.btn-primary { background: linear-gradient(120deg, #ff6b4a, #ff8f58 62%, #ffc857); color: #fff; }
.btn-secondary { background: transparent; border: 1px solid rgba(255, 255, 255, 0.7); color: #fff; }
.btn-ghost { background: #e9f6f6; color: #0f7b7f; }
.btn-danger { background: #fdecef; color: #b23946; }

@media (max-width: 960px) {
  .form-grid { grid-template-columns: 1fr 1fr; }
  .stats-grid { grid-template-columns: 1fr; }
}

@media (max-width: 640px) {
  .admin-panel { padding: 1rem; }
  .form-grid { grid-template-columns: 1fr; }
  .crud-actions, .event-actions { flex-direction: column; }
}
</style>
