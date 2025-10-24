const circleService = require('../services/circleService');
const logger = require('../utils/logger');
const MessageUtils = require('../utils/messageUtils');
const ButtonUtils = require('../utils/buttonUtils');
const sessionManager = require('../utils/sessionManager');

class HelpHandler {
  async handle(ctx) {
    try {
      const userId = ctx.from.id;
      
      // Show loading message
      const loadingMessage = await MessageUtils.sendLoading(ctx, '🔄 Mengambil informasi bantuan...');
      
      try {
        const response = await circleService.getHelp();
        
        if (response.status === 'success' && response.data) {
          let message = '📋 *Daftar Action dan Fee Circle Management*\n\n';
          
          response.data.forEach((action, index) => {
            message += `*${index + 1}. ${action.action.toUpperCase()}*\n`;
            message += `💰 Fee: ${action.fee === 0 ? 'Gratis' : `${action.fee} IDR`}\n`;
            message += `📝 Deskripsi: ${action.deskripsi}\n`;
            message += `ℹ️ Catatan: ${action.catatan}\n\n`;
          });
          
          // Delete loading message and send help info
          await MessageUtils.sendAndReplace(
            ctx,
            message,
            {
              parse_mode: 'Markdown',
              reply_markup: ButtonUtils.getBackToMainMenu().reply_markup
            },
            loadingMessage.message_id
          );
        } else {
          await MessageUtils.sendAndReplace(
            ctx,
            '❌ Gagal mendapatkan informasi bantuan',
            {
              reply_markup: ButtonUtils.getBackToMainMenu().reply_markup
            },
            loadingMessage.message_id
          );
        }
      } catch (error) {
        await MessageUtils.sendAndReplace(
          ctx,
          '❌ Terjadi kesalahan saat mengambil informasi bantuan',
          {
            reply_markup: ButtonUtils.getBackToMainMenu().reply_markup
          },
          loadingMessage.message_id
        );
      }
    } catch (error) {
      logger.error('Help handler error', error);
      await MessageUtils.sendError(ctx, 'Terjadi kesalahan saat mengambil informasi bantuan');
    }
  }
}

module.exports = new HelpHandler();
