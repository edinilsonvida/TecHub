const { Sequelize } = require('sequelize');
const pg = require('pg');
const config = require('./config');

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    port: dbConfig.port,
    dialect: dbConfig.dialect,
    dialectModule: dbConfig.dialect === 'postgres' ? pg : undefined,
    logging: dbConfig.logging,
    dialectOptions: dbConfig.dialectOptions,
  }
);

module.exports = sequelize;
