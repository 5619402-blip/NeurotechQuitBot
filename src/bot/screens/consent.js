const { Markup } = require('telegraf');

const CONSENT_TEXT =
  'Перед продолжением, пожалуйста, подтвердите согласие с условиями:\n\n' +
  '1. Я прохожу NeuroTech Quit добровольно и по собственному решению.\n' +
  '2. Я понимаю, что сервис не является медицинской услугой, не является лечением и не заменяет врача, психотерапевта, медицинскую диагностику или медицинскую помощь.\n' +
  '3. Я понимаю, что результат индивидуален и не гарантируется.\n' +
  '4. Я подтверждаю, что нахожусь в трезвом и спокойном состоянии и могу проходить аудиопроцедуру.\n' +
  '5. Я согласен(на) с правилами прохождения процедур, включая требование проходить аудио полностью и без остановок.\n' +
  '6. Я понимаю, что при прерывании процедуры, остановке, отвлечении или выходе из плеера NeuroTech не может гарантировать корректность результата этой сессии.\n' +
  '7. Я понимаю, что аудиофайлы не передаются мне и доступны только через защищённый плеер.\n' +
  '8. Я согласен(на) на обработку данных внутри сервиса для работы бота, диагностики, доступа, напоминаний и сопровождения прохождения протокола.\n' +
  '9. Я понимаю, что могу прекратить использование сервиса, но для корректного прохождения протокола важно следовать инструкциям.\n' +
  '10. Я подтверждаю, что ознакомился(лась) с условиями и хочу продолжить.';

const backCallbacks = {
  decision:      'consent:back_decision',
  low_readiness: 'consent:back_low_readiness',
  not_sure:      'consent:back_not_sure',
};

function buildConsentKeyboard(source) {
  return Markup.inlineKeyboard([
    [Markup.button.callback('Согласен, продолжить', 'consent:accept')],
    [Markup.button.callback('Назад', backCallbacks[source] ?? 'consent:back_decision')],
  ]);
}

async function showConsent(ctx, source) {
  const keyboard = buildConsentKeyboard(source);
  try {
    await ctx.editMessageText(CONSENT_TEXT, keyboard);
  } catch {
    await ctx.reply(CONSENT_TEXT, keyboard);
  }
}

module.exports = { showConsent };
