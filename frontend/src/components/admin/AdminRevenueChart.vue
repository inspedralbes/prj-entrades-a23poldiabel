<template>
  <div class="chart-wrapper">
    <h3>Estat de seients (ChartJS)</h3>
    <Bar :data="chartData" :options="chartOptions" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Bar } from 'vue-chartjs';
import {
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface Props {
  disponibles: number;
  reservats: number;
  venuts: number;
}

const props = defineProps<Props>();

const chartData = computed(() => ({
  labels: ['Disponibles', 'Reservats', 'Venuts'],
  datasets: [
    {
      label: 'Seients',
      data: [props.disponibles, props.reservats, props.venuts],
      backgroundColor: ['#2f9e44', '#f76707', '#1c7ed6'],
      borderRadius: 8,
    },
  ],
}));

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false,
    },
  },
};
</script>

<style scoped>
.chart-wrapper {
  height: 260px;
  display: grid;
  gap: 0.7rem;
}

.chart-wrapper h3 {
  margin: 0;
  color: #1f2a34;
  font-size: 1rem;
}
</style>
