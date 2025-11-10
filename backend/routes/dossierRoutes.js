const express = require('express');
const dossierMedicalController = require('../controllers/dossierMedicalController');

const router = express.Router();

// Get complete medical record
router.get('/patient/:idPatient', dossierMedicalController.getDossierByPatient);

// Update medical record
router.put('/patient/:idPatient', dossierMedicalController.upsertDossier);

// Add medical note
router.post('/patient/:idPatient/notes', dossierMedicalController.ajouterNote);

// Add analysis
router.post('/patient/:idPatient/analyses', dossierMedicalController.ajouterAnalyse);

// Add prescription
router.post('/patient/:idPatient/ordonnances', dossierMedicalController.ajouterOrdonnance);

// Update diagnosis
router.put('/patient/:idPatient/diagnostic', dossierMedicalController.mettreAJourDiagnostic);

// Update and Delete Analysis
router.put('/analyses/:idAnalyse', dossierMedicalController.mettreAJourAnalyse);
router.delete('/analyses/:idAnalyse', dossierMedicalController.supprimerAnalyse);

// Update and Delete Prescription
router.put('/ordonnances/:idOrdonnance', dossierMedicalController.mettreAJourOrdonnance);
router.delete('/ordonnances/:idOrdonnance', dossierMedicalController.supprimerOrdonnance);

// Update and Delete Note
router.put('/notes/:idNote', dossierMedicalController.mettreAJourNote);
router.delete('/notes/:idNote', dossierMedicalController.supprimerNote);

module.exports = router;

