const { Markup } = require('telegraf');

const GIFT_ACTIVATED_TEXT = {
  gift_single_procedure:
    'Подарочный доступ активирован!\n\n' +
    'Вам открыта одна процедура основного протокола.\n\n' +
    'Нажмите «Продолжить», чтобы начать.',
  gift_full_access:
    'Подарочный доступ активирован!\n\n' +
    'Вам открыт полный доступ NeuroTech Quit без ограничений.\n\n' +
    'Нажмите «Продолжить», чтобы начать.',
  gift_alpha:
    'Подарочный доступ активирован!\n\n' +
    'Вам открыта одна Альфа-сессия.\n\n' +
    'Нажмите «Продолжить», чтобы начать.',
  gift_test_access:
    'Тестовый доступ активирован!\n\n' +
    'Вам открыт полный доступ NeuroTech Quit.\n\n' +
    'Нажмите «Продолжить», чтобы начать.',
};

async function showGiftAlreadyActive(ctx) {
  await ctx.reply(
    'У вас уже есть активный доступ. Подарочную ссылку нельзя активировать повторно.',
    Markup.inlineKeyboard([
      [Markup.button.callback('Мой доступ', 'my_access:show')],
      [Markup.button.callback('Главное меню', 'my_access:menu')],
    ])
  );
}

async function showGiftExpired(ctx) {
  await ctx.reply(
    'Эта подарочная ссылка уже была использована или её срок действия истёк.\n\nОбратитесь к тому, кто прислал вам ссылку.',
    Markup.inlineKeyboard([
      [Markup.button.callback('Главное меню', 'my_access:menu')],
      [Markup.button.callback('Пройти диагностику', 'welcome:diagnostic')],
    ])
  );
}

async function showGiftInvalid(ctx) {
  await ctx.reply(
    'Подарочная ссылка не найдена. Проверьте ссылку и попробуйте снова.',
    Markup.inlineKeyboard([
      [Markup.button.callback('Главное меню', 'my_access:menu')],
      [Markup.button.callback('Пройти диагностику', 'welcome:diagnostic')],
    ])
  );
}

async function showGiftActivated(ctx, giftAccessType) {
  const text = GIFT_ACTIVATED_TEXT[giftAccessType]
    ?? 'Подарочный доступ активирован!\n\nНажмите «Продолжить», чтобы начать.';
  await ctx.reply(
    text,
    Markup.inlineKeyboard([
      [Markup.button.callback('Продолжить', 'gift:continue')],
    ])
  );
}

module.exports = {
  showGiftAlreadyActive,
  showGiftExpired,
  showGiftInvalid,
  showGiftActivated,
};
