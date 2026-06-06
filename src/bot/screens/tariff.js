const { Markup } = require('telegraf');

const TARIFF_TEXT_NEW =
  'Выберите формат доступа к NeuroTech Quit.\n\n' +
  'Вы можете начать с одной процедуры, чтобы попробовать первый этап протокола, или сразу открыть полный доступ ко всем основным процедурам и поддерживающей Альфа-процедуре.\n\n' +
  'Одна процедура за 990 ₽ включает:\n' +
  '— первую основную процедуру «Анти-табак».\n\n' +
  'Полный доступ за 4 900 ₽ открывает прохождение основного протокола и дополнительные процедуры по правилам доступа.';

const TARIFF_TEXT_UPGRADE =
  'У вас уже есть оплаченный доступ к одной процедуре.\n\n' +
  'Вы можете оплатить следующую процедуру или доплатить до полного доступа ко всему протоколу и неограниченной Альфа-процедуре.';

const tariffKeyboardNew = Markup.inlineKeyboard([
  [Markup.button.callback('Одна процедура — 990 ₽', 'tariff:single')],
  [Markup.button.callback('Полный доступ — 4 900 ₽', 'tariff:full')],
]);

const tariffKeyboardUpgrade = Markup.inlineKeyboard([
  [Markup.button.callback('Оплатить следующую процедуру — 990 ₽', 'tariff:single_next')],
  [Markup.button.callback('Доплатить до полного доступа — 3 910 ₽', 'tariff:upgrade')],
]);

const TARIFF_TEXT_FULL_ACCESS =
  'У вас уже открыт полный доступ. Перейдите в раздел «Мой доступ», чтобы продолжить протокол.';

const tariffKeyboardFullAccess = Markup.inlineKeyboard([
  [Markup.button.callback('Мой доступ', 'my_access:show')],
]);

async function showTariff(ctx, user = null) {
  if (user?.access_type === 'full_access') {
    try {
      await ctx.editMessageText(TARIFF_TEXT_FULL_ACCESS, tariffKeyboardFullAccess);
    } catch {
      await ctx.reply(TARIFF_TEXT_FULL_ACCESS, tariffKeyboardFullAccess);
    }
    return;
  }

  const isUpgrade = user?.access_type === 'single_procedure';
  const text = isUpgrade ? TARIFF_TEXT_UPGRADE : TARIFF_TEXT_NEW;
  const keyboard = isUpgrade ? tariffKeyboardUpgrade : tariffKeyboardNew;

  try {
    await ctx.editMessageText(text, keyboard);
  } catch {
    await ctx.reply(text, keyboard);
  }
}

module.exports = { showTariff };
