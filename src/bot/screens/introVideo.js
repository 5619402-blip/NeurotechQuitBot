const path = require('path');
const { Markup } = require('telegraf');
const { setLastBotMessageId, getUserByTelegramId } = require('../../db/users');
const { INTRO_VIDEO_FILE_ID } = require('../../config/media');

// Клиент с доступом уже прошёл диагностику и оплатил — воронка новичка
// («Пройти диагностику», «Назад» на приветствие) ему не показывается.
async function isClientUser(ctx) {
  const user = await getUserByTelegramId(ctx.from.id).catch(() => null);
  return user?.access_type === 'single_procedure' || user?.access_type === 'full_access';
}

const INTRO_VIDEO_TEXT =
  'Посмотрите короткое объяснение, как формируется никотиновая зависимость и как работает NeuroTech Quit.';

const INTRO_VIDEO_PATH = path.join(__dirname, '../../../media/intro_neurotech_quit_h264.mp4');

const INTRO_VIDEO_CAPTION = 'Когда будете готовы, переходите к короткой диагностике.';

function buildIntroVideoKeyboard(isClient) {
  const rows = [
    [Markup.button.callback('Смотреть', 'intro_video:watch')],
    [Markup.button.callback('Смотреть отзывы', 'intro_video:reviews')],
    [Markup.button.callback('Назад', 'intro_video:back')],
  ];
  return Markup.inlineKeyboard(rows);
}

// Клавиатура под видео: клиент видит только «Назад», новичок — плюс «Пройти диагностику»
function buildAfterWatchInlineKeyboard(isClient) {
  const rows = [];
  if (!isClient) rows.push([{ text: 'Пройти диагностику', callback_data: 'intro_video:diagnostic' }]);
  rows.push([{ text: 'Назад', callback_data: 'intro_video:back' }]);
  return rows;
}

async function showIntroVideo(ctx) {
  const isClient = await isClientUser(ctx);
  const keyboard = buildIntroVideoKeyboard(isClient);
  try {
    await ctx.editMessageText(INTRO_VIDEO_TEXT, keyboard);
  } catch {
    await ctx.reply(INTRO_VIDEO_TEXT, keyboard);
  }
}

async function showIntroVideoWatch(ctx) {
  try {
    await ctx.deleteMessage();
  } catch {
    // сообщение уже удалено или недоступно
  }

  const isClient = await isClientUser(ctx);
  const useLocal = process.env.USE_LOCAL_MEDIA === 'true';
  const videoSource = useLocal ? { source: INTRO_VIDEO_PATH } : INTRO_VIDEO_FILE_ID;
  console.log(`[introVideo] source=${useLocal ? 'local_file' : 'telegram_file_id'}`);

  try {
    const msg = await ctx.replyWithVideo(
      videoSource,
      {
        caption: INTRO_VIDEO_CAPTION,
        reply_markup: {
          inline_keyboard: buildAfterWatchInlineKeyboard(isClient),
        },
      }
    );
    if (ctx.from?.id && msg?.message_id) {
      setLastBotMessageId(ctx.from.id, msg.message_id).catch(() => {});
    }
  } catch (err) {
    console.error('[introVideo] replyWithVideo:', err.message);
    await ctx.reply('Не удалось загрузить видео. Попробуйте ещё раз.').catch(() => {});
  }
}

module.exports = { showIntroVideo, showIntroVideoWatch };
