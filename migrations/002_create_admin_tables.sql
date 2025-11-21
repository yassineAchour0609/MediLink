-- Migration pour ajouter la table de blocage des comptes
-- Date: 2025-11-16

-- Table pour bloquer les faux comptes (sans les supprimer)
CREATE TABLE IF NOT EXISTS comptesbloques (
  id INT(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id INT(11) NOT NULL UNIQUE,
  reason TEXT,
  blocked_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES utilisateur(idUtilisateur) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_blocked_date (blocked_date)
);
