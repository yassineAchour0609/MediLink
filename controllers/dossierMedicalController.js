const db = require('../config/db');

const ensureDossierExists = async (idPatient) => {
  // 1. Dossier déjà lié au patient
  const [currentRows] = await db.execute(
    'SELECT idDossier FROM dossiermedical WHERE idPatient = ? LIMIT 1',
    [idPatient]
  );
  if (currentRows.length > 0) {
    return currentRows[0].idDossier;
  }

  // 2. Dossier référencé dans la table patient (num_dossier_medical)
  const [patientRows] = await db.execute(
    'SELECT num_dossier_medical FROM patient WHERE idUtilisateur = ?',
    [idPatient]
  );
  if (patientRows.length > 0 && patientRows[0].num_dossier_medical) {
    const dossierId = patientRows[0].num_dossier_medical;
    const [dossierRows] = await db.execute(
      'SELECT idDossier FROM dossiermedical WHERE idDossier = ? LIMIT 1',
      [dossierId]
    );
    if (dossierRows.length > 0) {
      await db.execute(
        'UPDATE dossiermedical SET idPatient = ? WHERE idDossier = ?',
        [idPatient, dossierId]
      );
      return dossierId;
    }
  }

  // 3. Réutiliser un dossier existant (ex: données de démo) en le rattachant au patient
  const [anyDossier] = await db.execute(
    'SELECT idDossier FROM dossiermedical ORDER BY idDossier ASC LIMIT 1'
  );
  if (anyDossier.length > 0) {
    const dossierId = anyDossier[0].idDossier;
    await db.execute(
      'UPDATE dossiermedical SET idPatient = ? WHERE idDossier = ?',
      [idPatient, dossierId]
    );
    await db.execute(
      'UPDATE patient SET num_dossier_medical = ? WHERE idUtilisateur = ?',
      [dossierId, idPatient]
    );
    return dossierId;
  }

  // 4. Sinon, créer un nouveau dossier
  const [result] = await db.execute(
    'INSERT INTO dossiermedical (idPatient) VALUES (?)',
    [idPatient]
  );
  await db.execute(
    'UPDATE patient SET num_dossier_medical = ? WHERE idUtilisateur = ?',
    [result.insertId, idPatient]
  );
  return result.insertId;
};

