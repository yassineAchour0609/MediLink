const db = require('../config/db');
const bcrypt = require('bcryptjs');

const utilisateurController = {
  creerUtilisateur: async (req, res) => {
    try {

      const {
        email,
        motDePasse,
        nom,
        prenom,
        role,
        sexe,
        age,
        specialite,
        cabinet,
        tarif_consultation,
        disponibilite,
        heure_ouverture,
        heure_fermeture,
        date_naissance,
        telephone,
        num_cin
      } = req.body;

      if (!email || !motDePasse || !nom || !prenom || !role || !sexe || !age || !date_naissance || !telephone || !num_cin) {
        return res.status(400).json({ error: "Champs manquants" });
      }

      if (
        role === "medecin" &&
        (
          !specialite ||
          !cabinet ||
          !tarif_consultation ||
          !heure_ouverture ||
          !heure_fermeture
        )
      ) {
        return res.status(400).json({ error: "Champs du médecin manquants" });
      }

      const motDePasseHache = await bcrypt.hash(motDePasse, 10);

      const [result] = await db.execute(
        "INSERT INTO utilisateur (email, nom, prenom, motDePasse, role, sexe, age, date_naissance, telephone, num_cin) VALUES (?, ?, ?, ?, ?, ?, ?, ?,?,?)",
        [email, nom, prenom, motDePasseHache, role, sexe, age, date_naissance, telephone, num_cin]
      );

      if (role === "medecin") {
        await db.execute(
          `INSERT INTO medecin (
            idUtilisateur,
            specialite,
            cabinet,
            tarif_consultation,
            disponibilite,
            heure_ouverture,
            heure_fermeture
          ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            result.insertId,
            specialite,
            cabinet,
            tarif_consultation,
            disponibilite,
            heure_ouverture,
            heure_fermeture
          ]
        );
      } else if (role === "patient") {
        await db.execute(
          "INSERT INTO patient (idUtilisateur) VALUES (?)",
          [result.insertId]
        );
      } else {
        return res.status(400).json({ error: "Rôle invalide" });
      }

      res.json({
        success: true,
        message: "Utilisateur créé avec succès",
        id: result.insertId
      });

    } catch (error) {
      console.error("Erreur lors de la création de l'utilisateur:", error);
      res.status(500).json({
        error: "Erreur serveur",
        message: error.message,
        code: error.code
      });
    }
  },

  login: async (req, res) => {
    try {
      const { email, motDePasse } = req.body;

      const [users] = await db.execute(
        `SELECT idUtilisateur, email, nom, prenom, motDePasse, role, telephone, sexe, age FROM utilisateur WHERE email = ?`,
        [email]
      );

      if (users.length === 0) {
        return res.status(401).json({
          success: false,
          message: "Email incorrect",
        });
      }
      const utilisateur = users[0];

      const motDePasseValide = await bcrypt.compare(motDePasse, utilisateur.motDePasse);
      if (!motDePasseValide) {
        return res.status(401).json({
          success: false,
          message: "mot de passe incorrect",
        });
      }

      const { motDePasse: _, ...utilisateurSansMotDePasse } = utilisateur;

      res.json({
        success: true,
        message: "Connexion réussie",
        utilisateur: utilisateurSansMotDePasse,
      });
    } catch (error) {
      console.error("Erreur lors de la connexion:", error);
      res.status(500).json({
        success: false,
        message: "Erreur lors de la connexion",
      });
    }
  },

  getUtilisateurById: async (req, res) => {
  try {
    const { id } = req.params;

    // Récupération des informations du patient uniquement
    const [userRows] = await db.execute(`
      SELECT u.idUtilisateur, u.email, u.nom, u.prenom, u.telephone, u.role, p.num_dossier_medical
      FROM utilisateur u
      LEFT JOIN patient p ON u.idUtilisateur = p.idUtilisateur
      WHERE u.idUtilisateur = ?
    `, [id]);

    if (userRows.length === 0) {
      return res.status(404).json({ success: false, message: "Patient non trouvé" });
    }

    const patient = userRows[0];

    res.json({ success: true, patient });
  } catch (error) {
    console.error("❌ Erreur SQL :", error);
    res.status(500).json({ success: false, message: error.message });
  }
},

  getDashboardStats: async (req, res) => {
    try {
      const { idPatient } = req.params;
      const today = new Date().toISOString().split('T')[0];
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

      // Debug: Check all appointments for this patient
      const [allAppointments] = await db.execute(
        `SELECT * FROM rendezvous WHERE idPatient = ?`,
        [idPatient]
      );
      console.log(`📊 Total appointments for patient ${idPatient}:`, allAppointments.length);
      console.log(`📅 Today's date: ${today}`);

      // Count appointments today
      const [appointmentsToday] = await db.execute(
        `SELECT COUNT(*) as count FROM rendezvous WHERE idPatient = ? AND date = ? AND statut != 'Annulé'`,
        [idPatient, today]
      );

      // Count total appointments this month (including past and future in current month)
      const [appointmentsMonth] = await db.execute(
        `SELECT COUNT(*) as count FROM rendezvous 
         WHERE idPatient = ? 
         AND date >= ? 
         AND date <= ?
         AND statut != 'Annulé'`,
        [idPatient, startOfMonth, endOfMonth]
      );

      // Count upcoming appointments (future dates, any status except cancelled)
      const [upcomingAppointments] = await db.execute(
        `SELECT COUNT(*) as count FROM rendezvous 
         WHERE idPatient = ? 
         AND date > ? 
         AND statut != 'Annulé'`,
        [idPatient, today]
      );

      // Count pending analysis results (from dossier medical)
      const [pendingAnalysis] = await db.execute(
        `SELECT COUNT(*) as count FROM dossiermedical WHERE idPatient = ?`,
        [idPatient]
      );

      const stats = {
        appointmentsToday: appointmentsToday[0].count,
        appointmentsThisMonth: appointmentsMonth[0].count,
        upcomingAppointments: upcomingAppointments[0].count,
        pendingAnalysis: pendingAnalysis[0].count
      };

      console.log(`📊 Stats for patient ${idPatient}:`, stats);

      res.json({
        success: true,
        stats
      });
    } catch (error) {
      console.error("❌ Erreur SQL :", error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  getRecentActivities: async (req, res) => {
    try {
      const { idPatient } = req.params;
      const activities = [];

      // Get recent appointments (upcoming first, then past)
      const [appointments] = await db.execute(
        `SELECT 
          r.idRdv,
          r.date,
          DATE_FORMAT(r.heure, '%H:%i') AS heure,
          r.statut,
          r.idMedecin,
          u.nom AS medecin_nom,
          u.prenom AS medecin_prenom
        FROM rendezvous r
        LEFT JOIN utilisateur u ON r.idMedecin = u.idUtilisateur
        WHERE r.idPatient = ?
        ORDER BY 
          CASE WHEN r.date >= CURDATE() THEN 0 ELSE 1 END,
          r.date ASC,
          r.heure ASC
        LIMIT 10`,
        [idPatient]
      );

      console.log(`📋 Recent activities for patient ${idPatient}:`, appointments.length, 'appointments found');
      if (appointments.length > 0) {
        console.log('📋 Sample appointment:', JSON.stringify(appointments[0], null, 2));
      }

      // Format appointments as activities
      appointments.forEach(rdv => {
        // Handle date format - MySQL returns date as string YYYY-MM-DD
        const dateStr = rdv.date instanceof Date ? rdv.date.toISOString().split('T')[0] : rdv.date;
        const rdvDate = new Date(`${dateStr}T${rdv.heure || '00:00:00'}`);
        const now = new Date();
        const diffMs = rdvDate.getTime() - now.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        let timeAgo = '';
        if (diffMs < 0) {
          // Past appointment
          const absDiffDays = Math.abs(diffDays);
          if (absDiffDays === 0) {
            timeAgo = "Aujourd'hui";
          } else if (absDiffDays === 1) {
            timeAgo = "Hier";
          } else {
            timeAgo = `Il y a ${absDiffDays} jour${absDiffDays > 1 ? 's' : ''}`;
          }
        } else if (diffDays === 0) {
          // Today
          timeAgo = `Aujourd'hui à ${rdv.heure || ''}`;
        } else if (diffDays === 1) {
          // Tomorrow
          timeAgo = `Demain à ${rdv.heure || ''}`;
        } else {
          // Future
          timeAgo = `Dans ${diffDays} jour${diffDays > 1 ? 's' : ''}`;
        }

        activities.push({
          type: 'appointment',
          id: rdv.idRdv,
          title: `Rendez-vous - Dr ${rdv.medecin_prenom || ''} ${rdv.medecin_nom || ''}`,
          subtitle: `${dateStr} à ${rdv.heure || ''}`,
          time: timeAgo,
          date: dateStr,
          heure: rdv.heure,
          status: rdv.statut,
          icon: 'calendar-check',
          iconClass: 'appointment'
        });
      });


      // Activities are already sorted by SQL query (upcoming first, then past)
      // No need to re-sort, just return them
      console.log(`📋 Returning ${activities.length} activities`);

      res.json({
        success: true,
        activities: activities
      });
    } catch (error) {
      console.error("❌ Erreur SQL :", error);
      res.status(500).json({ success: false, message: error.message });
    }
  }
};

module.exports = utilisateurController;

