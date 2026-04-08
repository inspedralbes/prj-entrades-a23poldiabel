import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export interface Reserva {
  id: string;
  token: string;
  esdeveniment_id: string;
  data_inici: string;
  data_expiracio: string;
  seients: Array<{
    id: string;
    numero: string;
    fila: string;
    estat: string;
  }>;
}

export const useReservaStore = defineStore('reserva', () => {
  const reservaActiva = ref<Reserva | null>(null);
  const carregant = ref(false);
  const error = ref<string | null>(null);
  const araTimestamp = ref(Date.now());
  let intervalId: ReturnType<typeof setInterval> | null = null;

  function iniciarTimer() {
    if (intervalId) return;
    intervalId = setInterval(() => {
      araTimestamp.value = Date.now();
    }, 1000);
  }

  function aturarTimer() {
    if (!intervalId) return;
    clearInterval(intervalId);
    intervalId = null;
  }

  const tempsRestant = computed(() => {
    if (!reservaActiva.value) return 0;
    const ara = araTimestamp.value;
    const expiracio = new Date(reservaActiva.value.data_expiracio).getTime();
    return Math.max(0, Math.floor((expiracio - ara) / 1000));
  });

  const estaActiva = computed(() => {
    return tempsRestant.value > 0;
  });

  function setReservaActiva(reserva: Reserva | null) {
    reservaActiva.value = reserva;
    if (reserva) {
      iniciarTimer();
    } else {
      aturarTimer();
    }
  }

  function clearReserva() {
    reservaActiva.value = null;
    aturarTimer();
  }

  function setCarregant(valor: boolean) {
    carregant.value = valor;
  }

  function setError(msg: string | null) {
    error.value = msg;
  }

  return {
    reservaActiva,
    carregant,
    error,
    tempsRestant,
    estaActiva,
    setReservaActiva,
    clearReserva,
    setCarregant,
    setError,
  };
});
