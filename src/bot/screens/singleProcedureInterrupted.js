const { Markup } = require('telegraf');

const SINGLE_PROCEDURE_INTERRUPTED_TEXT =
  'Процедура не завершена.\n\n' +
  'Вы начали оплаченную процедуру, но не завершили её. Она ещё не считается пройденной.\n\n' +
  'Чтобы вернуться к процедуре, нужно заново пройти короткую подготовку. ' +
  'Это важно, чтобы запуск был корректным и безопасным.';

const singleProcedureInterruptedKeyboard = Markup.inlineKeyboard([
  [Markup.button.callback('Начать процедуру заново', 'single_interrupted:restart')],
  [Markup.button.callback('Вернуться позже', 'single_interrupted:later')],
  [Markup.button.callback('Главное меню', 'single_interrupted:menu')],
]);

async function showSingleProcedureInterrupted(ctx) {
  try {
    await ctx.editMessageText(SINGLE_PROCEDURE_INTERRUPTED_TEXT, singleProcedureInterruptedKeyboard);
  } catch {
    await ctx.reply(SINGLE_PROCEDURE_INTERRUPTED_TEXT, singleProcedureInterruptedKeyboard);
  }
}

module.exports = { showSingleProcedureInterrupted };
