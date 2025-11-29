const multer = require('multer');
const path = require('path');

// Créer le dossier uploads s'il n'existe pas
const fs = require('fs');
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Créer les sous-dossiers pour analyses et ordonnances
const analysesDir = path.join(uploadDir, 'analyses');
const ordonnancesDir = path.join(uploadDir, 'ordonnances');
if (!fs.existsSync(analysesDir)) {
  fs.mkdirSync(analysesDir, { recursive: true });
}
if (!fs.existsSync(ordonnancesDir)) {
  fs.mkdirSync(ordonnancesDir, { recursive: true });
}

// Configurer le stockage par défaut
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Générer un nom unique pour le fichier
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Stockage pour analyses
const storageAnalyses = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, analysesDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'analyse-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Stockage pour ordonnances
const storageOrdonnances = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, ordonnancesDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'ordonnance-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Filtrer les types de fichiers acceptés
const fileFilter = (req, file, cb) => {
  // Accepter images et documents
  const allowedTypes = /jpeg|jpg|png|pdf|doc|docx|txt/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Type de fichier non autorisé. Accepté: jpg, png, pdf, doc, docx, txt'));
  }
};

// Créer le middleware multer par défaut
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: fileFilter
});

// Middleware multer pour analyses
const uploadAnalyse = multer({
  storage: storageAnalyses,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: fileFilter
});

// Middleware multer pour ordonnances
const uploadOrdonnance = multer({
  storage: storageOrdonnances,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: fileFilter
});

// Middleware pour capturer les erreurs multer
const uploadErrorHandler = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ success: false, message: 'Fichier trop volumineux (max 10MB)' });
    }
    return res.status(400).json({ success: false, message: err.message });
  } else if (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
  next();
};

module.exports = upload;
module.exports.uploadAnalyse = uploadAnalyse;
module.exports.uploadOrdonnance = uploadOrdonnance;
module.exports.uploadErrorHandler = uploadErrorHandler;
