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

// Suivi santé (metriques)
router.post('/metriques', authMiddleware.verifyToken, authMiddleware.verifyPatient, patientController.addHealthMetric);
router.get('/metriques', authMiddleware.verifyToken, authMiddleware.verifyPatient, patientController.getHealthMetrics);
router.delete('/metrics/:id', authMiddleware.verifyToken, authMiddleware.verifyPatient, patientController.deleteHealthMetric);

module.exports = router;
