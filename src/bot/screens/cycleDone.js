const { Markup } = require('telegraf');

const CYCLE_DONE_FULL_TEXT =
  'Цикл завершён. Вы прошли полный протокол NeuroTech Quit. ' +
  'Наблюдайте за своим состоянием и возвращайтесь, если понадобится поддержка.';

const CYCLE_DONE_SINGLE_TEXT =
  'Текущий этап завершён. Вы использовали оплаченный доступ к процедуре. ' +
  'Чтобы продолжить протокол, вы можете оплатить следующую процедуру или перейти на полный доступ.';

const cycleDoneFullKeyboard = Markup.inlineKeyboard([
  [Markup.button.callback('Мой доступ', 'my_access:show')],
  [Markup.button.callback('Оставить отзыв', 'cycle_done:review')],
  [Markup.button.callback('Отправить другу', 'cycle_done:share')],
  [Markup.button.callback('Главное меню', 'cycle_done:menu')],
]);

const cycleDoneSingleKeyboard = Markup.inlineKeyboard([
  [Markup.button.callback('Оплатить следующую процедуру — 990 ₽', 'cycle_done:pay_next')],
  [Markup.button.callback('Доплатить до полного доступа — 3 910 ₽', 'cycle_done:upgrade')],
  [Markup.button.callback('Оставить отзыв', 'cycle_done:review')],
  [Markup.button.callback('Главное меню', 'cycle_done:menu')],
]);

async function showCycleDone(ctx, accessType) {
  const isFull = accessType === 'full_access';
  const text = isFull ? CYCLE_DONE_FULL_TEXT : CYCLE_DONE_SINGLE_TEXT;
  const keyboard = isFull ? cycleDoneFullKeyboard : cycleDoneSingleKeyboard;
  try {
    await ctx.editMessageText(text, keyboard);
  } catch {
    await ctx.reply(text, keyboard);
  }
}

module.exports = { showCycleDone };
