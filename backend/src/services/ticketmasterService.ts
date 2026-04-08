const TM_API_KEY = 'rqytFyJ0QdEH0IR3AjAe51GFymOkp2M5';
const TM_BASE_URL = 'https://app.ticketmaster.com/discovery/v2';

export interface TMEvent {
  id: string;
  name: string;
  images: any[];
  dates: {
    start: {
      dateTime: string;
      localDate: string;
      localTime: string;
    }
  };
  _embedded?: {
    venues: any[];
  };
  description?: string;
}

interface TMResponse {
  _embedded?: {
    events: TMEvent[];
  };
}

export async function fetchTMEvents(city: string = 'Barcelona') {
  try {
    const url = `${TM_BASE_URL}/events.json?apikey=${TM_API_KEY}&city=${city}&classificationName=music&size=20`;
    const response = await fetch(url);
    const data = await response.json() as TMResponse;
    
    if (!data._embedded || !data._embedded.events) {
      return [];
    }
    
    return data._embedded.events;
  } catch (error) {
    console.error('Error fetching from Ticketmaster:', error);
    return [];
  }
}

export async function fetchTMEventById(id: string) {
  try {
    const url = `${TM_BASE_URL}/events/${id}.json?apikey=${TM_API_KEY}`;
    const response = await fetch(url);
    if (!response.ok) return null;
    return await response.json() as TMEvent;
  } catch (error) {
    console.error('Error fetching TM event by ID:', error);
    return null;
  }
}
