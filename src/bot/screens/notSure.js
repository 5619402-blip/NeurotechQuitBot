const { Markup } = require('telegraf');

const NOT_SURE_TEXT =
  'Вы указали, что пока не до конца уверены в своём решении.\n\n' +
  'Это нормально. Многие начинают именно с этого состояния: желание бросить уже есть, но внутри ещё остаются сомнения.\n\n' +
  'Важно понимать: чтобы протокол дал сильный результат, нужно ваше внутреннее решение. Не просто интерес попробовать, а честное понимание: «Да, я действительно хочу бросить курить и выйти из этой зависимости».\n\n' +
  'Если такого решения пока нет, эффективность может заметно снижаться. Протокол помогает тогда, когда вы готовы включиться в процесс и действительно двигаться к отказу от никотина.\n\n' +
  'Сейчас вы можете продолжить, если чувствуете, что готовы сделать этот шаг. Или вернуться позже, когда решение будет окончательным и бесповоротным.';

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
