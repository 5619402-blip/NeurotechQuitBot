const { Markup } = require('telegraf');

const NOT_MY_DECISION_TEXT =
  'Вы указали, что решение бросить курить сейчас не ваше личное.\n\n' +
  'В таком состоянии проходить протокол не стоит. NeuroTech Quit работает тогда, когда внутри есть собственное решение: «Я действительно хочу выйти из зависимости».\n\n' +
  'Если человек проходит путь не по своему желанию, а потому что его уговорили, эффективность может сильно снижаться.\n\n' +
  'Вернитесь к этому позже, когда решение будет вашим — спокойным, честным и внутренне принятым.';

const notMyDecisionKeyboard = Markup.inlineKeyboard([
  [Markup.button.callback('Вернуться к началу', 'not_my_decision:to_welcome')],
]);

async function showNotMyDecision(ctx) {
  try {
    await ctx.editMessageText(NOT_MY_DECISION_TEXT, notMyDecisionKeyboard);
  } catch {
    await ctx.reply(NOT_MY_DECISION_TEXT, notMyDecisionKeyboard);
  }
}

module.exports = { showNotMyDecision };
