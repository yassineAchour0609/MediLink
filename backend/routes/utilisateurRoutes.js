const express = require('express');
const router = express.Router();
const utilisateurController = require('../controllers/utilisateurController');


router.post('/', utilisateurController.creerUtilisateur);

router.post('/login', utilisateurController.login);

router.get('/:id', utilisateurController.getUtilisateurById);

router.get('/:idPatient/dashboard/stats', utilisateurController.getDashboardStats);

router.get('/:idPatient/dashboard/activities', utilisateurController.getRecentActivities);

module.exports = router;