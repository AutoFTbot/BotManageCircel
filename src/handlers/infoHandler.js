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
          const groupName = MessageUtils.escapeMarkdown(summary?.group_name);
          const groupId = MessageUtils.escapeMarkdown(summary?.group_id);
          const createdDate = MessageUtils.escapeMarkdown(summary?.created_at?.tanggal);
          const packageName = MessageUtils.escapeMarkdown(summary?.package?.name);
          
          message += `🏷️ *Nama Grup:* ${groupName}\n`;
          message += `🆔 *Group ID:* \`${groupId}\`\n`;
          message += `📅 *Dibuat:* ${createdDate}\n`;
          message += `📦 *Paket:* ${packageName}\n\n`;
          
          // Quota Information
          if (summary?.detail_kuota) {
            const quota = summary.detail_kuota;
            const benefitName = MessageUtils.escapeMarkdown(quota.benefit?.name);
            const total = MessageUtils.escapeMarkdown(quota.benefit?.total);
            const sisa = MessageUtils.escapeMarkdown(quota.benefit?.sisa);
            const pemakaian = MessageUtils.escapeMarkdown(quota.benefit?.pemakaian);
            
            message += `📈 *Informasi Kuota*\n`;
            message += `👥 Total Member: ${quota['total-member'] || 0}\n`;
            message += `📊 Benefit: ${benefitName}\n`;
            message += `💾 Total: ${total}\n`;
            message += `📉 Sisa: ${sisa}\n`;
            message += `📈 Pemakaian: ${pemakaian}\n\n`;
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
              const memberName = MessageUtils.escapeMarkdown(member.member_name);
              const msisdn = MessageUtils.escapeMarkdown(member.msisdn);
              const role = MessageUtils.escapeMarkdown(member.member_role);
              const slotType = MessageUtils.escapeMarkdown(member.slot_type);
              const status = MessageUtils.escapeMarkdown(member.status);
              const joinDate = MessageUtils.escapeMarkdown(member.join_date);
              const total = MessageUtils.escapeMarkdown(member.total);
              const pemakaian = MessageUtils.escapeMarkdown(member.pemakaian);
              const tersisa = MessageUtils.escapeMarkdown(member.tersisa);
              
              message += `\n*${index + 1}\\. ${memberName}*\n`;
              message += `📱 Nomor: ${msisdn}\n`;
              message += `👤 Role: ${role}\n`;
              message += `🎫 Slot: ${slotType}\n`;
              message += `📊 Status: ${status}\n`;
              message += `📅 Join: ${joinDate}\n`;
              message += `💾 Total: ${total}\n`;
              message += `📈 Pemakaian: ${pemakaian}\n`;
              message += `📉 Sisa: ${tersisa}\n`;
            });
          }
          
          // Panel Info
          if (response.data?.info_saldo_panel) {
            const panel = response.data.info_saldo_panel;
            const idTelegram = MessageUtils.escapeMarkdown(panel.id_telegram);
            const role = MessageUtils.escapeMarkdown(panel.role);
            const catatan = MessageUtils.escapeMarkdown(panel.catatan);
            
            message += `\n💰 *Panel Info*\n`;
            message += `👤 ID Telegram: ${idTelegram}\n`;
            message += `🔑 Role: ${role}\n`;
            message += `💵 Saldo: ${panel.saldo_tersedia || 'N/A'} IDR\n`;
            message += `ℹ️ Catatan: ${catatan}`;
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
