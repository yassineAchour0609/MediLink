const db = require('../config/db');

const DEFAULT_OPENING_TIME = '08:00';
const DEFAULT_CLOSING_TIME = '19:00';

const normaliseTime = (timeValue) => {
  if (!timeValue) {
    return null;
  }

  if (typeof timeValue === 'string') {
    const [hours, minutes] = timeValue.split(':');
    const safeHours = (hours ?? '00').toString().padStart(2, '0');
    const safeMinutes = (minutes ?? '00').toString().padStart(2, '0');
    return `${safeHours}:${safeMinutes}`;
  }

  if (timeValue instanceof Date) {
    return `${timeValue.getHours().toString().padStart(2, '0')}:${timeValue
      .getMinutes()
      .toString()
      .padStart(2, '0')}`;
  }

  return null;
};

const timeToMinutes = (time) => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

const isWithinOfficeHours = (appointmentTime, openingTime, closingTime) => {
  const appointment = timeToMinutes(appointmentTime);
  const opening = timeToMinutes(openingTime);
  const closing = timeToMinutes(closingTime);

  if (closing < opening) {
    // Overnight shift, split into two segments
    return appointment >= opening || appointment <= closing;
  }

  return appointment >= opening && appointment <= closing;
};

const getMedecinOfficeHours = async (idMedecin) => {
  const [rows] = await db.execute(
    'SELECT heure_ouverture, heure_fermeture FROM medecin WHERE idUtilisateur = ? LIMIT 1',
    [idMedecin]
  );

  if (rows.length === 0) {
    throw new Error("Médecin introuvable");
  }

  const ouverture = normaliseTime(rows[0].heure_ouverture) || DEFAULT_OPENING_TIME;
  const fermeture = normaliseTime(rows[0].heure_fermeture) || DEFAULT_CLOSING_TIME;

  return { ouverture, fermeture };
};

const rendezvousController = {
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

    let officeHours;
    try {
      officeHours = await getMedecinOfficeHours(idMedecin);
    } catch (error) {
      return res.status(404).json({
        error: true,
        message: error.message
      });
    }

    const heureNormalisee = normaliseTime(heure);

    if (!heureNormalisee || !isWithinOfficeHours(heureNormalisee, officeHours.ouverture, officeHours.fermeture)) {
      return res.status(400).json({
        error: true,
        message: `Le rendez-vous doit être pris entre ${officeHours.ouverture} et ${officeHours.fermeture}.`
      });
    }

    const [rdvExiste] = await db.execute(
      "SELECT * FROM rendezvous WHERE idMedecin = ? AND date = ? AND heure = ?",
      [idMedecin, date, heure]
    );

    if (rdvExiste.length > 0) {
      return res.status(400).json({
        error: true,
        message: "Le médecin a déjà un rendez-vous à cette date et heure."
      });
    }

    const [result] = await db.execute(
      `INSERT INTO rendezvous (date, heure, statut, idPatient, idMedecin)
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
      const [rows] = await db.execute(
        `SELECT 
            idRdv,
            date,
            DATE_FORMAT(heure, '%H:%i') AS heure,
            statut,
            idPatient,
            idMedecin
          FROM rendezvous 
          WHERE idPatient = ?`,
        [idPatient]
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
        'UPDATE rendezvous SET statut = "Annulé" WHERE idRdv = ?',
        [id]
      );
      res.json({ success: true, message: "Rendez-vous annulé" });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  getRendezVousByMedecin: async (req, res) => {
    try {
      const { idMedecin } = req.params;

      const [rows] = await db.execute(
        `SELECT 
            r.idRdv,
            r.date,
            DATE_FORMAT(r.heure, '%H:%i') AS heure,
            r.statut,
            r.idPatient,
            r.idMedecin,
            u.nom AS patientNom,
            u.prenom AS patientPrenom,
            u.telephone AS patientTelephone
          FROM rendezvous r
          INNER JOIN utilisateur u ON u.idUtilisateur = r.idPatient
          WHERE r.idMedecin = ?
          ORDER BY r.date ASC, r.heure ASC`,
        [idMedecin]
      );

      res.json({ success: true, rendezvous: rows });
    } catch (error) {
      console.error('Erreur lors de la récupération des rendez-vous médecin :', error);
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

    let officeHours;
    try {
      officeHours = await getMedecinOfficeHours(idMedecin);
    } catch (error) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    const heureNormalisee = normaliseTime(heure);
    if (!heureNormalisee || !isWithinOfficeHours(heureNormalisee, officeHours.ouverture, officeHours.fermeture)) {
      return res.status(400).json({
        success: false,
        message: `Le rendez-vous doit être planifié entre ${officeHours.ouverture} et ${officeHours.fermeture}.`
      });
    }

    const [rdvExiste] = await db.execute(
      "SELECT * FROM rendezvous WHERE idMedecin = ? AND date = ? AND heure = ? AND idRdv != ?",
      [idMedecin, date, heure, id]
    );

    if (rdvExiste.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Le médecin a déjà un rendez-vous à cette date"
      });
    }

    const [result] = await db.execute(
      "UPDATE rendezvous SET date = ?, heure = ?, idMedecin = ?, idPatient = ?, statut = ? WHERE idRdv = ?",
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