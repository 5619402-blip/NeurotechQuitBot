// ALTER TYPE … ADD VALUE не может выполняться внутри транзакции в PostgreSQL.
exports.config = { transaction: false };

exports.up = async (knex) => {
  const client = knex.client.config.client;
  const isSQLite = client === 'better-sqlite3' || client === 'sqlite3';
  if (!isSQLite) {
    await knex.schema.raw(
      "ALTER TYPE reminder_type_enum ADD VALUE IF NOT EXISTS 'next_procedure_24h'"
    );
  }
};

exports.down = async (_knex) => {
  // reminder_type_enum values нельзя безопасно удалить в PostgreSQL — down не выполняется
};
