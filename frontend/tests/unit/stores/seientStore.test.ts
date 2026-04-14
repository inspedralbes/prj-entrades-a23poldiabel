import { beforeEach, describe, expect, it } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useSeientStore } from '../../../src/stores/seientStore';

describe('seient store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('sets seats and computes availability counters', () => {
    const store = useSeientStore();

    store.setSeients([
      { id: '1', zona_id: 'a', numero: '1', fila: 'A', estat: 'disponible' },
      { id: '2', zona_id: 'a', numero: '2', fila: 'A', estat: 'reservat' },
      { id: '3', zona_id: 'a', numero: '3', fila: 'A', estat: 'venut' },
    ]);

    expect(store.seientsDisponibles).toHaveLength(1);
    expect(store.seientsReservats).toHaveLength(1);
    expect(store.seientsVenuts).toHaveLength(1);
  });

  it('adds and removes selected seats without duplicates', () => {
    const store = useSeientStore();

    store.afegirSeientSeleccionat('seat-1');
    store.afegirSeientSeleccionat('seat-1');
    expect(store.seientsSeleccionats).toEqual(['seat-1']);

    store.treureSeientSeleccionat('seat-1');
    expect(store.seientsSeleccionats).toEqual([]);
  });

  it('updates an existing seat state', () => {
    const store = useSeientStore();

    store.setSeients([
      { id: '1', zona_id: 'a', numero: '1', fila: 'A', estat: 'disponible' },
    ]);

    store.actualitzarSeient({ id: '1', zona_id: 'a', numero: '1', fila: 'A', estat: 'venut' });
    expect(store.seients[0].estat).toBe('venut');
  });
});
