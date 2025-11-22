const express = require('express');
const router = express.Router();
const utilisateurController = require('../controllers/utilisateurController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/', utilisateurController.creerUtilisateur);
router.post('/login', utilisateurController.login);

router.get('/profile', authMiddleware.verifyToken, utilisateurController.getProfile);
router.put('/profile', authMiddleware.verifyToken, utilisateurController.updateProfile);
router.post('/change-password', authMiddleware.verifyToken, utilisateurController.changePassword);

router.get('/search', authMiddleware.verifyToken, utilisateurController.searchusersByName);

router.delete('/:id', authMiddleware.verifyToken, utilisateurController.supprimerUtilisateur);
router.get('/:id', authMiddleware.verifyToken, utilisateurController.getUtilisateurById);
router.get('/', authMiddleware.verifyToken, utilisateurController.getAllUtilisateurs);

module.exports = router;