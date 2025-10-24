const { Markup } = require('telegraf');

class ButtonUtils {
  /**
   * Main menu buttons
   */
  static getMainMenu() {
    return Markup.inlineKeyboard([
      [
        Markup.button.callback('📋 Help & Info', 'action_help'),
        Markup.button.callback('✅ Validasi Nomor', 'action_validate')
      ],
      [
        Markup.button.callback('🆕 Buat Circle', 'action_create'),
        Markup.button.callback('👥 Undang Anggota', 'action_invite')
      ],
      [
        Markup.button.callback('📊 Info Circle', 'action_info'),
        Markup.button.callback('🎁 Kelola Bonus', 'action_bonus')
      ],
      [
        Markup.button.callback('👤 Kelola Anggota', 'action_kick')
      ]
    ]);
  }

  /**
   * Back to main menu button
   */
  static getBackToMainMenu() {
    return Markup.inlineKeyboard([
      [Markup.button.callback('🏠 Kembali ke Menu Utama', 'action_main_menu')]
    ]);
  }

  /**
   * Cancel button
   */
  static getCancelButton() {
    return Markup.inlineKeyboard([
      [Markup.button.callback('❌ Batal', 'action_cancel')]
    ]);
  }

  /**
   * Yes/No buttons
   */
  static getYesNoButtons() {
    return Markup.inlineKeyboard([
      [
        Markup.button.callback('✅ Ya', 'action_yes'),
        Markup.button.callback('❌ Tidak', 'action_no')
      ]
    ]);
  }

  /**
   * Bonus action buttons
   */
  static getBonusActionButtons() {
    return Markup.inlineKeyboard([
      [
        Markup.button.callback('📋 Lihat List Bonus', 'bonus_list'),
        Markup.button.callback('🎁 Klaim Semua Bonus', 'bonus_all')
      ],
      [
        Markup.button.callback('🏠 Menu Utama', 'action_main_menu')
      ]
    ]);
  }

  /**
   * Kick action buttons
   */
  static getKickActionButtons() {
    return Markup.inlineKeyboard([
      [
        Markup.button.callback('📋 Lihat List Anggota', 'kick_list'),
        Markup.button.callback('👤 Pilih Anggota', 'kick_select')
      ],
      [
        Markup.button.callback('🏠 Menu Utama', 'action_main_menu')
      ]
    ]);
  }

  /**
   * Number selection buttons (1-10)
   */
  static getNumberButtons(max = 10) {
    const buttons = [];
    for (let i = 1; i <= max; i += 2) {
      const row = [];
      row.push(Markup.button.callback(`${i}`, `number_${i}`));
      if (i + 1 <= max) {
        row.push(Markup.button.callback(`${i + 1}`, `number_${i + 1}`));
      }
      buttons.push(row);
    }
    buttons.push([Markup.button.callback('🏠 Menu Utama', 'action_main_menu')]);
    return Markup.inlineKeyboard(buttons);
  }

  /**
   * Confirmation buttons for actions
   */
  static getConfirmationButtons(action) {
    return Markup.inlineKeyboard([
      [
        Markup.button.callback('✅ Konfirmasi', `confirm_${action}`),
        Markup.button.callback('❌ Batal', 'action_cancel')
      ]
    ]);
  }

  /**
   * Input type buttons
   */
  static getInputTypeButtons() {
    return Markup.inlineKeyboard([
      [
        Markup.button.callback('📱 Nomor Admin', 'input_admin_phone'),
        Markup.button.callback('📱 Nomor Anggota', 'input_member_phone')
      ],
      [
        Markup.button.callback('🏷️ Nama Grup', 'input_group_name'),
        Markup.button.callback('👤 Nama Admin', 'input_admin_name')
      ],
      [
        Markup.button.callback('👥 Nama Anggota', 'input_member_name'),
        Markup.button.callback('🏠 Menu Utama', 'action_main_menu')
      ]
    ]);
  }
}

module.exports = ButtonUtils;
