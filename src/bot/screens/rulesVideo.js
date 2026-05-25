const path = require('path');
const { Markup } = require('telegraf');
const { setLastBotMessageId } = require('../../db/users');
const { RULES_VIDEO_FILE_ID } = require('../../config/media');

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

  const useLocal = process.env.USE_LOCAL_MEDIA === 'true';
  const videoSource = useLocal ? { source: RULES_VIDEO_PATH } : RULES_VIDEO_FILE_ID;
  console.log(`[rulesVideo] source=${useLocal ? 'local_file' : 'telegram_file_id'}`);

  try {
    const msg = await ctx.replyWithVideo(
      videoSource,
      {
        caption: RULES_VIDEO_CAPTION,
        reply_markup: {
          inline_keyboard: [
            [{ text: 'Перейти к подготовке', callback_data: 'rules_video:to_preparation' }],
            [{ text: 'Назад', callback_data: 'rules_video:back' }],
          ],
        },
      }
    );
    return msg;
  } catch (err) {
    console.error('[rulesVideo] replyWithVideo:', err.message);
    await ctx.reply('Не удалось загрузить видео. Попробуйте ещё раз.').catch(() => {});
    return null;
  }
}

module.exports = { showRulesVideo, showRulesVideoWatch };
