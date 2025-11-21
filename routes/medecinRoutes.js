const express = require('express');
const router = express.Router();
const medecinController = require('../controllers/medecinController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/profile', authMiddleware.verifyToken, authMiddleware.verifyMedecin, medecinController.getMedecinProfile);
router.put('/profile', authMiddleware.verifyToken, authMiddleware.verifyMedecin, medecinController.updateMedecinProfile);

router.get('/', medecinController.getMedecins);
router.get('/:id', medecinController.getMedecinById);

module.exports = router;