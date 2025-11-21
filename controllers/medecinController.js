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
          m.heure_ouverture,
          m.heure_fermeture
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
          u.telephone,
          u.date_naissance,
          m.specialite,
          m.cabinet,
          m.tarif_consultation,
          m.disponibilite,
          m.heure_ouverture,
          m.heure_fermeture
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

  // Récupérer le profil du médecin connecté
  getMedecinProfile: async (req, res) => {
    try {
      const medecinId = req.user.id;

      const [rows] = await db.execute(`
        SELECT 
          u.idUtilisateur,
          u.prenom,
          u.nom,
          u.sexe,
          u.email,
          u.telephone,
          u.date_naissance,
          u.num_cin,
          m.specialite,
          m.cabinet,
          m.tarif_consultation,
          m.disponibilite,
          m.heure_ouverture,
          m.heure_fermeture
        FROM utilisateur u
        INNER JOIN medecin m ON u.idUtilisateur = m.idUtilisateur
        WHERE u.role = 'medecin' AND u.idUtilisateur = ?
      `, [medecinId]);

      if (rows.length === 0) {
        return res.status(404).json({ success: false, message: "Profil médecin non trouvé" });
      }

      res.json({ success: true, medecin: rows[0] });
    } catch (error) {
      console.error("❌ Erreur SQL :", error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Mettre à jour le profil du médecin
  updateMedecinProfile: async (req, res) => {
    try {
      const medecinId = req.user.id;
      const { nom, prenom, telephone, specialite, cabinet, tarif_consultation, disponibilite, heure_ouverture, heure_fermeture } = req.body;

      if (!nom || !prenom || !telephone) {
        return res.status(400).json({ 
          success: false, 
          message: "nom, prenom et telephone sont requis" 
        });
      }

      if (!specialite || !cabinet || tarif_consultation === undefined) {
        return res.status(400).json({ 
          success: false, 
          message: "specialite, cabinet et tarif_consultation sont requis" 
        });
      }

      // Mettre à jour les infos utilisateur
      await db.execute(
        `UPDATE utilisateur 
         SET nom = ?, prenom = ?, telephone = ?
         WHERE idUtilisateur = ?`,
        [nom, prenom, telephone, medecinId]
      );

      // Mettre à jour les infos médecin
      await db.execute(
        `UPDATE medecin 
         SET specialite = ?, cabinet = ?, tarif_consultation = ?, disponibilite = ?, heure_ouverture = ?, heure_fermeture = ?
         WHERE idUtilisateur = ?`,
        [specialite, cabinet, tarif_consultation, disponibilite || 1, heure_ouverture || '08:00:00', heure_fermeture || '19:00:00', medecinId]
      );

      res.json({ 
        success: true, 
        message: "Profil médecin mis à jour avec succès" 
      });
    } catch (error) {
      console.error("Erreur mise à jour profil médecin:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  }
};

module.exports = medecinController;