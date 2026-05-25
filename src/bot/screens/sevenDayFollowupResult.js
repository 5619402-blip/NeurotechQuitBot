const { Markup } = require('telegraf');

const SDF_SUCCESS_TEXT =
  'Поздравляем! Вы не курите уже неделю — это значимый результат.\n\n' +
  'Продолжайте наблюдать за собой спокойно. Если вы замечаете, что автоматизмы ослабли, — ' +
  'это хороший знак. Доверяйте своему состоянию.';

const sdfSuccessKeyboard = Markup.inlineKeyboard([
  [Markup.button.callback('Оставить отзыв', 'sdf_success:review')],
  [Markup.button.callback('Отправить другу', 'sdf_success:share')],
  [Markup.button.callback('Пройти Альфа-процедуру', 'sdf_success:alpha')],
  [Markup.button.callback('Завершить цикл', 'sdf_success:finish')],
  [Markup.button.callback('Главное меню', 'sdf_success:menu')],
]);

const SDF_NEEDS_WORK_TEXT =
  'Спасибо за честные ответы. Если тяга сохраняется или вы снова курили, это не означает, ' +
  'что весь прогресс потерян. Никотиновая зависимость может требовать нескольких этапов работы. ' +
  'Вы можете продолжить протокол, пройти следующую процедуру или вернуться к поддерживающей ' +
  'Альфа-процедуре, если она доступна по вашему тарифу.';

const sdfNeedsWorkKeyboard = Markup.inlineKeyboard([
  [Markup.button.callback('Продолжить протокол', 'sdf_result:continue_protocol')],
  [Markup.button.callback('Пройти Альфа-процедуру', 'sdf_result:alpha')],
  [Markup.button.callback('Мой доступ', 'my_access:show')],
  [Markup.button.callback('Поддержка', 'my_access:support')],
]);

async function showSdfSuccess(ctx) {
  try {
    await ctx.editMessageText(SDF_SUCCESS_TEXT, sdfSuccessKeyboard);
  } catch {
    await ctx.reply(SDF_SUCCESS_TEXT, sdfSuccessKeyboard);
  }
}

async function showSdfNeedsWork(ctx) {
  try {
    await ctx.editMessageText(SDF_NEEDS_WORK_TEXT, sdfNeedsWorkKeyboard);
  } catch {
    await ctx.reply(SDF_NEEDS_WORK_TEXT, sdfNeedsWorkKeyboard);
  }
}

module.exports = { showSdfSuccess, showSdfNeedsWork };
