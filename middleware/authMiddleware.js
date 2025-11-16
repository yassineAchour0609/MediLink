const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-medilink-2024';

const authMiddleware = {
  // Générer un token JWT
  generateToken: (utilisateur) => {
    return jwt.sign(
      {
        id: utilisateur.idUtilisateur,
        email: utilisateur.email,
        role: utilisateur.role
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
  },

  // Vérifier le token JWT
  verifyToken: (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token manquant'
      });
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Token invalide ou expiré'
      });
    }
  },

  // Vérifier que l'utilisateur est patient
  verifyPatient: (req, res, next) => {
    if (req.user.role !== 'patient') {
      return res.status(403).json({
        success: false,
        message: 'Accès réservé aux patients'
      });
    }
    next();
  },

  // Vérifier que l'utilisateur est médecin
  verifyMedecin: (req, res, next) => {
    if (req.user.role !== 'medecin') {
      return res.status(403).json({
        success: false,
        message: 'Accès réservé aux médecins'
      });
    }
    next();
  }
};

module.exports = authMiddleware;
