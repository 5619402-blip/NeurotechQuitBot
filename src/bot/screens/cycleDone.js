const { Markup } = require('telegraf');

const CYCLE_DONE_FULL_TEXT =
  'Цикл завершён. Вы прошли полный протокол NeuroTech Quit. ' +
  'Наблюдайте за своим состоянием и возвращайтесь, если понадобится поддержка.';

const CYCLE_DONE_SINGLE_TEXT =
  'Пробная процедура завершена.\n\n' +
  'Вы прошли одну оплаченную процедуру NeuroTech Quit.\n\n' +
  'Для продолжения полного протокола нужен полный доступ. В полном доступе следующие процедуры ' +
  'открываются поэтапно, с нужными интервалами, а Альфа-процедура доступна как поддержка состояния.\n\n' +
  'Если хотите продолжить работу по протоколу, откройте полный доступ.';

const cycleDoneFullKeyboard = Markup.inlineKeyboard([
  [Markup.button.callback('Мой доступ', 'my_access:show')],
  [Markup.button.callback('Оставить отзыв', 'cycle_done:review')],
  [Markup.button.callback('Отправить другу', 'cycle_done:share')],
  [Markup.button.callback('Главное меню', 'cycle_done:menu')],
]);

const cycleDoneSingleKeyboard = Markup.inlineKeyboard([
  [Markup.button.callback('Доплатить до полного доступа — 3 910 ₽', 'cycle_done:upgrade')],
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
