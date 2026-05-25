const { Markup } = require('telegraf');

async function sendScreen(ctx, text, keyboard) {
  try {
    await ctx.editMessageText(text, keyboard);
  } catch {
    await ctx.reply(text, keyboard);
  }
}

function getNdfQ1Data(followupId) {
  return {
    text: 'Добрый день! Прошли сутки после вашей процедуры.\n\nКурили ли вы после процедуры?',
    keyboard: Markup.inlineKeyboard([
      [Markup.button.callback('Нет', `ndf_q1:no:${followupId}`)],
      [Markup.button.callback('Один раз', `ndf_q1:once:${followupId}`)],
      [Markup.button.callback('Несколько раз', `ndf_q1:several:${followupId}`)],
      [Markup.button.callback('Да, вернулся(ась)', `ndf_q1:returned:${followupId}`)],
    ]),
  };
}

async function showNdfQ2(ctx, followupId) {
  await sendScreen(ctx,
    'Есть ли сейчас желание курить?',
    Markup.inlineKeyboard([
      [Markup.button.callback('Нет', `ndf_q2:no:${followupId}`)],
      [Markup.button.callback('Слабое', `ndf_q2:weak:${followupId}`)],
      [Markup.button.callback('Среднее', `ndf_q2:medium:${followupId}`)],
      [Markup.button.callback('Сильное', `ndf_q2:strong:${followupId}`)],
    ])
  );
}

async function showNdfQ3(ctx, followupId) {
  await sendScreen(ctx,
    'Стало ли легче воздерживаться?',
    Markup.inlineKeyboard([
      [Markup.button.callback('Да, заметно', `ndf_q3:yes_noticeable:${followupId}`)],
      [Markup.button.callback('Немного', `ndf_q3:a_bit:${followupId}`)],
      [Markup.button.callback('Пока не понимаю', `ndf_q3:unclear:${followupId}`)],
      [Markup.button.callback('Нет', `ndf_q3:no:${followupId}`)],
    ])
  );
}

async function showNdfQ4(ctx, followupId) {
  await sendScreen(ctx,
    'Где тяга появлялась сильнее всего?',
    Markup.inlineKeyboard([
      [
        Markup.button.callback('Утром', `ndf_q4:morning:${followupId}`),
        Markup.button.callback('После еды', `ndf_q4:after_food:${followupId}`),
      ],
      [
        Markup.button.callback('С кофе', `ndf_q4:with_coffee:${followupId}`),
        Markup.button.callback('В стрессе', `ndf_q4:stress:${followupId}`),
      ],
      [
        Markup.button.callback('За рулём', `ndf_q4:driving:${followupId}`),
        Markup.button.callback('Рядом курили', `ndf_q4:others_smoke:${followupId}`),
      ],
      [Markup.button.callback('Тяги почти не было', `ndf_q4:almost_none:${followupId}`)],
    ])
  );
}

async function showNdfQ5(ctx, followupId) {
  await sendScreen(ctx,
    'Что заметили?',
    Markup.inlineKeyboard([
      [Markup.button.callback('Больше спокойствия', `ndf_q5:more_calm:${followupId}`)],
      [Markup.button.callback('Меньше тяги', `ndf_q5:less_craving:${followupId}`)],
      [Markup.button.callback('Меньше автоматизма', `ndf_q5:less_auto:${followupId}`)],
      [Markup.button.callback('Появилось сопротивление', `ndf_q5:resistance:${followupId}`)],
      [Markup.button.callback('Пока ничего', `ndf_q5:nothing:${followupId}`)],
      [Markup.button.callback('Стало тревожнее', `ndf_q5:more_anxiety:${followupId}`)],
    ])
  );
}

async function showNdfQ6(ctx, followupId) {
  await sendScreen(ctx,
    'Хотите продолжить протокол?',
    Markup.inlineKeyboard([
      [Markup.button.callback('Да, продолжить', `ndf_q6:continue_protocol:${followupId}`)],
      [Markup.button.callback('Я уже не курю', `ndf_q6:already_not_smoking:${followupId}`)],
      [Markup.button.callback('Не хочу продолжать', `ndf_q6:do_not_continue:${followupId}`)],
    ])
  );
}

module.exports = { getNdfQ1Data, showNdfQ2, showNdfQ3, showNdfQ4, showNdfQ5, showNdfQ6 };
