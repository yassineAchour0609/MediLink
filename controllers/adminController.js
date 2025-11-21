const db = require('../config/db');

const adminController = {
  blockAccount: async (req, res) => {
    try {
      const { userId, reason } = req.query;

      if (!userId) {
        return res.status(400).json({ error: "userId requis" });
      }

      // Vérifier si le compte existe
      const [user] = await db.execute(
        "SELECT idUtilisateur, email, nom, prenom FROM utilisateur WHERE idUtilisateur = ?",
        [userId]
      );

      if (user.length === 0) {
        return res.status(404).json({ error: "Utilisateur non trouvé" });
      }

      // Bloquer le compte
      await db.execute(
        `INSERT INTO comptesbloques (user_id, reason, blocked_date) 
         VALUES (?, ?, NOW())
         ON DUPLICATE KEY UPDATE reason=?, blocked_date=NOW()`,
        [userId, reason || 'Compte bloqué par administrateur', reason || 'Compte bloqué par administrateur']
      );

      res.json({
        success: true,
        message: `Compte ${userId} bloqué avec succès`,
        data: {
          userId,
          email: user[0].email,
          nom: user[0].nom,
          prenom: user[0].prenom,
          reason: reason || 'Compte bloqué par administrateur'
        }
      });
    } catch (error) {
      console.error('Erreur blockAccount:', error);
      res.status(500).json({ error: error.message });
    }
  },

  /**
   * Débloquer un compte
   * POST /admin/unblock-account?userId=16
   */
  unblockAccount: async (req, res) => {
    try {
      const { userId } = req.query;

      if (!userId) {
        return res.status(400).json({ error: "userId requis" });
      }

      const [result] = await db.execute(
        "DELETE FROM comptesbloques WHERE user_id = ?",
        [userId]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Ce compte n'est pas bloqué" });
      }

      res.json({
        success: true,
        message: `Compte ${userId} débloqué avec succès`
      });
    } catch (error) {
      console.error('Erreur unblockAccount:', error);
      res.status(500).json({ error: error.message });
    }
  },

  /**
   * Lister tous les comptes bloqués
   * GET /admin/blocked-accounts
   */
  listBlockedAccounts: async (req, res) => {
    try {
      const [blocked] = await db.execute(
        `SELECT 
           ba.user_id,
           u.email,
           u.prenom,
           u.nom,
           u.role,
           ba.reason,
           ba.blocked_date
         FROM comptesbloques ba
         JOIN utilisateur u ON ba.user_id = u.idUtilisateur
         ORDER BY ba.blocked_date DESC`
      );

      res.json({
        success: true,
        count: blocked.length,
        data: blocked
      });
    } catch (error) {
      console.error('Erreur listecomptesbloques:', error);
      res.status(500).json({ error: error.message });
    }
  },

  /**
   * Vérifier si un compte est bloqué
   * GET /admin/is-blocked?userId=16
   */
  isAccountBlocked: async (req, res) => {
    try {
      const { userId } = req.query;

      if (!userId) {
        return res.status(400).json({ error: "userId requis" });
      }

      const [blocked] = await db.execute(
        "SELECT user_id, reason, blocked_date FROM comptesbloques WHERE user_id = ?",
        [userId]
      );

      res.json({
        success: true,
        isBlocked: blocked.length > 0,
        data: blocked.length > 0 ? blocked[0] : null
      });
    } catch (error) {
      console.error('Erreur compte est bloque:', error);
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = adminController;
