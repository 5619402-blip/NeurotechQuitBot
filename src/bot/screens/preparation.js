const { Markup } = require('telegraf');

const PROCEDURE_NAMES = {
  anti_tobacco: 'Анти-табак',
  quick_lever:  'Быстрый рычаг',
  alpha:        'Альфа-процедура',
};

const ALPHA_UNAVAILABLE_TEXT =
  'Альфа-процедура сейчас недоступна. ' +
  'Вы уже использовали доступные Альфа-сессии или она не входит в ваш текущий доступ.';

const alphaUnavailableKeyboard = Markup.inlineKeyboard([
  [Markup.button.callback('Мой доступ', 'my_access:show')],
  [Markup.button.callback('Поддержка', 'my_access:support')],
]);

const FULL_PREP_ITEMS =
  '1. Последний контакт с никотином, предусмотренный протоколом, завершён непосредственно перед ' +
  'процедурой, не за час и не за два, а перед началом сессии, как прощальный ритуал.\n' +
  '2. Вы собрали и выбросили все курительные принадлежности и триггеры из дома: сигареты, стики, ' +
  'вейпы, нагреватели, зажигалки, спички и всё, что может вернуть старый сценарий.\n' +
  '3. В доме не осталось курительных триггеров.\n' +
  '4. Вы в трезвом и спокойном состоянии.\n' +
  '5. Вы выбрали спокойное место, желательно тёмную комнату, где вас никто не будет отвлекать.\n' +
  '6. Телефон выключен или убран, уведомления и внешние раздражители отключены.\n' +
  '7. Вы сидите удобно, не лежите.\n' +
  '8. Наушники надеты.\n' +
  '9. Вы готовы пройти процедуру полностью и без остановок.';

const SHORT_PREP_ITEMS =
  '1. Спокойное место.\n' +
  '2. Телефон убран.\n' +
  '3. Вы сидите удобно.\n' +
  '4. Наушники надеты.\n' +
  '5. Готовы пройти процедуру полностью и без остановок.';

function buildPreparationText(procedureType, isFirstProcedure) {
  const name = PROCEDURE_NAMES[procedureType] ?? procedureType;
  const items = isFirstProcedure ? FULL_PREP_ITEMS : SHORT_PREP_ITEMS;
  return `Подготовка к процедуре «${name}»\n\n${items}`;
}

function buildPreparationKeyboard(procedureType, isFirstProcedure) {
  const needCallback = isFirstProcedure
    ? `preparation:need_first:${procedureType}`
    : `preparation:need_next:${procedureType}`;
  return Markup.inlineKeyboard([
    [Markup.button.callback('Да, я готов', `preparation:ready:${procedureType}`)],
    [Markup.button.callback('Мне нужно подготовиться', needCallback)],
    [Markup.button.callback('Назад', 'preparation:back')],
  ]);
}

function buildHelperText(isFirstProcedure) {
  let text =
    'Подготовьтесь спокойно и возвращайтесь, когда будете готовы пройти процедуру полностью ' +
    'без остановок.';
  if (isFirstProcedure) {
    text +=
      '\n\nПеред первой процедурой важно завершить последний контакт с никотином непосредственно ' +
      'перед сессией и убрать все курительные триггеры из дома.';
  }
  return text;
}

function buildHelperKeyboard(procedureType) {
  return Markup.inlineKeyboard([
    [Markup.button.callback('Я готов', `preparation:ready:${procedureType}`)],
    [Markup.button.callback('Вернуться в Мой доступ', 'preparation:back')],
  ]);
}

async function sendScreen(ctx, text, keyboard) {
  try {
    await ctx.editMessageText(text, keyboard);
  } catch {
    await ctx.reply(text, keyboard);
  }
}

async function showPreparation(ctx, { isFirstProcedure, procedureType }) {
  const text = buildPreparationText(procedureType, isFirstProcedure);
  const keyboard = buildPreparationKeyboard(procedureType, isFirstProcedure);
  await sendScreen(ctx, text, keyboard);
}

async function showAlphaUnavailable(ctx) {
  await sendScreen(ctx, ALPHA_UNAVAILABLE_TEXT, alphaUnavailableKeyboard);
}

async function showHelperText(ctx, { procedureType, isFirstProcedure }) {
  const text = buildHelperText(isFirstProcedure);
  const keyboard = buildHelperKeyboard(procedureType);
  await sendScreen(ctx, text, keyboard);
}

module.exports = { showPreparation, showAlphaUnavailable, showHelperText };
