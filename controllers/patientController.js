const db = require('../config/db');

const patientController = {
  // Récupérer le profil du patient connecté
  getPatientProfile: async (req, res) => {
    try {
      const patientId = req.user.id;

      const [userRows] = await db.execute(`
        SELECT 
          u.idUtilisateur,
          u.email,
          u.nom,
          u.prenom,
          u.telephone,
          u.sexe,
          u.age,
          u.date_naissance,
          u.num_cin,
          p.num_dossier_medical
        FROM utilisateur u
        LEFT JOIN patient p ON u.idUtilisateur = p.idUtilisateur
        WHERE u.idUtilisateur = ? AND u.role = 'patient'
      `, [patientId]);

      if (userRows.length === 0) {
        return res.status(404).json({ success: false, message: "Profil patient non trouvé" });
      }

      const patient = userRows[0];

      // Si le patient a un dossier médical, récupérer ses infos
      let dossierMedical = null;
      if (patient.num_dossier_medical) {
        const [dossiers] = await db.execute(`
          SELECT 
            idDossier,
            groupe_sanguin,
            antecedents_medicaux,
            traitements_en_cours,
            vaccinations,
            diagnostic,
            date_creation,
            der_mise_a_jour
          FROM dossiermedical
          WHERE idDossier = ?
        `, [patient.num_dossier_medical]);
        
        if (dossiers.length > 0) {
          dossierMedical = dossiers[0];
        }
      }

      res.json({ 
        success: true, 
        patient,
        dossierMedical 
      });
    } catch (error) {
      console.error("Erreur récupération profil patient:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Mettre à jour le profil du patient
  updatePatientProfile: async (req, res) => {
    try {
      const patientId = req.user.id;
      const { nom, prenom, telephone, sexe, age, date_naissance, num_cin } = req.body;

      if (!nom || !prenom || !telephone) {
        return res.status(400).json({ 
          success: false, 
          message: "nom, prenom et telephone sont requis" 
        });
      }

      const [result] = await db.execute(
        `UPDATE utilisateur 
         SET nom = ?, prenom = ?, telephone = ?, sexe = ?, age = ?, date_naissance = ?, num_cin = ?
         WHERE idUtilisateur = ? AND role = 'patient'`,
        [nom, prenom, telephone, sexe, age, date_naissance, num_cin, patientId]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: "Patient non trouvé" });
      }

      res.json({ 
        success: true, 
        message: "Profil patient mis à jour avec succès" 
      });
    } catch (error) {
      console.error("Erreur mise à jour profil patient:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Créer ou mettre à jour le dossier médical du patient
  createOrUpdateMedicalFile: async (req, res) => {
    try {
      const patientId = req.user.id;
      const { groupe_sanguin, antecedents_medicaux, traitements_en_cours, vaccinations, diagnostic } = req.body;

      if (!groupe_sanguin) {
        return res.status(400).json({ 
          success: false, 
          message: "groupe_sanguin est requis" 
        });
      }

      // Vérifier si le patient a déjà un dossier médical
      const [dossiers] = await db.execute(`
        SELECT idDossier FROM dossiermedical WHERE idPatient = ?
      `, [patientId]);

      let dossierId;

      if (dossiers.length > 0) {
        // Mettre à jour le dossier existant
        dossierId = dossiers[0].idDossier;
        await db.execute(
          `UPDATE dossiermedical 
           SET groupe_sanguin = ?, 
               antecedents_medicaux = ?, 
               traitements_en_cours = ?, 
               vaccinations = ?, 
               diagnostic = ?,
               der_mise_a_jour = NOW()
           WHERE idDossier = ?`,
          [groupe_sanguin, antecedents_medicaux || null, traitements_en_cours || null, vaccinations || null, diagnostic || null, dossierId]
        );
      } else {
        // Créer un nouveau dossier
        const [result] = await db.execute(
          `INSERT INTO dossiermedical (idPatient, groupe_sanguin, antecedents_medicaux, traitements_en_cours, vaccinations,der_mise_a_jour, diagnostic)
           VALUES (?, ?, ?, ?, ?,NOW(), ?)`,
          [patientId, groupe_sanguin, antecedents_medicaux || null, traitements_en_cours || null, vaccinations ||null|| null, diagnostic]
        );
        dossierId = result.insertId;

        // Mettre à jour la référence dans patient
        await db.execute(
          `UPDATE patient SET num_dossier_medical = ? WHERE idUtilisateur = ?`,
          [dossierId, patientId]
        );
      }

      res.json({ 
        success: true, 
        message: "Dossier médical créé/mis à jour avec succès",
        dossierId 
      });
    } catch (error) {
      console.error("Erreur création/mise à jour dossier médical:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Récupérer les rendez-vous du patient
  getPatientAppointments: async (req, res) => {
    try {
      const patientId = req.user.id;

      const [appointments] = await db.execute(`
        SELECT 
          r.idRdv,
          r.date,
          r.heure,
          r.statut,
          u.idUtilisateur as medecinId,
          u.nom as medecinNom,
          u.prenom as medecinPrenom,
          m.specialite,
          m.cabinet,
          m.tarif_consultation
        FROM rendezvous r
        INNER JOIN utilisateur u ON r.idMedecin = u.idUtilisateur
        INNER JOIN medecin m ON u.idUtilisateur = m.idUtilisateur
        WHERE r.idPatient = ?
        ORDER BY r.date DESC, r.heure DESC
      `, [patientId]);

      res.json({ 
        success: true, 
        appointments 
      });
    } catch (error) {
      console.error("Erreur récupération rendez-vous:", error);
      res.status(500).json({ success: false, message: error.message });
    }
    }
  ,

  // Ajouter une donnée de suivi santé (poids, tension, glycémie, ...)
  addHealthMetric: async (req, res) => {
    try {
      const patientId = req.user.id;
      const { type_mesure, valeur, unite, remarque } = req.body;

      if (!type_mesure || !valeur) {
        return res.status(400).json({ success: false, message: 'type_mesure et valeur sont requis' });
      }

      const [result] = await db.execute(
        `INSERT INTO suivi_sante (idPatient, type_mesure, valeur, unite, remarque, date_creation) VALUES (?, ?, ?, ?, ?, NOW())`,
        [patientId, type_mesure, valeur, unite || null, remarque || null]
      );

      const [rows] = await db.execute(`SELECT * FROM suivi_sante WHERE id = ?`, [result.insertId]);

      res.status(201).json({ success: true, message: 'Donnée de suivi ajoutée', data: rows[0] });
    } catch (error) {
      console.error('Erreur addHealthMetric:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Récupérer les données de suivi du patient (option: limit, from_date, to_date)
  getHealthMetrics: async (req, res) => {
    try {
      const patientId = req.user.id;
      const { limit, from_date, to_date } = req.query;

      let query = `SELECT * FROM suivi_sante WHERE idPatient = ?`;
      const params = [patientId];

      if (from_date) {
        query += ` AND date_creation >= ?`;
        params.push(from_date);
      }

      if (to_date) {
        query += ` AND date_creation <= ?`;
        params.push(to_date);
      }

      query += ` ORDER BY date_creation DESC`;

      if (limit) {
        query += ` LIMIT ?`;
        params.push(parseInt(limit, 10));
      }

      const [rows] = await db.execute(query, params);
      res.json({ success: true, count: rows.length, data: rows });
    } catch (error) {
      console.error('Erreur getHealthMetrics:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Supprimer une donnée de suivi
  deleteHealthMetric: async (req, res) => {
    try {
      const patientId = req.user.id;
      const { id } = req.params;

      const [result] = await db.execute(`DELETE FROM suivi_sante WHERE id = ? AND idPatient = ?`, [id, patientId]);
      if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Donnée non trouvée ou accès refusé' });

      res.json({ success: true, message: 'Donnée de suivi supprimée' });
    } catch (error) {
      console.error('Erreur deleteHealthMetric:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  },
};

module.exports = patientController;
