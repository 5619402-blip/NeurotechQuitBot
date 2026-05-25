const { Markup } = require('telegraf');

const POST_PROCEDURE_TEXT =
  'Процедура завершена.\n\n' +
  'Сейчас важно наблюдать за своим состоянием. Воздержитесь от никотина ' +
  'и старайтесь не возвращаться к триггерам. Если возникнет тяга — ' +
  'вспомните заключительную часть процедуры.';

async function showPostProcedure(ctx, { sessionId }) {
  const keyboard = Markup.inlineKeyboard([
    [Markup.button.callback('Далее', `postProcedure:next:${sessionId}`)],
  ]);
  try {
    await ctx.editMessageText(POST_PROCEDURE_TEXT, keyboard);
  } catch {
    await ctx.reply(POST_PROCEDURE_TEXT, keyboard);
  }
}

module.exports = { showPostProcedure };
