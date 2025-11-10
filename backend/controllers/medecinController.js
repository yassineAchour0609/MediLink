const db = require('../config/db');

const medecinController = {
  getMedecins: async (req, res) => {
    try {
      const [rows] = await db.execute(`
        SELECT 
          u.idUtilisateur,
          u.prenom,
          u.nom,
          u.sexe,
          u.email,
          m.specialite,
          m.cabinet,
          m.tarif_consultation,
          m.disponibilite,
          DATE_FORMAT(m.heure_ouverture, '%H:%i') AS heure_ouverture,
          DATE_FORMAT(m.heure_fermeture, '%H:%i') AS heure_fermeture
        FROM utilisateur u
        INNER JOIN medecin m ON u.idUtilisateur = m.idUtilisateur
        WHERE u.role = 'medecin'
      `);

      res.json({ success: true, medecins: rows });
    } catch (error) {
      console.error("❌ Erreur SQL :", error);
      res.status(500).json({ success: false, message: error.message });
    }
  },
  getMedecinById: async (req, res) => {
    const { id } = req.params;

    try {
      const [rows] = await db.execute(`
        SELECT 
          u.idUtilisateur,
          u.prenom,
          u.nom,
          u.sexe,
          u.email,
          m.specialite,
          m.cabinet,
          m.tarif_consultation,
          m.disponibilite,
          DATE_FORMAT(m.heure_ouverture, '%H:%i') AS heure_ouverture,
          DATE_FORMAT(m.heure_fermeture, '%H:%i') AS heure_fermeture
        FROM utilisateur u
        INNER JOIN medecin m ON u.idUtilisateur = m.idUtilisateur
        WHERE u.role = 'medecin' AND u.idUtilisateur = ?
      `, [id]);

      if (rows.length === 0) {
        return res.status(404).json({ success: false, message: "Médecin introuvable" });
      }

      res.json({ success: true, medecin: rows[0] });
    } catch (error) {
      console.error("❌ Erreur SQL :", error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  /**
   * Tableau de bord des rendez-vous pour un médecin
   */
  getDashboardRendezVous: async (req, res) => {
    const { idMedecin } = req.params;
    const { date } = req.query; // Optionnel: filtrer par date

    try {
      let query = `
        SELECT 
          r.idRdv,
          r.date,
          DATE_FORMAT(r.heure, '%H:%i') AS heure,
          r.statut,
          r.idPatient,
          r.idMedecin,
          u.nom AS patientNom,
          u.prenom AS patientPrenom,
          u.telephone AS patientTelephone,
          u.email AS patientEmail
        FROM rendezvous r
        INNER JOIN utilisateur u ON u.idUtilisateur = r.idPatient
        WHERE r.idMedecin = ?
      `;
      const params = [idMedecin];

      if (date) {
        query += ` AND r.date = ?`;
        params.push(date);
      }
      // Retirer le filtre par défaut pour afficher TOUS les rendez-vous

      query += ` ORDER BY r.date ASC, r.heure ASC`;

      const [rendezvous] = await db.execute(query, params);

      // Statistiques
      const today = new Date().toISOString().split('T')[0];
      const [todayCount] = await db.execute(
        `SELECT COUNT(*) as count FROM rendezvous WHERE idMedecin = ? AND date = ? AND statut != 'Annulé'`,
        [idMedecin, today]
      );

      const [upcomingCount] = await db.execute(
        `SELECT COUNT(*) as count FROM rendezvous WHERE idMedecin = ? AND date > CURDATE() AND statut = 'prévu'`,
        [idMedecin]
      );

      res.json({
        success: true,
        rendezvous,
        stats: {
          today: todayCount[0].count,
          upcoming: upcomingCount[0].count
        }
      });
    } catch (error) {
      console.error('Erreur lors de la récupération du tableau de bord :', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }
};

module.exports = medecinController;