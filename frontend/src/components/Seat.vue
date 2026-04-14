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
  width: 38px;
  height: 38px;
  border-radius: 10px;
  border: 2px solid transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.74rem;
  font-weight: 700;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  cursor: default;
}

.seient--disponible {
  background-color: #37b24d;
  border-color: #27903d;
  color: #fff;
}

.seient--reservat {
  background-color: #e8a515;
  border-color: #c58602;
  color: #402703;
  opacity: 0.9;
}

.seient--seleccionat {
  background-color: #0f7b7f;
  border-color: #0b6165;
  color: #eff6ff;
  box-shadow: 0 0 0 3px rgba(15, 123, 127, 0.26);
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
  transform: translateY(-2px) scale(1.07);
  box-shadow: 0 10px 14px rgba(40, 128, 61, 0.25);
}

.seient-numero {
  font-size: 0.7rem;
}
</style>
