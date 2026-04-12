<template>
  <div class="mapa-seients" data-test="seat-map">
    <div v-if="carregant" class="loading">Carregant seients...</div>
    
    <div v-else class="zones">
      <div v-for="zona in zonesAgrupats" :key="zona.id" class="zona" :data-zona="zona.id">
        <h3 class="zona-titol">{{ zona.nom }} - {{ zona.preu }}€</h3>
        
        <div class="files">
          <div v-for="(fila, index) in zona.files" :key="index" class="fila seat-row" :data-fila="fila.nom">
            <span class="fila-label">{{ fila.nom }}</span>
            <div class="seients-fila">
              <Seat
                v-for="seient in fila.seients"
                :key="seient.id"
                :id="seient.id"
                :numero="seient.numero"
                :fila="seient.fila"
                :estat="seient.estat"
                :es-seleccionable="potSeleccionar"
                :data-test="seient.id"
                :data-seat-id="seient.id"
                :data-state="seient.estat"
                @click="seleccionarSeient"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="llegenda">
      <h4>Llegenda</h4>
      <div class="llegenda-items">
        <div class="llegenda-item">
          <span class="llegenda-color disponible"></span>
          <span>Disponible</span>
        </div>
        <div class="llegenda-item">
          <span class="llegenda-color reservat"></span>
          <span>Reservat</span>
        </div>
        <div class="llegenda-item">
          <span class="llegenda-color seleccionat"></span>
          <span>Seleccionat</span>
        </div>
        <div class="llegenda-item">
          <span class="llegenda-color venut"></span>
          <span>Venut</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import Seat from './Seat.vue';

interface Seient {
  id: string;
  numero: string;
  fila: string;
  estat: 'disponible' | 'reservat' | 'seleccionat' | 'venut';
  zona: {
    id: string;
    nom: string;
    preu: number;
  };
}

interface Props {
  seients: Seient[];
  carregant?: boolean;
  reservaActiva?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  carregant: false,
  reservaActiva: false,
});

const emit = defineEmits<{
  seleccionarSeient: [seientId: string];
}>();

const potSeleccionar = computed(() => !props.reservaActiva);

const zonesAgrupats = computed(() => {
  const grups = new Map<string, { id: string; nom: string; preu: number; files: Map<string, Seient[]> }>();

  for (const seient of props.seients) {
    const zonaNom = seient.zona.nom;
    
    if (!grups.has(zonaNom)) {
      grups.set(zonaNom, {
        id: seient.zona.id,
        nom: zonaNom,
        preu: seient.zona.preu,
        files: new Map(),
      });
    }

    const zona = grups.get(zonaNom)!;
    
    if (!zona.files.has(seient.fila)) {
      zona.files.set(seient.fila, []);
    }
    
    zona.files.get(seient.fila)!.push(seient);
  }

  return Array.from(grups.values()).map(zona => ({
    id: zona.id,
    nom: zona.nom,
    preu: zona.preu,
    files: Array.from(zona.files.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([nom, seients]) => ({
        nom,
        seients: seients.sort((a, b) => parseInt(a.numero) - parseInt(b.numero)),
      })),
  }));
});

function seleccionarSeient(seientId: string) {
  emit('seleccionarSeient', seientId);
}
</script>

<style scoped>
.mapa-seients {
  padding: var(--spacing-md);
  background: #f8fafc;
  border: 1px solid #dbe3ef;
  border-radius: 14px;
}

.zones {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xl);
}

.zona {
  background: #ffffff;
  border: 1px solid #dbe3ef;
  padding: var(--spacing-lg);
  border-radius: var(--radius-lg);
}

.zona-titol {
  text-align: center;
  margin-bottom: var(--spacing-md);
  color: #1f2937;
}

.fila {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-sm);
}

.fila-label {
  width: 28px;
  font-weight: 600;
  color: #475569;
}

.seients-fila {
  display: flex;
  gap: var(--spacing-xs);
  flex-wrap: wrap;
  align-items: center;
}

.llegenda {
  margin-top: var(--spacing-xl);
  padding: var(--spacing-md);
  background: #ffffff;
  border: 1px solid #dbe3ef;
  border-radius: var(--radius-md);
}

.llegenda h4 {
  margin-bottom: var(--spacing-sm);
}

.llegenda-items {
  display: flex;
  gap: var(--spacing-lg);
  flex-wrap: wrap;
}

.llegenda-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.llegenda-color {
  width: 20px;
  height: 20px;
  border-radius: 6px;
  border: 2px solid transparent;
}

.llegenda-color.disponible {
  background: #22c55e;
  border-color: #15803d;
}

.llegenda-color.reservat {
  background: #f59e0b;
  border-color: #b45309;
}

.llegenda-color.seleccionat {
  background: #2563eb;
  border-color: #1d4ed8;
}

.llegenda-color.venut {
  background: #64748b;
  border-color: #334155;
}
</style>
