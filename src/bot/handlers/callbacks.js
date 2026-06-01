const { Markup } = require('telegraf');
const config = require('../../config');
const { showWelcome } = require('../screens/welcome');
const { showIntroVideo, showIntroVideoWatch } = require('../screens/introVideo');
const { showReviews } = require('../screens/reviews');
const {
  showDiagQ_adult,
  showDiagQ_duration,
  showDiagQ_attempts,
  showDiagQ_maxtime,
  showDiagQ_awareness,
  showDiagQ_motivation,
  showDiagQ_decision,
} = require('../screens/diagnostic');
const { showNotAdult } = require('../screens/notAdult');
const { showNotReady } = require('../screens/notReady');
const { saveDraftAnswer, getDraftAnswer, getAllDraftAnswers, createDiagnosticRecord } = require('../../db/diagnostics');
const { saveConsent, hasConsentForVersion } = require('../../db/consents');
const { showLowReadiness } = require('../screens/lowReadiness');
const { showNotSure } = require('../screens/notSure');
const { showNotMyDecision } = require('../screens/notMyDecision');
const { showConsent } = require('../screens/consent');
const { showDiagConsent, startDiagnosticFlow, DIAG_CONSENT_VERSION } = require('../screens/diagConsent');
const { showTariff } = require('../screens/tariff');
const { showPaymentStub } = require('../screens/paymentStub');
const { showPaymentSuccess } = require('../screens/paymentSuccess');
const { showWhatAwaits } = require('../screens/whatAwaits');
const { showPaymentError } = require('../screens/paymentError');
const { getUserByTelegramId, updateUserStatus, updateUserAfterPayment, setActiveUnfinishedProcedure, setPaused, setRulesVideoWatched, setLastBotMessageId } = require('../../db/users');
const { processTestPayment } = require('../../db/payments');
const { showMyAccess } = require('../screens/myAccess');
const { showMainMenu } = require('../screens/mainMenu');
const { getAccessRights, getProtocolProgress, incrementUsedMain, incrementUsedAlpha, upsertProtocolProgress, getNextProcedureType } = require('../../db/access');
const { showPreparation, showAlphaUnavailable, showHelperText } = require('../screens/preparation');
const { showRulesVideo, showRulesVideoWatch } = require('../screens/rulesVideo');
const { showPlayerWarning } = require('../screens/playerWarning');
const { showProcedureInterrupted } = require('../screens/procedureInterrupted');
const { showProcedureLaunch } = require('../screens/procedureLaunch');
const { getProcedureByType, getProcedureById, createSession, getSessionById, completeSession, interruptSession, getStartedSessionForUser } = require('../../db/sessions');
const { showPostProcedure } = require('../screens/postProcedure');
const { showPostQ1, showPostQ2, showPostQ3, showPostQ4, showPostQ5, showPostQ6, showPostQComplete } = require('../screens/postQ');
const { showSessionPaused } = require('../screens/sessionPaused');
const { showNotSmokingResult } = require('../screens/notSmokingResult');
const { showSupportRequest } = require('../screens/supportRequest');
const { upsertPostProcedureAnswer, getPostProcedureAnswers } = require('../../db/postProcedureAnswers');
const { createReminder, getReminderById, setReminderUserResponse } = require('../../db/reminders');
const { createNextDayFollowup, getNextDayFollowupById, saveNextDayFollowupAnswer, markNextDayFollowupCompleted } = require('../../db/nextDayFollowups');
const { createSevenDayFollowup, getSevenDayFollowupById, saveSevenDayFollowupAnswer, markSevenDayFollowupCompleted } = require('../../db/sevenDayFollowups');
const { createSupportRequest } = require('../../db/supportRequests');
const { showNdfQ2, showNdfQ3, showNdfQ4, showNdfQ5, showNdfQ6 } = require('../screens/nextDayFollowupQ');
const { showSdfQ2, showSdfQ3, showSdfQ4 } = require('../screens/sevenDayFollowupQ');
const { showSdfSuccess, showSdfNeedsWork } = require('../screens/sevenDayFollowupResult');
const { showLeaveReview, showLeaveReviewStub, showReviewTextPrompt } = require('../screens/leaveReview');
const { showCycleDone } = require('../screens/cycleDone');
const { createUserReview } = require('../../db/userReviews');

const awaitingSupportText = new Map();
const awaitingReviewText = new Map();

