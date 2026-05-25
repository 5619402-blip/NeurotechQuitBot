// Справочная схема БД — раздел 18, docs/TZ_v4.md
// Исполняемый код не содержит. Актуальные определения таблиц — в migrations/.
//
// ENUM-типы (migrations/20260514000001_create_enums.js):
//   user_status_enum        — 23 значения (раздел 18.1)
//   access_type_enum        — none | single_procedure | full_access
//   access_status_enum      — inactive | active | expired | blocked
//   payment_status_enum     — pending | paid | failed | cancelled | refunded
//   procedure_type_enum     — anti_tobacco | quick_lever | alpha
//   session_status_enum     — created | started | completed | interrupted | abandoned | expired
//   reminder_status_enum    — scheduled | sent | cancelled | completed | expired
//   reminder_type_enum      — next_procedure_48h | next_day_followup | seven_day_followup | manual_admin
//   support_status_enum     — new | in_progress | resolved | closed
//   moderation_status_enum  — pending | approved | rejected
//   gift_token_status_enum  — active | used | expired | revoked
//   gift_access_type_enum   — gift_single_procedure | gift_full_access | gift_alpha | gift_test_access
//   wants_to_continue_enum  — continue_protocol | already_not_smoking | do_not_continue | needs_support | unknown
//   result_status_enum      — not_smoking | reduced_smoking | relapsed | unknown
//   diagnostic_status_enum  — started | completed
//   review_type_enum        — video | audio | text | external
//
// Таблицы и ключевые поля:
//
// procedures            — id, procedure_name, procedure_type, sort_order, is_main_protocol, is_active
// users                 — id, telegram_id*, username, first_name, created_at, last_activity_at,
//                         current_screen, user_status, access_type, access_status,
//                         next_procedure_id→procedures, completed_procedures_count,
//                         has_active_unfinished_procedure, maturity_mode_enabled, pause_reason, paused_at
// audio_files           — id, procedure_id→procedures, file_name, storage_provider, storage_path,
//                         file_size_mb, duration_seconds, audio_format, channels, is_active, created_at
// diagnostics           — id, user_id→users, user_name, age_group, nicotine_type, smoking_years_group,
//                         tried_to_quit_before, quit_attempts_count, longest_quit_period,
//                         motivation_level, motivation_source, diagnostic_status, created_at, completed_at
// draft_answers         — id, user_id→users, screen_id, answers_json, updated_at
//                         UNIQUE(user_id, screen_id)
// user_consents         — id, user_id→users, consent_version, accepted_at, source, telegram_id
// payments              — id, user_id→users, tariff_type, amount, currency, payment_provider,
//                         payment_status, provider_payment_id, created_at, paid_at, failed_at, failure_reason
// access_rights         — id, user_id→users, payment_id→payments(nullable), access_type, access_status,
//                         paid_main_procedures_count, used_main_procedures_count,
//                         available_alpha_sessions_count(nullable=unlimited), used_alpha_sessions_count,
//                         upgrade_available, upgrade_amount, created_at, updated_at
// procedure_sessions    — id, user_id→users, procedure_id→procedures, procedure_number,
//                         session_status, started_at, completed_at, interrupted_at,
//                         audio_position_seconds(analytics_only), is_counted_as_completed, exit_reason
// protocol_progress     — id, user_id→users(UNIQUE), current_step_number, next_procedure_type,
//                         main_protocol_completed, last_completed_procedure_type, created_at, updated_at
// player_tokens         — id, user_id→users, procedure_session_id→procedure_sessions,
//                         token(UNIQUE), expires_at, used_at, is_revoked, created_at
// post_procedure_answers— id, user_id→users, procedure_session_id→procedure_sessions,
//                         answers_json(Q1–Q6), created_at
// next_day_followups    — id, user_id→users, procedure_session_id→procedure_sessions,
//                         scheduled_at, sent_at, smoked_after_procedure, current_craving,
//                         easier_to_abstain, strongest_trigger, noticed_change, wants_to_continue, created_at
// seven_day_followups   — id, user_id→users, trigger_source, scheduled_at, sent_at,
//                         smoked_last_7_days, current_craving, changes_noticed, needs_support,
//                         result_status, created_at
// reminders             — id, user_id→users, procedure_id→procedures, related_session_id→procedure_sessions,
//                         reminder_type, scheduled_at(мутирует), sent_at, reminder_count,
//                         reminder_status, user_response, created_at
// reviews               — id, review_type, title, client_name, description, file_url,
//                         preview_image_url, source, is_active, sort_order, created_at
// user_reviews          — id, user_id→users, review_type, text, file_url, review_context,
//                         uploaded_at, moderation_status, created_at
// support_requests      — id, user_id→users, current_screen, access_type, message_text,
//                         support_status, created_at, resolved_at
// gift_access_tokens    — id, token(UNIQUE), created_by_admin_id, gift_access_type, expires_at,
//                         status, activated_by_user_id→users(nullable), activated_at, admin_comment, created_at
// events                — id, user_id→users(nullable), event_name, event_payload, created_at
