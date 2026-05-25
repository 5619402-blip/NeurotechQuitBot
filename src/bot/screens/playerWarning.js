const { Markup } = require('telegraf');

const WARNING_TEXT =
  'Важное правило прохождения\n\n' +
  'Процедуру необходимо проходить полностью и без остановок. ' +
  'Нельзя ставить аудио на паузу, выходить из процедуры или отвлекаться. ' +
  'Последовательность аудио и инструкций имеет значение для корректной работы метода. ' +
  'Если процедура была прервана, остановлена или пользователь отвлекался, ' +
  'NeuroTech не может гарантировать корректность результата этой сессии. ' +
  'В таком случае процедуру рекомендуется пройти заново с самого начала.';

function buildPlayerWarningKeyboard(procedureType) {
  return Markup.inlineKeyboard([
    [Markup.button.callback('Начать процедуру', `player_warning:start:${procedureType}`)],
    [Markup.button.callback('Вернуться назад', `player_warning:back:${procedureType}`)],
  ]);
}

async function sendScreen(ctx, text, keyboard) {
  try {
    await ctx.editMessageText(text, keyboard);
  } catch {
    await ctx.reply(text, keyboard);
  }
}

async function showPlayerWarning(ctx, { procedureType }) {
  const keyboard = buildPlayerWarningKeyboard(procedureType);
  await sendScreen(ctx, WARNING_TEXT, keyboard);
}

module.exports = { showPlayerWarning };
