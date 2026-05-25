const { Markup } = require('telegraf');

const LEAVE_REVIEW_TEXT =
  'Спасибо, что прошли NeuroTech Quit. Вы можете оставить отзыв о своём опыте.';

const LEAVE_REVIEW_STUB_TEXT =
  'Этот формат отзывов будет доступен позже. Сейчас вы можете оставить текстовый отзыв.';

const leaveReviewKeyboard = Markup.inlineKeyboard([
  [Markup.button.callback('Текстовый отзыв', 'leave_review:text')],
  [Markup.button.callback('Видеоотзыв', 'leave_review:video')],
  [Markup.button.callback('Аудиоотзыв', 'leave_review:audio')],
  [Markup.button.callback('Пропустить', 'leave_review:skip')],
]);

const reviewStubKeyboard = Markup.inlineKeyboard([
  [Markup.button.callback('Оставить текстовый отзыв', 'leave_review:text')],
  [Markup.button.callback('Назад', 'leave_review:back')],
]);

const reviewTextPromptKeyboard = Markup.inlineKeyboard([
  [Markup.button.callback('Отмена', 'leave_review:cancel')],
]);

async function showLeaveReview(ctx) {
  try {
    await ctx.editMessageText(LEAVE_REVIEW_TEXT, leaveReviewKeyboard);
  } catch {
    await ctx.reply(LEAVE_REVIEW_TEXT, leaveReviewKeyboard);
  }
}

async function showLeaveReviewStub(ctx) {
  try {
    await ctx.editMessageText(LEAVE_REVIEW_STUB_TEXT, reviewStubKeyboard);
  } catch {
    await ctx.reply(LEAVE_REVIEW_STUB_TEXT, reviewStubKeyboard);
  }
}

async function showReviewTextPrompt(ctx) {
  const text = 'Напишите ваш отзыв одним сообщением. Мы его прочитаем и, если всё в порядке, опубликуем.';
  try {
    await ctx.editMessageText(text, reviewTextPromptKeyboard);
  } catch {
    await ctx.reply(text, reviewTextPromptKeyboard);
  }
}

module.exports = { showLeaveReview, showLeaveReviewStub, showReviewTextPrompt };
