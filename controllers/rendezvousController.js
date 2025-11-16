const db = require('../config/db');

const rendezvousController = {

 // Met à jour les statuts des rendez-vous déjà passés
 async _markPastAppointmentsPassed(whereClauseSql, whereParams) {
   // Tous les rendez-vous dont la date/heure est passée et statut = 'prévu' deviennent 'passé'
   const updateSql = `
     UPDATE \`rendezvous\`
     SET statut = 'terminé'
     WHERE statut = 'prévu'
       AND (
         date < CURRENT_DATE()
         OR (date = CURRENT_DATE() AND TIME(heure) < CURRENT_TIME())
       )
       AND (${whereClauseSql})
   `;
   await db.execute(updateSql, whereParams);
 },
 creerRendezVous: async (req, res) => {
  try {
    const { idMedecin, idPatient, date, heure, statut } = req.body;

    if (!idMedecin || !idPatient || !date || !heure) {
      return res.status(400).json({
        error: true,
        message: 'Champs obligatoires manquants'
      });
    }

    const maintenant = new Date();
    const dateRdv = new Date(`${date}T${heure}`);

    if (dateRdv < maintenant) {
      return res.status(400).json({
        error: true,
        message: "La date du rendez-vous est déjà passée"
      });
    }

    // Vérifier les heures d'ouverture et de fermeture du médecin
    const [medecinInfo] = await db.execute(
      "SELECT heure_ouverture, heure_fermeture FROM `medecin` WHERE idUtilisateur = ?",
      [idMedecin]
    );

    if (medecinInfo.length === 0) {
      return res.status(404).json({
        error: true,
        message: "Médecin introuvable"
      });
    }

    const { heure_ouverture, heure_fermeture } = medecinInfo[0];
    
    // Comparer l'heure du rendez-vous avec les heures d'ouverture/fermeture
    const heureRdv = heure.substring(0, 5); // Format HH:MM
    const heureOuverture = heure_ouverture ? heure_ouverture.substring(0, 5) : '08:00';
    const heureFermeture = heure_fermeture ? heure_fermeture.substring(0, 5) : '19:00';

    if (heureRdv < heureOuverture || heureRdv >= heureFermeture) {
      return res.status(400).json({
        error: true,
        message: `Le rendez-vous doit être pris entre ${heureOuverture} et ${heureFermeture}`
      });
    }

    const [rdvExiste] = await db.execute(
      "SELECT * FROM `rendezvous` WHERE idMedecin = ? AND date = ? AND heure = ?",
      [idMedecin, date, heure]
    );

    if (rdvExiste.length > 0) {
      return res.status(400).json({
        error: true,
        message: "Le médecin a déjà un rendez-vous à cette date et heure."
      });
    }

    const [result] = await db.execute(
      `INSERT INTO \`rendezvous\` (date, heure, statut, idPatient, idMedecin)
       VALUES (?, ?, ?, ?, ?)`,
      [date, heure, statut || 'prévu', idPatient, idMedecin]
    );

    res.status(201).json({
      success: true,
      message: 'Rendez-vous créé avec succès',
      idRdv: result.insertId
    });

  } catch (error) {
    console.error('Erreur lors de la création du rendez-vous :', error);
    res.status(500).json({
      error: true,
      message: 'Erreur serveur',
      details: error.message
    });
  }
},

  getRendezVousByPatient: async (req, res) => {
    try {
      const { idPatient } = req.params;

      // Marquer automatiquement les RDV passés comme "passé" pour ce patient
      await rendezvousController._markPastAppointmentsPassed('idPatient = ?', [idPatient]);

      const [rows] = await db.execute(
        `SELECT r.*, 
                u.nom AS medecinNom,
                u.prenom AS medecinPrenom,
                m.specialite AS medecinSpecialite
         FROM \`rendezvous\` r
         INNER JOIN \`medecin\` m ON r.idMedecin = m.idUtilisateur
         INNER JOIN \`utilisateur\` u ON m.idUtilisateur = u.idUtilisateur
         WHERE r.idPatient = ?
         ORDER BY r.date ASC, r.heure ASC`,
        [idPatient]
      );
      res.json({ success: true, rendezvous: rows });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  getRendezVousByMedecin: async (req, res) => {
    try {
      const { idMedecin } = req.params;

      // Marquer automatiquement les RDV passés comme "passé" pour ce médecin
      await rendezvousController._markPastAppointmentsPassed('idMedecin = ?', [idMedecin]);

      const [rows] = await db.execute(
        `SELECT r.*,
                u.nom AS patientNom,
                u.prenom AS patientPrenom,
                u.telephone AS patientTelephone
         FROM \`rendezvous\` r
         INNER JOIN \`utilisateur\` u ON r.idPatient = u.idUtilisateur
         WHERE r.idMedecin = ?
         ORDER BY r.date ASC, r.heure ASC`,
        [idMedecin]
      );
      res.json({ success: true, rendezvous: rows });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  annulerRendezVous: async (req, res) => {
    try {
      const { id } = req.params;
      await db.execute(
        'UPDATE `rendezvous` SET statut = "annulé" WHERE idRdv = ?',
        [id]
      );
      res.json({ success: true, message: "Rendez-vous annulé" });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

modifierRendezVous: async (req, res) => {
  try {
    const { id } = req.params;
    const { date, heure, idMedecin, idPatient, statut } = req.body;

    const maintenant = new Date();
    const dateRdv = new Date(`${date}T${heure}`);


    if (dateRdv < maintenant) {
      return res.status(400).json({
        success: false,
        message: "La date du rendez-vous est déjà passée"
      });
    }

    // Vérifier les heures d'ouverture et de fermeture du médecin
    const [medecinInfo] = await db.execute(
      "SELECT heure_ouverture, heure_fermeture FROM `medecin` WHERE idUtilisateur = ?",
      [idMedecin]
    );

    if (medecinInfo.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Médecin introuvable"
      });
    }

    const { heure_ouverture, heure_fermeture } = medecinInfo[0];
    
    // Comparer l'heure du rendez-vous avec les heures d'ouverture/fermeture
    const heureRdv = heure.substring(0, 5); // Format HH:MM
    const heureOuverture = heure_ouverture ? heure_ouverture.substring(0, 5) : '08:00';
    const heureFermeture = heure_fermeture ? heure_fermeture.substring(0, 5) : '19:00';

    if (heureRdv < heureOuverture || heureRdv >= heureFermeture) {
      return res.status(400).json({
        success: false,
        message: `Le rendez-vous doit être pris entre ${heureOuverture} et ${heureFermeture}`
      });
    }

    const [rdvExiste] = await db.execute(
      "SELECT * FROM `rendezvous` WHERE idMedecin = ? AND date = ? AND heure = ? AND idRdv != ?",
      [idMedecin, date, heure, id]
    );

    if (rdvExiste.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Le médecin a déjà un rendez-vous à cette date"
      });
    }

    const [result] = await db.execute(
      "UPDATE `rendezvous` SET date = ?, heure = ?, idMedecin = ?, idPatient = ?, statut = ? WHERE idRdv = ?",
      [date, heure, idMedecin, idPatient, statut, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Rendez-vous introuvable"
      });
    }

    res.json({
      success: true,
      message: "Rendez-vous modifié avec succès"
    });

  } catch (error) {
    console.error("Erreur lors de la modification du rendez-vous :", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
}

};

module.exports = rendezvousController;