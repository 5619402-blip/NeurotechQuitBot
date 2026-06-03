const { Markup } = require('telegraf');

const CYCLE_COMPLETE_TEXT =
  'Основной цикл протокола завершён.\n\n' +
  'Вы прошли все основные этапы NeuroTech Quit.\n\n' +
  'Сейчас важно понаблюдать за состоянием и закрепить результат. Если потребуется ' +
  'дальнейшая поддержка, вы сможете вернуться к доступным разделам бота.';

async function sendScreen(ctx, text, keyboard) {
  try {
    await ctx.editMessageText(text, keyboard);
  } catch {
    await ctx.reply(text, keyboard);
  }
}

async function showProtocolCycleComplete(ctx) {
  const keyboard = Markup.inlineKeyboard([
    [Markup.button.callback('Главное меню', 'protocol_cycle_complete:menu')],
    [Markup.button.callback('Мой доступ', 'protocol_cycle_complete:access')],
  ]);
  await sendScreen(ctx, CYCLE_COMPLETE_TEXT, keyboard);
}

module.exports = { showProtocolCycleComplete };
