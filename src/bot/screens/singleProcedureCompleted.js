const { Markup } = require('telegraf');

const SINGLE_PROCEDURE_COMPLETED_TEXT =
  'Пробная процедура завершена.\n\n' +
  'Вы прошли одну оплаченную процедуру NeuroTech Quit.\n\n' +
  'Для продолжения полного протокола нужен полный доступ. ' +
  'В полном доступе следующие процедуры открываются поэтапно, с нужными интервалами, ' +
  'а Альфа-процедура доступна как поддержка состояния.\n\n' +
  'Если хотите продолжить работу по протоколу, откройте полный доступ.';

const singleProcedureCompletedKeyboard = Markup.inlineKeyboard([
  [Markup.button.callback('Доплатить до полного доступа — 3 910 ₽', 'single_completed:upgrade')],
  [Markup.button.callback('Главное меню', 'single_completed:menu')],
]);

async function showSingleProcedureCompleted(ctx) {
  try {
    await ctx.editMessageText(SINGLE_PROCEDURE_COMPLETED_TEXT, singleProcedureCompletedKeyboard);
  } catch {
    await ctx.reply(SINGLE_PROCEDURE_COMPLETED_TEXT, singleProcedureCompletedKeyboard);
  }
}

module.exports = { showSingleProcedureCompleted };
