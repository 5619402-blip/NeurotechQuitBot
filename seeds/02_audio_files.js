// Seed 02 — запись в audio_files для процедуры «Анти-табак».
// Хранилище: Yandex Object Storage, bucket neurotech-quit-test.
// Идемпотентен: повторный запуск не создаёт дубль.
exports.seed = async (knex) => {
  const STORAGE_PATH = 'Anti SmokingАУДИО.m4a';

  // Ищем процедуру по стабильному enum-полю, не по id
  const procedure = await knex('procedures')
    .where({ procedure_type: 'anti_tobacco', is_active: true })
    .first();

  if (!procedure) {
    throw new Error('[seed 02] Процедура anti_tobacco не найдена. Запустите seed 01 первым.');
  }

  const procedureId = procedure.id;

  // Проверяем: нужная запись уже есть?
  const existing = await knex('audio_files')
    .where({ procedure_id: procedureId, storage_path: STORAGE_PATH, is_active: true })
    .first();

  if (existing) {
    console.log(`[seed 02] audio_files: запись уже есть (id=${existing.id}), пропускаем.`);
    return;
  }

  // Деактивируем старые активные записи для этой процедуры (если есть)
  const deactivated = await knex('audio_files')
    .where({ procedure_id: procedureId, is_active: true })
    .update({ is_active: false });

  if (deactivated > 0) {
    console.log(`[seed 02] audio_files: деактивировано старых записей: ${deactivated}.`);
  }

  // Вставляем актуальную запись
  await knex('audio_files').insert({
    procedure_id: procedureId,
    file_name: STORAGE_PATH,
    storage_provider: 's3',
    storage_path: STORAGE_PATH,
    audio_format: 'm4a',
    is_active: true,
  });

  console.log(`[seed 02] audio_files: запись добавлена (procedure_id=${procedureId}, storage_path='${STORAGE_PATH}').`);
};
