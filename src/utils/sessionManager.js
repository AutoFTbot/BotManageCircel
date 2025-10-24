const logger = require('./logger');

class SessionManager {
  constructor() {
    this.sessions = new Map();
  }

  /**
   * Create or update user session
   * @param {number} userId - User ID
   * @param {Object} sessionData - Session data
   */
  setSession(userId, sessionData) {
    try {
      const existingSession = this.sessions.get(userId) || {};
      const updatedSession = { ...existingSession, ...sessionData, updatedAt: Date.now() };
      this.sessions.set(userId, updatedSession);
      logger.debug('Session updated', { userId, sessionData });
    } catch (error) {
      logger.error('Failed to set session', { userId, error: error.message });
    }
  }

  /**
   * Get user session
   * @param {number} userId - User ID
   */
  getSession(userId) {
    try {
      const session = this.sessions.get(userId);
      if (session && this.isSessionValid(session)) {
        return session;
      }
      return null;
    } catch (error) {
      logger.error('Failed to get session', { userId, error: error.message });
      return null;
    }
  }

  /**
   * Clear user session
   * @param {number} userId - User ID
   */
  clearSession(userId) {
    try {
      this.sessions.delete(userId);
      logger.debug('Session cleared', { userId });
    } catch (error) {
      logger.error('Failed to clear session', { userId, error: error.message });
    }
  }

  /**
   * Check if session is valid (not expired)
   * @param {Object} session - Session object
   */
  isSessionValid(session) {
    const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
    return session.updatedAt && (Date.now() - session.updatedAt) < SESSION_TIMEOUT;
  }

  /**
   * Set current action for user
   * @param {number} userId - User ID
   * @param {string} action - Action name
   * @param {Object} data - Action data
   */
  setCurrentAction(userId, action, data = {}) {
    this.setSession(userId, {
      currentAction: action,
      actionData: data,
      step: 0
    });
  }

  /**
   * Get current action for user
   * @param {number} userId - User ID
   */
  getCurrentAction(userId) {
    const session = this.getSession(userId);
    return session ? session.currentAction : null;
  }

  /**
   * Update action data
   * @param {number} userId - User ID
   * @param {Object} data - Data to update
   */
  updateActionData(userId, data) {
    const session = this.getSession(userId);
    if (session) {
      this.setSession(userId, {
        actionData: { ...session.actionData, ...data }
      });
    }
  }

  /**
   * Get action data
   * @param {number} userId - User ID
   */
  getActionData(userId) {
    const session = this.getSession(userId);
    return session ? session.actionData : {};
  }

  /**
   * Set next step
   * @param {number} userId - User ID
   * @param {number} step - Step number
   */
  setStep(userId, step) {
    this.setSession(userId, { step });
  }

  /**
   * Get current step
   * @param {number} userId - User ID
   */
  getStep(userId) {
    const session = this.getSession(userId);
    return session ? session.step : 0;
  }

  /**
   * Set last message ID for user
   * @param {number} userId - User ID
   * @param {number} messageId - Message ID
   */
  setLastMessageId(userId, messageId) {
    this.setSession(userId, { lastMessageId: messageId });
  }

  /**
   * Get last message ID for user
   * @param {number} userId - User ID
   */
  getLastMessageId(userId) {
    const session = this.getSession(userId);
    return session ? session.lastMessageId : null;
  }

  /**
   * Set input data for user
   * @param {number} userId - User ID
   * @param {string} field - Field name
   * @param {string} value - Field value
   */
  setInputData(userId, field, value) {
    const session = this.getSession(userId);
    const inputData = session ? session.inputData || {} : {};
    inputData[field] = value;
    this.setSession(userId, { inputData });
  }

  /**
   * Get input data for user
   * @param {number} userId - User ID
   */
  getInputData(userId) {
    const session = this.getSession(userId);
    return session ? session.inputData || {} : {};
  }

  /**
   * Clear input data for user
   * @param {number} userId - User ID
   */
  clearInputData(userId) {
    this.setSession(userId, { inputData: {} });
  }

  /**
   * Clean up expired sessions
   */
  cleanupExpiredSessions() {
    try {
      const now = Date.now();
      for (const [userId, session] of this.sessions.entries()) {
        if (!this.isSessionValid(session)) {
          this.sessions.delete(userId);
          logger.debug('Expired session cleaned up', { userId });
        }
      }
    } catch (error) {
      logger.error('Failed to cleanup expired sessions', { error: error.message });
    }
  }

  /**
   * Get session statistics
   */
  getStats() {
    return {
      totalSessions: this.sessions.size,
      activeSessions: Array.from(this.sessions.values()).filter(session => 
        this.isSessionValid(session)
      ).length
    };
  }
}

// Create singleton instance
const sessionManager = new SessionManager();

// Cleanup expired sessions every 5 minutes
setInterval(() => {
  sessionManager.cleanupExpiredSessions();
}, 5 * 60 * 1000);

module.exports = sessionManager;
