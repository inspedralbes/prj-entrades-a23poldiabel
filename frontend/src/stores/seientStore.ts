import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export interface Seient {
  id: string;
  zona_id: string;
  numero: string;
  fila: string;
  estat: 'disponible' | 'reservat' | 'seleccionat' | 'venut';
  zona?: {
    id: string;
    nom: string;
    preu?: number;
  };
}

export const useSeientStore = defineStore('seient', () => {
  const seients = ref<Seient[]>([]);
  const seientsSeleccionats = ref<string[]>([]);
  const carregant = ref(false);
  const error = ref<string | null>(null);

  const seientsDisponibles = computed(() => 
    seients.value.filter(s => s.estat === 'disponible')
  );

  const seientsReservats = computed(() => 
    seients.value.filter(s => s.estat === 'reservat')
  );

  const seientsVenuts = computed(() => 
    seients.value.filter(s => s.estat === 'venut')
  );

  function setSeients(nouSeients: Seient[]) {
    seients.value = nouSeients;
  }

  function actualitzarSeient(seientActualitzat: Seient) {
    const index = seients.value.findIndex(s => s.id === seientActualitzat.id);
    if (index !== -1) {
      seients.value[index] = seientActualitzat;
    }
  }

  function afegirSeientSeleccionat(seientId: string) {
    if (!seientsSeleccionats.value.includes(seientId)) {
      seientsSeleccionats.value.push(seientId);
    }
  }

  function treureSeientSeleccionat(seientId: string) {
    seientsSeleccionats.value = seientsSeleccionats.value.filter(id => id !== seientId);
  }

  function clearSeleccionats() {
    seientsSeleccionats.value = [];
  }

  function clearSeients() {
    seients.value = [];
    seientsSeleccionats.value = [];
  }

  return {
    seients,
    seientsSeleccionats,
    carregant,
    error,
    seientsDisponibles,
    seientsReservats,
    seientsVenuts,
    setSeients,
    actualitzarSeient,
    afegirSeientSeleccionat,
    treureSeientSeleccionat,
    clearSeleccionats,
    clearSeients,
  };
});
