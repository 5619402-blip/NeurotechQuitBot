const { Markup } = require('telegraf');

async function sendScreen(ctx, text, keyboard) {
  try {
    await ctx.editMessageText(text, keyboard);
  } catch {
    await ctx.reply(text, keyboard);
  }
}

function getSdfQ1Data(followupId) {
  return {
    text: 'Прошло 7 дней после вашей последней процедуры.\n\nКурили ли вы за последние 7 дней?',
    keyboard: Markup.inlineKeyboard([
      [Markup.button.callback('Нет', `sdf_q1:no:${followupId}`)],
      [Markup.button.callback('Один раз', `sdf_q1:once:${followupId}`)],
      [Markup.button.callback('Несколько раз', `sdf_q1:several:${followupId}`)],
      [Markup.button.callback('Да, вернулся(ась)', `sdf_q1:relapsed:${followupId}`)],
    ]),
  };
}

async function showSdfQ2(ctx, followupId) {
  await sendScreen(ctx,
    'Есть ли желание курить?',
    Markup.inlineKeyboard([
      [Markup.button.callback('Нет', `sdf_q2:no:${followupId}`)],
      [Markup.button.callback('Слабое', `sdf_q2:weak:${followupId}`)],
      [Markup.button.callback('Среднее', `sdf_q2:medium:${followupId}`)],
      [Markup.button.callback('Сильное', `sdf_q2:strong:${followupId}`)],
    ])
  );
}

async function showSdfQ3(ctx, followupId) {
  await sendScreen(ctx,
    'Что изменилось за эти 7 дней?',
    Markup.inlineKeyboard([
      [Markup.button.callback('Стало лучше', `sdf_q3:better:${followupId}`)],
      [Markup.button.callback('Без изменений', `sdf_q3:same:${followupId}`)],
      [Markup.button.callback('Стало хуже', `sdf_q3:worse:${followupId}`)],
      [Markup.button.callback('Сложно сказать', `sdf_q3:hard_to_say:${followupId}`)],
    ])
  );
}

async function showSdfQ4(ctx, followupId) {
  await sendScreen(ctx,
    'Нужна ли вам поддержка дальше?',
    Markup.inlineKeyboard([
      [Markup.button.callback('Нет', `sdf_q4:no:${followupId}`)],
      [Markup.button.callback('Да', `sdf_q4:yes:${followupId}`)],
    ])
  );
}

module.exports = { getSdfQ1Data, showSdfQ2, showSdfQ3, showSdfQ4 };
