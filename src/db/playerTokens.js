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

    // TEMP DIAGNOSTIC — удалить после отладки на Bothost
    if (!row) {
      await _diagnosePlayerToken(token);
    }
    // END TEMP DIAGNOSTIC

    return row ?? null;
  } catch (err) {
    console.error('[db] getPlayerToken:', err.message);
    return null;
  }
}

// TEMP DIAGNOSTIC — удалить после отладки на Bothost
async function _diagnosePlayerToken(token) {
  const prefix = token.slice(0, 8);
  try {
    const pt = await db('player_tokens').where({ token }).select('id', 'procedure_session_id').first();
    if (!pt) {
      console.log(`[diagnose ${prefix}...] player_token: не найден`);
      return;
    }
    console.log(`[diagnose ${prefix}...] player_token: id=${pt.id}, session_id=${pt.procedure_session_id}`);

    const ps = await db('procedure_sessions').where({ id: pt.procedure_session_id }).select('id', 'procedure_id', 'session_status').first();
    if (!ps) {
      console.log(`[diagnose ${prefix}...] procedure_session: не найдена (id=${pt.procedure_session_id})`);
      return;
    }
    console.log(`[diagnose ${prefix}...] procedure_session: id=${ps.id}, procedure_id=${ps.procedure_id}, status=${ps.session_status}`);

    const p = await db('procedures').where({ id: ps.procedure_id }).select('id', 'procedure_type', 'is_active').first();
    if (!p) {
      console.log(`[diagnose ${prefix}...] procedure: не найдена (id=${ps.procedure_id})`);
      return;
    }
    console.log(`[diagnose ${prefix}...] procedure: id=${p.id}, type=${p.procedure_type}, active=${p.is_active}`);

    const allAf = await db('audio_files').where({ procedure_id: p.id }).select('id', 'is_active', 'storage_path');
    if (!allAf.length) {
      console.log(`[diagnose ${prefix}...] audio_files: нет записей для procedure_id=${p.id} — нужно запустить seed 02`);
      return;
    }
    const activeAf = allAf.find(r => r.is_active);
    if (!activeAf) {
      console.log(`[diagnose ${prefix}...] audio_files: ${allAf.length} записей, но ни одна не активна (is_active=false)`);
    } else {
      console.log(`[diagnose ${prefix}...] audio_files: активная запись id=${activeAf.id}, storage_path=${activeAf.storage_path ? `'${activeAf.storage_path}'` : 'ПУСТО'}`);
    }
  } catch (err) {
    console.error('[diagnose] ошибка:', err.message);
  }
}
// END TEMP DIAGNOSTIC

module.exports = { createPlayerToken, getPlayerToken };
