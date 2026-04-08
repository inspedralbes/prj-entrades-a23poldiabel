import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const sequelize = new Sequelize(
  process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/entrades_db',
  {
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    dialect: 'postgres',
    define: {
      timestamps: true,
      underscored: true,
    },
  }
);

export async function connectDatabase(): Promise<void> {
  try {
    await sequelize.authenticate();
    console.log('Connexió a la base de dades establerta.');
  } catch (error) {
    console.error('Error en connectar a la base de dades:', error);
    throw error;
  }
}

export default sequelize;
