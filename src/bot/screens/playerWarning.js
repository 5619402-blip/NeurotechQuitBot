const { Markup } = require('telegraf');

const WARNING_TEXT =
  'Важное правило прохождения\n\n' +
  'Во время процедуры важно сохранять спокойное, расслабленное состояние и проходить аудио полностью, без пауз и остановок.\n\n' +
  'В аудио заложено сочетание технологий бинауральных ритмов, нейродинамических элементов и последовательных инструкций. ' +
  'Они работают не отдельными фрагментами, а как цельная процедура, где важны порядок, непрерывность и ваше внутреннее состояние во время прохождения.\n\n' +
  'Во время процедуры просто следуйте инструкциям, слушайте аудио и наблюдайте за своими ощущениями. ' +
  'Оценивайте своё состояние спокойно, без спешки и внутреннего сопротивления.\n\n' +
  'Заранее уберите отвлекающие факторы: уведомления, звонки, разговоры и любые дела, которые могут прервать процесс.\n\n' +
  'Если процедура была остановлена, прервана или вы сильно отвлеклись, лучше пройти её заново с самого начала.\n\n' +
  'Так вы сможете пройти сессию корректно и получить более устойчивый результат.';

function buildPlayerWarningKeyboard(procedureType) {
  return Markup.inlineKeyboard([
    [Markup.button.callback('Начать процедуру', `player_warning:start:${procedureType}`)],
    [Markup.button.callback('Вернуться назад', `player_warning:back:${procedureType}`)],
  ]);
}

async function sendScreen(ctx, text, keyboard) {
  try {
    await ctx.editMessageText(text, keyboard);
  } catch {
    await ctx.reply(text, keyboard);
  }
}

async function showPlayerWarning(ctx, { procedureType }) {
  const keyboard = buildPlayerWarningKeyboard(procedureType);
  await sendScreen(ctx, WARNING_TEXT, keyboard);
}

module.exports = { showPlayerWarning };
