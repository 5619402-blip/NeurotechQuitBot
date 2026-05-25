const { Markup } = require('telegraf');

const WELCOME_TEXT =
  'Добро пожаловать в NeuroTech Quit.\n\n' +
  'Здесь вы сможете пройти авторский протокол NeuroTech по отказу от курения и никотина в понятном пошаговом формате.\n\n' +
  'Это не медицинская программа, а авторская технология, которая уже показала свою эффективность на тысячах реальных прохождений и подтверждается отзывами клиентов.\n\n' +
  'Начните с короткого объяснения метода. После него бот предложит диагностику готовности и подскажет следующий шаг.';

const welcomeKeyboard = Markup.inlineKeyboard([
  [Markup.button.callback('О технологии и методе', 'welcome:intro_video')],
  [Markup.button.callback('Отзывы', 'welcome:reviews')],
]);

async function showWelcome(ctx) {
  try {
    await ctx.editMessageText(WELCOME_TEXT, welcomeKeyboard);
  } catch {
    await ctx.reply(WELCOME_TEXT, welcomeKeyboard);
  }
}

module.exports = { showWelcome };
