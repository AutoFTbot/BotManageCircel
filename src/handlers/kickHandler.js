const circleService = require('../services/circleService');
const validators = require('../utils/validators');
const logger = require('../utils/logger');
const MessageUtils = require('../utils/messageUtils');
const ButtonUtils = require('../utils/buttonUtils');
const sessionManager = require('../utils/sessionManager');

class KickHandler {
  async handle(ctx) {
    try {
      const userId = ctx.from.id;
      
      // Set current action
      sessionManager.setCurrentAction(userId, 'kick', {
        step: 0,
        inputData: {}
      });
      
      // Show action selection
      await this.showActionSelection(ctx);
    } catch (error) {
      logger.error('Kick handler error', error);
      await MessageUtils.sendError(ctx, 'Terjadi kesalahan saat memproses kick anggota');
    }
  }

  async showActionSelection(ctx) {
    try {
      const message = `
👤 *Kelola Anggota Circle*

Pilih aksi yang ingin dilakukan:

• 📋 Lihat daftar anggota circle
• 👤 Pilih anggota untuk dikick
      `;

      await MessageUtils.sendAndReplace(
        ctx,
        message,
        {
          parse_mode: 'Markdown',
          reply_markup: ButtonUtils.getKickActionButtons().reply_markup
        },
        sessionManager.getLastMessageId(ctx.from.id)
      );
    } catch (error) {
      logger.error('Failed to show action selection', error);
      await MessageUtils.sendError(ctx, 'Gagal menampilkan pilihan aksi');
    }
  }

  async handleCallback(ctx) {
    try {
      const callbackData = ctx.callbackQuery.data;
      const userId = ctx.from.id;
      
      if (callbackData === 'kick_list') {
        await this.handleListMembers(ctx);
      } else if (callbackData === 'kick_select') {
        await this.handleSelectMember(ctx);
      } else {
        await ctx.answerCbQuery('Aksi tidak dikenali');
      }
    } catch (error) {
      logger.error('Failed to handle callback', error);
      await ctx.answerCbQuery('Gagal memproses aksi');
    }
  }

  async handleListMembers(ctx) {
    try {
      const userId = ctx.from.id;
      
      // Set current action
      sessionManager.setCurrentAction(userId, 'kick', {
        step: 1,
        action: 'list',
        inputData: {}
      });
      
      // Show input form for admin phone
      await this.showAdminPhoneInput(ctx);
    } catch (error) {
      logger.error('Failed to handle list members', error);
      await MessageUtils.sendError(ctx, 'Gagal memproses list anggota');
    }
  }

  async handleSelectMember(ctx) {
    try {
      const userId = ctx.from.id;
      
      // Set current action
      sessionManager.setCurrentAction(userId, 'kick', {
        step: 1,
        action: 'select',
        inputData: {}
      });
      
      // Show input form for admin phone
      await this.showAdminPhoneInput(ctx);
    } catch (error) {
      logger.error('Failed to handle select member', error);
      await MessageUtils.sendError(ctx, 'Gagal memproses pilih anggota');
    }
  }

