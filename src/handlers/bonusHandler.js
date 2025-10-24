const circleService = require('../services/circleService');
const validators = require('../utils/validators');
const logger = require('../utils/logger');
const MessageUtils = require('../utils/messageUtils');
const ButtonUtils = require('../utils/buttonUtils');
const sessionManager = require('../utils/sessionManager');

class BonusHandler {
  async handle(ctx) {
    try {
      const userId = ctx.from.id;
      
      // Set current action
      sessionManager.setCurrentAction(userId, 'bonus', {
        step: 0,
        inputData: {}
      });
      
      // Show action selection
      await this.showActionSelection(ctx);
    } catch (error) {
      logger.error('Bonus handler error', error);
      await MessageUtils.sendError(ctx, 'Terjadi kesalahan saat memproses bonus');
    }
  }

  async showActionSelection(ctx) {
    try {
      const message = `
🎁 *Kelola Bonus Circle*

Pilih aksi yang ingin dilakukan:

• 📋 Lihat daftar bonus yang tersedia
• 🎁 Klaim semua bonus yang tersedia
• 👤 Pilih bonus tertentu untuk diklaim
      `;

      await MessageUtils.sendAndReplace(
        ctx,
        message,
        {
          parse_mode: 'Markdown',
          reply_markup: ButtonUtils.getBonusActionButtons().reply_markup
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
      
      if (callbackData === 'bonus_list') {
        await this.handleListBonus(ctx);
      } else if (callbackData === 'bonus_all') {
        await this.handleClaimAllBonus(ctx);
      } else {
        await ctx.answerCbQuery('Aksi tidak dikenali');
      }
    } catch (error) {
      logger.error('Failed to handle callback', error);
      await ctx.answerCbQuery('Gagal memproses aksi');
    }
  }

  async handleListBonus(ctx) {
    try {
      const userId = ctx.from.id;
      
      // Set current action
      sessionManager.setCurrentAction(userId, 'bonus', {
        step: 1,
        action: 'list',
        inputData: {}
      });
      
      // Show input form for admin phone
      await this.showAdminPhoneInput(ctx);
    } catch (error) {
      logger.error('Failed to handle list bonus', error);
      await MessageUtils.sendError(ctx, 'Gagal memproses list bonus');
    }
  }

  async handleClaimAllBonus(ctx) {
    try {
      const userId = ctx.from.id;
      
      // Set current action
      sessionManager.setCurrentAction(userId, 'bonus', {
        step: 1,
        action: 'all',
        inputData: {}
      });
      
      // Show input form for admin phone
      await this.showAdminPhoneInput(ctx);
    } catch (error) {
      logger.error('Failed to handle claim all bonus', error);
      await MessageUtils.sendError(ctx, 'Gagal memproses klaim semua bonus');
    }
  }

  async showAdminPhoneInput(ctx) {
    try {
      const message = `
🎁 *Kelola Bonus Circle*

Masukkan nomor admin untuk mengelola bonus:

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

      // Process bonus request
      const action = session.actionData.action;
      await this.processBonusRequest(ctx, text, action);
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

      // Process bonus claim with specific number
      await this.processBonusRequest(ctx, nomorAdmin, number);
    } catch (error) {
      logger.error('Failed to handle number selection', error);
      await MessageUtils.sendError(ctx, 'Gagal memproses pilihan nomor');
    }
  }

  async processBonusRequest(ctx, nomorAdmin, action) {
    try {
      const userId = ctx.from.id;
      
      // Show loading message
      const loadingMessage = await MessageUtils.sendLoading(ctx, '🔄 Memproses bonus...');
      
      try {
        const response = await circleService.claimBonus(nomorAdmin, action);
        
        if (response.status === 'success') {
          const data = response.data;
          
          if (action === 'list') {
            // Show bonus list
            let message = '🎁 *Daftar Bonus Tersedia*\n\n';
            message += `📊 Total: ${data.count || 0} bonus\n\n`;
            
            if (data.bonuses && data.bonuses.length > 0) {
              data.bonuses.forEach((bonus, index) => {
                message += `*${bonus.index}. ${bonus.title}*\n`;
                message += `📝 Deskripsi: ${bonus.description || '-'}\n`;
                message += `📊 Status: ${bonus.status || '-'}\n\n`;
              });
              
              message += `💡 *Cara Klaim:*\n`;
              message += `• Pilih nomor bonus di bawah untuk klaim tertentu\n`;
              message += `• Atau gunakan tombol "Klaim Semua Bonus"`;
              
              // Add number buttons for bonus selection
              const buttons = ButtonUtils.getNumberButtons(data.bonuses.length);
              buttons.reply_markup.inline_keyboard.push([
                { text: '🎁 Klaim Semua Bonus', callback_data: 'bonus_all' }
              ]);
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
                '❌ Tidak ada bonus yang tersedia',
                {
                  reply_markup: ButtonUtils.getBackToMainMenu().reply_markup
                },
                loadingMessage.message_id
              );
            }
          } else {
            // Show claim result
            let message = '🎁 *Hasil Klaim Bonus*\n\n';
            
            if (data.results && data.results.length > 0) {
              message += `✅ Berhasil mengklaim ${data.count || 0} bonus\n\n`;
              
              data.results.forEach((result, index) => {
                message += `*${index + 1}. ${result.bonus?.name || 'N/A'}*\n`;
                message += `📊 Status: ${result.status || 'N/A'}\n`;
                message += `💰 Total Amount: ${result.resp?.data?.total_amount || 0} IDR\n`;
                message += `🆔 Transaction Code: ${result.resp?.data?.transaction_code || 'N/A'}\n`;
                message += `💳 Payment Method: ${result.resp?.data?.payment_method || 'N/A'}\n\n`;
              });
            } else {
              message += '❌ Tidak ada bonus yang berhasil diklaim';
            }
            
            // Panel Info
            if (data.info_saldo_panel) {
              const panel = data.info_saldo_panel;
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
          }
        } else {
          await MessageUtils.sendAndReplace(
            ctx,
            '❌ Gagal memproses bonus',
            {
              reply_markup: ButtonUtils.getBackToMainMenu().reply_markup
            },
            loadingMessage.message_id
          );
        }
      } catch (error) {
        let errorMessage = '❌ Terjadi kesalahan saat memproses bonus';
        
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
      logger.error('Failed to process bonus request', error);
      await MessageUtils.sendError(ctx, 'Gagal memproses permintaan bonus');
    }
  }
}

module.exports = new BonusHandler();
