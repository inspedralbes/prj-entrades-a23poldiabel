import { Sequelize } from 'sequelize';
import { initializeModels } from '../models/index.js';

let sequelize: Sequelize | null = null;
let dbModels: any = null;

export async function connectDatabase() {
  const {
    DB_HOST = 'entrades-postgres',
    DB_PORT = '5432',
    DB_NAME = 'entrades',
    DB_USER = 'postgres',
    DB_PASSWORD = 'postgres'
  } = process.env;

  sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
    host: DB_HOST,
    port: parseInt(DB_PORT),
    dialect: 'postgres',
    logging: console.log // En producció, disable-ho
  });

  try {
    await sequelize.authenticate();
    console.log('✓ Base de dades connectada');
  } catch (error) {
    console.error('❌ Error connectant BD:', error);
    throw error;
  }

  // Inicialitza models
  const models = initializeModels(sequelize);
  dbModels = models;

  return { sequelize, models };
}

export function getSequelize(): Sequelize {
  if (!sequelize) {
    throw new Error('Database not initialized. Call connectDatabase() first.');
  }
  return sequelize;
}

export function getModels() {
  if (!dbModels) {
    throw new Error('Models not initialized. Call connectDatabase() first.');
  }
  return dbModels;
}
