const { Telegraf } = require('telegraf');
const config = require('./config');
const logger = require('./utils/logger');
const ButtonUtils = require('./utils/buttonUtils');
const MessageUtils = require('./utils/messageUtils');
const sessionManager = require('./utils/sessionManager');

// Import handlers
const helpHandler = require('./handlers/helpHandler');
const validateHandler = require('./handlers/validateHandler');
const createHandler = require('./handlers/createHandler');
const inviteHandler = require('./handlers/inviteHandler');
const infoHandler = require('./handlers/infoHandler');
const bonusHandler = require('./handlers/bonusHandler');
const kickHandler = require('./handlers/kickHandler');

class CircleManagementBot {
  constructor() {
    this.bot = new Telegraf(config.bot.token);
    this.setupCommands();
    this.setupErrorHandling();
  }

  setupCommands() {
    // Start command - Show main menu
    this.bot.start((ctx) => {
      this.showMainMenu(ctx);
    });

    // Help command - Show main menu
    this.bot.command('help', (ctx) => {
      this.showMainMenu(ctx);
    });

    // Setup callback query handlers for buttons
    this.setupCallbackHandlers();

    // Text message handler for input
    this.bot.on('text', (ctx) => {
      this.handleTextInput(ctx);
    });
  }

  setupCallbackHandlers() {
    // Main menu callback
    this.bot.action('action_main_menu', async (ctx) => {
      await ctx.answerCbQuery();
      // Delete the current message before showing main menu
      try {
        await ctx.deleteMessage();
      } catch (error) {
        logger.warn('Failed to delete message in main menu callback', { error: error.message });
      }
      this.showMainMenu(ctx);
    });

    // Help action
    this.bot.action('action_help', async (ctx) => {
      await ctx.answerCbQuery();
      // Delete the current message before showing help
      try {
        await ctx.deleteMessage();
      } catch (error) {
        logger.warn('Failed to delete message in help callback', { error: error.message });
      }
      helpHandler.handle(ctx);
    });

    // Validate action
    this.bot.action('action_validate', async (ctx) => {
      await ctx.answerCbQuery();
      // Delete the current message before showing validate form
      try {
        await ctx.deleteMessage();
      } catch (error) {
        logger.warn('Failed to delete message in validate callback', { error: error.message });
      }
      validateHandler.handle(ctx);
    });

    // Create action
    this.bot.action('action_create', async (ctx) => {
      await ctx.answerCbQuery();
      // Delete the current message before showing create form
      try {
        await ctx.deleteMessage();
      } catch (error) {
        logger.warn('Failed to delete message in create callback', { error: error.message });
      }
      createHandler.handle(ctx);
    });

    // Invite action
    this.bot.action('action_invite', async (ctx) => {
      await ctx.answerCbQuery();
      // Delete the current message before showing invite form
      try {
        await ctx.deleteMessage();
      } catch (error) {
        logger.warn('Failed to delete message in invite callback', { error: error.message });
      }
      inviteHandler.handle(ctx);
    });

    // Info action
    this.bot.action('action_info', async (ctx) => {
      await ctx.answerCbQuery();
      // Delete the current message before showing info form
      try {
        await ctx.deleteMessage();
      } catch (error) {
        logger.warn('Failed to delete message in info callback', { error: error.message });
      }
      infoHandler.handle(ctx);
    });

    // Bonus action
    this.bot.action('action_bonus', async (ctx) => {
      await ctx.answerCbQuery();
      // Delete the current message before showing bonus options
      try {
        await ctx.deleteMessage();
      } catch (error) {
        logger.warn('Failed to delete message in bonus callback', { error: error.message });
      }
      bonusHandler.handle(ctx);
    });

    // Kick action
    this.bot.action('action_kick', async (ctx) => {
      await ctx.answerCbQuery();
      // Delete the current message before showing kick options
      try {
        await ctx.deleteMessage();
      } catch (error) {
        logger.warn('Failed to delete message in kick callback', { error: error.message });
      }
      kickHandler.handle(ctx);
    });

    // Cancel action
    this.bot.action('action_cancel', async (ctx) => {
      await ctx.answerCbQuery();
      // Delete the current message before showing main menu
      try {
        await ctx.deleteMessage();
      } catch (error) {
        logger.warn('Failed to delete message in cancel callback', { error: error.message });
      }
      this.showMainMenu(ctx);
    });

    // Handle other callback queries
    this.bot.on('callback_query', async (ctx) => {
      const callbackData = ctx.callbackQuery.data;
      
      try {
        // Handle bonus actions
        if (callbackData.startsWith('bonus_')) {
          await ctx.answerCbQuery();
          // Delete the current message before handling bonus callback
          try {
            await ctx.deleteMessage();
          } catch (error) {
            logger.warn('Failed to delete message in bonus callback', { error: error.message });
          }
          bonusHandler.handleCallback(ctx);
        }
        
        // Handle kick actions
        else if (callbackData.startsWith('kick_')) {
          await ctx.answerCbQuery();
          // Delete the current message before handling kick callback
          try {
            await ctx.deleteMessage();
          } catch (error) {
            logger.warn('Failed to delete message in kick callback', { error: error.message });
          }
          kickHandler.handleCallback(ctx);
        }
        
        // Handle number selection
        else if (callbackData.startsWith('number_')) {
          await ctx.answerCbQuery();
          // Delete the current message before handling number selection
          try {
            await ctx.deleteMessage();
          } catch (error) {
            logger.warn('Failed to delete message in number selection', { error: error.message });
          }
          this.handleNumberSelection(ctx);
        }
        
        // Handle confirmations
        else if (callbackData.startsWith('confirm_')) {
          await ctx.answerCbQuery();
          // Delete the current message before handling confirmation
          try {
            await ctx.deleteMessage();
          } catch (error) {
            logger.warn('Failed to delete message in confirmation', { error: error.message });
          }
          this.handleConfirmation(ctx);
        }
        
        // Handle input types
        else if (callbackData.startsWith('input_')) {
          await ctx.answerCbQuery();
          // Delete the current message before handling input type
          try {
            await ctx.deleteMessage();
          } catch (error) {
            logger.warn('Failed to delete message in input type', { error: error.message });
          }
          this.handleInputType(ctx);
        }
        
        // Unknown callback
        else {
          await ctx.answerCbQuery('Aksi tidak dikenali');
        }
      } catch (error) {
        logger.error('Callback query error', { error: error.message, callbackData });
        await ctx.answerCbQuery('Terjadi kesalahan');
      }
    });
  }