module.exports = (bot) => {

  // ─── Welcome ────────────────────────────────────────────────────────────────

  // welcome:intro_video — раздел 5.2
  bot.action('welcome:intro_video', async (ctx) => {
    await ctx.answerCbQuery();
    await showIntroVideo(ctx);
  });

  // welcome:reviews — раздел 5.3
  bot.action('welcome:reviews', async (ctx) => {
    await ctx.answerCbQuery();
    try { await ctx.deleteMessage(); } catch {}
    await showReviews(ctx);
  });

  // welcome:diagnostic — раздел 5.4
  bot.action('welcome:diagnostic', async (ctx) => {
    await ctx.answerCbQuery();
    await startDiagnosticFlow(ctx);
  });

  // welcome:show — возврат к Welcome (Назад из первого вопроса диагностики)
  bot.action('welcome:show', async (ctx) => {
    await ctx.answerCbQuery();
    await showWelcome(ctx);
  });

  // ─── Объясняющий ролик (5.2) ─────────────────────────────────────────────

  bot.action('intro_video:watch', async (ctx) => {
    await ctx.answerCbQuery();
    await showIntroVideoWatch(ctx);
  });

  bot.action('intro_video:reviews', async (ctx) => {
    await ctx.answerCbQuery();
    try { await ctx.deleteMessage(); } catch {}
    await showReviews(ctx);
  });

  bot.action('intro_video:back', async (ctx) => {
    await ctx.answerCbQuery();
    try { await ctx.deleteMessage(); } catch {}
    await showWelcome(ctx);
  });

  bot.action('intro_video:diagnostic', async (ctx) => {
    await ctx.answerCbQuery();
    try {
      await ctx.deleteMessage();
    } catch {
      // видео уже удалено или недоступно
    }
    await startDiagnosticFlow(ctx);
  });

  // ─── Отзывы до диагностики (5.3) ────────────────────────────────────────

  bot.action('reviews:diagnostic', async (ctx) => {
    await ctx.answerCbQuery();
    try { await ctx.deleteMessage(); } catch {}
    await startDiagnosticFlow(ctx);
  });

  bot.action('reviews:back', async (ctx) => {
    await ctx.answerCbQuery();
    try { await ctx.deleteMessage(); } catch {}
    await showWelcome(ctx);
  });

  bot.action(/^reviews:show:/, async (ctx) => {
    await ctx.answerCbQuery();
    const index = parseInt(ctx.callbackQuery.data.replace('reviews:show:', ''), 10);
    await showReviews(ctx, isNaN(index) ? 0 : index);
  });

  // ─── Диагностика: навигация Назад ───────────────────────────────────────

  bot.action(/^diag:nav_/, async (ctx) => {
    await ctx.answerCbQuery();
    const target = ctx.callbackQuery.data.replace('diag:nav_', '');
    const screens = {
      adult:   showDiagConsent,
      dur:     showDiagQ_duration,
      att:     showDiagQ_attempts,
      maxtime: showDiagQ_maxtime,
      aware:   showDiagQ_awareness,
      motiv:   showDiagQ_motivation,
    };
    const fn = screens[target];
    if (fn) await fn(ctx);
  });

  // ─── Диагностика Экран 0: Фильтр 18+ ────────────────────────────────────

  bot.action('diag:adult_yes', async (ctx) => {
    await ctx.answerCbQuery();
    await showDiagQ_duration(ctx);
  });

  bot.action('diag:adult_no', async (ctx) => {
    await ctx.answerCbQuery();
    await showNotAdult(ctx);
  });

  // ─── Диагностическое согласие 18+ ───────────────────────────────────────

  bot.action('diag_consent:accept', async (ctx) => {
    await ctx.answerCbQuery();
    const telegramId = ctx.from.id;
    const user = await getUserByTelegramId(telegramId).catch(() => null);
    if (user?.id) {
      await saveConsent(user.id, telegramId, DIAG_CONSENT_VERSION, 'diagnostic_consent').catch(e =>
        console.error('[diag_consent] saveConsent:', e.message)
      );
    }
    await showDiagQ_duration(ctx);
  });

  bot.action('diag_consent:under18', async (ctx) => {
    await ctx.answerCbQuery();
    await showNotAdult(ctx);
  });

  // ─── Диагностика Экран 1: Стаж ───────────────────────────────────────────

  bot.action(/^diag:dur_/, async (ctx) => {
    await ctx.answerCbQuery();
    const value = ctx.callbackQuery.data.replace('diag:dur_', '');
    saveDraftAnswer(ctx.from.id, 'smoking_duration', value).catch(e =>
      console.error('[diag] save duration:', e.message)
    );
    await showDiagQ_attempts(ctx);
  });

  // ─── Диагностика Экран 2: Попытки бросить ────────────────────────────────

  bot.action(/^diag:att_/, async (ctx) => {
    await ctx.answerCbQuery();
    const value = ctx.callbackQuery.data.replace('diag:att_', '');
    saveDraftAnswer(ctx.from.id, 'quit_attempts', value).catch(e =>
      console.error('[diag] save attempts:', e.message)
    );
    await showDiagQ_maxtime(ctx);
  });

  // ─── Диагностика Экран 3: Макс. срок без никотина ────────────────────────

  bot.action(/^diag:max_/, async (ctx) => {
    await ctx.answerCbQuery();
    const value = ctx.callbackQuery.data.replace('diag:max_', '');
    saveDraftAnswer(ctx.from.id, 'max_quit_duration', value).catch(e =>
      console.error('[diag] save maxtime:', e.message)
    );
    await showDiagQ_awareness(ctx);
  });

  // ─── Диагностика Экран 4: Осознание проблемы ─────────────────────────────

  bot.action(/^diag:aware_/, async (ctx) => {
    await ctx.answerCbQuery();
    const value = ctx.callbackQuery.data.replace('diag:aware_', '');
    saveDraftAnswer(ctx.from.id, 'nicotine_awareness', value).catch(e =>
      console.error('[diag] save awareness:', e.message)
    );
    await showDiagQ_motivation(ctx);
  });

  // ─── Диагностика Экран 5: Мотивация 1–10 ────────────────────────────────

  bot.action(/^diag:motiv_/, async (ctx) => {
    await ctx.answerCbQuery();
    const value = ctx.callbackQuery.data.replace('diag:motiv_', '');
    saveDraftAnswer(ctx.from.id, 'motivation_level', value).catch(e =>
      console.error('[diag] save motivation:', e.message)
    );
    const level = parseInt(value, 10);
    if (level >= 1 && level <= 3) {
      return showNotReady(ctx);
    }
    await showDiagQ_decision(ctx);
  });

  // ─── Диагностика Экран 6: Финальное решение ──────────────────────────────

  bot.action(/^diag:decision_/, async (ctx) => {
    await ctx.answerCbQuery();
    const value = ctx.callbackQuery.data.replace('diag:decision_', '');

    // await здесь: читаем answers_json сразу после сохранения последнего ответа
    await saveDraftAnswer(ctx.from.id, 'motivation_source', value).catch(e =>
      console.error('[diag] save decision:', e.message)
    );

    if (value === 'not_sure') {
      updateUserStatus(ctx.from.id, 'not_sure_clarification').catch(e =>
        console.error('[diag] updateStatus not_sure:', e.message)
      );
      return showNotSure(ctx);
    }

    // value === 'no' или 'yes': финальное решение — сохраняем запись в diagnostics
    const user = await getUserByTelegramId(ctx.from.id).catch(() => null);
    const answers = await getAllDraftAnswers(ctx.from.id);
    if (user?.id && answers) {
      createDiagnosticRecord(user.id, ctx.from.first_name, answers).catch(e =>
        console.error('[diag] createDiagnosticRecord:', e.message)
      );
    }

    if (value === 'no') {
      return showNotMyDecision(ctx);
    }

    // value === 'yes': мотивация 1–3 уже заблокирована на экране мотивации
    updateUserStatus(ctx.from.id, 'diagnostic_completed').catch(e =>
      console.error('[diag] updateStatus diagnostic_completed:', e.message)
    );
    return showConsent(ctx, 'decision');
  });

  // ─── Низкая готовность (5.6) ─────────────────────────────────────────────

  bot.action('low_readiness:continue', async (ctx) => {
    await ctx.answerCbQuery();
    await showConsent(ctx, 'low_readiness');
  });

  bot.action('low_readiness:reviews', async (ctx) => {
    await ctx.answerCbQuery();
    try { await ctx.deleteMessage(); } catch {}
    await showReviews(ctx);
  });

  bot.action('low_readiness:later', async (ctx) => {
    await ctx.answerCbQuery();
    updateUserStatus(ctx.from.id, 'protocol_paused').catch(e =>
      console.error('[low_readiness] updateStatus:', e.message)
    );
    await ctx.editMessageText('Хорошо. Нажмите /start, когда будете готовы.').catch(() =>
      ctx.reply('Хорошо. Нажмите /start, когда будете готовы.')
    );
  });

  // ─── Уточняющий экран «Пока не уверен(а)» (5.7) ─────────────────────────

  bot.action('not_sure:continue', async (ctx) => {
    await ctx.answerCbQuery();
    await showConsent(ctx, 'not_sure');
  });

  bot.action('not_sure:reviews', async (ctx) => {
    await ctx.answerCbQuery();
    try { await ctx.deleteMessage(); } catch {}
    await showReviews(ctx);
  });

  bot.action('not_sure:later', async (ctx) => {
    await ctx.answerCbQuery();
    updateUserStatus(ctx.from.id, 'protocol_paused').catch(e =>
      console.error('[not_sure] updateStatus:', e.message)
    );
    await ctx.editMessageText('Хорошо. Нажмите /start, когда будете готовы.').catch(() =>
      ctx.reply('Хорошо. Нажмите /start, когда будете готовы.')
    );
  });

  // ─── Пользовательское согласие (5.8) ────────────────────────────────────

  bot.action('consent:accept', async (ctx) => {
    await ctx.answerCbQuery();
    const telegramId = ctx.from.id;

    const user = await getUserByTelegramId(telegramId).catch(() => null);

    if (user?.id) {
      try {
        await saveConsent(user.id, telegramId, 'quit_protocol_v1', 'telegram_bot');
      } catch (e) {
        console.error('[consent] saveConsent failed:', e.message);
        return ctx.reply('Не удалось сохранить согласие. Попробуйте ещё раз.');
      }
    }

    await updateUserStatus(telegramId, 'consent_accepted').catch(e =>
      console.error('[consent] updateStatus consent_accepted:', e.message)
    );

    // Если у пользователя уже есть активный подарочный доступ — не показывать тариф
    try {
      if (user?.id) {
        const ar = await getAccessRights(user.id);
        if (ar?.access_status === 'active') {
          const newStatus = user.access_type === 'full_access' ? 'paid_full' : 'paid_single';
          await updateUserStatus(telegramId, newStatus).catch(e =>
            console.error('[consent] updateStatus gift finalize:', e.message)
          );
          const updatedUser = await getUserByTelegramId(telegramId);
          return showMyAccess(ctx, updatedUser);
        }
      }
    } catch (e) {
      console.error('[consent] gift access check:', e.message);
    }

    await showTariff(ctx);
  });

  bot.action('consent:back_decision', async (ctx) => {
    await ctx.answerCbQuery();
    await showDiagQ_decision(ctx);
  });

  bot.action('consent:back_low_readiness', async (ctx) => {
    await ctx.answerCbQuery();
    await showLowReadiness(ctx, { markFlag: false });
  });

  bot.action('consent:back_not_sure', async (ctx) => {
    await ctx.answerCbQuery();
    await showNotSure(ctx);
  });

  // ─── Выбор тарифа (6.1) ─────────────────────────────────────────────────────

  bot.action('tariff:single', async (ctx) => {
    await ctx.answerCbQuery();
    await showPaymentStub(ctx, 'single');
  });

  bot.action('tariff:full', async (ctx) => {
    await ctx.answerCbQuery();
    await showPaymentStub(ctx, 'full');
  });

  bot.action('tariff:single_next', async (ctx) => {
    await ctx.answerCbQuery();
    await showPaymentStub(ctx, 'single_next');
  });

  bot.action('tariff:upgrade', async (ctx) => {
    await ctx.answerCbQuery();
    await showPaymentStub(ctx, 'upgrade');
  });

  // ─── Оплата-заглушка (6.3) ──────────────────────────────────────────────────

  bot.action(/^payment:test_/, async (ctx) => {
    await ctx.answerCbQuery();
    const variant = ctx.callbackQuery.data.replace('payment:test_', '');
    try {
      await processTestPayment(ctx.from.id, variant);
      await updateUserAfterPayment(ctx.from.id, variant);
      await showWhatAwaits(ctx);
    } catch (err) {
      console.error(`[payment:test_${variant}]`, err.message);
      await showPaymentError(ctx, variant);
    }
  });

  bot.action('what_awaits:continue', async (ctx) => {
    await ctx.answerCbQuery();
    await showRulesVideo(ctx);
  });

  bot.action('payment:back_new', async (ctx) => {
    await ctx.answerCbQuery();
    await showTariff(ctx);
  });

  bot.action('payment:back_upgrade', async (ctx) => {
    await ctx.answerCbQuery();
    await showTariff(ctx, { access_type: 'single_procedure' });
  });

  // ─── Успешная оплата (6.4) ──────────────────────────────────────────────────

  bot.action('payment_success:rules', async (ctx) => {
    await ctx.answerCbQuery();
    await showRulesVideo(ctx);
  });

  // ─── Мой доступ (раздел 10.1) ───────────────────────────────────────────────

  bot.action('my_access:show', async (ctx) => {
    await ctx.answerCbQuery();
    const user = await getUserByTelegramId(ctx.from.id).catch(() => null);
    await showMyAccess(ctx, user);
  });

  bot.action('my_access:continue_protocol', async (ctx) => {
    await ctx.answerCbQuery();
    const user = await getUserByTelegramId(ctx.from.id).catch(() => null);
    if (!user?.id) return showMyAccess(ctx, user);

    if (user.has_active_unfinished_procedure) {
      return showProcedureInterrupted(ctx);
    }

    if (user.user_status === 'not_smoking') {
      return showNotSmokingResult(ctx);
    }

    const [ar, progress] = await Promise.all([
      getAccessRights(user.id),
      getProtocolProgress(user.id),
    ]);

    if (!ar) return showMyAccess(ctx, user);

    if (!user.rules_video_watched_at) {
      return showRulesVideo(ctx);
    }

    const step = progress?.current_step_number ?? 0;
    const nextType = getNextProcedureType(step);
    const isFirstProcedure = step === 0;

    if (user.access_type === 'full_access') {
      return showPreparation(ctx, { isFirstProcedure, procedureType: nextType });
    }

    if (ar.paid_main_procedures_count > ar.used_main_procedures_count) {
      return showPreparation(ctx, { isFirstProcedure, procedureType: nextType });
    }

    return showTariff(ctx, user);
  });

  bot.action('my_access:alpha', async (ctx) => {
    await ctx.answerCbQuery();
    const user = await getUserByTelegramId(ctx.from.id).catch(() => null);
    if (!user?.id) return showMyAccess(ctx, user);

    const ar = await getAccessRights(user.id);
    if (!ar) return showMyAccess(ctx, user);

    const alphaAvailable =
      user.access_type === 'full_access' ||
      (ar.available_alpha_sessions_count !== null &&
        ar.available_alpha_sessions_count > ar.used_alpha_sessions_count);

    if (!alphaAvailable) return showAlphaUnavailable(ctx);
    return showPreparation(ctx, { isFirstProcedure: false, procedureType: 'alpha' });
  });

  bot.action('my_access:support', async (ctx) => {
    await ctx.answerCbQuery();
    awaitingSupportText.set(ctx.from.id, null);
    await showSupportRequest(ctx);
  });

  bot.action('support:cancel', async (ctx) => {
    await ctx.answerCbQuery();
    awaitingSupportText.delete(ctx.from.id);
    const user = await getUserByTelegramId(ctx.from.id).catch(() => null);
    await showMyAccess(ctx, user);
  });

  bot.action('my_access:pay_next', async (ctx) => {
    await ctx.answerCbQuery();
    await showPaymentStub(ctx, 'single_next');
  });

  bot.action('my_access:upgrade', async (ctx) => {
    await ctx.answerCbQuery();
    await showPaymentStub(ctx, 'upgrade');
  });

  bot.action('my_access:menu', async (ctx) => {
    await ctx.answerCbQuery();
    await showMainMenu(ctx);
  });

  bot.action('my_access:to_welcome', async (ctx) => {
    await ctx.answerCbQuery();
    await showWelcome(ctx);
  });

  bot.action('not_my_decision:to_welcome', async (ctx) => {
    await ctx.answerCbQuery();
    await showWelcome(ctx);
  });

  // ─── Подготовка к процедуре (раздел 7.2 / 7.3 / 7.4) ───────────────────────

  bot.action(/^preparation:ready:/, async (ctx) => {
    await ctx.answerCbQuery();
    const procedureType = ctx.callbackQuery.data.replace('preparation:ready:', '');
    await showPlayerWarning(ctx, { procedureType });
  });

  bot.action(/^preparation:need_first:/, async (ctx) => {
    await ctx.answerCbQuery();
    const procedureType = ctx.callbackQuery.data.replace('preparation:need_first:', '');
    await showHelperText(ctx, { procedureType, isFirstProcedure: true });
  });

  bot.action(/^preparation:need_next:/, async (ctx) => {
    await ctx.answerCbQuery();
    const procedureType = ctx.callbackQuery.data.replace('preparation:need_next:', '');
    await showHelperText(ctx, { procedureType, isFirstProcedure: false });
  });

  bot.action('preparation:back', async (ctx) => {
    await ctx.answerCbQuery();
    const user = await getUserByTelegramId(ctx.from.id).catch(() => null);
    await showMyAccess(ctx, user);
  });

  // ─── Ролик с правилами (раздел 7.1) ─────────────────────────────────────────

  bot.action('rules_video:watch', async (ctx) => {
    await ctx.answerCbQuery();
    const msg = await showRulesVideoWatch(ctx);
    if (msg?.message_id) {
      await Promise.all([
        setRulesVideoWatched(ctx.from.id).catch(() => {}),
        updateUserStatus(ctx.from.id, 'rules_watched').catch(() => {}),
        setLastBotMessageId(ctx.from.id, msg.message_id).catch(() => {}),
      ]);
    }
  });

  bot.action('rules_video:to_preparation', async (ctx) => {
    await ctx.answerCbQuery();
    try { await ctx.deleteMessage(); } catch {}
    const user = await getUserByTelegramId(ctx.from.id).catch(() => null);
    if (!user?.id) return showMyAccess(ctx, user);

    const [ar, progress] = await Promise.all([
      getAccessRights(user.id),
      getProtocolProgress(user.id),
    ]);

    if (!ar) return showMyAccess(ctx, user);

    const step = progress?.current_step_number ?? 0;
    const nextType = getNextProcedureType(step);
    const isFirstProcedure = step === 0;

    if (user.access_type === 'full_access') {
      return showPreparation(ctx, { isFirstProcedure, procedureType: nextType });
    }

    if (ar.paid_main_procedures_count > ar.used_main_procedures_count) {
      return showPreparation(ctx, { isFirstProcedure, procedureType: nextType });
    }

    return showTariff(ctx, user);
  });

  bot.action('rules_video:to_access', async (ctx) => {
    await ctx.answerCbQuery();
    try { await ctx.deleteMessage(); } catch {}
    const user = await getUserByTelegramId(ctx.from.id).catch(() => null);
    await showMyAccess(ctx, user);
  });

  bot.action('rules_video:back', async (ctx) => {
    await ctx.answerCbQuery();
    try { await ctx.deleteMessage(); } catch {}
    const user = await getUserByTelegramId(ctx.from.id).catch(() => null);
    await showMyAccess(ctx, user);
  });

  // ─── Экран предупреждения перед запуском (раздел 8.2) ────────────────────────

  bot.action(/^player_warning:start:/, async (ctx) => {
    await ctx.answerCbQuery();
    const procedureType = ctx.callbackQuery.data.replace('player_warning:start:', '');

    const user = await getUserByTelegramId(ctx.from.id).catch(() => null);
    if (!user?.id) return showMyAccess(ctx, user);

    if (user.has_active_unfinished_procedure) {
      await ctx.editMessageText(
        'Процедура уже активна. Проверьте статус в «Мой доступ».'
      ).catch(() => ctx.reply('Процедура уже активна. Проверьте статус в «Мой доступ».'));
      return;
    }

    const ar = await getAccessRights(user.id);
    if (!ar) return showMyAccess(ctx, user);

    const isMain = procedureType !== 'alpha';
    if (isMain) {
      const hasAccess =
        user.access_type === 'full_access' ||
        ar.paid_main_procedures_count > ar.used_main_procedures_count;
      if (!hasAccess) return showMyAccess(ctx, user);
    } else {
      const alphaAvailable =
        user.access_type === 'full_access' ||
        (ar.available_alpha_sessions_count !== null &&
          ar.available_alpha_sessions_count > ar.used_alpha_sessions_count);
      if (!alphaAvailable) return showAlphaUnavailable(ctx);
    }

    const procedure = await getProcedureByType(procedureType);
    if (!procedure) {
      await ctx.editMessageText(
        'Не удалось подготовить процедуру. Попробуйте позже или обратитесь в поддержку.'
      ).catch(() =>
        ctx.reply('Не удалось подготовить процедуру. Попробуйте позже или обратитесь в поддержку.')
      );
      return;
    }

    const progress = await getProtocolProgress(user.id);
    const procedureNumber = progress?.current_step_number ?? 0;

    const session = await createSession(user.id, procedure.id, procedureNumber);
    if (!session) {
      await ctx.editMessageText(
        'Не удалось создать сессию процедуры. Попробуйте позже или обратитесь в поддержку.'
      ).catch(() =>
        ctx.reply('Не удалось создать сессию процедуры. Попробуйте позже или обратитесь в поддержку.')
      );
      return;
    }

    await setActiveUnfinishedProcedure(user.id, true);
    await updateUserStatus(ctx.from.id, 'procedure_in_progress');
    await showProcedureLaunch(ctx, { procedureType, sessionId: session.id });
  });

  bot.action(/^player_warning:back:/, async (ctx) => {
    await ctx.answerCbQuery();
    const procedureType = ctx.callbackQuery.data.replace('player_warning:back:', '');
    const user = await getUserByTelegramId(ctx.from.id).catch(() => null);
    const progress = user?.id ? await getProtocolProgress(user.id) : null;
    const isFirstProcedure = !progress || progress.current_step_number === 0;
    await showPreparation(ctx, { isFirstProcedure, procedureType });
  });

  // ─── Заглушка плеера (тест-режим) ───────────────────────────────────────────

  bot.action(/^player_stub:completed:/, async (ctx) => {
    await ctx.answerCbQuery();
    const sessionId = parseInt(ctx.callbackQuery.data.replace('player_stub:completed:', ''), 10);

    const user = await getUserByTelegramId(ctx.from.id).catch(() => null);
    if (!user?.id) return showMyAccess(ctx, user);

    const session = await getSessionById(sessionId);
    if (!session || session.user_id !== user.id) return showMyAccess(ctx, user);

    if (session.session_status !== 'started') {
      await showPostProcedure(ctx, { sessionId });
      return;
    }

    const procedure = await getProcedureById(session.procedure_id);
    if (!procedure) {
      const errorKeyboard = Markup.inlineKeyboard([
        [Markup.button.callback('Мой доступ', 'my_access:show')],
        [Markup.button.callback('Поддержка', 'my_access:support')],
      ]);
      await ctx.editMessageText(
        'Не удалось определить процедуру. Доступ не был списан. Попробуйте позже или обратитесь в поддержку.',
        errorKeyboard
      ).catch(() =>
        ctx.reply(
          'Не удалось определить процедуру. Доступ не был списан. Попробуйте позже или обратитесь в поддержку.',
          errorKeyboard
        )
      );
      return;
    }

    const procedureType = procedure.procedure_type;

    await completeSession(sessionId);

    if (procedureType === 'alpha') {
      await incrementUsedAlpha(user.id);
    } else {
      await incrementUsedMain(user.id);
      const progress = await getProtocolProgress(user.id);
      await upsertProtocolProgress(user.id, procedureType, progress?.current_step_number ?? 0);
    }

    await setActiveUnfinishedProcedure(user.id, false);
    await updateUserStatus(ctx.from.id, 'procedure_completed');

    await showPostProcedure(ctx, { sessionId });
  });

  bot.action(/^player_stub:interrupted:/, async (ctx) => {
    await ctx.answerCbQuery();
    const sessionId = parseInt(ctx.callbackQuery.data.replace('player_stub:interrupted:', ''), 10);

    const user = await getUserByTelegramId(ctx.from.id).catch(() => null);
    if (!user?.id) return showMyAccess(ctx, user);

    const session = await getSessionById(sessionId);
    if (!session || session.user_id !== user.id) return showMyAccess(ctx, user);

    if (session.session_status !== 'started') {
      return showProcedureInterrupted(ctx);
    }

    await interruptSession(sessionId);
    await setActiveUnfinishedProcedure(user.id, false);
    await updateUserStatus(ctx.from.id, 'procedure_interrupted');
    await showProcedureInterrupted(ctx);
  });

  bot.action('procedure_interrupted:restart', async (ctx) => {
    await ctx.answerCbQuery();
    const user = await getUserByTelegramId(ctx.from.id).catch(() => null);
    if (!user?.id) return showMyAccess(ctx, user);

    const session = await getStartedSessionForUser(user.id);
    if (session) await interruptSession(session.id);
    await setActiveUnfinishedProcedure(user.id, false);
    await updateUserStatus(ctx.from.id, 'waiting_next_procedure');

    const [ar, progress] = await Promise.all([
      getAccessRights(user.id),
      getProtocolProgress(user.id),
    ]);
    if (!ar) return showMyAccess(ctx, user);

    const step = progress?.current_step_number ?? 0;
    const procedureType = progress?.next_procedure_type ?? getNextProcedureType(step);
    const isFirstProcedure = step === 0;
    await showPreparation(ctx, { isFirstProcedure, procedureType });
  });

  bot.action('procedure_interrupted:later', async (ctx) => {
    await ctx.answerCbQuery();
    const user = await getUserByTelegramId(ctx.from.id).catch(() => null);
    if (!user?.id) return showMyAccess(ctx, user);

    const session = await getStartedSessionForUser(user.id);
    if (session) await interruptSession(session.id);
    await setActiveUnfinishedProcedure(user.id, false);
    await updateUserStatus(ctx.from.id, 'waiting_next_procedure');

    const freshUser = await getUserByTelegramId(ctx.from.id).catch(() => null);
    await showMyAccess(ctx, freshUser);
  });

  // ─── Главное меню (раздел 10.3) ─────────────────────────────────────────────

  bot.action('main_menu:my_access', async (ctx) => {
    await ctx.answerCbQuery();
    const user = await getUserByTelegramId(ctx.from.id).catch(() => null);
    await showMyAccess(ctx, user);
  });

  bot.action('main_menu:reviews', async (ctx) => {
    await ctx.answerCbQuery();
    try { await ctx.deleteMessage(); } catch {}
    await showReviews(ctx);
  });

  bot.action('main_menu:support', async (ctx) => {
    await ctx.answerCbQuery();
    awaitingSupportText.set(ctx.from.id, null);
    await showSupportRequest(ctx);
  });

  bot.action('main_menu:about', async (ctx) => {
    await ctx.answerCbQuery();
    await showIntroVideo(ctx);
  });

  // ─── После процедуры: экран и вопросы Q1–Q6 (раздел 11) ─────────────────────

  bot.action(/^postProcedure:next:/, async (ctx) => {
    await ctx.answerCbQuery();
    const sessionId = parseInt(ctx.callbackQuery.data.replace('postProcedure:next:', ''), 10);
    await showPostQ1(ctx, sessionId);
  });

  bot.action(/^post_q:1:/, async (ctx) => {
    await ctx.answerCbQuery();
    const parts = ctx.callbackQuery.data.split(':');
    const value = parts[2];
    const sessionId = parseInt(parts[3], 10);
    const user = await getUserByTelegramId(ctx.from.id).catch(() => null);
    if (!user?.id) return showMyAccess(ctx, user);
    await upsertPostProcedureAnswer(user.id, sessionId, 'q1', value);
    await showPostQ2(ctx, sessionId);
  });

  bot.action(/^post_q:2:/, async (ctx) => {
    await ctx.answerCbQuery();
    const parts = ctx.callbackQuery.data.split(':');
    const value = parts[2];
    const sessionId = parseInt(parts[3], 10);
    const user = await getUserByTelegramId(ctx.from.id).catch(() => null);
    if (!user?.id) return showMyAccess(ctx, user);
    await upsertPostProcedureAnswer(user.id, sessionId, 'q2', value);
    await showPostQ3(ctx, sessionId);
  });

  bot.action(/^post_q:3:/, async (ctx) => {
    await ctx.answerCbQuery();
    const parts = ctx.callbackQuery.data.split(':');
    const value = parts[2];
    const sessionId = parseInt(parts[3], 10);
    const user = await getUserByTelegramId(ctx.from.id).catch(() => null);
    if (!user?.id) return showMyAccess(ctx, user);
    await upsertPostProcedureAnswer(user.id, sessionId, 'q3', value);
    await showPostQ4(ctx, sessionId);
  });

  bot.action(/^post_q:4:/, async (ctx) => {
    await ctx.answerCbQuery();
    const parts = ctx.callbackQuery.data.split(':');
    const value = parts[2];
    const sessionId = parseInt(parts[3], 10);
    const user = await getUserByTelegramId(ctx.from.id).catch(() => null);
    if (!user?.id) return showMyAccess(ctx, user);
    await upsertPostProcedureAnswer(user.id, sessionId, 'q4', value);
    await showPostQ5(ctx, sessionId);
  });

  bot.action(/^post_q:5:/, async (ctx) => {
    await ctx.answerCbQuery();
    const parts = ctx.callbackQuery.data.split(':');
    const value = parts[2];
    const sessionId = parseInt(parts[3], 10);
    const user = await getUserByTelegramId(ctx.from.id).catch(() => null);
    if (!user?.id) return showMyAccess(ctx, user);
    await upsertPostProcedureAnswer(user.id, sessionId, 'q5', value);
    await showPostQ6(ctx, sessionId);
  });

  bot.action(/^post_q:6:/, async (ctx) => {
    await ctx.answerCbQuery();
    const parts = ctx.callbackQuery.data.split(':');
    const value = parts[2];
    const sessionId = parseInt(parts[3], 10);
    const user = await getUserByTelegramId(ctx.from.id).catch(() => null);
    if (!user?.id) return showMyAccess(ctx, user);
    await upsertPostProcedureAnswer(user.id, sessionId, 'q6', value);
    await showPostQComplete(ctx, sessionId);
  });

  bot.action(/^post_q:continue:/, async (ctx) => {
    await ctx.answerCbQuery();
    const parts = ctx.callbackQuery.data.split(':');
    const sessionId = parseInt(parts[2], 10);

    const user = await getUserByTelegramId(ctx.from.id).catch(() => null);
    if (!user?.id) return showMyAccess(ctx, user);

    const answers = await getPostProcedureAnswers(user.id, sessionId);
    const requiredKeys = ['q1', 'q2', 'q3', 'q4', 'q5', 'q6'];
    const missingKey = requiredKeys.find(k => !answers[k]);
    if (missingKey) {
      const qNum = parseInt(missingKey.replace('q', ''), 10);
      const showFns = [null, showPostQ1, showPostQ2, showPostQ3, showPostQ4, showPostQ5, showPostQ6];
      return showFns[qNum](ctx, sessionId);
    }

    const { q2, q5, q6 } = answers;

    if (q5 === 'yes_continue') {
      await updateUserStatus(ctx.from.id, 'waiting_next_procedure');

      const [ar, progress, session] = await Promise.all([
        getAccessRights(user.id),
        getProtocolProgress(user.id),
        getSessionById(sessionId),
      ]);

      if (session) {
        const procedure = await getProcedureById(session.procedure_id);
        if (procedure && procedure.procedure_type !== 'alpha') {
          const nextType = getNextProcedureType(progress?.current_step_number ?? 0);
          const nextProcedure = await getProcedureByType(nextType);
          if (nextProcedure) await createReminder(user.id, nextProcedure.id, sessionId);
        }
      }

      if (q2 === 'strong' && ar) {
        const alphaAvailable =
          user.access_type === 'full_access' ||
          (ar.available_alpha_sessions_count !== null &&
            ar.available_alpha_sessions_count > ar.used_alpha_sessions_count);
        if (alphaAvailable) {
          const freshUser = await getUserByTelegramId(ctx.from.id).catch(() => null);
          return showMyAccess(ctx, freshUser || user);
        }
      }

      if (!ar) return showMyAccess(ctx, user);
      const step = progress?.current_step_number ?? 0;
      const nextProcedureType = getNextProcedureType(step);
      if (user.access_type === 'full_access') {
        return showPreparation(ctx, { isFirstProcedure: false, procedureType: nextProcedureType });
      }
      if (ar.paid_main_procedures_count > ar.used_main_procedures_count) {
        return showPreparation(ctx, { isFirstProcedure: false, procedureType: nextProcedureType });
      }
      return showTariff(ctx, user);
    }

    if (q5 === 'not_sure') {
      await createNextDayFollowup(user.id, sessionId);
      await updateUserStatus(ctx.from.id, 'followup_pending');
      if (q6 === 'want_alpha') {
        const ar = await getAccessRights(user.id);
        const alphaAvailable = ar && (
          user.access_type === 'full_access' ||
          (ar.available_alpha_sessions_count !== null &&
            ar.available_alpha_sessions_count > ar.used_alpha_sessions_count)
        );
        if (alphaAvailable) return showPreparation(ctx, { isFirstProcedure: false, procedureType: 'alpha' });
        return showMyAccess(ctx, user);
      }
      if (q6 === 'need_support') {
        awaitingSupportText.set(ctx.from.id, sessionId);
        return showSupportRequest(ctx);
      }
      return showMyAccess(ctx, user);
    }

    if (q5 === 'not_smoking') {
      await updateUserStatus(ctx.from.id, 'not_smoking');
      await createSevenDayFollowup(user.id);
      return showNotSmokingResult(ctx);
    }

    if (q5 === 'no_continue') {
      await setPaused(user.id, 'user_choice');
      return showSessionPaused(ctx);
    }

    return showMyAccess(ctx, user);
  });

  // ─── Сессия приостановлена (раздел 13.1) ────────────────────────────────────

  bot.action('session_paused:welcome', async (ctx) => {
    await ctx.answerCbQuery();
    await showWelcome(ctx);
  });

  bot.action('session_paused:rediag', async (ctx) => {
    await ctx.answerCbQuery();
    await updateUserStatus(ctx.from.id, 'diagnostic_started');
    await startDiagnosticFlow(ctx);
  });

  // ─── Экран результата «Я уже не курю» (раздел 13.2) ─────────────────────────

  bot.action('not_smoking_result:alpha', async (ctx) => {
    await ctx.answerCbQuery();
    const user = await getUserByTelegramId(ctx.from.id).catch(() => null);
    if (!user?.id) return showMyAccess(ctx, user);
    const ar = await getAccessRights(user.id);
    if (!ar) return showMyAccess(ctx, user);
    const alphaAvailable =
      user.access_type === 'full_access' ||
      (ar.available_alpha_sessions_count !== null &&
        ar.available_alpha_sessions_count > ar.used_alpha_sessions_count);
    if (!alphaAvailable) return showAlphaUnavailable(ctx);
    return showPreparation(ctx, { isFirstProcedure: false, procedureType: 'alpha' });
  });

  bot.action('not_smoking_result:review', async (ctx) => {
    await ctx.answerCbQuery();
    await showLeaveReview(ctx);
  });

  bot.action('not_smoking_result:menu', async (ctx) => {
    await ctx.answerCbQuery();
    await showMainMenu(ctx);
  });

  // ─── Напоминания о следующей процедуре (раздел 12.2) ────────────────────────

  bot.action(/^reminder:continue:/, async (ctx) => {
    await ctx.answerCbQuery();
    const reminderId = parseInt(ctx.callbackQuery.data.split(':')[2], 10);
    const user = await getUserByTelegramId(ctx.from.id).catch(() => null);
    if (!user?.id) return showMyAccess(ctx, user);

    const reminder = await getReminderById(reminderId);
    if (!reminder || reminder.user_id !== user.id) return showMyAccess(ctx, user);

    await setReminderUserResponse(reminderId, 'continue_procedure');

    const [ar, progress] = await Promise.all([
      getAccessRights(user.id),
      getProtocolProgress(user.id),
    ]);
    if (!ar) return showTariff(ctx, user);

    const procedure = reminder.procedure_id ? await getProcedureById(reminder.procedure_id) : null;
    const procedureType = procedure?.procedure_type ?? getNextProcedureType(progress?.current_step_number ?? 0);

    const hasAccess =
      user.access_type === 'full_access' ||
      ar.paid_main_procedures_count > ar.used_main_procedures_count;

    if (!hasAccess) return showTariff(ctx, user);
    return showPreparation(ctx, { isFirstProcedure: false, procedureType });
  });

  bot.action(/^reminder:not_smoking:/, async (ctx) => {
    await ctx.answerCbQuery();
    const reminderId = parseInt(ctx.callbackQuery.data.split(':')[2], 10);
    const user = await getUserByTelegramId(ctx.from.id).catch(() => null);
    if (!user?.id) return showMyAccess(ctx, user);

    const reminder = await getReminderById(reminderId);
    if (!reminder || reminder.user_id !== user.id) return showMyAccess(ctx, user);

    await setReminderUserResponse(reminderId, 'already_not_smoking');
    await updateUserStatus(ctx.from.id, 'not_smoking');
    await createSevenDayFollowup(user.id);
    return showNotSmokingResult(ctx);
  });

  bot.action(/^reminder:no_continue:/, async (ctx) => {
    await ctx.answerCbQuery();
    const reminderId = parseInt(ctx.callbackQuery.data.split(':')[2], 10);
    const user = await getUserByTelegramId(ctx.from.id).catch(() => null);
    if (!user?.id) return showMyAccess(ctx, user);

    const reminder = await getReminderById(reminderId);
    if (!reminder || reminder.user_id !== user.id) return showMyAccess(ctx, user);

    await setReminderUserResponse(reminderId, 'do_not_continue');
    await setPaused(user.id, 'reminder_no_continue');
    return showSessionPaused(ctx);
  });

  // ─── Follow-up +1 день: вопросы Q1–Q6 (раздел 12.1) ────────────────────────

  bot.action(/^ndf_q1:/, async (ctx) => {
    await ctx.answerCbQuery();
    const parts = ctx.callbackQuery.data.split(':');
    const value = parts[1];
    const followupId = parseInt(parts[2], 10);
    const user = await getUserByTelegramId(ctx.from.id).catch(() => null);
    if (!user?.id) return showMyAccess(ctx, user);
    const ndf = await getNextDayFollowupById(followupId);
    if (!ndf || ndf.user_id !== user.id) return showMyAccess(ctx, user);
    await saveNextDayFollowupAnswer(followupId, 'smoked_after_procedure', value);
    await showNdfQ2(ctx, followupId);
  });

  bot.action(/^ndf_q2:/, async (ctx) => {
    await ctx.answerCbQuery();
    const parts = ctx.callbackQuery.data.split(':');
    const value = parts[1];
    const followupId = parseInt(parts[2], 10);
    const user = await getUserByTelegramId(ctx.from.id).catch(() => null);
    if (!user?.id) return showMyAccess(ctx, user);
    const ndf = await getNextDayFollowupById(followupId);
    if (!ndf || ndf.user_id !== user.id) return showMyAccess(ctx, user);
    await saveNextDayFollowupAnswer(followupId, 'current_craving', value);
    await showNdfQ3(ctx, followupId);
  });

  bot.action(/^ndf_q3:/, async (ctx) => {
    await ctx.answerCbQuery();
    const parts = ctx.callbackQuery.data.split(':');
    const value = parts[1];
    const followupId = parseInt(parts[2], 10);
    const user = await getUserByTelegramId(ctx.from.id).catch(() => null);
    if (!user?.id) return showMyAccess(ctx, user);
    const ndf = await getNextDayFollowupById(followupId);
    if (!ndf || ndf.user_id !== user.id) return showMyAccess(ctx, user);
    await saveNextDayFollowupAnswer(followupId, 'easier_to_abstain', value);
    await showNdfQ4(ctx, followupId);
  });

  bot.action(/^ndf_q4:/, async (ctx) => {
    await ctx.answerCbQuery();
    const parts = ctx.callbackQuery.data.split(':');
    const value = parts[1];
    const followupId = parseInt(parts[2], 10);
    const user = await getUserByTelegramId(ctx.from.id).catch(() => null);
    if (!user?.id) return showMyAccess(ctx, user);
    const ndf = await getNextDayFollowupById(followupId);
    if (!ndf || ndf.user_id !== user.id) return showMyAccess(ctx, user);
    await saveNextDayFollowupAnswer(followupId, 'strongest_trigger', value);
    await showNdfQ5(ctx, followupId);
  });

  bot.action(/^ndf_q5:/, async (ctx) => {
    await ctx.answerCbQuery();
    const parts = ctx.callbackQuery.data.split(':');
    const value = parts[1];
    const followupId = parseInt(parts[2], 10);
    const user = await getUserByTelegramId(ctx.from.id).catch(() => null);
    if (!user?.id) return showMyAccess(ctx, user);
    const ndf = await getNextDayFollowupById(followupId);
    if (!ndf || ndf.user_id !== user.id) return showMyAccess(ctx, user);
    await saveNextDayFollowupAnswer(followupId, 'noticed_change', value);
    await showNdfQ6(ctx, followupId);
  });

  bot.action(/^ndf_q6:/, async (ctx) => {
    await ctx.answerCbQuery();
    const parts = ctx.callbackQuery.data.split(':');
    const value = parts[1];
    const followupId = parseInt(parts[2], 10);
    const user = await getUserByTelegramId(ctx.from.id).catch(() => null);
    if (!user?.id) return showMyAccess(ctx, user);
    const ndf = await getNextDayFollowupById(followupId);
    if (!ndf || ndf.user_id !== user.id) return showMyAccess(ctx, user);

    await markNextDayFollowupCompleted(followupId, value);

    if (value === 'continue_protocol') {
      await updateUserStatus(ctx.from.id, 'waiting_next_procedure');

      if (ndf.current_craving === 'strong') {
        const ar = await getAccessRights(user.id);
        const alphaAvailable = ar && (
          user.access_type === 'full_access' ||
          (ar.available_alpha_sessions_count !== null &&
            ar.available_alpha_sessions_count > ar.used_alpha_sessions_count)
        );
        if (alphaAvailable) {
          const freshUser = await getUserByTelegramId(ctx.from.id).catch(() => null);
          return showMyAccess(ctx, freshUser || user);
        }
      }

      const [ar, progress] = await Promise.all([getAccessRights(user.id), getProtocolProgress(user.id)]);
      if (!ar) return showMyAccess(ctx, user);
      const step = progress?.current_step_number ?? 0;
      const nextProcedureType = getNextProcedureType(step);
      if (user.access_type === 'full_access' || ar.paid_main_procedures_count > ar.used_main_procedures_count) {
        return showPreparation(ctx, { isFirstProcedure: false, procedureType: nextProcedureType });
      }
      return showTariff(ctx, user);
    }

    if (value === 'already_not_smoking') {
      await updateUserStatus(ctx.from.id, 'not_smoking');
      await createSevenDayFollowup(user.id);
      return showNotSmokingResult(ctx);
    }

    if (value === 'do_not_continue') {
      await setPaused(user.id, 'ndf_decline');
      return showSessionPaused(ctx);
    }

    return showMyAccess(ctx, user);
  });

  // ─── Follow-up +7 дней: вопросы Q1–Q4 (раздел 12.3) ────────────────────────

  bot.action(/^sdf_q1:/, async (ctx) => {
    await ctx.answerCbQuery();
    const parts = ctx.callbackQuery.data.split(':');
    const value = parts[1];
    const followupId = parseInt(parts[2], 10);
    const user = await getUserByTelegramId(ctx.from.id).catch(() => null);
    if (!user?.id) return showMyAccess(ctx, user);
    const sdf = await getSevenDayFollowupById(followupId);
    if (!sdf || sdf.user_id !== user.id) return showMyAccess(ctx, user);
    await saveSevenDayFollowupAnswer(followupId, 'smoked_last_7_days', value);
    await showSdfQ2(ctx, followupId);
  });

  bot.action(/^sdf_q2:/, async (ctx) => {
    await ctx.answerCbQuery();
    const parts = ctx.callbackQuery.data.split(':');
    const value = parts[1];
    const followupId = parseInt(parts[2], 10);
    const user = await getUserByTelegramId(ctx.from.id).catch(() => null);
    if (!user?.id) return showMyAccess(ctx, user);
    const sdf = await getSevenDayFollowupById(followupId);
    if (!sdf || sdf.user_id !== user.id) return showMyAccess(ctx, user);
    await saveSevenDayFollowupAnswer(followupId, 'current_craving', value);
    await showSdfQ3(ctx, followupId);
  });

  bot.action(/^sdf_q3:/, async (ctx) => {
    await ctx.answerCbQuery();
    const parts = ctx.callbackQuery.data.split(':');
    const value = parts[1];
    const followupId = parseInt(parts[2], 10);
    const user = await getUserByTelegramId(ctx.from.id).catch(() => null);
    if (!user?.id) return showMyAccess(ctx, user);
    const sdf = await getSevenDayFollowupById(followupId);
    if (!sdf || sdf.user_id !== user.id) return showMyAccess(ctx, user);
    await saveSevenDayFollowupAnswer(followupId, 'changes_noticed', value);
    await showSdfQ4(ctx, followupId);
  });

  bot.action(/^sdf_q4:/, async (ctx) => {
    await ctx.answerCbQuery();
    const parts = ctx.callbackQuery.data.split(':');
    const value = parts[1];
    const followupId = parseInt(parts[2], 10);
    const user = await getUserByTelegramId(ctx.from.id).catch(() => null);
    if (!user?.id) return showMyAccess(ctx, user);
    const sdf = await getSevenDayFollowupById(followupId);
    if (!sdf || sdf.user_id !== user.id) return showMyAccess(ctx, user);

    await saveSevenDayFollowupAnswer(followupId, 'needs_support', value === 'yes');

    const q1 = sdf.smoked_last_7_days;
    const q2 = sdf.current_craving;
    let resultStatus;
    if (q1 === 'no' && (q2 === 'no' || q2 === 'weak')) {
      resultStatus = 'not_smoking';
    } else if (q1 === 'several' || q1 === 'relapsed') {
      resultStatus = 'relapsed';
    } else if (q1 === 'once' || q2 === 'medium' || q2 === 'strong') {
      resultStatus = 'reduced_smoking';
    } else {
      resultStatus = 'unknown';
    }

    await markSevenDayFollowupCompleted(followupId, resultStatus);

    if (resultStatus === 'not_smoking') return showSdfSuccess(ctx);
    return showSdfNeedsWork(ctx);
  });

  // ─── Экраны итога follow-up +7 дней ─────────────────────────────────────────

  bot.action('sdf_success:review', async (ctx) => {
    await ctx.answerCbQuery();
    await showLeaveReview(ctx);
  });

  bot.action('sdf_success:share', async (ctx) => {
    await ctx.answerCbQuery();
    const username = ctx.botInfo?.username;
    const shareUrl = username
      ? `https://t.me/share/url?url=${encodeURIComponent(`https://t.me/${username}`)}&text=${encodeURIComponent('Попробуй NeuroTech Quit — авторский протокол помощи при отказе от никотина.')}`
      : null;
    const keyboard = shareUrl
      ? Markup.inlineKeyboard([
          [Markup.button.url('Отправить другу', shareUrl)],
          [Markup.button.callback('Назад', 'sdf_success:menu')],
        ])
      : Markup.inlineKeyboard([[Markup.button.callback('Назад', 'sdf_success:menu')]]);
    const text = 'Поделитесь NeuroTech Quit с другом — возможно, он тоже хочет бросить курить.';
    try {
      await ctx.editMessageText(text, keyboard);
    } catch {
      await ctx.reply(text, keyboard);
    }
  });

  bot.action('sdf_success:alpha', async (ctx) => {
    await ctx.answerCbQuery();
    const user = await getUserByTelegramId(ctx.from.id).catch(() => null);
    if (!user?.id) return showMyAccess(ctx, user);
    const ar = await getAccessRights(user.id);
    if (!ar) return showMyAccess(ctx, user);
    const alphaAvailable =
      user.access_type === 'full_access' ||
      (ar.available_alpha_sessions_count !== null &&
        ar.available_alpha_sessions_count > ar.used_alpha_sessions_count);
    if (!alphaAvailable) return showAlphaUnavailable(ctx);
    return showPreparation(ctx, { isFirstProcedure: false, procedureType: 'alpha' });
  });

  bot.action('sdf_success:finish', async (ctx) => {
    await ctx.answerCbQuery();
    const user = await getUserByTelegramId(ctx.from.id).catch(() => null);
    await showCycleDone(ctx, user?.access_type ?? 'single_procedure');
  });

  bot.action('sdf_success:menu', async (ctx) => {
    await ctx.answerCbQuery();
    await showMainMenu(ctx);
  });

  bot.action('sdf_result:continue_protocol', async (ctx) => {
    await ctx.answerCbQuery();
    const user = await getUserByTelegramId(ctx.from.id).catch(() => null);
    if (!user?.id) return showMyAccess(ctx, user);
    const [ar, progress] = await Promise.all([
      getAccessRights(user.id),
      getProtocolProgress(user.id),
    ]);
    if (!ar) return showTariff(ctx, user);
    const step = progress?.current_step_number ?? 0;
    const nextProcedureType = getNextProcedureType(step);
    if (user.access_type === 'full_access' || ar.paid_main_procedures_count > ar.used_main_procedures_count) {
      return showPreparation(ctx, { isFirstProcedure: false, procedureType: nextProcedureType });
    }
    return showTariff(ctx, user);
  });

  bot.action('sdf_result:alpha', async (ctx) => {
    await ctx.answerCbQuery();
    const user = await getUserByTelegramId(ctx.from.id).catch(() => null);
    if (!user?.id) return showMyAccess(ctx, user);
    const ar = await getAccessRights(user.id);
    if (!ar) return showMyAccess(ctx, user);
    const alphaAvailable =
      user.access_type === 'full_access' ||
      (ar.available_alpha_sessions_count !== null &&
        ar.available_alpha_sessions_count > ar.used_alpha_sessions_count);
    if (!alphaAvailable) return showAlphaUnavailable(ctx);
    return showPreparation(ctx, { isFirstProcedure: false, procedureType: 'alpha' });
  });

  // ─── Завершить цикл (раздел 13.3) ───────────────────────────────────────────

  bot.action('cycle_done:review', async (ctx) => {
    await ctx.answerCbQuery();
    await showLeaveReview(ctx);
  });

  bot.action('cycle_done:share', async (ctx) => {
    await ctx.answerCbQuery();
    const username = ctx.botInfo?.username;
    const shareUrl = username
      ? `https://t.me/share/url?url=${encodeURIComponent(`https://t.me/${username}`)}&text=${encodeURIComponent('Попробуй NeuroTech Quit — авторский протокол помощи при отказе от никотина.')}`
      : null;
    const keyboard = shareUrl
      ? Markup.inlineKeyboard([
          [Markup.button.url('Отправить другу', shareUrl)],
          [Markup.button.callback('Назад', 'cycle_done:menu')],
        ])
      : Markup.inlineKeyboard([[Markup.button.callback('Назад', 'cycle_done:menu')]]);
    const text = 'Поделитесь NeuroTech Quit с другом — возможно, он тоже хочет бросить курить.';
    try {
      await ctx.editMessageText(text, keyboard);
    } catch {
      await ctx.reply(text, keyboard);
    }
  });

  bot.action('cycle_done:pay_next', async (ctx) => {
    await ctx.answerCbQuery();
    await showPaymentStub(ctx, 'single_next');
  });

  bot.action('cycle_done:upgrade', async (ctx) => {
    await ctx.answerCbQuery();
    await showPaymentStub(ctx, 'upgrade');
  });

  bot.action('cycle_done:menu', async (ctx) => {
    await ctx.answerCbQuery();
    await showMainMenu(ctx);
  });

  // ─── Оставить отзыв (раздел 15.1) ───────────────────────────────────────────

  bot.action('leave_review:text', async (ctx) => {
    await ctx.answerCbQuery();
    awaitingReviewText.set(ctx.from.id, true);
    await showReviewTextPrompt(ctx);
  });

  bot.action('leave_review:video', async (ctx) => {
    await ctx.answerCbQuery();
    await showLeaveReviewStub(ctx);
  });

  bot.action('leave_review:audio', async (ctx) => {
    await ctx.answerCbQuery();
    await showLeaveReviewStub(ctx);
  });

  bot.action('leave_review:skip', async (ctx) => {
    await ctx.answerCbQuery();
    await showMainMenu(ctx);
  });

  bot.action('leave_review:back', async (ctx) => {
    await ctx.answerCbQuery();
    await showLeaveReview(ctx);
  });

  bot.action('leave_review:cancel', async (ctx) => {
    await ctx.answerCbQuery();
    awaitingReviewText.delete(ctx.from.id);
    await showLeaveReview(ctx);
  });

  // ─── Подарочный доступ: продолжить после активации (раздел 16.3) ─────────────

  bot.action('gift:continue', async (ctx) => {
    await ctx.answerCbQuery();
    const telegramId = ctx.from.id;

    let user;
    try {
      user = await getUserByTelegramId(telegramId);
    } catch (e) {
      console.error('[gift:continue] getUserByTelegramId:', e.message);
      return ctx.reply('Ошибка. Попробуйте /start');
    }

    const status = user.user_status;
    const NO_DIAG = ['new', 'intro_video_watched', 'diagnostic_started', 'low_motivation', 'not_sure_clarification'];

    if (NO_DIAG.includes(status)) {
      return startDiagnosticFlow(ctx);
    }

    if (status === 'diagnostic_completed') {
      return showConsent(ctx, 'decision');
    }

    // consent_accepted или выше — подтверждаем финальный статус
    const newStatus = user.access_type === 'full_access' ? 'paid_full' : 'paid_single';
    await updateUserStatus(telegramId, newStatus).catch(e =>
      console.error('[gift:continue] updateUserStatus:', e.message)
    );
    const updatedUser = await getUserByTelegramId(telegramId).catch(() => null);
    return showMyAccess(ctx, updatedUser || user);
  });

  // ─── Поддержка: текстовое сообщение (раздел 14) ──────────────────────────────

  bot.on('text', async (ctx) => {
    const telegramId = ctx.from.id;
    const text = ctx.message.text;
    if (text.startsWith('/')) return;

    if (awaitingReviewText.has(telegramId)) {
      awaitingReviewText.delete(telegramId);
      const user = await getUserByTelegramId(telegramId).catch(() => null);
      if (!user?.id) return;
      await createUserReview(user.id, 'text', text, 'user_submitted').catch(e =>
        console.error('[review] createUserReview:', e.message)
      );
      const adminIds = config.adminTelegramIds;
      const adminMsg = `[Отзыв] От @${ctx.from.username || telegramId}:\n\n${text}`;
      for (const adminId of adminIds) {
        await ctx.telegram.sendMessage(adminId, adminMsg).catch(e =>
          console.error('[review] sendMessage to admin:', e.message)
        );
      }
      const confirmKeyboard = Markup.inlineKeyboard([
        [Markup.button.callback('Мой доступ', 'my_access:show')],
        [Markup.button.callback('Главное меню', 'my_access:menu')],
      ]);
      await ctx.reply('Спасибо. Ваш отзыв отправлен на модерацию.', confirmKeyboard);
      return;
    }

    if (!awaitingSupportText.has(telegramId)) return;

    const sessionId = awaitingSupportText.get(telegramId);
    awaitingSupportText.delete(telegramId);

    const user = await getUserByTelegramId(telegramId).catch(() => null);
    if (!user?.id) return;

    await createSupportRequest(user.id, text, {
      screen: 'post_q_complete',
      accessType: user.access_type,
    });

    const adminIds = config.adminTelegramIds;
    const adminMsg = `[Поддержка] От @${ctx.from.username || telegramId}:\n\n${text}`;
    for (const adminId of adminIds) {
      await ctx.telegram.sendMessage(adminId, adminMsg).catch(e =>
        console.error('[support] sendMessage to admin:', e.message)
      );
    }

    const confirmKeyboard = Markup.inlineKeyboard([
      [Markup.button.callback('Мой доступ', 'my_access:show')],
      [Markup.button.callback('Главное меню', 'my_access:menu')],
    ]);
    await ctx.reply(
      'Ваше обращение принято. Мы вернёмся с ответом, когда поддержка будет доступна.',
      confirmKeyboard
    );
  });

};
