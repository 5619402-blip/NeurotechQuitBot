// ALTER TYPE … ADD VALUE не может выполняться внутри транзакции в PostgreSQL.
// exports.config = { transaction: false } отключает автоматическую транзакцию Knex.
exports.config = { transaction: false };

exports.up = async (knex) => {
  const client = knex.client.config.client;
  const isSQLite = client === 'better-sqlite3' || client === 'sqlite3';

  if (!isSQLite) {
    await knex.schema.raw(
      "ALTER TYPE procedure_type_enum ADD VALUE IF NOT EXISTS 'short_quick_lever'"
    );
    await knex.schema.raw(
      "ALTER TYPE procedure_type_enum ADD VALUE IF NOT EXISTS 'short_anti_tobacco'"
    );
  }

  // Идемпотентная вставка: пропускаем, если тип уже существует в таблице
  const existing = await knex('procedures')
    .whereIn('procedure_type', ['short_quick_lever', 'short_anti_tobacco'])
    .select('procedure_type');
  const existingTypes = existing.map((r) => r.procedure_type);

  const toInsert = [
    {
      procedure_name: 'Укороченный Быстрый рычаг',
      procedure_type: 'short_quick_lever',
      sort_order: 4,
      is_main_protocol: true,
      is_active: true,
    },
    {
      procedure_name: 'Укороченный Антитабак',
      procedure_type: 'short_anti_tobacco',
      sort_order: 5,
      is_main_protocol: true,
      is_active: true,
    },
  ].filter((r) => !existingTypes.includes(r.procedure_type));

  if (toInsert.length > 0) {
    await knex('procedures').insert(toInsert);
  }
};

exports.down = async (knex) => {
  // Enum values нельзя безопасно удалить из PostgreSQL без пересоздания типа.
  // down удаляет только строки в procedures.
  await knex('procedures')
    .whereIn('procedure_type', ['short_quick_lever', 'short_anti_tobacco'])
    .delete();
};
