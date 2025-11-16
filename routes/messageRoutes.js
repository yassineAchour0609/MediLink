const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const authMiddleware = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Toutes les routes sont protégées
router.use(authMiddleware.verifyToken);

// Routes GET - avant les autres routes
router.get('/list/all', messageController.getConversations);
router.get('/conversation/:idAutre', messageController.getConversation);

// Routes POST
router.post('/', messageController.sendMessage);

// Upload fichier avec gestion d'erreur améliorée
router.post('/upload', (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    next();
  });
}, (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "Aucun fichier fourni" });
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({
      success: true,
      message: "Fichier uploadé",
      url: fileUrl,
      filename: req.file.originalname,
      size: req.file.size
    });
  } catch (error) {
    console.error('Erreur upload:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Routes PUT
router.put('/:idMessage/read', messageController.markAsRead);

// Routes DELETE
router.delete('/:idMessage', messageController.deleteMessage);

module.exports = router;
