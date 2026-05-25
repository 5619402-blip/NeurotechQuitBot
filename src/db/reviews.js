const db = require('./connection');

async function getActiveReviews() {
  return db('reviews')
    .where({ is_active: true })
    .orderBy('sort_order', 'asc')
    .select('title', 'client_name', 'description', 'source');
}

module.exports = { getActiveReviews };
