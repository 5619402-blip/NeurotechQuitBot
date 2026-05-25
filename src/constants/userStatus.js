// Все значения user_status — раздел 18.1 docs/TZ_v4.md
const USER_STATUS = Object.freeze({
  NEW:                    'new',
  INTRO_VIDEO_WATCHED:    'intro_video_watched',
  DIAGNOSTIC_STARTED:     'diagnostic_started',
  DIAGNOSTIC_COMPLETED:   'diagnostic_completed',
  LOW_MOTIVATION:         'low_motivation',
  NOT_SURE_CLARIFICATION: 'not_sure_clarification',
  CONSENT_ACCEPTED:       'consent_accepted',
  TARIFF_SELECTED:        'tariff_selected',
  PAYMENT_PENDING:        'payment_pending',
  PAID_SINGLE:            'paid_single',
  PAID_FULL:              'paid_full',
  RULES_WATCHED:          'rules_watched',
  PREPARATION_STARTED:    'preparation_started',
  PROCEDURE_IN_PROGRESS:  'procedure_in_progress',
  PROCEDURE_INTERRUPTED:  'procedure_interrupted',
  PROCEDURE_COMPLETED:    'procedure_completed',
  WAITING_NEXT_PROCEDURE: 'waiting_next_procedure',
  FOLLOWUP_PENDING:       'followup_pending',
  PROTOCOL_ACTIVE:        'protocol_active',
  PROTOCOL_PAUSED:        'protocol_paused',
  PROTOCOL_COMPLETED:     'protocol_completed',
  NOT_SMOKING:            'not_smoking',
  STOPPED_BY_USER:        'stopped_by_user',
});

module.exports = USER_STATUS;
