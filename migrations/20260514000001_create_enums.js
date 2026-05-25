// Миграция 001 — все ENUM-типы из раздела 18.1 docs/TZ_v4.md
// SQLite не поддерживает CREATE TYPE; колонки с specificType() хранятся как TEXT.
exports.up = async (knex) => {
  if (knex.client.config.client === 'better-sqlite3') return;

  await knex.schema.raw(`
    CREATE TYPE user_status_enum AS ENUM (
      'new', 'intro_video_watched', 'diagnostic_started', 'diagnostic_completed',
      'low_motivation', 'not_sure_clarification', 'consent_accepted', 'tariff_selected',
      'payment_pending', 'paid_single', 'paid_full', 'rules_watched', 'preparation_started',
      'procedure_in_progress', 'procedure_interrupted', 'procedure_completed',
      'waiting_next_procedure', 'followup_pending', 'protocol_active', 'protocol_paused',
      'protocol_completed', 'not_smoking', 'stopped_by_user'
    )
  `);
  await knex.schema.raw(`CREATE TYPE access_type_enum AS ENUM ('none', 'single_procedure', 'full_access')`);
  await knex.schema.raw(`CREATE TYPE access_status_enum AS ENUM ('inactive', 'active', 'expired', 'blocked')`);
  await knex.schema.raw(`CREATE TYPE payment_status_enum AS ENUM ('pending', 'paid', 'failed', 'cancelled', 'refunded')`);
  await knex.schema.raw(`CREATE TYPE procedure_type_enum AS ENUM ('anti_tobacco', 'quick_lever', 'alpha')`);
  await knex.schema.raw(`CREATE TYPE session_status_enum AS ENUM ('created', 'started', 'completed', 'interrupted', 'abandoned', 'expired')`);
  await knex.schema.raw(`CREATE TYPE reminder_status_enum AS ENUM ('scheduled', 'sent', 'cancelled', 'completed', 'expired')`);
  await knex.schema.raw(`CREATE TYPE reminder_type_enum AS ENUM ('next_procedure_48h', 'next_day_followup', 'seven_day_followup', 'manual_admin')`);
  await knex.schema.raw(`CREATE TYPE support_status_enum AS ENUM ('new', 'in_progress', 'resolved', 'closed')`);
  await knex.schema.raw(`CREATE TYPE moderation_status_enum AS ENUM ('pending', 'approved', 'rejected')`);
  await knex.schema.raw(`CREATE TYPE gift_token_status_enum AS ENUM ('active', 'used', 'expired', 'revoked')`);
  await knex.schema.raw(`CREATE TYPE gift_access_type_enum AS ENUM ('gift_single_procedure', 'gift_full_access', 'gift_alpha', 'gift_test_access')`);
  await knex.schema.raw(`CREATE TYPE wants_to_continue_enum AS ENUM ('continue_protocol', 'already_not_smoking', 'do_not_continue', 'needs_support', 'unknown')`);
  await knex.schema.raw(`CREATE TYPE result_status_enum AS ENUM ('not_smoking', 'reduced_smoking', 'relapsed', 'unknown')`);
  await knex.schema.raw(`CREATE TYPE diagnostic_status_enum AS ENUM ('started', 'completed')`);
  await knex.schema.raw(`CREATE TYPE review_type_enum AS ENUM ('video', 'audio', 'text', 'external')`);
};

exports.down = async (knex) => {
  if (knex.client.config.client === 'better-sqlite3') return;

  await knex.schema.raw('DROP TYPE IF EXISTS review_type_enum CASCADE');
  await knex.schema.raw('DROP TYPE IF EXISTS diagnostic_status_enum CASCADE');
  await knex.schema.raw('DROP TYPE IF EXISTS result_status_enum CASCADE');
  await knex.schema.raw('DROP TYPE IF EXISTS wants_to_continue_enum CASCADE');
  await knex.schema.raw('DROP TYPE IF EXISTS gift_access_type_enum CASCADE');
  await knex.schema.raw('DROP TYPE IF EXISTS gift_token_status_enum CASCADE');
  await knex.schema.raw('DROP TYPE IF EXISTS moderation_status_enum CASCADE');
  await knex.schema.raw('DROP TYPE IF EXISTS support_status_enum CASCADE');
  await knex.schema.raw('DROP TYPE IF EXISTS reminder_type_enum CASCADE');
  await knex.schema.raw('DROP TYPE IF EXISTS reminder_status_enum CASCADE');
  await knex.schema.raw('DROP TYPE IF EXISTS session_status_enum CASCADE');
  await knex.schema.raw('DROP TYPE IF EXISTS procedure_type_enum CASCADE');
  await knex.schema.raw('DROP TYPE IF EXISTS payment_status_enum CASCADE');
  await knex.schema.raw('DROP TYPE IF EXISTS access_status_enum CASCADE');
  await knex.schema.raw('DROP TYPE IF EXISTS access_type_enum CASCADE');
  await knex.schema.raw('DROP TYPE IF EXISTS user_status_enum CASCADE');
};
