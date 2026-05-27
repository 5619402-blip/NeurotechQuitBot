const db = require('./connection');

async function getActiveReviews() {
  return db('reviews')
    .where({ is_active: true })
    .orderBy('sort_order', 'asc')
    .select('id', 'title', 'client_name', 'description', 'source', 'file_url', 'telegram_file_id', 'sort_order', 'is_active');
}

module.exports = { getActiveReviews };
