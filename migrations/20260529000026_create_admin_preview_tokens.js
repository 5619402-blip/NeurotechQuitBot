exports.up = async (knex) => {
  await knex.schema.createTable('admin_preview_tokens', (table) => {
    table.bigIncrements('id').primary();
    table.text('token').notNullable().unique();
    table.bigInteger('admin_user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.text('procedure_type').notNullable();
    table.timestamp('expires_at', { useTz: true }).notNullable();
    table.integer('use_count').notNullable().defaultTo(0);
    table.integer('max_uses').notNullable().defaultTo(10);
    table.boolean('is_revoked').notNullable().defaultTo(false);
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });
};

exports.down = async (knex) => {
  await knex.schema.dropTableIfExists('admin_preview_tokens');
};
