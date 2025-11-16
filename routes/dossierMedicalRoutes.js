const express = require('express');
const router = express.Router();
const dossierMedicalController = require('../controllers/dossierMedicalController');

// Dossier médical du patient
router.get('/patient/:idPatient', dossierMedicalController.getDossierByPatient);
router.put('/patient/:idPatient', dossierMedicalController.updateInfos);
router.post('/patient/:idPatient/analyses', dossierMedicalController.addAnalyse);
router.put('/patient/:idPatient/analyses/:idAnalyse', dossierMedicalController.updateAnalyse);
router.delete('/patient/:idPatient/analyses/:idAnalyse', dossierMedicalController.deleteAnalyse);
router.post('/patient/:idPatient/ordonnances', dossierMedicalController.addOrdonnance);
router.put('/patient/:idPatient/ordonnances/:idOrdonnance', dossierMedicalController.updateOrdonnance);
router.delete('/patient/:idPatient/ordonnances/:idOrdonnance', dossierMedicalController.deleteOrdonnance);
router.post('/patient/:idPatient/notes', dossierMedicalController.addNote);
router.put('/patient/:idPatient/notes/:idNote', dossierMedicalController.updateNote);
router.delete('/patient/:idPatient/notes/:idNote', dossierMedicalController.deleteNote);

module.exports = router;


