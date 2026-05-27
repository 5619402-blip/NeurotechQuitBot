exports.up = async (knex) => {
  const hasCol = await knex.schema.hasColumn('reviews', 'telegram_file_id');
  if (!hasCol) {
    await knex.schema.table('reviews', (t) => {
      t.text('telegram_file_id').nullable();
    });
  }
};

exports.down = async (knex) => {
  const hasCol = await knex.schema.hasColumn('reviews', 'telegram_file_id');
  if (hasCol) {
    await knex.schema.table('reviews', (t) => {
      t.dropColumn('telegram_file_id');
    });
  }
};
