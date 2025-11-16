const express = require('express');
const router = express.Router();
const utilisateurController = require('../controllers/utilisateurController');


router.post('/', utilisateurController.creerUtilisateur);

router.post('/login', utilisateurController.login);

// Recherche patients par nom/prénom
router.get('/search', utilisateurController.searchPatientsByName);
router.delete('/:id', utilisateurController.supprimerUtilisateur);
router.get('/:id', utilisateurController.getUtilisateurById);
router.get('/', utilisateurController.getAllUtilisateurs);

module.exports = router;