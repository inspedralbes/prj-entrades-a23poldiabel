<template>
  <div
    class="seient"
    :class="[
      `seient--${estat}`,
      { 'seient--seleccionable': esSeleccionable }
    ]"
    :title="`torna: ${fila}, seient: ${numero}`"
    @click="handleClick"
  >
    <span class="seient-numero">{{ numero }}</span>
  </div>
</template>

<script setup lang="ts">
interface Props {
  id: string;
  numero: string;
  fila: string;
  estat: 'disponible' | 'reservat' | 'seleccionat' | 'venut';
  esSeleccionable?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  esSeleccionable: false,
});

const emit = defineEmits<{
  click: [id: string];
}>();

function handleClick() {
  if (props.estat === 'disponible' && props.esSeleccionable) {
    emit('click', props.id);
  }
}
</script>

<style scoped>
.seient {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  border: 2px solid transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.78rem;
  font-weight: 700;
  transition: all 0.2s ease;
  cursor: default;
}

.seient--disponible {
  background-color: #22c55e;
  border-color: #15803d;
  color: #052e16;
}

.seient--reservat {
  background-color: #f59e0b;
  border-color: #b45309;
  color: #451a03;
  opacity: 0.9;
}

.seient--seleccionat {
  background-color: #2563eb;
  border-color: #1d4ed8;
  color: #eff6ff;
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.25);
}

.seient--venut {
  background-color: #64748b;
  border-color: #334155;
  color: #e2e8f0;
  cursor: not-allowed;
  opacity: 0.65;
}

.seient--seleccionable.seient--disponible {
  cursor: pointer;
}

.seient--seleccionable.seient--disponible:hover {
  transform: translateY(-1px) scale(1.05);
  box-shadow: 0 8px 14px rgba(21, 128, 61, 0.22);
}

.seient-numero {
  font-size: 0.7rem;
}
</style>
