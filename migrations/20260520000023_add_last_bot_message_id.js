exports.up = async (knex) => {
  await knex.schema.alterTable('users', (table) => {
    table.bigInteger('last_bot_message_id').nullable();
  });
};

exports.down = async (knex) => {
  await knex.schema.alterTable('users', (table) => {
    table.dropColumn('last_bot_message_id');
  });
};
