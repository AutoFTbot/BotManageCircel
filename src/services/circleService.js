const apiClient = require('./apiClient');
const logger = require('../utils/logger');

class CircleService {
  /**
   * Get help information about available actions and their fees
   */
  async getHelp() {
    try {
      const response = await apiClient.makeRequest('help');
      return response;
    } catch (error) {
      logger.error('Failed to get help', error);
      throw new Error('Gagal mendapatkan informasi bantuan');
    }
  }

  /**
   * Validate member number before inviting to circle
   * @param {string} nomorAdmin - Admin phone number
   * @param {string} nomorAnggota - Member phone number to validate
   */
  async validateNumber(nomorAdmin, nomorAnggota) {
    try {
      const response = await apiClient.makeRequest('validasi_nomor', {
        nomor_admin: nomorAdmin,
        nomor_anggota: nomorAnggota,
      });
      return response;
    } catch (error) {
      logger.error('Failed to validate number', { nomorAdmin, nomorAnggota, error });
      throw new Error('Gagal memvalidasi nomor anggota');
    }
  }

  /**
   * Create new circle group and invite first member
   * @param {Object} params - Circle creation parameters
   */
  async createCircle(params) {
    const { nomorAdmin, nomorAnggota, namaGroup, namaAdmin, namaAnggota } = params;
    
    try {
      const response = await apiClient.makeRequest('create', {
        nomor_admin: nomorAdmin,
        nomor_anggota: nomorAnggota,
        nama_group: namaGroup,
        nama_admin: namaAdmin,
        nama_anggota: namaAnggota,
      });
      return response;
    } catch (error) {
      logger.error('Failed to create circle', { params, error });
      throw new Error('Gagal membuat grup circle');
    }
  }

  /**
   * Invite new member to existing circle
   * @param {Object} params - Invite parameters
   */
  async inviteMember(params) {
    const { nomorAdmin, nomorAnggota, namaAnggota } = params;
    
    try {
      const response = await apiClient.makeRequest('invite', {
        nomor_admin: nomorAdmin,
        nomor_anggota: nomorAnggota,
        nama_anggota: namaAnggota,
      });
      return response;
    } catch (error) {
      logger.error('Failed to invite member', { params, error });
      throw new Error('Gagal mengundang anggota baru');
    }
  }

  /**
   * Get detailed information about circle group and remaining quota
   * @param {string} nomorAdmin - Admin phone number
   */
  async getCircleInfo(nomorAdmin) {
    try {
      const response = await apiClient.makeRequest('info', {
        nomor_admin: nomorAdmin,
      });
      return response;
    } catch (error) {
      logger.error('Failed to get circle info', { nomorAdmin, error });
      throw new Error('Gagal mendapatkan informasi circle');
    }
  }

  /**
   * Claim available bonuses
   * @param {string} nomorAdmin - Admin phone number
   * @param {string} listBonus - Bonus action parameter ('list', 'all', or specific number)
   */
  async claimBonus(nomorAdmin, listBonus = 'list') {
    try {
      const response = await apiClient.makeRequest('bonus', {
        nomor_admin: nomorAdmin,
        list_bonus: listBonus,
      });
      return response;
    } catch (error) {
      logger.error('Failed to claim bonus', { nomorAdmin, listBonus, error });
      throw new Error('Gagal mengklaim bonus');
    }
  }

  /**
   * Kick member from circle
   * @param {string} nomorAdmin - Admin phone number
   * @param {string} kickNomor - Kick action parameter ('list' or specific number)
   */
  async kickMember(nomorAdmin, kickNomor = 'list') {
    try {
      const response = await apiClient.makeRequest('kick', {
        nomor_admin: nomorAdmin,
        kick_nomor: kickNomor,
      });
      return response;
    } catch (error) {
      logger.error('Failed to kick member', { nomorAdmin, kickNomor, error });
      throw new Error('Gagal mengeluarkan anggota');
    }
  }
}

module.exports = new CircleService();
