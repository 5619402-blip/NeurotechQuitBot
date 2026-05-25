const { randomUUID } = require('crypto');
const db = require('./connection');

async function createPlayerToken(userId, sessionId) {
  try {
    const token = randomUUID();
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
      .join('audio_files as af', function () {
        this.on('af.procedure_id', '=', 'p.id').andOnVal('af.is_active', true);
      })
      .where('pt.token', token)
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

module.exports = { createPlayerToken, getPlayerToken };
