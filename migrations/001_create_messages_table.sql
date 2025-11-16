-- Créer la table pour les messages entre patients et médecins
CREATE TABLE IF NOT EXISTS `messages` (
  `idMessage` int(11) NOT NULL AUTO_INCREMENT,
  `idEmetteur` int(11) NOT NULL,
  `idDestinaire` int(11) NOT NULL,
  `contenu` text NOT NULL,
  `type_message` enum('text','document','image') DEFAULT 'text',
  `url_document` varchar(500) DEFAULT NULL,
  `nom_document` varchar(255) DEFAULT NULL,
  `date_creation` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `lu` tinyint(1) DEFAULT 0,
  `date_lecture` datetime DEFAULT NULL,
  PRIMARY KEY (`idMessage`),
  KEY `idEmetteur` (`idEmetteur`),
  KEY `idDestinaire` (`idDestinaire`),
  KEY `date_creation` (`date_creation`),
  FOREIGN KEY (`idEmetteur`) REFERENCES `utilisateur` (`idUtilisateur`) ON DELETE CASCADE,
  FOREIGN KEY (`idDestinaire`) REFERENCES `utilisateur` (`idUtilisateur`) ON DELETE CASCADE
);

-- Créer la table pour les conversations (pour grouper les messages entre deux utilisateurs)
CREATE TABLE IF NOT EXISTS `conversations` (
  `idConversation` int(11) NOT NULL AUTO_INCREMENT,
  `idUtilisateur1` int(11) NOT NULL,
  `idUtilisateur2` int(11) NOT NULL,
  `dernier_message` datetime DEFAULT NULL,
  `date_creation` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`idConversation`),
  UNIQUE KEY `unique_conversation` (`idUtilisateur1`, `idUtilisateur2`),
  KEY `idUtilisateur1` (`idUtilisateur1`),
  KEY `idUtilisateur2` (`idUtilisateur2`),
  FOREIGN KEY (`idUtilisateur1`) REFERENCES `utilisateur` (`idUtilisateur`) ON DELETE CASCADE,
  FOREIGN KEY (`idUtilisateur2`) REFERENCES `utilisateur` (`idUtilisateur`) ON DELETE CASCADE
);
