const { Markup } = require('telegraf');

const NOT_SURE_TEXT =
  'Вы указали, что пока не уверены в своём решении.\n\n' +
  'Это нормально — многие начинают именно с такого состояния. ' +
  'Уровень мотивации достаточный для прохождения протокола.\n\n' +
  'Вы можете продолжить прямо сейчас или сначала посмотреть отзывы других участников.';

const notSureKeyboard = Markup.inlineKeyboard([
  [Markup.button.callback('Я хочу продолжить', 'not_sure:continue')],
  [Markup.button.callback('Посмотреть отзывы', 'not_sure:reviews')],
  [Markup.button.callback('Вернуться позже', 'not_sure:later')],
]);

async function showNotSure(ctx) {
  try {
    await ctx.editMessageText(NOT_SURE_TEXT, notSureKeyboard);
  } catch {
    await ctx.reply(NOT_SURE_TEXT, notSureKeyboard);
  }
}

module.exports = { showNotSure };
