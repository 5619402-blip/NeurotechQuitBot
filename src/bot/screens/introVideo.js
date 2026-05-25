const path = require('path');
const { Markup } = require('telegraf');
const { setLastBotMessageId } = require('../../db/users');

const INTRO_VIDEO_TEXT =
  'Посмотрите короткое объяснение, как формируется никотиновая зависимость и как работает NeuroTech Quit.';

const INTRO_VIDEO_PATH = path.join(__dirname, '../../../media/intro_neurotech_quit_h264.mp4');

const INTRO_VIDEO_CAPTION = 'Когда будете готовы, переходите к короткой диагностике.';

const introVideoKeyboard = Markup.inlineKeyboard([
  [Markup.button.callback('Смотреть', 'intro_video:watch')],
  [Markup.button.callback('Смотреть отзывы', 'intro_video:reviews')],
  [Markup.button.callback('Назад', 'intro_video:back')],
]);

const introVideoAfterWatchKeyboard = Markup.inlineKeyboard([
  [Markup.button.callback('Пройти диагностику', 'intro_video:diagnostic')],
  [Markup.button.callback('Назад', 'intro_video:back')],
]);

async function showIntroVideo(ctx) {
  try {
    await ctx.editMessageText(INTRO_VIDEO_TEXT, introVideoKeyboard);
  } catch {
    await ctx.reply(INTRO_VIDEO_TEXT, introVideoKeyboard);
  }
}

async function showIntroVideoWatch(ctx) {
  try {
    await ctx.deleteMessage();
  } catch {
    // сообщение уже удалено или недоступно
  }

  const msg = await ctx.replyWithVideo(
    { source: INTRO_VIDEO_PATH },
    {
      caption: INTRO_VIDEO_CAPTION,
      ...introVideoAfterWatchKeyboard,
    }
  );

  if (ctx.from?.id && msg?.message_id) {
    setLastBotMessageId(ctx.from.id, msg.message_id).catch(() => {});
  }
}

module.exports = { showIntroVideo, showIntroVideoWatch };
