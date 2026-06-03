exports.up = async (knex) => {
  await knex.schema.alterTable('protocol_progress', (table) => {
    table.timestamp('next_procedure_unlocks_at', { useTz: true }).nullable();
  });
};

exports.down = async (knex) => {
  await knex.schema.alterTable('protocol_progress', (table) => {
    table.dropColumn('next_procedure_unlocks_at');
  });
};
