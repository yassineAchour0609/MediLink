const express = require('express');
const router = express.Router();
const utilisateurController = require('../controllers/utilisateurController');
const authMiddleware = require('../middleware/authMiddleware');

// Routes publiques
router.post('/', utilisateurController.creerUtilisateur);
router.post('/login', utilisateurController.login);

// Routes protégées (authentification requise)
router.get('/profile', authMiddleware.verifyToken, utilisateurController.getProfile);
router.put('/profile', authMiddleware.verifyToken, utilisateurController.updateProfile);
router.post('/change-password', authMiddleware.verifyToken, utilisateurController.changePassword);

// Recherche patients par nom/prénom (pour médecins)
router.get('/search', authMiddleware.verifyToken, utilisateurController.searchPatientsByName);

router.get('/:id', utilisateurController.getUtilisateurById);

module.exports = router;