const { Markup } = require('telegraf');

const INFO_TEXTS = {
  short_quick_lever:
    'Закрепление: Быстрый рычаг\n\n' +
    'Это дополнительный этап протокола NeuroTech Quit.\n\n' +
    'Он открывается после основных процедур и помогает глубже закрепить результат, ' +
    'ослабить остаточный внутренний импульс к никотину и поддержать новое состояние.\n\n' +
    'В этой версии нет длинного вступления. Здесь остаётся основная медитативная и ' +
    'нейродинамическая часть процедуры.\n\n' +
    'Перед началом выберите спокойное время, наденьте наушники и постарайтесь пройти ' +
    'аудио полностью, без пауз и отвлечений.',

  short_anti_tobacco:
    'Закрепление: Антитабак\n\n' +
    'Это дополнительная закрепляющая процедура NeuroTech Quit.\n\n' +
    'Она помогает усилить и стабилизировать результат после предыдущих этапов протокола, ' +
    'поддержать внутреннее отстранение от никотина и закрепить новое состояние.\n\n' +
    'В этой версии нет длинного вступления. Процедура сфокусирована на основной части ' +
    'работы и подходит как следующий шаг для дополнительного закрепления.\n\n' +
    'Перед началом выберите спокойное время, наденьте наушники и постарайтесь пройти ' +
    'аудио полностью, без пауз и отвлечений.',
};

async function sendScreen(ctx, text, keyboard) {
  try {
    await ctx.editMessageText(text, keyboard);
  } catch {
    await ctx.reply(text, keyboard);
  }
}

async function showShortProcedureInfo(ctx, procedureType) {
  const text = INFO_TEXTS[procedureType];
  if (!text) return;

  const keyboard = Markup.inlineKeyboard([
    [Markup.button.callback('Перейти к подготовке', `short_procedure_info:continue:${procedureType}`)],
    [Markup.button.callback('Назад', 'short_procedure_info:back')],
  ]);

  await sendScreen(ctx, text, keyboard);
}

module.exports = { showShortProcedureInfo };
