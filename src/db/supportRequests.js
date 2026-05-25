const db = require('./connection');

async function createSupportRequest(userId, messageText, { screen, accessType } = {}) {
  try {
    const existing = await db('support_requests')
      .where({
        user_id: userId,
        current_screen: screen ?? null,
        message_text: messageText,
        support_status: 'new',
      })
      .first();
    if (existing) return existing;

    const [row] = await db('support_requests')
      .insert({
        user_id: userId,
        message_text: messageText,
        current_screen: screen ?? null,
        access_type: accessType ?? null,
        support_status: 'new',
      })
      .returning('*');
    return row;
  } catch (err) {
    console.error('[db] createSupportRequest:', err.message);
    return null;
  }
}

module.exports = { createSupportRequest };