  async showMainMenu(ctx) {
    try {
      const welcomeMessage = `
🎉 *Selamat Datang di Circle Management Bot!*

Bot ini membantu Anda mengelola Circle dengan mudah melalui Telegram.

Pilih menu di bawah ini untuk memulai:
      `;

      // Send new message (no need to replace since callback already deleted the message)
      const sentMessage = await ctx.reply(welcomeMessage, {
        parse_mode: 'Markdown',
        reply_markup: ButtonUtils.getMainMenu().reply_markup
      });

      // Store message ID for future deletion
      if (ctx.from?.id) {
        sessionManager.setLastMessageId(ctx.from.id, sentMessage.message_id);
      }

      // Clear any existing session
      sessionManager.clearSession(ctx.from.id);
    } catch (error) {
      logger.error('Failed to show main menu', error);
      await MessageUtils.sendError(ctx, 'Gagal menampilkan menu utama');
    }
  }

  async handleTextInput(ctx) {
    try {
      const userId = ctx.from.id;
      const text = ctx.message.text;
      const currentAction = sessionManager.getCurrentAction(userId);
      
      if (!currentAction) {
        // No active session, show main menu
        await this.showMainMenu(ctx);
        return;
      }

      // Handle different input types based on current action
      switch (currentAction) {
        case 'validate':
          await validateHandler.handleTextInput(ctx, text);
          break;
        case 'create':
          await createHandler.handleTextInput(ctx, text);
          break;
        case 'invite':
          await inviteHandler.handleTextInput(ctx, text);
          break;
        case 'info':
          await infoHandler.handleTextInput(ctx, text);
          break;
        case 'bonus':
          await bonusHandler.handleTextInput(ctx, text);
          break;
        case 'kick':
          await kickHandler.handleTextInput(ctx, text);
          break;
        default:
          await this.showMainMenu(ctx);
      }
    } catch (error) {
      logger.error('Failed to handle text input', error);
      await MessageUtils.sendError(ctx, 'Gagal memproses input');
    }
  }

