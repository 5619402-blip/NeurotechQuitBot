const { Markup } = require('telegraf');

const INTERRUPTED_TEXT =
  'Процедура была прервана. ' +
  'Для корректного результата её нужно будет пройти заново с самого начала.';

const interruptedKeyboard = Markup.inlineKeyboard([
  [Markup.button.callback('Пройти заново сейчас', 'procedure_interrupted:restart')],
  [Markup.button.callback('Вернуться позже', 'procedure_interrupted:later')],
]);

async function sendScreen(ctx, text, keyboard) {
  try {
    await ctx.editMessageText(text, keyboard);
  } catch {
    await ctx.reply(text, keyboard);
  }
}

async function showProcedureInterrupted(ctx) {
  await sendScreen(ctx, INTERRUPTED_TEXT, interruptedKeyboard);
}

module.exports = { showProcedureInterrupted };
