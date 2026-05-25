const { Markup } = require('telegraf');

const PAYMENT_SUCCESS_TEXT =
  'Оплата прошла успешно. Доступ открыт. ' +
  'Перед запуском процедуры посмотрите короткие правила прохождения. ' +
  'Это поможет пройти её правильно и без лишних ошибок.';

const paymentSuccessKeyboard = Markup.inlineKeyboard([
  [Markup.button.callback('Перейти к правилам', 'payment_success:rules')],
]);

async function showPaymentSuccess(ctx) {
  try {
    await ctx.editMessageText(PAYMENT_SUCCESS_TEXT, paymentSuccessKeyboard);
  } catch {
    await ctx.reply(PAYMENT_SUCCESS_TEXT, paymentSuccessKeyboard);
  }
}

module.exports = { showPaymentSuccess };
