const { Telegraf } = require('telegraf');
const config = require('../config');
const { setLastBotMessageId } = require('../db/users');
const registerStart = require('./handlers/start');
const registerCallbacks = require('./handlers/callbacks');
const registerAdmin = require('./handlers/admin');
const { handleGiftCommand, handleAdminPreviewCommand, handleAdminCommand } = registerAdmin;

const bot = new Telegraf(config.botToken);

bot.catch((err, ctx) => {
  console.error('[bot] unhandled error update_id=%d: %s', ctx.update?.update_id, err.message);
});

// Перехватывает ctx.reply глобально: после каждого нового сообщения сохраняет
// message_id как last_bot_message_id. Покрывает /start-fallback и callback-fallback.
bot.use(async (ctx, next) => {
  const originalReply = ctx.reply.bind(ctx);
  ctx.reply = async (...args) => {
    const msg = await originalReply(...args);
    if (ctx.from?.id && msg?.message_id) {
      setLastBotMessageId(ctx.from.id, msg.message_id).catch(() => {});
    }
    return msg;
  };

  const originalEdit = ctx.editMessageText.bind(ctx);
  ctx.editMessageText = async (...args) => {
    const msg = await originalEdit(...args);
    if (ctx.from?.id && msg?.message_id) {
      setLastBotMessageId(ctx.from.id, msg.message_id).catch(() => {});
    }
    return msg;
  };

  return next();
});

bot.use(async (ctx, next) => {
  const text = ctx.message?.text;
  if (!text) return next();
  const first = text.trim().split(/\s+/)[0].toLowerCase();
  if (first === '/gift' || first === '/gift@neurotechquitbot') return handleGiftCommand(ctx);
  if (first === '/admin_preview' || first === '/admin_preview@neurotechquitbot') return handleAdminPreviewCommand(ctx);
  if (first === '/admin' || first === '/admin@neurotechquitbot') return handleAdminCommand(ctx);
  return next();
});

registerStart(bot);
registerAdmin(bot);
registerCallbacks(bot);

module.exports = { bot };
