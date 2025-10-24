const logger = require('./logger');

class MessageUtils {
  /**
   * Escape special characters for Markdown parsing
   * @param {string} text - Text to escape
   * @returns {string} - Escaped text
   */
  static escapeMarkdown(text) {
    if (!text || typeof text !== 'string') return 'N/A';
    
    // Only escape the most problematic characters for Markdown
    return text
      .replace(/\\/g, '\\\\')  // Escape backslashes first
      .replace(/\*/g, '\\*')   // Escape asterisks
      .replace(/_/g, '\\_')    // Escape underscores
      .replace(/\[/g, '\\[')   // Escape square brackets
      .replace(/\]/g, '\\]')   // Escape square brackets
      .replace(/\(/g, '\\(')   // Escape parentheses
      .replace(/\)/g, '\\)')   // Escape parentheses
      .replace(/~/g, '\\~')    // Escape tildes
      .replace(/`/g, '\\`')    // Escape backticks
      .replace(/>/g, '\\>')    // Escape greater than
      .replace(/#/g, '\\#')    // Escape hash
      .replace(/\|/g, '\\|');  // Escape pipe
  }

  /**
   * Escape text for inline code blocks
   * @param {string} text - Text to escape
   * @returns {string} - Escaped text
   */
  static escapeCode(text) {
    if (!text || typeof text !== 'string') return 'N/A';
    
    // Only escape backticks for inline code
    return text.replace(/`/g, '\\`');
  }
  /**
   * Send message and delete old message if exists
   * @param {Object} ctx - Telegraf context
   * @param {string} message - Message to send
   * @param {Object} options - Message options
   * @param {number} oldMessageId - Old message ID to delete
   */
  static async sendAndReplace(ctx, message, options = {}, oldMessageId = null) {
    try {
      // Delete old message if exists
      if (oldMessageId) {
        try {
          await ctx.deleteMessage(oldMessageId);
          logger.debug('Old message deleted', { messageId: oldMessageId });
        } catch (error) {
          logger.warn('Failed to delete old message', { 
            error: error.message, 
            messageId: oldMessageId,
            chatId: ctx.chat?.id 
          });
        }
      }

      // Send new message
      const sentMessage = await ctx.reply(message, options);
      
      // Store new message ID for future deletion
      if (ctx.from?.id) {
        const sessionManager = require('./sessionManager');
        sessionManager.setLastMessageId(ctx.from.id, sentMessage.message_id);
      }
      
      return sentMessage;
    } catch (error) {
      logger.error('Failed to send and replace message', { error: error.message });
      throw error;
    }
  }

  /**
   * Send message with loading indicator
   * @param {Object} ctx - Telegraf context
   * @param {string} loadingText - Loading text
   * @param {Object} options - Message options
   */
  static async sendLoading(ctx, loadingText = '🔄 Memproses...', options = {}) {
    try {
      const loadingMessage = await ctx.reply(loadingText, {
        ...options,
        reply_markup: { remove_keyboard: true }
      });
      
      // Store message ID for future deletion
      if (ctx.from?.id) {
        const sessionManager = require('./sessionManager');
        sessionManager.setLastMessageId(ctx.from.id, loadingMessage.message_id);
      }
      
      return loadingMessage;
    } catch (error) {
      logger.error('Failed to send loading message', { error: error.message });
      throw error;
    }
  }

  /**
   * Send error message
   * @param {Object} ctx - Telegraf context
   * @param {string} errorMessage - Error message
   * @param {Object} options - Message options
   */
  static async sendError(ctx, errorMessage, options = {}) {
    try {
      const errorMsg = `❌ ${errorMessage}`;
      const sentMessage = await ctx.reply(errorMsg, {
        ...options,
        parse_mode: 'Markdown'
      });
      
      // Store message ID for future deletion
      if (ctx.from?.id) {
        const sessionManager = require('./sessionManager');
        sessionManager.setLastMessageId(ctx.from.id, sentMessage.message_id);
      }
      
      return sentMessage;
    } catch (error) {
      logger.error('Failed to send error message', { error: error.message });
      throw error;
    }
  }

  /**
   * Send success message
   * @param {Object} ctx - Telegraf context
   * @param {string} successMessage - Success message
   * @param {Object} options - Message options
   */
  static async sendSuccess(ctx, successMessage, options = {}) {
    try {
      const successMsg = `✅ ${successMessage}`;
      const sentMessage = await ctx.reply(successMsg, {
        ...options,
        parse_mode: 'Markdown'
      });
      
      // Store message ID for future deletion
      if (ctx.from?.id) {
        const sessionManager = require('./sessionManager');
        sessionManager.setLastMessageId(ctx.from.id, sentMessage.message_id);
      }
      
      return sentMessage;
    } catch (error) {
      logger.error('Failed to send success message', { error: error.message });
      throw error;
    }
  }

  /**
   * Send info message
   * @param {Object} ctx - Telegraf context
   * @param {string} infoMessage - Info message
   * @param {Object} options - Message options
   */
  static async sendInfo(ctx, infoMessage, options = {}) {
    try {
      const infoMsg = `ℹ️ ${infoMessage}`;
      const sentMessage = await ctx.reply(infoMsg, {
        ...options,
        parse_mode: 'Markdown'
      });
      
      // Store message ID for future deletion
      if (ctx.from?.id) {
        const sessionManager = require('./sessionManager');
        sessionManager.setLastMessageId(ctx.from.id, sentMessage.message_id);
      }
      
      return sentMessage;
    } catch (error) {
      logger.error('Failed to send info message', { error: error.message });
      throw error;
    }
  }

  /**
   * Format phone number for display
   * @param {string} phoneNumber - Phone number
   */
  static formatPhoneNumber(phoneNumber) {
    if (!phoneNumber) return 'N/A';
    return phoneNumber.replace(/(\d{2})(\d{3})(\d{4})(\d{4})/, '$1 $2 $3 $4');
  }

  /**
   * Format currency for display
   * @param {number} amount - Amount
   */
  static formatCurrency(amount) {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  }

  /**
   * Format data size for display
   * @param {string} size - Data size
   */
  static formatDataSize(size) {
    if (!size) return 'N/A';
    return size;
  }

  /**
   * Truncate text
   * @param {string} text - Text to truncate
   * @param {number} maxLength - Maximum length
   */
  static truncateText(text, maxLength = 100) {
    if (!text) return 'N/A';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }

  /**
   * Create progress bar
   * @param {number} current - Current value
   * @param {number} total - Total value
   * @param {number} length - Bar length
   */
  static createProgressBar(current, total, length = 10) {
    const percentage = Math.min(100, Math.max(0, (current / total) * 100));
    const filled = Math.round((percentage / 100) * length);
    const empty = length - filled;
    
    const bar = '█'.repeat(filled) + '░'.repeat(empty);
    return `${bar} ${percentage.toFixed(1)}%`;
  }

  /**
   * Get status emoji
   * @param {string} status - Status string
   */
  static getStatusEmoji(status) {
    const statusMap = {
      'ACTIVE': '✅',
      'CANCELLED': '❌',
      'PENDING': '⏳',
      'SUCCESS': '✅',
      'ERROR': '❌',
      'FREE': '🆓',
      'PAID': '💰',
      'PARENT': '👑',
      'MEMBER': '👤'
    };
    return statusMap[status] || '❓';
  }
}

module.exports = MessageUtils;
