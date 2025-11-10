const express = require('express');
const router = express.Router();
const medecinController = require('../controllers/medecinController');
const rendezvousController = require('../controllers/rendezvousController');

router.get('/', medecinController.getMedecins);

router.get('/:id', medecinController.getMedecinById);

router.get('/:id/rendezvous', rendezvousController.getRendezVousByMedecin);

// Dashboard des rendez-vous pour planifier la journée
router.get('/:idMedecin/dashboard/rendezvous', medecinController.getDashboardRendezVous);

module.exports = router;