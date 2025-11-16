const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patientController');
const authMiddleware = require('../middleware/authMiddleware');

// Routes protégées (authentification + vérification que c'est un patient)
router.get('/profile', authMiddleware.verifyToken, authMiddleware.verifyPatient, patientController.getPatientProfile);
router.put('/profile', authMiddleware.verifyToken, authMiddleware.verifyPatient, patientController.updatePatientProfile);

// Dossier médical
router.post('/dossier-medical', authMiddleware.verifyToken, authMiddleware.verifyPatient, patientController.createOrUpdateMedicalFile);

// Rendez-vous
router.get('/rendez-vous', authMiddleware.verifyToken, authMiddleware.verifyPatient, patientController.getPatientAppointments);

module.exports = router;
