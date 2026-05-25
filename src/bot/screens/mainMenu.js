const { Markup } = require('telegraf');

const MAIN_MENU_TEXT = 'Главное меню';

const mainMenuKeyboard = Markup.inlineKeyboard([
  [Markup.button.callback('Мой доступ', 'main_menu:my_access')],
  [Markup.button.callback('Отзывы', 'main_menu:reviews')],
  [Markup.button.callback('Поддержка', 'main_menu:support')],
  [Markup.button.callback('О проекте', 'main_menu:about')],
]);

async function showMainMenu(ctx) {
  try {
    await ctx.editMessageText(MAIN_MENU_TEXT, mainMenuKeyboard);
  } catch {
    await ctx.reply(MAIN_MENU_TEXT, mainMenuKeyboard);
  }
}

module.exports = { showMainMenu };
