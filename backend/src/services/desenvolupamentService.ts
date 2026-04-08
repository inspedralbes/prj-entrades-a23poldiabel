import * as ticketmasterService from './ticketmasterService.js';

/**
 * Servicio de eventos - SOLO TICKETMASTER
 * Este servicio es un wrapper que solo devuelve eventos de la API de Ticketmaster
 */

export async function obtenirTotsEsdeveniments() {
  try {
    // Obtener eventos de Ticketmaster para Barcelona
    const eventos = await ticketmasterService.fetchTMEvents('Barcelona');
    
    console.log('🎪 Raw TM Response:', eventos);
    
    // Mapear a formato estándar del sistema
    return eventos.map((e: any) => ({
      id: e.id,
      nom: e.name || 'Unknown Event',
      data_hora: e.dates?.start?.dateTime || new Date().toISOString(),
      recinte: e._embedded?.venues?.[0]?.name || 'TBD',
      descripcio: e.description || '',
      imatge: e.images?.[0]?.url || 'https://via.placeholder.com/300x200?text=Event',
      estat: 'activo',
      origen: 'ticketmaster'
    }));
  } catch (error) {
    console.error('Error obtenint esdeveniments de Ticketmaster:', error);
    throw new Error('No s\'han pogut obtenir els esdeveniments');
  }
}

export async function obtenirEsdevenimentPerId(id: string) {
  try {
    // Obtener un evento específico de Ticketmaster
    const event = await ticketmasterService.fetchTMEventById(id);
    
    if (!event) {
      return null;
    }

    console.log('🎪 Event by ID:', event);
    
    // Mapear a formato estándar
    return {
      id: event.id,
      nom: event.name || 'Unknown Event',
      data_hora: event.dates?.start?.dateTime || new Date().toISOString(),
      recinte: event._embedded?.venues?.[0]?.name || 'TBD',
      descripcio: event.description || '',
      imatge: event.images?.[0]?.url || 'https://via.placeholder.com/300x200?text=Event',
      estat: 'activo',
      origen: 'ticketmaster'
    };
  } catch (error) {
    console.error('Error obtenint event de Ticketmaster:', error);
    return null;
  }
}
