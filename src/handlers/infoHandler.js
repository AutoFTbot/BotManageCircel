const circleService = require('../services/circleService');
const validators = require('../utils/validators');
const logger = require('../utils/logger');
const MessageUtils = require('../utils/messageUtils');
const ButtonUtils = require('../utils/buttonUtils');
const sessionManager = require('../utils/sessionManager');

class InfoHandler {
  async handle(ctx) {
    try {
      const userId = ctx.from.id;
      
      // Set current action
      sessionManager.setCurrentAction(userId, 'info', {
        step: 0,
        inputData: {}
      });
      
      // Show input form
      await this.showInputForm(ctx);
    } catch (error) {
      logger.error('Info handler error', error);
      await MessageUtils.sendError(ctx, 'Terjadi kesalahan saat mengambil informasi circle');
    }
  }

  async showInputForm(ctx) {
    try {
      const message = `
📊 *Info Circle*

Masukkan nomor admin untuk melihat informasi circle:

📱 *Nomor Admin:* Belum diisi

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

      // Validate phone number
      const validation = validators.validatePhoneNumber(text);
      if (validation.error) {
        await MessageUtils.sendError(ctx, `Nomor admin tidak valid: ${validation.error.details[0].message}`);
        return;
      }

      // Store input data
      sessionManager.setInputData(userId, 'nomorAdmin', text);

      // Process info request
      await this.processInfoRequest(ctx, text);
    } catch (error) {
      logger.error('Failed to handle text input', error);
      await MessageUtils.sendError(ctx, 'Gagal memproses input');
    }
  }

  async processInfoRequest(ctx, nomorAdmin) {
    try {
      const userId = ctx.from.id;
      
      // Show loading message
      const loadingMessage = await MessageUtils.sendLoading(ctx, '🔄 Mengambil informasi circle...');
      
      try {
        const response = await circleService.getCircleInfo(nomorAdmin);
        
        if (response.status === 'success' && response.data?.data) {
          const data = response.data.data;
          const summary = data.summary;
          const members = data.members || [];
          
          let message = '📊 *Informasi Circle*\n\n';
          
          // Group Summary
          message += `🏷️ *Nama Grup:* ${summary?.group_name || 'N/A'}\n`;
          message += `🆔 *Group ID:* \`${summary?.group_id || 'N/A'}\`\n`;
          message += `📅 *Dibuat:* ${summary?.created_at?.tanggal || 'N/A'}\n`;
          message += `📦 *Paket:* ${summary?.package?.name || 'N/A'}\n\n`;
          
          // Quota Information
          if (summary?.detail_kuota) {
            const quota = summary.detail_kuota;
            message += `📈 *Informasi Kuota*\n`;
            message += `👥 Total Member: ${quota['total-member'] || 0}\n`;
            message += `📊 Benefit: ${quota.benefit?.name || 'N/A'}\n`;
            message += `💾 Total: ${quota.benefit?.total || 'N/A'}\n`;
            message += `📉 Sisa: ${quota.benefit?.sisa || 'N/A'}\n`;
            message += `📈 Pemakaian: ${quota.benefit?.pemakaian || 'N/A'}\n\n`;
          }
          
          // Slot Information
          message += `🎫 *Slot Information*\n`;
          message += `🆓 Free Slot: ${summary?.total_free_slot || 0}\n`;
          message += `💰 Paid Slot: ${summary?.total_paid_slot || 0}\n`;
          message += `🎁 Bonus Remaining: ${summary?.bonus_remaining || 0}\n\n`;
          
          // Members List
          if (members.length > 0) {
            message += `👥 *Daftar Anggota*\n`;
            members.forEach((member, index) => {
              message += `\n*${index + 1}. ${member.member_name || 'N/A'}*\n`;
              message += `📱 Nomor: ${member.msisdn || 'N/A'}\n`;
              message += `👤 Role: ${member.member_role || 'N/A'}\n`;
              message += `🎫 Slot: ${member.slot_type || 'N/A'}\n`;
              message += `📊 Status: ${member.status || 'N/A'}\n`;
              message += `📅 Join: ${member.join_date || 'N/A'}\n`;
              message += `💾 Total: ${member.total || 'N/A'}\n`;
              message += `📈 Pemakaian: ${member.pemakaian || 'N/A'}\n`;
              message += `📉 Sisa: ${member.tersisa || 'N/A'}\n`;
            });
          }
          
          // Panel Info
          if (response.data?.info_saldo_panel) {
            const panel = response.data.info_saldo_panel;
            message += `\n💰 *Panel Info*\n`;
            message += `👤 ID Telegram: ${panel.id_telegram || 'N/A'}\n`;
            message += `🔑 Role: ${panel.role || 'N/A'}\n`;
            message += `💵 Saldo: ${panel.saldo_tersedia || 'N/A'} IDR\n`;
            message += `ℹ️ Catatan: ${panel.catatan || 'N/A'}`;
          }
          
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
            '❌ Gagal mendapatkan informasi circle',
            {
              reply_markup: ButtonUtils.getBackToMainMenu().reply_markup
            },
            loadingMessage.message_id
          );
        }
      } catch (error) {
        await MessageUtils.sendAndReplace(
          ctx,
          '❌ Terjadi kesalahan saat mengambil informasi circle',
          {
            reply_markup: ButtonUtils.getBackToMainMenu().reply_markup
          },
          loadingMessage.message_id
        );
      }
      
      // Clear session
      sessionManager.clearSession(userId);
    } catch (error) {
      logger.error('Failed to process info request', error);
      await MessageUtils.sendError(ctx, 'Gagal memproses permintaan info');
    }
  }
}

module.exports = new InfoHandler();
