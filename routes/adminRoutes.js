const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

/**
 * ROUTES ADMIN - Blocage des faux comptes
 * NOTE: L'admin accède via des URLs directes (pas de création d'admin en base)
 */

/**
 * Bloquer un compte (sans le supprimer)
 * POST /admin/block-account?userId=16&reason=fake_account
 */
router.post('/bloquer-compte', adminController.blockAccount);

/**
 * Débloquer un compte
 * POST /admin/unblock-account?userId=16
 */
router.post('/debloquer-compte', adminController.unblockAccount);

/**
 * Lister tous les comptes bloqués
 * GET /admin/blocked-accounts
 */
router.get('/comptes-bloques', adminController.listBlockedAccounts);

/**
 * Vérifier si un compte est bloqué
 * GET /admin/is-blocked?userId=16
 */
router.get('/estbloque', adminController.isAccountBlocked);

module.exports = router;
