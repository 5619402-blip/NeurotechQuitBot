const { Markup } = require('telegraf');

const REMINDER_TEXT =
  'Напоминание о следующей процедуре\n\n' +
  'Пришло время для следующей процедуры NeuroTech Quit. ' +
  'Чем раньше вы её пройдёте, тем устойчивее результат.';

function buildReminderKeyboard(reminderId) {
  return Markup.inlineKeyboard([
    [Markup.button.callback('Пройти следующую процедуру', `reminder:continue:${reminderId}`)],
    [Markup.button.callback('Я уже бросил курить', `reminder:not_smoking:${reminderId}`)],
    [Markup.button.callback('Не хочу продолжать', `reminder:no_continue:${reminderId}`)],
  ]);
}

module.exports = { REMINDER_TEXT, buildReminderKeyboard };
