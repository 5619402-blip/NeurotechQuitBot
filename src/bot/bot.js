const { Telegraf } = require('telegraf');
const config = require('../config');
const { setLastBotMessageId } = require('../db/users');
const registerStart = require('./handlers/start');
const registerCallbacks = require('./handlers/callbacks');
const registerAdmin = require('./handlers/admin');

const bot = new Telegraf(config.botToken);

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

registerStart(bot);
registerAdmin(bot);
registerCallbacks(bot);

module.exports = { bot };
