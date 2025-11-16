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
  }
};

module.exports = medecinController;