  async showAdminPhoneInput(ctx) {
    try {
      const message = `
👤 *Kelola Anggota Circle*

Masukkan nomor admin untuk mengelola anggota:

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
      logger.error('Failed to show admin phone input', error);
      await MessageUtils.sendError(ctx, 'Gagal menampilkan form input');
    }
  }

  async handleTextInput(ctx, text) {
    try {
      const userId = ctx.from.id;
      const session = sessionManager.getSession(userId);
      const currentInputType = session?.actionData?.currentInputType;
      
      if (!currentInputType) {
        await this.showAdminPhoneInput(ctx);
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

      // Process kick request
      const action = session.actionData.action;
      await this.processKickRequest(ctx, text, action);
    } catch (error) {
      logger.error('Failed to handle text input', error);
      await MessageUtils.sendError(ctx, 'Gagal memproses input');
    }
  }

  async handleNumberSelection(ctx, number) {
    try {
      const userId = ctx.from.id;
      const session = sessionManager.getSession(userId);
      const nomorAdmin = session.actionData.inputData.nomorAdmin;
      
      if (!nomorAdmin) {
        await MessageUtils.sendError(ctx, 'Nomor admin tidak ditemukan');
        return;
      }

      // Process kick with specific number
      await this.processKickRequest(ctx, nomorAdmin, number);
    } catch (error) {
      logger.error('Failed to handle number selection', error);
      await MessageUtils.sendError(ctx, 'Gagal memproses pilihan nomor');
    }
  }

  async handleConfirmation(ctx) {
    try {
      const userId = ctx.from.id;
      const session = sessionManager.getSession(userId);
      const nomorAdmin = session.actionData.inputData.nomorAdmin;
      const selectedNumber = session.actionData.selectedNumber;
      
      if (!nomorAdmin || !selectedNumber) {
        await MessageUtils.sendError(ctx, 'Data tidak lengkap');
        return;
      }

      // Process kick confirmation
      await this.processKickRequest(ctx, nomorAdmin, selectedNumber);
    } catch (error) {
      logger.error('Failed to handle confirmation', error);
      await MessageUtils.sendError(ctx, 'Gagal memproses konfirmasi');
    }
  }

  async processKickRequest(ctx, nomorAdmin, action) {
    try {
      const userId = ctx.from.id;
      
      // Show loading message
      const loadingMessage = await MessageUtils.sendLoading(ctx, '🔄 Memproses kick anggota...');
      
      try {
        const response = await circleService.kickMember(nomorAdmin, action);
        
        if (response.status === 'success') {
          const data = response.data;
          
          if (action === 'list') {
            // Show member list
            let message = '👥 *Daftar Anggota Circle*\n\n';
            message += `📊 Total Member (Non-Parent): ${data.total_member_non_parent || 0}\n\n`;
            
            if (data.members && data.members.length > 0) {
              data.members.forEach((member, index) => {
                const statusEmoji = member.status === 'CANCELLED' ? '❌' : '✅';
                message += `*${member.index}. ${member.member_name || 'N/A'}* ${statusEmoji}\n`;
                message += `📱 Nomor: ${member.msisdn || 'N/A'}\n`;
                message += `👤 Role: ${member.member_role || 'N/A'}\n`;
                message += `🎫 Slot: ${member.slot_type || 'N/A'}\n`;
                message += `📊 Status: ${member.status || 'N/A'}\n\n`;
              });
              
              message += `💡 *Cara Kick:*\n`;
              message += `• Pilih nomor anggota di bawah untuk kick\n\n`;
              message += `ℹ️ *Catatan:*\n`;
              message += `• Status CANCELLED = anggota sudah tidak aktif/kick`;
              
              // Add number buttons for member selection
              const buttons = ButtonUtils.getNumberButtons(data.members.length);
              buttons.reply_markup.inline_keyboard.push([
                { text: '🏠 Menu Utama', callback_data: 'action_main_menu' }
              ]);
              
              await MessageUtils.sendAndReplace(
                ctx,
                message,
                {
                  parse_mode: 'Markdown',
                  reply_markup: buttons.reply_markup
                },
                loadingMessage.message_id
              );
            } else {
              await MessageUtils.sendAndReplace(
                ctx,
                '❌ Tidak ada anggota yang ditemukan',
                {
                  reply_markup: ButtonUtils.getBackToMainMenu().reply_markup
                },
                loadingMessage.message_id
              );
            }
          } else {
            // Show kick result
            let message = '👥 *Hasil Kick Anggota*\n\n';
            
            if (data.member) {
              message += `✅ *Anggota Berhasil Dikick*\n\n`;
              message += `👤 Nama: ${data.member.member_name || 'N/A'}\n`;
              message += `📱 Nomor: ${data.member.msisdn || 'N/A'}\n`;
              message += `👤 Role: ${data.member.member_role || 'N/A'}\n`;
              message += `🎫 Slot: ${data.member.slot_type || 'N/A'}\n`;
              message += `🆔 Member ID: \`${data.member.member_id || 'N/A'}\`\n\n`;
              message += `🏷️ Group ID: \`${data.group_id || 'N/A'}\`\n`;
              message += `✅ Status: ${data.message || 'N/A'}`;
            } else {
              message += '❌ Tidak ada anggota yang berhasil dikick';
            }
            
            // Panel Info
            if (data.info_saldo_panel) {
              const panel = data.info_saldo_panel;
              message += `\n\n💰 *Panel Info*\n`;
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
          }
        } else {
          await MessageUtils.sendAndReplace(
            ctx,
            '❌ Gagal memproses kick anggota',
            {
              reply_markup: ButtonUtils.getBackToMainMenu().reply_markup
            },
            loadingMessage.message_id
          );
        }
      } catch (error) {
        await MessageUtils.sendAndReplace(
          ctx,
          '❌ Terjadi kesalahan saat memproses kick anggota',
          {
            reply_markup: ButtonUtils.getBackToMainMenu().reply_markup
          },
          loadingMessage.message_id
        );
      }
      
      // Clear session
      sessionManager.clearSession(userId);
    } catch (error) {
      logger.error('Failed to process kick request', error);
      await MessageUtils.sendError(ctx, 'Gagal memproses permintaan kick');
    }
  }
}

module.exports = new KickHandler();
