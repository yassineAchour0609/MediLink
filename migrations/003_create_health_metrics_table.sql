-- Migration pour ajouter la table de suivi santé (metriques)
-- Date: 2025-11-16

CREATE TABLE IF NOT EXISTS suivi_sante (
  id INT(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
  idPatient INT(11) NOT NULL,
  type_mesure VARCHAR(50) NOT NULL, -- 'poids', 'tension', 'glycemie', etc.
  valeur VARCHAR(100) NOT NULL,      -- stocke la valeur ou format '120/80' pour tension
  unite VARCHAR(20) DEFAULT NULL,    -- 'kg', 'mmHg', 'mg/dL', ...
  remarque TEXT DEFAULT NULL,
  date_creation DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (idPatient) REFERENCES patient(idUtilisateur) ON DELETE CASCADE,
  INDEX idx_patient (idPatient),
  INDEX idx_type_mesure (type_mesure),
  INDEX idx_date_creation (date_creation)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
