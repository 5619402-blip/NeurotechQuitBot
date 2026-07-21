const { randomUUID } = require('crypto');
const db = require('./connection');

async function createPlayerToken(userId, sessionId) {
  try {
    const token = randomUUID();
    // TTL 2 часа (раздел 8 ТЗ). Ссылка многоразовая в пределах TTL,
    // пока procedure_session остаётся в статусе started.
    const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000);
    const [row] = await db('player_tokens')
      .insert({
        user_id: userId,
        procedure_session_id: sessionId,
        token,
        expires_at: expiresAt,
      })
      .returning('*');
    return row;
  } catch (err) {
    console.error('[db] createPlayerToken:', err.message);
    return null;
  }
}

async function getPlayerToken(token) {
  try {
    const row = await db('player_tokens as pt')
      .join('procedure_sessions as ps', 'ps.id', 'pt.procedure_session_id')
      .join('procedures as p', 'p.id', 'ps.procedure_id')
      .join('audio_files as af', 'af.procedure_id', 'p.id')
      .where('pt.token', token)
      .where('af.is_active', true)
      .select(
        'pt.id as token_id',
        'pt.token',
        'pt.expires_at',
        'pt.used_at',
        'pt.is_revoked',
        'ps.id as session_id',
        'ps.session_status',
        'p.procedure_type',
        'af.storage_provider',
        'af.storage_path'
      )
      .first();
    return row ?? null;
  } catch (err) {
    console.error('[db] getPlayerToken:', err.message);
    return null;
  }
}

async function getTokenForLaunch(token) {
  try {
    const row = await db('player_tokens as pt')
      .join('procedure_sessions as ps', 'ps.id', 'pt.procedure_session_id')
      .join('procedures as p', 'p.id', 'ps.procedure_id')
      .where('pt.token', token)
      .select(
        'pt.id as token_id',
        'pt.expires_at',
        'pt.used_at',
        'pt.is_revoked',
        'ps.id as session_id',
        'ps.session_status',
        'p.procedure_type'
      )
      .first();
    return row ?? null;
  } catch (err) {
    console.error('[db] getTokenForLaunch:', err.message);
    return null;
  }
}

// Отмечает первое открытие ссылки (аналитика). Не блокирует повторные открытия.
async function markTokenUsed(token) {
  try {
    const count = await db('player_tokens')
      .where({ token, is_revoked: false })
      .whereNull('used_at')
      .update({ used_at: new Date() });
    return count;
  } catch (err) {
    console.error('[db] markTokenUsed:', err.message);
    return 0;
  }
}

module.exports = { createPlayerToken, getPlayerToken, getTokenForLaunch, markTokenUsed };
