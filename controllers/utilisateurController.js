const db = require('../config/db');
const bcrypt = require('bcryptjs');
const authMiddleware = require('../middleware/authMiddleware');

const utilisateurController = {
  creerUtilisateur: async (req, res) => {
    try {
      console.log("Body reçu:", req.body);

      const {
        email, motDePasse, nom, prenom, role, sexe, age,
        specialite, cabinet, tarif_consultation, disponibilite,
        date_naissance, telephone, num_cin
      } = req.body;

      if (!email || !motDePasse || !nom || !prenom || !role || !sexe || !age || !date_naissance || !telephone || !num_cin) {
        return res.status(400).json({ error: "Champs manquants" });
      }

      if (role === "medecin" && (!specialite || !cabinet || !tarif_consultation)) {
        return res.status(400).json({ error: "Champs du médecin manquants" });
      }

      const motDePasseHache = await bcrypt.hash(motDePasse, 10);

      const [result] = await db.execute(
        "INSERT INTO Utilisateur (email, nom, prenom, motDePasse, role, sexe, age, date_naissance, telephone, num_cin) VALUES (?, ?, ?, ?, ?, ?, ?, ?,?,?)",
        [email, nom, prenom, motDePasseHache, role, sexe, age, date_naissance, telephone, num_cin]
      );

      if (role === "medecin") {
        await db.execute(
          "INSERT INTO Medecin (idUtilisateur, specialite, cabinet, tarif_consultation,disponibilite) VALUES (?, ?, ?, ?,?)",
          [result.insertId, specialite, cabinet, tarif_consultation, disponibilite]
        );
      } else if (role === "patient") {
        await db.execute(
          "INSERT INTO Patient (idUtilisateur) VALUES (?)",
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
      console.error("ERREUR COMPLETE:", error);
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

      if (!email || !motDePasse) {
        return res.status(400).json({
          success: false,
          message: 'Email et mot de passe requis'
        });
      }

      const [users] = await db.execute(
        `SELECT idUtilisateur, email, nom, prenom, motDePasse, role, telephone, sexe, age, date_naissance, num_cin FROM Utilisateur WHERE email = ?`,
        [email]
      );

      if (users.length === 0) {
        return res.status(401).json({
          success: false,
          message: "Email ou mot de passe incorrect",
        });
      }
      const utilisateur = users[0];

      // VÉRIFIER SI LE COMPTE EST BLOQUÉ
      const [blocked] = await db.execute(
        "SELECT reason FROM blocked_accounts WHERE user_id = ?",
        [utilisateur.idUtilisateur]
      );

      if (blocked.length > 0) {
        return res.status(403).json({
          success: false,
          message: "Ce compte a été bloqué",
          reason: blocked[0].reason
        });
      }

      const motDePasseValide = await bcrypt.compare(motDePasse, utilisateur.motDePasse);
      if (!motDePasseValide) {
        return res.status(401).json({
          success: false,
          message: "Email ou mot de passe incorrect",
        });
      }

      // Générer le JWT
      const token = authMiddleware.generateToken(utilisateur);

      const { motDePasse: _, ...utilisateurSansMotDePasse } = utilisateur;

      res.json({
        success: true,
        message: "Connexion réussie",
        token: token,
        utilisateur: utilisateurSansMotDePasse,
      });
    } catch (error) {
      console.error("Erreur connexion complète:", error);
      res.status(500).json({
        success: false,
        message: "Erreur lors de la connexion",
        error: error.message
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

  // Recherche de patients par nom/prénom (pour médecins)
  searchPatientsByName: async (req, res) => {
    try {
      const { q } = req.query;
      if (!q || String(q).trim().length < 2) {
        return res.status(400).json({ success: false, message: 'Paramètre q requis (min 2 caractères)' });
      }

      const like = `%${q}%`;
      const [rows] = await db.execute(
        `SELECT u.idUtilisateur AS id, u.nom, u.prenom, u.telephone
         FROM utilisateur u
         INNER JOIN patient p ON p.idUtilisateur = u.idUtilisateur
         WHERE CONCAT(u.nom, ' ', u.prenom) LIKE ?
            OR CONCAT(u.prenom, ' ', u.nom) LIKE ?
            OR u.nom LIKE ?
            OR u.prenom LIKE ?
         ORDER BY u.nom ASC, u.prenom ASC
         LIMIT 20`,
        [like, like, like, like]
      );

      res.json({ success: true, results: rows });
    } catch (error) {
      console.error('Erreur recherche patients:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Récupérer le profil de l'utilisateur connecté
  getProfile: async (req, res) => {
    try {
      const userId = req.user.id;

      const [users] = await db.execute(
        `SELECT u.idUtilisateur, u.email, u.nom, u.prenom, u.telephone, u.sexe, u.age, u.date_naissance, u.num_cin, u.role
         FROM utilisateur u
         WHERE u.idUtilisateur = ?`,
        [userId]
      );

      if (users.length === 0) {
        return res.status(404).json({ success: false, message: "Profil non trouvé" });
      }

      const utilisateur = users[0];
      res.json({ success: true, utilisateur });
    } catch (error) {
      console.error("Erreur récupération profil:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Mettre à jour le profil de l'utilisateur
  updateProfile: async (req, res) => {
    try {
      const userId = req.user.id;
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
         WHERE idUtilisateur = ?`,
        [nom, prenom, telephone, sexe, age, date_naissance, num_cin, userId]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: "Utilisateur non trouvé" });
      }

      res.json({ 
        success: true, 
        message: "Profil mis à jour avec succès" 
      });
    } catch (error) {
      console.error("Erreur mise à jour profil:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Changer le mot de passe
  changePassword: async (req, res) => {
    try {
      const userId = req.user.id;
      const { ancienMotDePasse, nouveauMotDePasse } = req.body;

      if (!ancienMotDePasse || !nouveauMotDePasse) {
        return res.status(400).json({ 
          success: false, 
          message: "Ancien et nouveau mot de passe requis" 
        });
      }

      const [users] = await db.execute(
        `SELECT motDePasse FROM utilisateur WHERE idUtilisateur = ?`,
        [userId]
      );

      if (users.length === 0) {
        return res.status(404).json({ success: false, message: "Utilisateur non trouvé" });
      }

      const motDePasseValide = await bcrypt.compare(ancienMotDePasse, users[0].motDePasse);
      if (!motDePasseValide) {
        return res.status(401).json({ 
          success: false, 
          message: "Ancien mot de passe incorrect" 
        });
      }

      const nouveauMotDePasseHache = await bcrypt.hash(nouveauMotDePasse, 10);

      await db.execute(
        `UPDATE utilisateur SET motDePasse = ? WHERE idUtilisateur = ?`,
        [nouveauMotDePasseHache, userId]
      );

      res.json({ 
        success: true, 
        message: "Mot de passe changé avec succès" 
      });
    } catch (error) {
      console.error("Erreur changement mot de passe:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  }
};

module.exports = utilisateurController;