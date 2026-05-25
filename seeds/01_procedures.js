// Seed 01 — начальные данные таблицы procedures
// Три процедуры протокола (раздел 9, docs/TZ_v4.md).
// Порядок: anti_tobacco → quick_lever чередуется по current_step_number (раздел 9.2).
exports.seed = async (knex) => {
  await knex('procedures').del();

  await knex('procedures').insert([
    {
      procedure_name: 'Анти-табак',
      procedure_type: 'anti_tobacco',
      sort_order: 1,
      is_main_protocol: true,
      is_active: true,
    },
    {
      procedure_name: 'Быстрый рычаг',
      procedure_type: 'quick_lever',
      sort_order: 2,
      is_main_protocol: true,
      is_active: true,
    },
    {
      procedure_name: 'Альфа',
      procedure_type: 'alpha',
      sort_order: 3,
      is_main_protocol: false,
      is_active: true,
    },
  ]);
};
