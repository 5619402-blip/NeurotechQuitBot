// Миграция 022 — добавляет followup_status_enum и поле followup_status
// в таблицы next_day_followups и seven_day_followups (Шаг 12).
exports.up = async (knex) => {
  const client = knex.client.config.client;
  const isSQLite = client === 'better-sqlite3' || client === 'sqlite3';

  if (!isSQLite) {
    await knex.schema.raw(`
      CREATE TYPE followup_status_enum AS ENUM ('scheduled', 'sent', 'completed', 'cancelled')
    `);
  }

  await knex.schema.alterTable('next_day_followups', (table) => {
    table.specificType('followup_status', 'followup_status_enum').notNullable().defaultTo('scheduled');
  });
  await knex.schema.alterTable('seven_day_followups', (table) => {
    table.specificType('followup_status', 'followup_status_enum').notNullable().defaultTo('scheduled');
  });
};

exports.down = async (knex) => {
  const client = knex.client.config.client;
  const isSQLite = client === 'better-sqlite3' || client === 'sqlite3';

  await knex.schema.alterTable('seven_day_followups', (table) => {
    table.dropColumn('followup_status');
  });
  await knex.schema.alterTable('next_day_followups', (table) => {
    table.dropColumn('followup_status');
  });

  if (!isSQLite) {
    await knex.schema.raw('DROP TYPE IF EXISTS followup_status_enum');
  }
};