const dossierMedicalController = {
  // Récupérer le dossier complet (infos + analyses + ordonnances + notes)
  getDossierByPatient: async (req, res) => {
    try {
      const { idPatient } = req.params;
      const { idMedecin } = req.query; // optionnel : filtrer les analyses selon la spécialité du médecin

      const dossierId = await ensureDossierExists(idPatient);

      const [dossierRows] = await db.execute(
        `SELECT d.idDossier, d.idPatient, d.groupe_sanguin, d.antecedents_medicaux, d.traitements_en_cours,
                d.vaccinations, d.diagnostic, d.der_mise_a_jour
         FROM \`dossiermedical\` d
         WHERE d.idDossier = ?`,
        [dossierId]
      );

      const dossier = dossierRows[0] || null;

      // Préparer filtre par spécialité si idMedecin fourni
      let analysesQuery = `
        SELECT a.*, 
               u.nom AS medecinNom, 
               u.prenom AS medecinPrenom
        FROM \`analyses\` a
        LEFT JOIN \`utilisateur\` u ON a.idMedecinPrescripteur = u.idUtilisateur
        WHERE a.idDossier = ?
      `;
      const analysesParams = [dossierId];

      if (idMedecin) {
        // Récupérer la spécialité du médecin
        const [specRows] = await db.execute(
          'SELECT specialite FROM medecin WHERE idUtilisateur = ? LIMIT 1',
          [idMedecin]
        );
        if (specRows.length > 0 && specRows[0].specialite) {
          const specialite = specRows[0].specialite;
          // Filtrer par spécialité dans le champ type_analyse (approximation simple)
          analysesQuery += ` AND LOWER(a.type_analyse) LIKE LOWER(CONCAT('%', ?, '%')) `;
          analysesParams.push(specialite);
        }
      }

      analysesQuery += ' ORDER BY a.date_analyse DESC';

      const [analyses] = await db.execute(analysesQuery, analysesParams);

      const [ordonnances] = await db.execute(
        `SELECT o.*, 
                u.nom AS medecinNom, 
                u.prenom AS medecinPrenom
         FROM \`ordonnances\` o
         LEFT JOIN \`utilisateur\` u ON o.idMedecinPrescripteur = u.idUtilisateur
         WHERE o.idDossier = ?
         ORDER BY o.date_ordonnance DESC`,
        [dossierId]
      );

      const [notes] = await db.execute(
        `SELECT n.*, 
                u.nom AS medecinNom, 
                u.prenom AS medecinPrenom
         FROM \`notesmedicales\` n
         LEFT JOIN \`utilisateur\` u ON n.idMedecin = u.idUtilisateur
         WHERE n.idDossier = ?
         ORDER BY n.created_at DESC`,
        [dossierId]
      );

      res.json({
        success: true,
        dossier,
        analyses,
        ordonnances,
        notes
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Mettre à jour les informations principales
  updateInfos: async (req, res) => {
    try {
      const { idPatient } = req.params;
      const {
        groupe_sanguin,
        antecedents_medicaux,
        traitements_en_cours,
        vaccinations,
        diagnostic
      } = req.body;

      const idDossier = await ensureDossierExists(idPatient);

      await db.execute(
        `UPDATE dossiermedical
         SET groupe_sanguin = ?, 
             antecedents_medicaux = ?, 
             traitements_en_cours = ?,
             vaccinations = ?, 
             diagnostic = ?
         WHERE idDossier = ?`,
        [
          groupe_sanguin || null,
          antecedents_medicaux || null,
          traitements_en_cours || null,
          vaccinations || null,
          diagnostic || null,
          idDossier
        ]
      );

      res.json({ success: true, message: 'Dossier mis à jour' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Ajouter une analyse
  addAnalyse: async (req, res) => {
    try {
      const { idPatient } = req.params;
      const {
        idMedecin,
        type_analyse,
        date_analyse,
        resultats,
        laboratoire,
        notes
      } = req.body;

      if (!type_analyse || !date_analyse) {
        return res.status(400).json({ success: false, message: 'Type et date requis' });
      }

      // Gérer l'upload de fichier si présent
      let url_document = null;
      if (req.file) {
        url_document = `/uploads/analyses/${req.file.filename}`;
      }

      const idDossier = await ensureDossierExists(idPatient);

      const [result] = await db.execute(
        `INSERT INTO analyses (idDossier, type_analyse, date_analyse, resultats, laboratoire, idMedecinPrescripteur, notes, url_document)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          idDossier,
          type_analyse,
          date_analyse,
          resultats || null,
          laboratoire || null,
          idMedecin || null,
          notes || null,
          url_document
        ]
      );

      res.status(201).json({ 
        success: true, 
        id: result.insertId,
        url_document: url_document
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  updateAnalyse: async (req, res) => {
    try {
      const { idPatient, idAnalyse } = req.params;
      const {
        type_analyse,
        date_analyse,
        resultats,
        laboratoire,
        idMedecin,
        notes
      } = req.body;

      const idDossier = await ensureDossierExists(idPatient);

      // Récupérer l'URL actuelle du document si elle existe
      const [currentAnalyse] = await db.execute(
        'SELECT url_document FROM analyses WHERE idAnalyse = ? AND idDossier = ?',
        [idAnalyse, idDossier]
      );

      let url_document = currentAnalyse.length > 0 ? currentAnalyse[0].url_document : null;

      // Si un nouveau fichier est uploadé, utiliser celui-ci
      if (req.file) {
        url_document = `/uploads/analyses/${req.file.filename}`;
      }

      const [result] = await db.execute(
        `UPDATE analyses
         SET type_analyse = ?, date_analyse = ?, resultats = ?, laboratoire = ?, idMedecinPrescripteur = ?, notes = ?, url_document = ?
         WHERE idAnalyse = ? AND idDossier = ?`,
        [
          type_analyse,
          date_analyse,
          resultats || null,
          laboratoire || null,
          idMedecin || null,
          notes || null,
          url_document,
          idAnalyse,
          idDossier
        ]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'Analyse introuvable' });
      }

      res.json({ success: true, message: 'Analyse mise à jour', url_document: url_document });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  deleteAnalyse: async (req, res) => {
    try {
      const { idPatient, idAnalyse } = req.params;
      const idDossier = await ensureDossierExists(idPatient);

      const [result] = await db.execute(
        'DELETE FROM analyses WHERE idAnalyse = ? AND idDossier = ?',
        [idAnalyse, idDossier]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'Analyse introuvable' });
      }

      res.json({ success: true, message: 'Analyse supprimée' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Ajouter une ordonnance
  addOrdonnance: async (req, res) => {
    try {
      const { idPatient } = req.params;
      const {
        idMedecin,
        date_ordonnance,
        medicaments,
        posologie,
        duree_traitement,
        notes
      } = req.body;

      if (!date_ordonnance || !medicaments) {
        return res.status(400).json({ success: false, message: 'Date et médicaments requis' });
      }

      // Gérer l'upload de fichier si présent
      let url_document = null;
      if (req.file) {
        url_document = `/uploads/ordonnances/${req.file.filename}`;
      }

      const idDossier = await ensureDossierExists(idPatient);

      const [result] = await db.execute(
        `INSERT INTO ordonnances (idDossier, date_ordonnance, idMedecinPrescripteur, medicaments, posologie, duree_traitement, notes, url_document)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          idDossier,
          date_ordonnance,
          idMedecin || null,
          medicaments,
          posologie || null,
          duree_traitement || null,
          notes || null,
          url_document
        ]
      );

      res.status(201).json({ 
        success: true, 
        id: result.insertId,
        url_document: url_document
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  updateOrdonnance: async (req, res) => {
    try {
      const { idPatient, idOrdonnance } = req.params;
      const {
        idMedecin,
        date_ordonnance,
        medicaments,
        posologie,
        duree_traitement,
        notes
      } = req.body;

      const idDossier = await ensureDossierExists(idPatient);

      // Récupérer l'URL actuelle du document si elle existe
      const [currentOrdonnance] = await db.execute(
        'SELECT url_document FROM ordonnances WHERE idOrdonnance = ? AND idDossier = ?',
        [idOrdonnance, idDossier]
      );

      let url_document = currentOrdonnance.length > 0 ? currentOrdonnance[0].url_document : null;

      // Si un nouveau fichier est uploadé, utiliser celui-ci
      if (req.file) {
        url_document = `/uploads/ordonnances/${req.file.filename}`;
      }

      const [result] = await db.execute(
        `UPDATE ordonnances
         SET date_ordonnance = ?, idMedecinPrescripteur = ?, medicaments = ?, posologie = ?, duree_traitement = ?, notes = ?, url_document = ?
         WHERE idOrdonnance = ? AND idDossier = ?`,
        [
          date_ordonnance,
          idMedecin || null,
          medicaments,
          posologie || null,
          duree_traitement || null,
          notes || null,
          url_document,
          idOrdonnance,
          idDossier
        ]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'Ordonnance introuvable' });
      }

      res.json({ success: true, message: 'Ordonnance mise à jour', url_document: url_document });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  deleteOrdonnance: async (req, res) => {
    try {
      const { idPatient, idOrdonnance } = req.params;
      const idDossier = await ensureDossierExists(idPatient);

      const [result] = await db.execute(
        'DELETE FROM ordonnances WHERE idOrdonnance = ? AND idDossier = ?',
        [idOrdonnance, idDossier]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'Ordonnance introuvable' });
      }

      res.json({ success: true, message: 'Ordonnance supprimée' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Ajouter une note médicale
  addNote: async (req, res) => {
    try {
      const { idPatient } = req.params;
      const { idMedecin, type_note, contenu_note } = req.body;

      if (!idMedecin || !contenu_note) {
        return res.status(400).json({ success: false, message: 'Médecin et contenu requis' });
      }

      const idDossier = await ensureDossierExists(idPatient);

      const [result] = await db.execute(
        `INSERT INTO notesmedicales (idDossier, idMedecin, type_note, contenu_note)
         VALUES (?, ?, ?, ?)`,
        [
          idDossier,
          idMedecin,
          type_note || 'Consultation',
          contenu_note
        ]
      );

      res.status(201).json({ success: true, id: result.insertId });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  updateNote: async (req, res) => {
    try {
      const { idPatient, idNote } = req.params;
      const { idMedecin, type_note, contenu_note } = req.body;

      const idDossier = await ensureDossierExists(idPatient);

      const [result] = await db.execute(
        `UPDATE notesmedicales
         SET idMedecin = ?, type_note = ?, contenu_note = ?
         WHERE idNote = ? AND idDossier = ?`,
        [
          idMedecin,
          type_note || 'Consultation',
          contenu_note,
          idNote,
          idDossier
        ]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'Note introuvable' });
      }

      res.json({ success: true, message: 'Note mise à jour' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  deleteNote: async (req, res) => {
    try {
      const { idPatient, idNote } = req.params;
      const idDossier = await ensureDossierExists(idPatient);

      const [result] = await db.execute(
        'DELETE FROM notesmedicales WHERE idNote = ? AND idDossier = ?',
        [idNote, idDossier]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'Note introuvable' });
      }

      res.json({ success: true, message: 'Note supprimée' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};

module.exports = dossierMedicalController;
