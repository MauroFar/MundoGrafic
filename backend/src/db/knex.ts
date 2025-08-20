import knex from 'knex';
import knexConfig from '../../knexfile';

// Crear instancia de Knex basada en el entorno
const environment = process.env.NODE_ENV || 'development';
const config = knexConfig[environment as keyof typeof knexConfig];

// Crear la instancia de Knex
const db = knex(config);

export default db;
