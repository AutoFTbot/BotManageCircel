const circleService = require('../services/circleService');
const validators = require('../utils/validators');
const logger = require('../utils/logger');
const MessageUtils = require('../utils/messageUtils');
const ButtonUtils = require('../utils/buttonUtils');
const sessionManager = require('../utils/sessionManager');

class ValidateHandler {
  async handle(ctx) {
    try {
      const userId = ctx.from.id;
      
      sessionManager.setCurrentAction(userId, 'validate', {
        step: 0,
        inputData: {}
      });
      
      await this.showInputForm(ctx);
    } catch (error) {
      logger.error('Validate handler error', error);
      await MessageUtils.sendError(ctx, 'Terjadi kesalahan saat memvalidasi nomor');
    }
  }

  async showInputForm(ctx) {
    try {
      const message = `
✅ *Validasi Nomor Anggota*

Masukkan data berikut untuk memvalidasi nomor anggota:

📱 *Nomor Admin:* Belum diisi
📱 *Nomor Anggota:* Belum diisi

Pilih field yang ingin diisi:
      `;

      await MessageUtils.sendAndReplace(
        ctx,
        message,
        {
          parse_mode: 'Markdown',
          reply_markup: ButtonUtils.getInputTypeButtons().reply_markup
        },
        sessionManager.getLastMessageId(ctx.from.id)
      );
    } catch (error) {
      logger.error('Failed to show input form', error);
      await MessageUtils.sendError(ctx, 'Gagal menampilkan form input');
    }
  }

  async handleTextInput(ctx, text) {
    try {
      const userId = ctx.from.id;
      const session = sessionManager.getSession(userId);
      const currentInputType = session?.actionData?.currentInputType;
      
      if (!currentInputType) {
        await this.showInputForm(ctx);
        return;
      }

      let validation;
      if (currentInputType === 'admin_phone' || currentInputType === 'member_phone') {
        validation = validators.validatePhoneNumber(text);
      } else {
        validation = validators.validateName(text);
      }

      if (validation.error) {
        await MessageUtils.sendError(ctx, `Input tidak valid: ${validation.error.details[0].message}`);
        return;
      }

      const fieldMap = {
        'admin_phone': 'nomorAdmin',
        'member_phone': 'nomorAnggota'
      };
      
      const field = fieldMap[currentInputType];
      if (field) {
        sessionManager.setInputData(userId, field, text);
      }

      const inputData = sessionManager.getInputData(userId);
      if (inputData.nomorAdmin && inputData.nomorAnggota) {
        await this.processValidation(ctx, inputData.nomorAdmin, inputData.nomorAnggota);
      } else {
        await this.showUpdatedForm(ctx);
      }
    } catch (error) {
      logger.error('Failed to handle text input', error);
      await MessageUtils.sendError(ctx, 'Gagal memproses input');
    }
  }

  async showUpdatedForm(ctx) {
    try {
      const userId = ctx.from.id;
      const inputData = sessionManager.getInputData(userId);
      
      const message = `
✅ *Validasi Nomor Anggota*

Masukkan data berikut untuk memvalidasi nomor anggota:

📱 *Nomor Admin:* ${inputData.nomorAdmin || 'Belum diisi'}
📱 *Nomor Anggota:* ${inputData.nomorAnggota || 'Belum diisi'}

Pilih field yang ingin diisi:
      `;

      await MessageUtils.sendAndReplace(
        ctx,
        message,
        {
          parse_mode: 'Markdown',
          reply_markup: ButtonUtils.getInputTypeButtons().reply_markup
        },
        sessionManager.getLastMessageId(ctx.from.id)
      );
    } catch (error) {
      logger.error('Failed to show updated form', error);
      await MessageUtils.sendError(ctx, 'Gagal menampilkan form input');
    }
  }

  async processValidation(ctx, nomorAdmin, nomorAnggota) {
    try {
      const userId = ctx.from.id;
      
      const loadingMessage = await MessageUtils.sendLoading(ctx, '🔄 Memvalidasi nomor anggota...');
      
      try {
        const response = await circleService.validateNumber(nomorAdmin, nomorAnggota);
        
        if (response.status === 'success') {
          const data = response.data;
          let message = '✅ *Nomor Valid*\n\n';
          message += `📱 Nomor Admin: ${nomorAdmin}\n`;
          message += `📱 Nomor Anggota: ${nomorAnggota}\n`;
          message += `✅ Status: ${data.message}\n`;
          message += `💰 Saldo Tersedia: ${data.info_saldo_panel?.saldo_tersedia || 'N/A'} IDR\n`;
          message += `👤 Role: ${data.info_saldo_panel?.role || 'N/A'}\n\n`;
          message += '✅ Nomor siap untuk diundang ke circle!';
          
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
          const data = response.data;
          let message = '❌ *Nomor Tidak Valid*\n\n';
          message += `📱 Nomor Admin: ${nomorAdmin}\n`;
          message += `📱 Nomor Anggota: ${nomorAnggota}\n`;
          message += `❌ Error: ${data.message}\n`;
          message += `📝 Detail: ${data.detail}\n`;
          message += `💰 Saldo Tersedia: ${data.info_saldo_panel?.saldo_tersedia || 'N/A'} IDR\n`;
          
          await MessageUtils.sendAndReplace(
            ctx,
            message,
            {
              parse_mode: 'Markdown',
              reply_markup: ButtonUtils.getBackToMainMenu().reply_markup
            },
            loadingMessage.message_id
          );
        }
      } catch (error) {
        await MessageUtils.sendAndReplace(
          ctx,
          '❌ Terjadi kesalahan saat memvalidasi nomor',
          {
            reply_markup: ButtonUtils.getBackToMainMenu().reply_markup
          },
          loadingMessage.message_id
        );
      }
      sessionManager.clearSession(userId);
    } catch (error) {
      logger.error('Failed to process validation', error);
      await MessageUtils.sendError(ctx, 'Gagal memproses validasi');
    }
  }
}

module.exports = new ValidateHandler();
