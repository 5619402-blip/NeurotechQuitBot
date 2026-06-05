const { Markup } = require('telegraf');

const POST_PROCEDURE_WAIT_TEXT =
  'Первая процедура завершена.\n\n' +
  'Ответы записаны.\n\n' +
  'Следующую процедуру — «Быстрый рычаг» — можно пройти минимум через 24–48 часов. ' +
  'Она будет ждать вас в разделе «Мой доступ».\n\n' +
  'Если до прохождения второй процедуры появится тревога или желание курить, ' +
  'вы сможете пройти Альфа-процедуру. Она также находится в разделе «Мой доступ».';

async function showPostProcedureWait(ctx) {
  const keyboard = Markup.inlineKeyboard([
    [Markup.button.callback('Перейти в Мой доступ', 'post_procedure_wait:to_access')],
  ]);
  try {
    await ctx.editMessageText(POST_PROCEDURE_WAIT_TEXT, keyboard);
  } catch {
    await ctx.reply(POST_PROCEDURE_WAIT_TEXT, keyboard);
  }
}

const POST_PROCEDURE_WAIT3_TEXT =
  'Третья процедура завершена.\n\n' +
  'Ответы записаны.\n\n' +
  'Следующий этап — «Закрепление: Быстрый рычаг» — можно пройти минимум через 48 часов. ' +
  'Он будет ждать вас в разделе «Мой доступ».\n\n' +
  'Если до следующего этапа появится тревога или желание курить, вы можете пройти Альфа-процедуру. ' +
  'Она также находится в разделе «Мой доступ».';

async function showPostProcedureWait3(ctx) {
  const keyboard = Markup.inlineKeyboard([
    [Markup.button.callback('Перейти в Мой доступ', 'post_procedure_wait:to_access')],
  ]);
  try {
    await ctx.editMessageText(POST_PROCEDURE_WAIT3_TEXT, keyboard);
  } catch {
    await ctx.reply(POST_PROCEDURE_WAIT3_TEXT, keyboard);
  }
}

module.exports = { showPostProcedureWait, showPostProcedureWait3 };
