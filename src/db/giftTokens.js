const crypto = require('crypto');
const db = require('./connection');

const ACCESS_RIGHTS_CONFIG = {
  gift_single_procedure: {
    access_type: 'single_procedure',
    access_status: 'active',
    paid_main_procedures_count: 1,
    used_main_procedures_count: 0,
    available_alpha_sessions_count: 1,
    used_alpha_sessions_count: 0,
    upgrade_available: true,
    upgrade_amount: 3910,
  },
  gift_full_access: {
    access_type: 'full_access',
    access_status: 'active',
    paid_main_procedures_count: 0,
    used_main_procedures_count: 0,
    available_alpha_sessions_count: null,
    used_alpha_sessions_count: 0,
    upgrade_available: false,
    upgrade_amount: null,
  },
  gift_alpha: {
    access_type: 'none',
    access_status: 'active',
    paid_main_procedures_count: 0,
    used_main_procedures_count: 0,
    available_alpha_sessions_count: 1,
    used_alpha_sessions_count: 0,
    upgrade_available: false,
    upgrade_amount: null,
  },
  gift_test_access: {
    access_type: 'full_access',
    access_status: 'active',
    paid_main_procedures_count: 0,
    used_main_procedures_count: 0,
    available_alpha_sessions_count: null,
    used_alpha_sessions_count: 0,
    upgrade_available: false,
    upgrade_amount: null,
  },
};

async function createGiftToken({ adminId, giftAccessType, expiresAt, adminComment }) {
  const token = 'gift_' + crypto.randomBytes(8).toString('hex');
  const [row] = await db('gift_access_tokens')
    .insert({
      token,
      created_by_admin_id: adminId,
      gift_access_type: giftAccessType,
      expires_at: expiresAt,
      status: 'active',
      admin_comment: adminComment || null,
      created_at: db.fn.now(),
    })
    .returning('*');
  return row;
}

async function getGiftTokenByToken(token) {
  try {
    return await db('gift_access_tokens').where({ token }).first() ?? null;
  } catch (err) {
    console.error('[db] getGiftTokenByToken:', err.message);
    return null;
  }
}

// Атомарная активация: UPDATE WHERE status='active' AND expires_at > now()
// Защита от гонки: если два запроса одновременно, победит только первый (affected rows = 1)
// Возвращает активированную строку или null, если токен уже использован/истёк/не найден
async function activateGiftToken(token, userId) {
  try {
    const rows = await db('gift_access_tokens')
      .where({ token, status: 'active' })
      .where('expires_at', '>', db.fn.now())
      .update({
        status: 'used',
        activated_by_user_id: userId,
        activated_at: db.fn.now(),
      })
      .returning('*');
    return rows.length > 0 ? rows[0] : null;
  } catch (err) {
    console.error('[db] activateGiftToken:', err.message);
    return null;
  }
}

async function createGiftAccessRights(userId, giftAccessType) {
  const cfg = ACCESS_RIGHTS_CONFIG[giftAccessType];
  if (!cfg) throw new Error(`Unknown giftAccessType: ${giftAccessType}`);
  await db('access_rights').insert({
    user_id: userId,
    payment_id: null,
    ...cfg,
    created_at: db.fn.now(),
    updated_at: db.fn.now(),
  });
}

module.exports = {
  createGiftToken,
  getGiftTokenByToken,
  activateGiftToken,
  createGiftAccessRights,
};
