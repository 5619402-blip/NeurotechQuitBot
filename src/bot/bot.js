const { Telegraf } = require('telegraf');
const config = require('../config');
const { setLastBotMessageId } = require('../db/users');
const registerStart = require('./handlers/start');
const registerCallbacks = require('./handlers/callbacks');
const registerAdmin = require('./handlers/admin');
const { handleGiftCommand, handleAdminPreviewCommand } = registerAdmin;

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

bot.use(async (ctx, next) => {
  console.log('[update]', ctx.updateType, ctx.message?.text?.slice(0, 60), 'from:', ctx.from?.id);
  return next();
});

bot.use(async (ctx, next) => {
  const text = ctx.message?.text;
  if (!text) return next();
  const first = text.trim().split(/\s+/)[0].toLowerCase();
  if (first === '/gift' || first === '/gift@neurotechquitbot') return handleGiftCommand(ctx);
  if (first === '/admin_preview' || first === '/admin_preview@neurotechquitbot') return handleAdminPreviewCommand(ctx);
  return next();
});

console.log('[bot] before registerStart');
registerStart(bot);
console.log('[bot] after registerStart');

console.log('[bot] before registerAdmin');
try {
  registerAdmin(bot);
  console.log('[bot] after registerAdmin');
} catch (err) {
  console.error('[bot] registerAdmin failed:', err.message, err.stack);
  throw err;
}

console.log('[bot] before registerCallbacks');
registerCallbacks(bot);
console.log('[bot] after registerCallbacks');

module.exports = { bot };
