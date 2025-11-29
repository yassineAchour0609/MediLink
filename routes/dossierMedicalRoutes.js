const express = require('express');
const router = express.Router();
const dossierMedicalController = require('../controllers/dossierMedicalController');
const { uploadAnalyse, uploadOrdonnance, uploadErrorHandler } = require('../middleware/uploadMiddleware');

// Dossier médical du patient
router.get('/patient/:idPatient', dossierMedicalController.getDossierByPatient);
router.put('/patient/:idPatient', dossierMedicalController.updateInfos);

// Routes pour analyses avec upload de fichier
router.post('/patient/:idPatient/analyses', 
  uploadAnalyse.single('document'),
  uploadErrorHandler,
  dossierMedicalController.addAnalyse
);
router.put('/patient/:idPatient/analyses/:idAnalyse', 
  uploadAnalyse.single('document'),
  uploadErrorHandler,
  dossierMedicalController.updateAnalyse
);
router.delete('/patient/:idPatient/analyses/:idAnalyse', dossierMedicalController.deleteAnalyse);

// Routes pour ordonnances avec upload de fichier
router.post('/patient/:idPatient/ordonnances', 
  uploadOrdonnance.single('document'),
  uploadErrorHandler,
  dossierMedicalController.addOrdonnance
);
router.put('/patient/:idPatient/ordonnances/:idOrdonnance', 
  uploadOrdonnance.single('document'),
  uploadErrorHandler,
  dossierMedicalController.updateOrdonnance
);
router.delete('/patient/:idPatient/ordonnances/:idOrdonnance', dossierMedicalController.deleteOrdonnance);

router.post('/patient/:idPatient/notes', dossierMedicalController.addNote);
router.put('/patient/:idPatient/notes/:idNote', dossierMedicalController.updateNote);
router.delete('/patient/:idPatient/notes/:idNote', dossierMedicalController.deleteNote);

module.exports = router;


