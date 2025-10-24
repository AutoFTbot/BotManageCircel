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
          const nomorPengelola = data.details?.nomor_pengelola || 'N/A';
          const memberName = data.details?.member_name || 'N/A';
          const nomorMember = data.details?.nomor_member || 'N/A';
          const groupId = data.details?.group_id || 'N/A';
          const memberId = data.details?.member_id || 'N/A';
          const status = data.message || 'N/A';
          
          let message = '✅ *Anggota Berhasil Diundang*\n\n';
          message += `👤 Admin: ${nomorPengelola}\n`;
          message += `👥 Anggota: ${memberName} (${nomorMember})\n`;
          message += `🆔 Group ID: \`${MessageUtils.escapeCode(groupId)}\`\n`;
          message += `🆔 Member ID: \`${MessageUtils.escapeCode(memberId)}\`\n\n`;
          message += `💰 Saldo Tersedia: ${data.info_saldo_panel?.saldo_tersedia || 'N/A'} IDR\n`;
          message += `✅ Status: ${status}`;
          
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
        let errorMessage = '❌ Terjadi kesalahan saat mengundang anggota';
        
        // Handle specific API errors
        if (error.response && error.response.data) {
          const apiError = error.response.data;
          if (apiError.message) {
            if (apiError.message.includes('Saldo minimal')) {
              errorMessage = `❌ *Saldo Tidak Mencukupi*\n\n`;
              errorMessage += `💰 Saldo Tersedia: ${apiError.saldo_tersedia || 'N/A'} IDR\n`;
              errorMessage += `💳 Saldo Minimal: 25.000 IDR\n\n`;
              errorMessage += `💡 *Solusi:*\n`;
              errorMessage += `• Top up saldo terlebih dahulu\n`;
              errorMessage += `• Minimal saldo: 25.000 IDR\n`;
              errorMessage += `• Cek saldo dengan menu "Info Circle"`;
            } else if (apiError.message.includes('already registered as participant')) {
              errorMessage = `❌ *User Sudah Terdaftar*\n\n`;
              errorMessage += `👤 Status: User sudah terdaftar sebagai participant\n`;
              errorMessage += `🚫 Status: Tidak diizinkan untuk action ini\n\n`;
              errorMessage += `💡 *Solusi:*\n`;
              errorMessage += `• Gunakan nomor admin yang berbeda\n`;
              errorMessage += `• Atau hubungi administrator\n`;
              errorMessage += `• Cek status dengan menu "Info Circle"`;
            } else if (apiError.message.includes('not allowed status')) {
              errorMessage = `❌ *Status Tidak Diizinkan*\n\n`;
              errorMessage += `👤 User: Sudah terdaftar sebagai participant\n`;
              errorMessage += `🚫 Status: Tidak diizinkan untuk action ini\n\n`;
              errorMessage += `💡 *Solusi:*\n`;
              errorMessage += `• Gunakan nomor admin yang berbeda\n`;
              errorMessage += `• Atau hubungi administrator\n`;
              errorMessage += `• Cek status dengan menu "Info Circle"`;
            } else {
              errorMessage = `❌ *Error API*\n\n${apiError.message}`;
            }
          }
        }
        
        await MessageUtils.sendAndReplace(
          ctx,
          errorMessage,
          {
            parse_mode: 'Markdown',
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
