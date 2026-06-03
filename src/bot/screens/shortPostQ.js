const { Markup } = require('telegraf');

async function sendScreen(ctx, text, keyboard) {
  try {
    await ctx.editMessageText(text, keyboard);
  } catch {
    await ctx.reply(text, keyboard);
  }
}

async function showShortPostQ1(ctx, sessionId) {
  const keyboard = Markup.inlineKeyboard([
    [Markup.button.callback('Спокойнее и устойчивее', `short_post_q:1:calm_stable:${sessionId}`)],
    [Markup.button.callback('Есть лёгкое напряжение', `short_post_q:1:light_tension:${sessionId}`)],
    [Markup.button.callback('Пока без изменений', `short_post_q:1:no_changes:${sessionId}`)],
    [Markup.button.callback('Стало тревожнее', `short_post_q:1:more_anxious:${sessionId}`)],
  ]);
  await sendScreen(ctx, 'Как вы сейчас себя чувствуете?', keyboard);
}

async function showShortPostQ2(ctx, sessionId) {
  const keyboard = Markup.inlineKeyboard([
    [Markup.button.callback('Нет', `short_post_q:2:none:${sessionId}`)],
    [Markup.button.callback('Слабое', `short_post_q:2:weak:${sessionId}`)],
    [Markup.button.callback('Среднее', `short_post_q:2:medium:${sessionId}`)],
    [Markup.button.callback('Сильное', `short_post_q:2:strong:${sessionId}`)],
  ]);
  await sendScreen(ctx, 'Есть ли сейчас желание курить?', keyboard);
}

async function showShortPostQ3(ctx, sessionId) {
  const keyboard = Markup.inlineKeyboard([
    [Markup.button.callback('Я не курю, тяги нет', `short_post_q:3:no_craving:${sessionId}`)],
    [Markup.button.callback('Я не курю, но иногда желание появляется', `short_post_q:3:occasional_craving:${sessionId}`)],
    [Markup.button.callback('Я курил(а) после процедуры', `short_post_q:3:smoked_after:${sessionId}`)],
    [Markup.button.callback('Мне нужна поддержка', `short_post_q:3:need_support:${sessionId}`)],
  ]);
  await sendScreen(ctx, 'Что сейчас ближе к вашему состоянию?', keyboard);
}

async function showShortCongrats(ctx) {
  const text =
    'Поздравляем.\n\n' +
    'Вы прошли важный этап NeuroTech Quit и сейчас отмечаете, что не курите и тяги нет.\n\n' +
    'Это хороший момент, чтобы закрепить результат: продолжайте наблюдать за состоянием, ' +
    'берегите спокойный режим и возвращайтесь к поддержке, если она понадобится.';
  const keyboard = Markup.inlineKeyboard([
    [Markup.button.callback('Оставить отзыв', 'short_congrats:review')],
    [Markup.button.callback('Посоветовать другу', 'short_congrats:share')],
    [Markup.button.callback('Главное меню', 'short_congrats:menu')],
  ]);
  await sendScreen(ctx, text, keyboard);
}

async function showShortContinueOptions(ctx, reason) {
  const text = reason === 'smoked_after'
    ? 'Понял. Это не означает, что результат потерян. Важно спокойно продолжить работу и не ' +
      'превращать один эпизод в откат. Вы можете вернуться к протоколу, пройти поддерживающую ' +
      'Альфа-процедуру или написать в поддержку.'
    : 'Понял. Если желание иногда появляется, лучше не считать работу завершённой резко. ' +
      'Вы можете продолжить протокол по текущему плану, пройти Альфа-процедуру для поддержки ' +
      'состояния или обратиться в поддержку.';
  const keyboard = Markup.inlineKeyboard([
    [Markup.button.callback('Мой доступ', 'my_access:show')],
    [Markup.button.callback('Альфа-процедура', 'short_result:alpha')],
    [Markup.button.callback('Поддержка', 'my_access:support')],
    [Markup.button.callback('Главное меню', 'my_access:menu')],
  ]);
  await sendScreen(ctx, text, keyboard);
}

module.exports = { showShortPostQ1, showShortPostQ2, showShortPostQ3, showShortCongrats, showShortContinueOptions };
