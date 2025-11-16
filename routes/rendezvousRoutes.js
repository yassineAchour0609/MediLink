const express = require('express');
const router = express.Router();
const rendezvousController = require('../controllers/rendezvousController');

router.post('/', rendezvousController.creerRendezVous);
router.get('/', rendezvousController.getAllRendezVous);
router.get('/patient/:idPatient', rendezvousController.getRendezVousByPatient);

// Liste des rendez-vous d'un médecin (pour tableau de bord)
router.get('/medecin/:idMedecin', rendezvousController.getRendezVousByMedecin);

router.put('/:id/annuler', rendezvousController.annulerRendezVous);

router.put('/modifier/:id', rendezvousController.modifierRendezVous);

module.exports = router;