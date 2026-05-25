const { Markup } = require('telegraf');
const { setLowReadinessFlag } = require('../../db/users');

const LOW_READINESS_TEXT =
  'По вашим ответам видно, что внутреннее решение отказаться от никотина пока может быть недостаточно устойчивым.\n\n' +
  'NeuroTech Quit лучше работает, когда человек сам хочет выйти из никотинового сценария и готов пройти протокол осознанно.\n\n' +
  'Вы можете продолжить, но важно понимать: при низкой мотивации результат может быть менее устойчивым, а желание курить может возвращаться сильнее. В таком случае особенно важно честно отвечать на вопросы после процедуры и проходить протокол последовательно.\n\n' +
  'Если вы понимаете это и всё равно хотите продолжить, вы можете перейти дальше.';

const lowReadinessKeyboard = Markup.inlineKeyboard([
  [Markup.button.callback('Я понимаю и хочу продолжить', 'low_readiness:continue')],
  [Markup.button.callback('Посмотреть отзывы', 'low_readiness:reviews')],
  [Markup.button.callback('Вернуться позже', 'low_readiness:later')],
]);

async function showLowReadiness(ctx, { markFlag = true } = {}) {
  if (markFlag) {
    setLowReadinessFlag(ctx.from.id).catch(e =>
      console.error('[lowReadiness] setFlag:', e.message)
    );
  }
  try {
    await ctx.editMessageText(LOW_READINESS_TEXT, lowReadinessKeyboard);
  } catch {
    await ctx.reply(LOW_READINESS_TEXT, lowReadinessKeyboard);
  }
}

module.exports = { showLowReadiness };
