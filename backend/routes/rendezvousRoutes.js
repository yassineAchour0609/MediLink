const express = require('express');
const router = express.Router();
const rendezvousController = require('../controllers/rendezvousController');

router.post('/', rendezvousController.creerRendezVous);

router.get('/patient/:idPatient', rendezvousController.getRendezVousByPatient);

router.get('/medecin/:idMedecin', rendezvousController.getRendezVousByMedecin);

router.put('/:id/annuler', rendezvousController.annulerRendezVous);

router.put('/modifier/:id', rendezvousController.modifierRendezVous);

module.exports = router;