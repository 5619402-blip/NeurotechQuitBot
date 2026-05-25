const { Markup } = require('telegraf');

const PAYMENT_ERROR_TEXT =
  'Не удалось сохранить тестовый доступ. ' +
  'Проверьте подключение к базе данных или попробуйте позже.';

function buildPaymentErrorKeyboard(variant) {
  const backCallback = (variant === 'single_next' || variant === 'upgrade')
    ? 'payment:back_upgrade'
    : 'payment:back_new';

  return Markup.inlineKeyboard([
    [Markup.button.callback('Повторить', `payment:test_${variant}`)],
    [Markup.button.callback('Назад к выбору тарифа', backCallback)],
  ]);
}

async function showPaymentError(ctx, variant) {
  const keyboard = buildPaymentErrorKeyboard(variant);
  try {
    await ctx.editMessageText(PAYMENT_ERROR_TEXT, keyboard);
  } catch {
    await ctx.reply(PAYMENT_ERROR_TEXT, keyboard);
  }
}

module.exports = { showPaymentError };
