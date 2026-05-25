const { Markup } = require('telegraf');

const PAYMENT_STUB_TEXT =
  'Оплата временно находится в тестовом режиме. ' +
  'Сейчас можно проверить весь путь прохождения без реального списания средств.';

function buildPaymentStubKeyboard(variant) {
  const backCallback = (variant === 'single_next' || variant === 'upgrade')
    ? 'payment:back_upgrade'
    : 'payment:back_new';

  return Markup.inlineKeyboard([
    [Markup.button.callback('Тестово открыть доступ', `payment:test_${variant}`)],
    [Markup.button.callback('Назад к выбору тарифа', backCallback)],
  ]);
}

async function showPaymentStub(ctx, variant) {
  const keyboard = buildPaymentStubKeyboard(variant);
  try {
    await ctx.editMessageText(PAYMENT_STUB_TEXT, keyboard);
  } catch {
    await ctx.reply(PAYMENT_STUB_TEXT, keyboard);
  }
}

module.exports = { showPaymentStub };
