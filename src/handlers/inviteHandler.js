const circleService = require('../services/circleService');
const validators = require('../utils/validators');
const logger = require('../utils/logger');
const MessageUtils = require('../utils/messageUtils');
const ButtonUtils = require('../utils/buttonUtils');
const sessionManager = require('../utils/sessionManager');

class InviteHandler {
  async handle(ctx) {
    try {
      const userId = ctx.from.id;
      
      // Set current action
      sessionManager.setCurrentAction(userId, 'invite', {
        step: 0,
        inputData: {}
      });
      
      // Show input form
      await this.showInputForm(ctx);
    } catch (error) {
      logger.error('Invite handler error', error);
      await MessageUtils.sendError(ctx, 'Terjadi kesalahan saat mengundang anggota');
    }
  }

  async showInputForm(ctx) {
    try {
      const message = `
👥 *Undang Anggota Baru*

Masukkan data berikut untuk mengundang anggota baru:

📱 *Nomor Admin:* Belum diisi
📱 *Nomor Anggota:* Belum diisi
👥 *Nama Anggota:* Belum diisi

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

      // Validate input based on type
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

      // Store input data
      const fieldMap = {
        'admin_phone': 'nomorAdmin',
        'member_phone': 'nomorAnggota',
        'member_name': 'namaAnggota'
      };
      
      const field = fieldMap[currentInputType];
      if (field) {
        sessionManager.setInputData(userId, field, text);
      }

      // Check if all required fields are filled
      const inputData = sessionManager.getInputData(userId);
      if (inputData.nomorAdmin && inputData.nomorAnggota && inputData.namaAnggota) {
        // All fields filled, show confirmation
        await this.showConfirmation(ctx, inputData);
      } else {
        // Show updated form
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
👥 *Undang Anggota Baru*

Masukkan data berikut untuk mengundang anggota baru:

📱 *Nomor Admin:* ${inputData.nomorAdmin || 'Belum diisi'}
📱 *Nomor Anggota:* ${inputData.nomorAnggota || 'Belum diisi'}
👥 *Nama Anggota:* ${inputData.namaAnggota || 'Belum diisi'}

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

  async showConfirmation(ctx, inputData) {
    try {
      const message = `
✅ *Konfirmasi Data Undangan*

Data yang akan digunakan:

📱 *Nomor Admin:* ${inputData.nomorAdmin}
📱 *Nomor Anggota:* ${inputData.nomorAnggota}
👥 *Nama Anggota:* ${inputData.namaAnggota}

Apakah data sudah benar?
      `;

      await MessageUtils.sendAndReplace(
        ctx,
        message,
        {
          parse_mode: 'Markdown',
          reply_markup: ButtonUtils.getConfirmationButtons('invite').reply_markup
        },
        sessionManager.getLastMessageId(ctx.from.id)
      );
    } catch (error) {
      logger.error('Failed to show confirmation', error);
      await MessageUtils.sendError(ctx, 'Gagal menampilkan konfirmasi');
    }
  }

  async handleConfirmation(ctx) {
    try {
      const userId = ctx.from.id;
      const inputData = sessionManager.getInputData(userId);
      
      // Process member invitation
      await this.processMemberInvitation(ctx, inputData);
    } catch (error) {
      logger.error('Failed to handle confirmation', error);
      await MessageUtils.sendError(ctx, 'Gagal memproses konfirmasi');
    }
  }

  async processMemberInvitation(ctx, inputData) {
    try {
      const userId = ctx.from.id;
      
      // Show loading message
      const loadingMessage = await MessageUtils.sendLoading(ctx, '🔄 Mengundang anggota baru...');
      
      try {
        const response = await circleService.inviteMember(inputData);
        
        if (response.status === 'success') {
          const data = response.data;
          let message = '✅ *Anggota Berhasil Diundang*\n\n';
          message += `👤 Admin: ${data.details?.nomor_pengelola || 'N/A'}\n`;
          message += `👥 Anggota: ${data.details?.member_name || 'N/A'} (${data.details?.nomor_member || 'N/A'})\n`;
          message += `🆔 Group ID: \`${data.details?.group_id || 'N/A'}\`\n`;
          message += `🆔 Member ID: \`${data.details?.member_id || 'N/A'}\`\n\n`;
          message += `💰 Saldo Tersedia: ${data.info_saldo_panel?.saldo_tersedia || 'N/A'} IDR\n`;
          message += `✅ Status: ${data.message}`;
          
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
            '❌ Gagal mengundang anggota',
            {
              reply_markup: ButtonUtils.getBackToMainMenu().reply_markup
            },
            loadingMessage.message_id
          );
        }
      } catch (error) {
        await MessageUtils.sendAndReplace(
          ctx,
          '❌ Terjadi kesalahan saat mengundang anggota',
          {
            reply_markup: ButtonUtils.getBackToMainMenu().reply_markup
          },
          loadingMessage.message_id
        );
      }
      
      // Clear session
      sessionManager.clearSession(userId);
    } catch (error) {
      logger.error('Failed to process member invitation', error);
      await MessageUtils.sendError(ctx, 'Gagal memproses undangan anggota');
    }
  }
}

module.exports = new InviteHandler();
