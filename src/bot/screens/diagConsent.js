const { Markup } = require('telegraf');
const { getUserByTelegramId } = require('../../db/users');
const { hasConsentForVersion } = require('../../db/consents');
const { showDiagQ_duration } = require('./diagnostic');

const DIAG_CONSENT_VERSION = 'diagnostic_consent_v1';

const DIAG_CONSENT_TEXT =
  'Перед началом диагностики\n\n' +
  'NeuroTech Quit — это авторский протокол помощи при отказе от никотина. ' +
  'Он не является медицинской услугой, не заменяет консультацию врача ' +
  'и не предназначен для диагностики или лечения заболеваний.\n\n' +
  'Диагностика нужна, чтобы понять вашу готовность к прохождению протокола ' +
  'и подобрать дальнейший маршрут внутри бота.\n\n' +
  'Продолжая, вы подтверждаете, что:\n' +
  '— проходите диагностику добровольно;\n' +
  '— понимаете, что результат зависит от вашей личной мотивации и готовности включиться в процесс;\n' +
  '— согласны на обработку ваших ответов в рамках работы бота;\n' +
  '— ознакомились с условиями прохождения протокола;\n' +
  '— вам уже исполнилось 18 лет.\n\n' +
  'Если вам ещё нет 18 лет, пожалуйста, не продолжайте прохождение протокола.';

const diagConsentKeyboard = Markup.inlineKeyboard([
  [Markup.button.callback('Согласен, мне есть 18 лет', 'diag_consent:accept')],
  [Markup.button.callback('Мне нет 18 лет', 'diag_consent:under18')],
]);

async function showDiagConsent(ctx) {
  try {
    await ctx.editMessageText(DIAG_CONSENT_TEXT, diagConsentKeyboard);
  } catch {
    await ctx.reply(DIAG_CONSENT_TEXT, diagConsentKeyboard);
  }
}

async function startDiagnosticFlow(ctx) {
  try {
    const user = await getUserByTelegramId(ctx.from.id);
    if (user?.id && await hasConsentForVersion(user.id, DIAG_CONSENT_VERSION)) {
      return showDiagQ_duration(ctx);
    }
  } catch {}
  return showDiagConsent(ctx);
}

module.exports = { showDiagConsent, startDiagnosticFlow, DIAG_CONSENT_VERSION };
