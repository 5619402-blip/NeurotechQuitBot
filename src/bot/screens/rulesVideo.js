const path = require('path');
const { Markup } = require('telegraf');
const { setLastBotMessageId } = require('../../db/users');

const RULES_VIDEO_TEXT =
  'Перед процедурой посмотрите короткие правила. Это важно для корректного прохождения.';

const RULES_VIDEO_PATH = path.join(__dirname, '../../../media/rules_neurotech_quit_h264.mp4');

const RULES_VIDEO_CAPTION = 'Когда будете готовы, переходите к подготовке процедуры.';

const rulesVideoKeyboard = Markup.inlineKeyboard([
  [Markup.button.callback('Смотреть', 'rules_video:watch')],
  [Markup.button.callback('Назад', 'rules_video:back')],
]);

const rulesVideoAfterWatchKeyboard = Markup.inlineKeyboard([
  [Markup.button.callback('Перейти к подготовке', 'rules_video:to_preparation')],
  [Markup.button.callback('Назад', 'rules_video:back')],
]);

async function showRulesVideo(ctx) {
  try {
    await ctx.editMessageText(RULES_VIDEO_TEXT, rulesVideoKeyboard);
  } catch {
    await ctx.reply(RULES_VIDEO_TEXT, rulesVideoKeyboard);
  }
}

async function showRulesVideoWatch(ctx) {
  try {
    await ctx.deleteMessage();
  } catch {
    // сообщение уже удалено или недоступно
  }

  const msg = await ctx.replyWithVideo(
    { source: RULES_VIDEO_PATH },
    {
      caption: RULES_VIDEO_CAPTION,
      ...rulesVideoAfterWatchKeyboard,
    }
  );

  return msg;
}

module.exports = { showRulesVideo, showRulesVideoWatch };