  async handleNumberSelection(ctx) {
    try {
      const callbackData = ctx.callbackQuery.data;
      const number = callbackData.split('_')[1];
      const userId = ctx.from.id;
      
      // Store the selected number
      sessionManager.updateActionData(userId, { selectedNumber: number });
      
      // Answer callback query
      await ctx.answerCbQuery(`Dipilih: ${number}`);
      
      // Continue with the current action
      const currentAction = sessionManager.getCurrentAction(userId);
      if (currentAction) {
        switch (currentAction) {
          case 'bonus':
            await bonusHandler.handleNumberSelection(ctx, number);
            break;
          case 'kick':
            await kickHandler.handleNumberSelection(ctx, number);
            break;
        }
      }
    } catch (error) {
      logger.error('Failed to handle number selection', error);
      await ctx.answerCbQuery('Gagal memproses pilihan');
    }
  }

  async handleConfirmation(ctx) {
    try {
      const callbackData = ctx.callbackQuery.data;
      const action = callbackData.split('_')[1];
      const userId = ctx.from.id;
      
      // Answer callback query
      await ctx.answerCbQuery('Konfirmasi diterima');
      
      // Handle confirmation based on action
      switch (action) {
        case 'create':
          await createHandler.handleConfirmation(ctx);
          break;
        case 'invite':
          await inviteHandler.handleConfirmation(ctx);
          break;
        case 'kick':
          await kickHandler.handleConfirmation(ctx);
          break;
        default:
          await this.showMainMenu(ctx);
      }
    } catch (error) {
      logger.error('Failed to handle confirmation', error);
      await ctx.answerCbQuery('Gagal memproses konfirmasi');
    }
  }

  async handleInputType(ctx) {
    try {
      const callbackData = ctx.callbackQuery.data;
      const inputType = callbackData.split('_').slice(1).join('_');
      const userId = ctx.from.id;
      
      // Store the input type
      sessionManager.updateActionData(userId, { currentInputType: inputType });
      
      // Show input prompt
      await this.showInputPrompt(ctx, inputType);
    } catch (error) {
      logger.error('Failed to handle input type', error);
      await ctx.answerCbQuery('Gagal memproses input type');
    }
  }

  async showInputPrompt(ctx, inputType) {
    try {
      const prompts = {
        'admin_phone': '📱 Masukkan nomor admin (contoh: 6281234567890):',
        'member_phone': '📱 Masukkan nomor anggota (contoh: 6289876543210):',
        'group_name': '🏷️ Masukkan nama grup (contoh: My Circle):',
        'admin_name': '👤 Masukkan nama admin (contoh: Admin Name):',
        'member_name': '👥 Masukkan nama anggota (contoh: Member Name):'
      };

      const prompt = prompts[inputType] || 'Masukkan data:';
      
      // Send new message (no need to replace since callback already deleted the message)
      const sentMessage = await ctx.reply(prompt, {
        reply_markup: ButtonUtils.getCancelButton().reply_markup
      });

      // Store message ID for future deletion
      if (ctx.from?.id) {
        sessionManager.setLastMessageId(ctx.from.id, sentMessage.message_id);
      }
    } catch (error) {
      logger.error('Failed to show input prompt', error);
      await MessageUtils.sendError(ctx, 'Gagal menampilkan prompt input');
    }
  }

  setupErrorHandling() {
    // Global error handler
    this.bot.catch((err, ctx) => {
      logger.error('Bot error', {
        error: err.message,
        stack: err.stack,
        update: ctx.update,
      });
      
      ctx.reply(
        '❌ Terjadi kesalahan internal. Silakan coba lagi atau hubungi administrator.',
        { parse_mode: 'Markdown' }
      );
    });

    // Process error handler
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection', { reason, promise });
    });

    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception', error);
      process.exit(1);
    });
  }

  async start() {
    try {
      // Create logs directory if not exists
      const fs = require('fs');
      const path = require('path');
      const logsDir = path.join(__dirname, '..', 'logs');
      if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir, { recursive: true });
      }

      logger.info('Starting Circle Management Bot...');
      
      await this.bot.launch();
      
      logger.info('Bot started successfully!');
      console.log('🤖 Circle Management Bot is running...');
      console.log('Press Ctrl+C to stop the bot');
      
      // Graceful shutdown
      process.once('SIGINT', () => this.stop('SIGINT'));
      process.once('SIGTERM', () => this.stop('SIGTERM'));
      
    } catch (error) {
      logger.error('Failed to start bot', error);
      process.exit(1);
    }
  }

  async stop(signal) {
    logger.info(`Bot stopping due to ${signal}...`);
    this.bot.stop(signal);
    logger.info('Bot stopped');
    process.exit(0);
  }
}

// Start the bot
const bot = new CircleManagementBot();
bot.start();
