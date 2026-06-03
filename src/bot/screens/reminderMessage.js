const { Markup } = require('telegraf');

const PROCEDURE_NAMES = {
  quick_lever:        'Быстрый рычаг',
  anti_tobacco:       'Антитабак',
  short_quick_lever:  'Закрепление: Быстрый рычаг',
  short_anti_tobacco: 'Закрепление: Антитабак',
};

const REMINDER_SUFFIX =
  '\n\nВы можете продолжить, когда будете готовы. ' +
  'Лучше выбрать спокойное время, надеть наушники и пройти процедуру без пауз и отвлечений.';

function buildReminderText(procedureType) {
  const name = procedureType ? PROCEDURE_NAMES[procedureType] : null;
  if (name) {
    return (
      'Следующий этап протокола уже доступен.\n\n' +
      `Открылся этап: ${name}.` +
      REMINDER_SUFFIX
    );
  }
  return 'Следующий этап протокола уже доступен.' + REMINDER_SUFFIX;
}

function buildReminderKeyboard(reminderId) {
  return Markup.inlineKeyboard([
    [Markup.button.callback('Пройти следующую процедуру', `reminder:continue:${reminderId}`)],
    [Markup.button.callback('Я уже бросил курить', `reminder:not_smoking:${reminderId}`)],
    [Markup.button.callback('Не хочу продолжать', `reminder:no_continue:${reminderId}`)],
  ]);
}

module.exports = { buildReminderText, buildReminderKeyboard };
