// Маршрутизация /start по user_status — раздел 4 docs/TZ_v4.md
const USER_STATUS = require('../constants/userStatus');
const { showWelcome } = require('./screens/welcome');
const { startDiagnosticFlow } = require('./screens/diagConsent');
const { showLowReadiness } = require('./screens/lowReadiness');
const { showNotSure } = require('./screens/notSure');
const { showConsent } = require('./screens/consent');
const { showTariff } = require('./screens/tariff');
const { showMyAccess } = require('./screens/myAccess');
const { showRulesVideo } = require('./screens/rulesVideo');
const { showPreparation } = require('./screens/preparation');
const { getAccessRights, getProtocolProgress, getNextProcedureType } = require('../db/access');
const { showProcedureInterrupted } = require('./screens/procedureInterrupted');
const { showNotSmokingResult } = require('./screens/notSmokingResult');

async function routeToPreparation(ctx, user) {
  const [ar, progress] = await Promise.all([
    getAccessRights(user.id),
    getProtocolProgress(user.id),
  ]);
  if (!ar) return showTariff(ctx, user);
  const step = progress?.current_step_number ?? 0;
  const procedureType = getNextProcedureType(step);
  return showPreparation(ctx, { isFirstProcedure: step === 0, procedureType });
}

async function route(ctx, user) {
  switch (user.user_status) {

    // Новый пользователь → Welcome (раздел 5.1)
    case USER_STATUS.NEW:
    case USER_STATUS.INTRO_VIDEO_WATCHED:
      return showWelcome(ctx);

    // Диагностика начата, но не завершена → начать диагностику с первого вопроса (раздел 5.4)
    // TODO: после подключения БД — возобновлять с сохранённого места через draft_answers
    case USER_STATUS.DIAGNOSTIC_STARTED:
      return startDiagnosticFlow(ctx);

    // Диагностика завершена, согласие не принято → пользовательское согласие (раздел 5.8)
    case USER_STATUS.DIAGNOSTIC_COMPLETED:
      return showConsent(ctx, 'decision');

    // Низкая мотивация — предупреждение уже было показано, флаг уже стоит
    case USER_STATUS.LOW_MOTIVATION:
      return showLowReadiness(ctx, { markFlag: false });

    // Пользователь не уверен — уточняющий экран (раздел 5.7)
    case USER_STATUS.NOT_SURE_CLARIFICATION:
      return showNotSure(ctx);

    // Согласие принято, оплата не завершена → выбор тарифа / оплата (раздел 6)
    case USER_STATUS.CONSENT_ACCEPTED:
    case USER_STATUS.TARIFF_SELECTED:
    case USER_STATUS.PAYMENT_PENDING:
      return showTariff(ctx, user);

    // Первичный flow — без myAccess до нажатия Play
    case USER_STATUS.PAID_SINGLE:
    case USER_STATUS.PAID_FULL:
      if (!user.rules_video_watched_at) return showRulesVideo(ctx);
      return routeToPreparation(ctx, user);

    case USER_STATUS.RULES_WATCHED:
    case USER_STATUS.PREPARATION_STARTED:
      return routeToPreparation(ctx, user);

    // ghost-статус (не выставляется в production) — myAccess как безопасный fallback
    case USER_STATUS.PROTOCOL_ACTIVE:
      return showMyAccess(ctx, user);

    // Процедура начата, но прервана → предложить начать заново
    case USER_STATUS.PROCEDURE_IN_PROGRESS:
    case USER_STATUS.PROCEDURE_INTERRUPTED:
      return showProcedureInterrupted(ctx);

    // Ожидается следующая процедура → Мой доступ с рекомендованной процедурой (раздел 9.2)
    case USER_STATUS.WAITING_NEXT_PROCEDURE:
      return showMyAccess(ctx, user);

    // Последняя процедура завершена → Мой доступ с баннером (раздел 4)
    case USER_STATUS.PROCEDURE_COMPLETED:
      return showMyAccess(ctx, user);

    // Ожидается follow-up → Мой доступ с информационным блоком (раздел 12.1)
    case USER_STATUS.FOLLOWUP_PENDING:
      return showMyAccess(ctx, user);

    // Протокол приостановлен → Мой доступ с блоком паузы (раздел 4)
    case USER_STATUS.PROTOCOL_PAUSED:
      return showMyAccess(ctx, user);

    // Пользователь не курит / протокол завершён → экран результата (раздел 12.3)
    case USER_STATUS.NOT_SMOKING:
    case USER_STATUS.PROTOCOL_COMPLETED:
      return showNotSmokingResult(ctx);

    // Пользователь остановил протокол самостоятельно
    case USER_STATUS.STOPPED_BY_USER:
      return ctx.reply('[Заглушка] Протокол остановлен пользователем');

    // Защитная ветка: неизвестный статус
    default:
      return ctx.reply('[Заглушка] Неизвестный статус — обратитесь в поддержку');
  }
}

module.exports = { route };
