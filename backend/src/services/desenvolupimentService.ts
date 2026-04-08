import * as tmService from './ticketmasterService.js';

// Solo devolvemos eventos de Ticketmaster, simplificado
export async function obtenirTotsEsdeveniments() {
  try {
    const eventos = await tmService.fetchTMEvents('Barcelona');
    
    return eventos.map(e => ({
      id: e.id,
      nom: e.name,
      data_hora: e.dates.start.dateTime,
      recinte: e._embedded?.venues?.[0]?.name || 'Unknown Venue',
      descripcio: e.description || '',
      imatge: e.images?.sort((a: any, b: any) => b.width - a.width)[0]?.url || '',
      estat: 'actiu',
      isExternal: true,
    }));
  } catch (error) {
    console.error('Error obtenint eventos:', error);
    return [];
  }
}

export async function obtenirEsdevenimentPerId(id: string) {
  try {
    const event = await tmService.fetchTMEventById(id);
    
    if (!event) {
      return null;
    }

    return {
      id: event.id,
      nom: event.name,
      data_hora: event.dates.start.dateTime,
      recinte: event._embedded?.venues?.[0]?.name || 'Unknown Venue',
      descripcio: event.description || '',
      imatge: event.images?.sort((a: any, b: any) => b.width - a.width)[0]?.url || '',
      estat: 'actiu',
      isExternal: true,
    };
  } catch (error) {
    console.error('Error obtenint evento:', error);
    return null;
  }
}

export async function crearEsdeveniment() {
  throw new Error('No es posible crear eventos manualmente - solo Ticketmaster');
}

export async function actualitzarEsdeveniment() {
  throw new Error('No es posible actualizar eventos - son de Ticketmaster');
}
