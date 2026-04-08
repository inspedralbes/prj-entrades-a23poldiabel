import { connectDatabase } from './config/database.js';
import { Esdeveniment, Zona, Seient } from './models/index.js';

async function seed() {
  await connectDatabase();

  const count = await Esdeveniment.count();
  if (count > 1) {
    console.log('Ja hi ha esdeveniments a la base de dades');
    return;
  }

  const esdeveniments = [
    { nom: 'Coldplay - Music of the Spheres', data_hora: new Date('2026-06-15T20:00:00'), recinte: 'Estadi Olímpic', descripcio: 'Gira mundial 2026' },
    { nom: 'Taylor Swift - Eras Tour', data_hora: new Date('2026-07-20T21:00:00'), recinte: 'Camp Nou', descripcio: 'El concert definitiu' },
    { nom: 'Festival de Cap d\'Any', data_hora: new Date('2026-12-31T22:00:00'), recinte: 'Fira Barcelona', descripcio: 'Els millors artists' },
    { nom: 'Rock Fest Barcelona', data_hora: new Date('2026-08-10T18:00:00'), recinte: 'Castelldefels', descripcio: 'Rock fins morts' },
  ];

  for (const esd of esdeveniments) {
    const esdeveniment = await Esdeveniment.create(esd);
    console.log(`Creat: ${esdeveniment.nom}`);
    
    const zones = [
      { nom: 'VIP', preu: 250, capacitat: 50 },
      { nom: 'Platea', preu: 120, capacitat: 200 },
      { nom: 'General', preu: 60, capacitat: 500 },
    ];

    for (const zona of zones) {
      const z = await Zona.create({ ...zona, esdeveniment_id: esdeveniment.id });
      console.log(`  Zona: ${zona.nom}`);
      
      for (let fila = 1; fila <= 5; fila++) {
        for (let numero = 1; numero <= 10; numero++) {
          await Seient.create({ zona_id: z.id, fila: String(fila), numero: String(numero), estat: 'disponible' });
        }
      }
    }
  }
  console.log('Seed completat!');
}

seed().catch(console.error);
