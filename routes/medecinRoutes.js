const express = require('express');
const router = express.Router();
const medecinController = require('../controllers/medecinController');
const authMiddleware = require('../middleware/authMiddleware');

// Routes protégées (authentification + vérification que c'est un médecin) - AVANT /:id
router.get('/profile', authMiddleware.verifyToken, authMiddleware.verifyMedecin, medecinController.getMedecinProfile);
router.put('/profile', authMiddleware.verifyToken, authMiddleware.verifyMedecin, medecinController.updateMedecinProfile);

// Routes publiques
router.get('/', medecinController.getMedecins);
router.get('/:id', medecinController.getMedecinById);

module.exports = router;