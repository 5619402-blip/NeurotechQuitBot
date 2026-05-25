const { Markup } = require('telegraf');

async function sendScreen(ctx, text, keyboard) {
  try {
    await ctx.editMessageText(text, keyboard);
  } catch {
    await ctx.reply(text, keyboard);
  }
}

async function showPostQ1(ctx, sessionId) {
  const keyboard = Markup.inlineKeyboard([
    [Markup.button.callback('Спокойно', `post_q:1:calm:${sessionId}`)],
    [Markup.button.callback('Легче', `post_q:1:easier:${sessionId}`)],
    [Markup.button.callback('Напряжённо', `post_q:1:tense:${sessionId}`)],
    [Markup.button.callback('Непривычно', `post_q:1:unusual:${sessionId}`)],
    [Markup.button.callback('Пока не понимаю', `post_q:1:unclear:${sessionId}`)],
  ]);
  await sendScreen(ctx, 'Как вы сейчас себя чувствуете?', keyboard);
}

async function showPostQ2(ctx, sessionId) {
  const keyboard = Markup.inlineKeyboard([
    [Markup.button.callback('Нет', `post_q:2:no:${sessionId}`)],
    [Markup.button.callback('Слабое', `post_q:2:weak:${sessionId}`)],
    [Markup.button.callback('Среднее', `post_q:2:medium:${sessionId}`)],
    [Markup.button.callback('Сильное', `post_q:2:strong:${sessionId}`)],
  ]);
  await sendScreen(ctx, 'Есть ли сейчас желание курить?', keyboard);
}

async function showPostQ3(ctx, sessionId) {
  const keyboard = Markup.inlineKeyboard([
    [Markup.button.callback('Нет', `post_q:3:no:${sessionId}`)],
    [Markup.button.callback('Немного', `post_q:3:a_bit:${sessionId}`)],
    [Markup.button.callback('Да, было заметно', `post_q:3:noticeable:${sessionId}`)],
    [Markup.button.callback('Сложно сказать', `post_q:3:hard_to_say:${sessionId}`)],
  ]);
  await sendScreen(ctx, 'Было ли желание прервать процедуру или сопротивление во время прохождения?', keyboard);
}

async function showPostQ4(ctx, sessionId) {
  const keyboard = Markup.inlineKeyboard([
    [Markup.button.callback('Не тянет', `post_q:4:no_pull:${sessionId}`)],
    [Markup.button.callback('Есть отстранение', `post_q:4:detachment:${sessionId}`)],
    [Markup.button.callback('Есть сомнение', `post_q:4:doubt:${sessionId}`)],
    [Markup.button.callback('Тянет как раньше', `post_q:4:still_pull:${sessionId}`)],
    [Markup.button.callback('Пока не понимаю', `post_q:4:unclear:${sessionId}`)],
  ]);
  await sendScreen(ctx, 'Как сейчас воспринимается мысль о никотине?', keyboard);
}

async function showPostQ5(ctx, sessionId) {
  const keyboard = Markup.inlineKeyboard([
    [Markup.button.callback('Да, хочу продолжить', `post_q:5:yes_continue:${sessionId}`)],
    [Markup.button.callback('Пока не знаю', `post_q:5:not_sure:${sessionId}`)],
    [Markup.button.callback('Я уже не курю', `post_q:5:not_smoking:${sessionId}`)],
    [Markup.button.callback('Не хочу продолжать', `post_q:5:no_continue:${sessionId}`)],
  ]);
  await sendScreen(ctx, 'Нужна ли вам следующая процедура по протоколу?', keyboard);
}

async function showPostQ6(ctx, sessionId) {
  const keyboard = Markup.inlineKeyboard([
    [Markup.button.callback('Нет', `post_q:6:no:${sessionId}`)],
    [Markup.button.callback('Да, нужна поддержка', `post_q:6:need_support:${sessionId}`)],
    [Markup.button.callback('Хочу пройти Альфа-процедуру', `post_q:6:want_alpha:${sessionId}`)],
  ]);
  await sendScreen(ctx, 'Нужна ли вам помощь или поддержка?', keyboard);
}

async function showPostQComplete(ctx, sessionId) {
  const keyboard = Markup.inlineKeyboard([
    [Markup.button.callback('Продолжить', `post_q:continue:${sessionId}`)],
  ]);
  await sendScreen(ctx, 'Ответы записаны. Нажмите «Продолжить», чтобы перейти к следующему шагу.', keyboard);
}

module.exports = { showPostQ1, showPostQ2, showPostQ3, showPostQ4, showPostQ5, showPostQ6, showPostQComplete };
