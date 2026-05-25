const knex = require('knex');
const knexConfig = require('../../knexfile.js');

// Пул соединений инициализируется лениво — первый реальный запрос к БД
// происходит при вызове функций из db/users.js и других модулей, не при старте бота.
const db = knex(knexConfig);

module.exports = db;
