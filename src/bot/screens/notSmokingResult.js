const { Markup } = require('telegraf');

const NOT_SMOKING_RESULT_TEXT =
  'Сейчас ваше состояние выглядит стабильнее. Постарайтесь избегать ' +
  'проверки себя «на одну сигарету», не возвращаться к старым триггерам ' +
  'и наблюдать за изменениями спокойно.';

const notSmokingResultKeyboard = Markup.inlineKeyboard([
  [Markup.button.callback('Альфа-процедура', 'not_smoking_result:alpha')],
  [Markup.button.callback('Оставить отзыв', 'not_smoking_result:review')],
  [Markup.button.callback('Главное меню', 'not_smoking_result:menu')],
]);

async function showNotSmokingResult(ctx) {
  try {
    await ctx.editMessageText(NOT_SMOKING_RESULT_TEXT, notSmokingResultKeyboard);
  } catch {
    await ctx.reply(NOT_SMOKING_RESULT_TEXT, notSmokingResultKeyboard);
  }
}

module.exports = { showNotSmokingResult };
