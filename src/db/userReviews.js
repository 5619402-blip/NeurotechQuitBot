const db = require('./connection');

async function createUserReview(userId, reviewType, text, reviewContext) {
  const [row] = await db('user_reviews').insert({
    user_id: userId,
    review_type: reviewType,
    text: text || null,
    review_context: reviewContext || null,
    uploaded_at: db.fn.now(),
    moderation_status: 'pending',
  }).returning('*');
  return row;
}

async function getPendingReviews() {
  return db('user_reviews')
    .where({ moderation_status: 'pending' })
    .orderBy('created_at', 'asc')
    .select('id', 'user_id', 'review_type', 'text', 'review_context', 'created_at');
}

async function updateReviewModerationStatus(id, status) {
  return db('user_reviews').where({ id }).update({ moderation_status: status });
}

module.exports = { createUserReview, getPendingReviews, updateReviewModerationStatus };
