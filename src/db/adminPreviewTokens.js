const { randomUUID } = require('crypto');
const db = require('./connection');

const PREVIEW_TTL_MS = 2 * 60 * 60 * 1000;
const PREVIEW_MAX_USES = 10;

async function createAdminPreviewToken(adminUserId, procedureType) {
  const token = randomUUID();
  const now = new Date();
  const expiresAt = new Date(Date.now() + PREVIEW_TTL_MS);
  const [row] = await db('admin_preview_tokens')
    .insert({
      token,
      admin_user_id: adminUserId,
      procedure_type: procedureType,
      expires_at: expiresAt,
      use_count: 0,
      max_uses: PREVIEW_MAX_USES,
      is_revoked: false,
      created_at: now,
      updated_at: now,
    })
    .returning('*');
  return row;
}

async function getAdminPreviewToken(token) {
  const row = await db('admin_preview_tokens').where({ token }).first();
  return row ?? null;
}

async function incrementAdminPreviewUseCount(tokenId) {
  await db('admin_preview_tokens')
    .where({ id: tokenId })
    .update({
      use_count: db.raw('use_count + 1'),
      updated_at: new Date(),
    });
}

module.exports = { createAdminPreviewToken, getAdminPreviewToken, incrementAdminPreviewUseCount };
