const { BlacklistedToken } = require("../models");
const { Op } = require("sequelize");
async function addBlacklistedToken(token, expiresAt, reason = null) {
  return await BlacklistedToken.create({
    token,
    expires_at: expiresAt,
    reason,
  });
}

/**
 * Get all blacklisted tokens
 */
async function getAllBlacklistedTokens() {
  return await BlacklistedToken.findAll();
}

/**
 * Check if a token is blacklisted
 */
async function isTokenBlacklisted(token) {
  const record = await BlacklistedToken.findOne({
    where: {
      token,
      expires_at: { [Op.gt]: new Date() }, // Still valid
    },
  });
  return Boolean(record); // Same as !!entry, but more readable
}

/**
 * Delete expired tokens
 */
async function deleteExpiredTokens() {
  return await BlacklistedToken.destroy({
    where: {
      expires_at: {
        [Op.lt]: new Date(),
      },
    },
  });
}

module.exports = {
  addBlacklistedToken,
  getAllBlacklistedTokens,
  isTokenBlacklisted,
  deleteExpiredTokens,
};
