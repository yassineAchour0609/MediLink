const db = require('../config/db');

const dossierMedicalController = {
  /**
   * Récupère le dossier médical complet d'un patient (dossier, analyses, ordonnances, notes)
   */
  getDossierByPatient: async (req, res) => {
    const { idPatient } = req.params;

    try {
      // Get or create dossiermedical
      let [dossierRows] = await db.execute(
        `SELECT
            idDossier,
            idPatient,
            date_creation,
            groupe_sanguin,
            antecedents_medicaux,
            traitements_en_cours,
            vaccinations,
            diagnostic,
            der_mise_a_jour
          FROM dossiermedical
          WHERE idPatient = ?
          LIMIT 1`,
        [idPatient]
      );

      let dossier = dossierRows.length > 0 ? dossierRows[0] : null;

      // If no dossier exists, create one
      if (!dossier) {
        const [result] = await db.execute(
          `INSERT INTO dossiermedical (idPatient, date_creation, der_mise_a_jour)
           VALUES (?, NOW(), NOW())`,
          [idPatient]
        );
        [dossierRows] = await db.execute(
          `SELECT * FROM dossiermedical WHERE idDossier = ?`,
          [result.insertId]
        );
        dossier = dossierRows[0];
      }

      // Get analyses
      const [analysesRows] = await db.execute(
        `SELECT 
          a.idAnalyse,
          a.type_analyse,
          a.date_analyse,
          a.resultats,
          a.laboratoire,
          a.idMedecinPrescripteur,
          a.notes,
          a.url_document,
          a.created_at,
          u.nom AS medecin_nom,
          u.prenom AS medecin_prenom
        FROM analyses a
        LEFT JOIN utilisateur u ON a.idMedecinPrescripteur = u.idUtilisateur
        WHERE a.idDossier = ?
        ORDER BY a.date_analyse DESC, a.created_at DESC`,
        [dossier.idDossier]
      );

      // Get ordonnances
      const [ordonnancesRows] = await db.execute(
        `SELECT 
          o.idOrdonnance,
          o.date_ordonnance,
          o.idMedecinPrescripteur,
          o.medicaments,
          o.posologie,
          o.duree_traitement,
          o.notes,
          o.url_document,
          o.created_at,
          u.nom AS medecin_nom,
          u.prenom AS medecin_prenom
        FROM ordonnances o
        LEFT JOIN utilisateur u ON o.idMedecinPrescripteur = u.idUtilisateur
        WHERE o.idDossier = ?
        ORDER BY o.date_ordonnance DESC, o.created_at DESC`,
        [dossier.idDossier]
      );

      // Get notes
      const [notesRows] = await db.execute(
        `SELECT 
          n.idNote,
          n.idDossier,
          n.idMedecin,
          n.type_note,
          n.contenu_note,
          n.created_at,
          u.nom AS medecin_nom,
          u.prenom AS medecin_prenom
        FROM notesmedicales n
        LEFT JOIN utilisateur u ON n.idMedecin = u.idUtilisateur
        WHERE n.idDossier = ?
        ORDER BY n.created_at DESC`,
        [dossier.idDossier]
      );

      res.json({ 
        success: true, 
        dossier,
        analyses: analysesRows,
        ordonnances: ordonnancesRows,
        notes: notesRows
      });
    } catch (error) {
      console.error('Erreur lors de la récupération du dossier médical :', error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  /**
   * Crée ou met à jour le dossier médical d'un patient.
   */
  upsertDossier: async (req, res) => {
    const { idPatient } = req.params;
    const {
      groupe_sanguin,
      antecedents_medicaux,
      traitements_en_cours,
      vaccinations,
      diagnostic
    } = req.body;

    try {
      await db.execute(
        `INSERT INTO dossiermedical (
            idPatient,
            date_creation,
            groupe_sanguin,
            antecedents_medicaux,
            traitements_en_cours,
            vaccinations,
            diagnostic,
            der_mise_a_jour
          ) VALUES (?, NOW(), ?, ?, ?, ?, ?, NOW())
          ON DUPLICATE KEY UPDATE
            groupe_sanguin = VALUES(groupe_sanguin),
            antecedents_medicaux = VALUES(antecedents_medicaux),
            traitements_en_cours = VALUES(traitements_en_cours),
            vaccinations = VALUES(vaccinations),
            diagnostic = VALUES(diagnostic),
            der_mise_a_jour = NOW()`,
        [
          idPatient,
          groupe_sanguin || null,
          antecedents_medicaux || null,
          traitements_en_cours || null,
          vaccinations || null,
          diagnostic || null
        ]
      );

      const [dossierRows] = await db.execute(
        `SELECT
            idDossier,
            idPatient,
            date_creation,
            groupe_sanguin,
            antecedents_medicaux,
            traitements_en_cours,
            vaccinations,
            diagnostic,
            der_mise_a_jour
          FROM dossiermedical
          WHERE idPatient = ?
          LIMIT 1`,
        [idPatient]
      );

      res.status(200).json({ success: true, dossier: dossierRows[0] });
    } catch (error) {
      console.error('Erreur lors de la mise à jour du dossier médical :', error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  /**
   * Ajoute une analyse au dossier médical
   */
  ajouterAnalyse: async (req, res) => {
    const { idPatient } = req.params;
    const {
      type_analyse,
      date_analyse,
      resultats,
      laboratoire,
      idMedecinPrescripteur,
      notes,
      url_document
    } = req.body;

    if (!type_analyse || !date_analyse) {
      return res.status(400).json({
        success: false,
        message: 'Les champs type_analyse et date_analyse sont obligatoires.'
      });
    }

    try {
      // Get or create dossier
      let [dossierRows] = await db.execute(
        'SELECT idDossier FROM dossiermedical WHERE idPatient = ?',
        [idPatient]
      );

      if (dossierRows.length === 0) {
        const [result] = await db.execute(
          'INSERT INTO dossiermedical (idPatient) VALUES (?)',
          [idPatient]
        );
        dossierRows = [{ idDossier: result.insertId }];
      }

      const [result] = await db.execute(
        `INSERT INTO analyses (
            idDossier,
            type_analyse,
            date_analyse,
            resultats,
            laboratoire,
            idMedecinPrescripteur,
            notes,
            url_document
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          dossierRows[0].idDossier,
          type_analyse,
          date_analyse,
          resultats || null,
          laboratoire || null,
          idMedecinPrescripteur || null,
          notes || null,
          url_document || null
        ]
      );

      res.status(201).json({ success: true, message: 'Analyse ajoutée au dossier médical.', idAnalyse: result.insertId });
    } catch (error) {
      console.error('Erreur lors de l\'ajout d\'une analyse :', error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  /**
   * Ajoute une ordonnance au dossier médical
   */
  ajouterOrdonnance: async (req, res) => {
    const { idPatient } = req.params;
    const {
      date_ordonnance,
      idMedecinPrescripteur,
      medicaments,
      posologie,
      duree_traitement,
      notes,
      url_document
    } = req.body;

    if (!date_ordonnance || !medicaments) {
      return res.status(400).json({
        success: false,
        message: 'Les champs date_ordonnance et medicaments sont obligatoires.'
      });
    }

    try {
      // Get or create dossier
      let [dossierRows] = await db.execute(
        'SELECT idDossier FROM dossiermedical WHERE idPatient = ?',
        [idPatient]
      );

      if (dossierRows.length === 0) {
        const [result] = await db.execute(
          'INSERT INTO dossiermedical (idPatient) VALUES (?)',
          [idPatient]
        );
        dossierRows = [{ idDossier: result.insertId }];
      }

      const [result] = await db.execute(
        `INSERT INTO ordonnances (
            idDossier,
            date_ordonnance,
            idMedecinPrescripteur,
            medicaments,
            posologie,
            duree_traitement,
            notes,
            url_document
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          dossierRows[0].idDossier,
          date_ordonnance,
          idMedecinPrescripteur || null,
          medicaments,
          posologie || null,
          duree_traitement || null,
          notes || null,
          url_document || null
        ]
      );

      res.status(201).json({ success: true, message: 'Ordonnance ajoutée au dossier médical.', idOrdonnance: result.insertId });
    } catch (error) {
      console.error('Erreur lors de l\'ajout d\'une ordonnance :', error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  /**
   * Ajoute une note médicale au dossier du patient.
   */
  ajouterNote: async (req, res) => {
    const { idPatient } = req.params;
    const { idMedecin, contenu_note, type_note } = req.body;

    if (!idMedecin || !contenu_note) {
      return res.status(400).json({
        success: false,
        message: 'Les champs idMedecin et contenu_note sont obligatoires.'
      });
    }

    try {
      // Get or create dossier
      let [dossierRows] = await db.execute(
        'SELECT idDossier FROM dossiermedical WHERE idPatient = ?',
        [idPatient]
      );

      if (dossierRows.length === 0) {
        const [result] = await db.execute(
          'INSERT INTO dossiermedical (idPatient) VALUES (?)',
          [idPatient]
        );
        dossierRows = [{ idDossier: result.insertId }];
      }

      await db.execute(
        `INSERT INTO notesmedicales (
            idDossier,
            idMedecin,
            type_note,
            contenu_note,
            created_at
          ) VALUES (?, ?, ?, ?, NOW())`,
        [dossierRows[0].idDossier, idMedecin, type_note || 'Consultation', contenu_note]
      );

      res.status(201).json({
        success: true,
        message: 'Note ajoutée au dossier médical.'
      });
    } catch (error) {
      console.error('Erreur lors de l\'ajout d\'une note médicale :', error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  /**
   * Met à jour le diagnostic du patient
   */
  mettreAJourDiagnostic: async (req, res) => {
    const { idPatient } = req.params;
    const { diagnostic } = req.body;

    if (!diagnostic) {
      return res.status(400).json({
        success: false,
        message: 'Le champ diagnostic est obligatoire.'
      });
    }

    try {
      // Get or create dossier
      let [dossierRows] = await db.execute(
        'SELECT idDossier FROM dossiermedical WHERE idPatient = ?',
        [idPatient]
      );

      if (dossierRows.length === 0) {
        const [result] = await db.execute(
          'INSERT INTO dossiermedical (idPatient, diagnostic) VALUES (?, ?)',
          [idPatient, diagnostic]
        );
        dossierRows = [{ idDossier: result.insertId }];
      } else {
        await db.execute(
          'UPDATE dossiermedical SET diagnostic = ?, der_mise_a_jour = NOW() WHERE idPatient = ?',
          [diagnostic, idPatient]
        );
      }

      res.status(200).json({
        success: true,
        message: 'Diagnostic mis à jour.'
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour du diagnostic :', error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  /**
   * Met à jour une analyse
   */
  mettreAJourAnalyse: async (req, res) => {
    const { idAnalyse } = req.params;
    const {
      type_analyse,
      date_analyse,
      resultats,
      laboratoire,
      notes,
      url_document
    } = req.body;

    if (!type_analyse || !date_analyse) {
      return res.status(400).json({
        success: false,
        message: 'Les champs type_analyse et date_analyse sont obligatoires.'
      });
    }

    try {
      await db.execute(
        `UPDATE analyses SET
          type_analyse = ?,
          date_analyse = ?,
          resultats = ?,
          laboratoire = ?,
          notes = ?,
          url_document = ?
        WHERE idAnalyse = ?`,
        [
          type_analyse,
          date_analyse,
          resultats || null,
          laboratoire || null,
          notes || null,
          url_document || null,
          idAnalyse
        ]
      );

      res.status(200).json({ success: true, message: 'Analyse mise à jour.' });
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'analyse :', error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  /**
   * Supprime une analyse
   */
  supprimerAnalyse: async (req, res) => {
    const { idAnalyse } = req.params;

    try {
      await db.execute('DELETE FROM analyses WHERE idAnalyse = ?', [idAnalyse]);
      res.status(200).json({ success: true, message: 'Analyse supprimée.' });
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'analyse :', error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  /**
   * Met à jour une ordonnance
   */
  mettreAJourOrdonnance: async (req, res) => {
    const { idOrdonnance } = req.params;
    const {
      date_ordonnance,
      medicaments,
      posologie,
      duree_traitement,
      notes,
      url_document
    } = req.body;

    if (!date_ordonnance || !medicaments) {
      return res.status(400).json({
        success: false,
        message: 'Les champs date_ordonnance et medicaments sont obligatoires.'
      });
    }

    try {
      await db.execute(
        `UPDATE ordonnances SET
          date_ordonnance = ?,
          medicaments = ?,
          posologie = ?,
          duree_traitement = ?,
          notes = ?,
          url_document = ?
        WHERE idOrdonnance = ?`,
        [
          date_ordonnance,
          medicaments,
          posologie || null,
          duree_traitement || null,
          notes || null,
          url_document || null,
          idOrdonnance
        ]
      );

      res.status(200).json({ success: true, message: 'Ordonnance mise à jour.' });
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'ordonnance :', error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  /**
   * Supprime une ordonnance
   */
  supprimerOrdonnance: async (req, res) => {
    const { idOrdonnance } = req.params;

    try {
      await db.execute('DELETE FROM ordonnances WHERE idOrdonnance = ?', [idOrdonnance]);
      res.status(200).json({ success: true, message: 'Ordonnance supprimée.' });
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'ordonnance :', error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  /**
   * Met à jour une note médicale
   */
  mettreAJourNote: async (req, res) => {
    const { idNote } = req.params;
    const { contenu_note, type_note } = req.body;

    if (!contenu_note) {
      return res.status(400).json({
        success: false,
        message: 'Le champ contenu_note est obligatoire.'
      });
    }

    try {
      await db.execute(
        `UPDATE notesmedicales SET
          contenu_note = ?,
          type_note = ?
        WHERE idNote = ?`,
        [contenu_note, type_note || 'Consultation', idNote]
      );

      res.status(200).json({ success: true, message: 'Note mise à jour.' });
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la note :', error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  /**
   * Supprime une note médicale
   */
  supprimerNote: async (req, res) => {
    const { idNote } = req.params;

    try {
      await db.execute('DELETE FROM notesmedicales WHERE idNote = ?', [idNote]);
      res.status(200).json({ success: true, message: 'Note supprimée.' });
    } catch (error) {
      console.error('Erreur lors de la suppression de la note :', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }
};

module.exports = dossierMedicalController;

