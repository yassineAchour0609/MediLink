-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Hôte : 127.0.0.1
-- Généré le : sam. 29 nov. 2025 à 19:37
-- Version du serveur : 10.4.32-MariaDB
-- Version de PHP : 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de données : `dbmedilink`
--

-- --------------------------------------------------------

--
-- Structure de la table `analyses`
--

CREATE TABLE `analyses` (
  `idAnalyse` int(11) NOT NULL,
  `idDossier` int(11) NOT NULL,
  `type_analyse` varchar(255) NOT NULL,
  `date_analyse` date NOT NULL,
  `resultats` text DEFAULT NULL,
  `laboratoire` varchar(255) DEFAULT NULL,
  `idMedecinPrescripteur` int(11) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `url_document` varchar(500) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `analyses`
--

INSERT INTO `analyses` (`idAnalyse`, `idDossier`, `type_analyse`, `date_analyse`, `resultats`, `laboratoire`, `idMedecinPrescripteur`, `notes`, `url_document`, `created_at`) VALUES
(9, 2, 'Test Analyse Urine', '2025-11-29', 'Résultats normaux', 'Laboratoire Test 2', 36, NULL, NULL, '2025-11-29 15:52:38'),
(11, 2, 'Test Analyse Urine', '2025-11-29', 'Résultats normaux', 'Laboratoire Test 2', 36, NULL, NULL, '2025-11-29 15:55:28'),
(12, 2, 'test', '2024-06-29', 'test', 'test ', 35, 'test', '/uploads/analyses/analyse-1764436167794-489855743.pdf', '2025-11-29 18:09:27'),
(13, 2, 'test1', '2025-11-08', 'test1', 'test1', 36, 'test1', '/uploads/analyses/analyse-1764438640390-124029618.pdf', '2025-11-29 18:50:40');

-- --------------------------------------------------------

--
-- Structure de la table `comptesbloques`
--

CREATE TABLE `comptesbloques` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `reason` text DEFAULT NULL,
  `blocked_date` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=MyISAM DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Structure de la table `conversations`
--

CREATE TABLE `conversations` (
  `idConversation` int(11) NOT NULL,
  `idUtilisateur1` int(11) NOT NULL,
  `idUtilisateur2` int(11) NOT NULL,
  `dernier_message` datetime DEFAULT NULL,
  `date_creation` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `dossiermedical`
--

CREATE TABLE `dossiermedical` (
  `idDossier` int(11) NOT NULL,
  `idPatient` int(11) NOT NULL,
  `date_creation` datetime NOT NULL DEFAULT current_timestamp(),
  `groupe_sanguin` varchar(10) DEFAULT NULL,
  `antecedents_medicaux` text DEFAULT NULL,
  `traitements_en_cours` text DEFAULT NULL,
  `vaccinations` text DEFAULT NULL,
  `der_mise_a_jour` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `diagnostic` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `dossiermedical`
--

INSERT INTO `dossiermedical` (`idDossier`, `idPatient`, `date_creation`, `groupe_sanguin`, `antecedents_medicaux`, `traitements_en_cours`, `vaccinations`, `der_mise_a_jour`, `diagnostic`) VALUES
(2, 35, '2025-11-23 23:18:29', 'O-', NULL, NULL, 'COVID-19', '2025-11-29 15:38:16', NULL);

-- --------------------------------------------------------

--
-- Structure de la table `medecin`
--

CREATE TABLE `medecin` (
  `idUtilisateur` int(11) NOT NULL,
  `specialite` varchar(100) DEFAULT NULL,
  `cabinet` varchar(100) DEFAULT NULL,
  `disponibilite` tinyint(1) DEFAULT NULL,
  `tarif_consultation` double DEFAULT NULL,
  `heure_ouverture` time NOT NULL DEFAULT '08:00:00',
  `heure_fermeture` time NOT NULL DEFAULT '19:00:00'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `medecin`
--

INSERT INTO `medecin` (`idUtilisateur`, `specialite`, `cabinet`, `disponibilite`, `tarif_consultation`, `heure_ouverture`, `heure_fermeture`) VALUES
(36, 'Dermatologue', 'Bardo', 1, 70, '08:00:00', '19:00:00'),
(37, 'Ophtalmologue', 'naser 2', 1, 80, '08:00:00', '19:00:00'),
(40, 'ORL', 'gabes', 1, 70, '08:00:00', '19:00:00'),
(41, 'Généraliste', 'Menzah 6', 1, 50, '08:00:00', '19:00:00');

-- --------------------------------------------------------

--
-- Structure de la table `messages`
--

CREATE TABLE `messages` (
  `idMessage` int(11) NOT NULL,
  `idEmetteur` int(11) NOT NULL,
  `idDestinaire` int(11) NOT NULL,
  `contenu` text NOT NULL,
  `type_message` enum('text','document','image') DEFAULT 'text',
  `url_document` varchar(500) DEFAULT NULL,
  `nom_document` varchar(255) DEFAULT NULL,
  `date_creation` datetime NOT NULL DEFAULT current_timestamp(),
  `lu` tinyint(1) DEFAULT 0,
  `date_lecture` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `notesmedicales`
--

CREATE TABLE `notesmedicales` (
  `idNote` int(11) NOT NULL,
  `idDossier` int(11) NOT NULL,
  `idMedecin` int(11) NOT NULL,
  `type_note` varchar(100) DEFAULT 'Consultation',
  `contenu_note` text NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `ordonnances`
--

CREATE TABLE `ordonnances` (
  `idOrdonnance` int(11) NOT NULL,
  `idDossier` int(11) NOT NULL,
  `date_ordonnance` date NOT NULL,
  `idMedecinPrescripteur` int(11) DEFAULT NULL,
  `medicaments` text NOT NULL,
  `posologie` text DEFAULT NULL,
  `duree_traitement` varchar(100) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `url_document` varchar(500) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `ordonnances`
--

INSERT INTO `ordonnances` (`idOrdonnance`, `idDossier`, `date_ordonnance`, `idMedecinPrescripteur`, `medicaments`, `posologie`, `duree_traitement`, `notes`, `url_document`, `created_at`) VALUES
(10, 2, '2025-11-29', 36, 'Paracétamol 500mg - Mis à jour', '2 comprimés 3 fois par jour', '10 jours', 'Notes mises à jour', '/uploads/ordonnances/ordonnance-1764428128574-533794336.pdf', '2025-11-29 15:55:28'),
(11, 2, '2025-11-29', 36, 'Aspirine 100mg', '1 comprimé par jour', '5 jours', 'Prendre après les repas', NULL, '2025-11-29 15:55:28');

-- --------------------------------------------------------

--
-- Structure de la table `patient`
--

CREATE TABLE `patient` (
  `idUtilisateur` int(11) NOT NULL,
  `num_dossier_medical` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `patient`
--

INSERT INTO `patient` (`idUtilisateur`, `num_dossier_medical`) VALUES
(35, 2),
(42, NULL),
(43, NULL),
(44, NULL);

-- --------------------------------------------------------

--
-- Structure de la table `rendezvous`
--

CREATE TABLE `rendezvous` (
  `idRdv` int(11) NOT NULL,
  `date` date NOT NULL,
  `heure` time NOT NULL,
  `statut` enum('prévu','annulé','terminé') DEFAULT 'prévu',
  `idPatient` int(11) NOT NULL,
  `idMedecin` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `rendezvous`
--

INSERT INTO `rendezvous` (`idRdv`, `date`, `heure`, `statut`, `idPatient`, `idMedecin`) VALUES
(16, '2025-11-30', '15:00:00', 'prévu', 35, 36);

-- --------------------------------------------------------

--
-- Structure de la table `suivi_sante`
--

CREATE TABLE `suivi_sante` (
  `id` int(11) NOT NULL,
  `idPatient` int(11) NOT NULL,
  `type_mesure` varchar(50) NOT NULL,
  `valeur` varchar(100) NOT NULL,
  `unite` varchar(20) DEFAULT NULL,
  `remarque` text DEFAULT NULL,
  `date_creation` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=MyISAM DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Structure de la table `utilisateur`
--

CREATE TABLE `utilisateur` (
  `idUtilisateur` int(11) NOT NULL,
  `prenom` varchar(50) DEFAULT NULL,
  `nom` varchar(50) DEFAULT NULL,
  `sexe` varchar(10) DEFAULT NULL,
  `age` int(11) DEFAULT NULL,
  `date_naissance` date DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `motDePasse` varchar(255) DEFAULT NULL,
  `telephone` varchar(20) DEFAULT NULL,
  `num_cin` varchar(20) DEFAULT NULL,
  `role` varchar(20) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `utilisateur`
--

INSERT INTO `utilisateur` (`idUtilisateur`, `prenom`, `nom`, `sexe`, `age`, `date_naissance`, `email`, `motDePasse`, `telephone`, `num_cin`, `role`) VALUES
(35, 'yassine', 'achour', 'homme', 21, '2004-06-09', 'achouryassine08@gmail.com', '$2b$10$2v.sUdB7cS.Qx6brW.yfjuj1p1Wdk/7JrgnjGt1F8WYJsxgWGAPca', '90515436', '12345678', 'patient'),
(36, 'Ons', 'Riahi', 'femme', 38, '1987-03-11', 'ons@gmail.com', '$2b$10$IQgYRHodwtg3KNY6NPmM9OExXWMTJJwdO2LS6WP/yNOGO6/7EvpMC', '22519779', '22222222', 'medecin'),
(37, 'Syrine', 'Achour', 'femme', 26, '1999-08-27', 'syrine@gmail.com', '$2b$10$KPRQn8NzEsm20/zVgXVa6OQVqK1g.r8NW7mkx6nuwhAhROjxwvjIm', '22555333', '22333322', 'medecin'),
(40, 'Mohamed', 'Ben Ali', 'homme', 44, '1980-12-30', 'Mohamed@gmail.com', '$2b$10$fIazCU7AXtI/5tVsiaxMdusL3a8QyCdwYty3QNgY3qo262NgcUtje', '27031500', '33333333', 'medecin'),
(41, 'Salma', 'Gharbi', 'femme', 55, '1970-09-28', 'salma@gmail.com', '$2b$10$ez8hUnr.0m.HbROlEnSBHerDd.Cc2dqWgCaZ6loefjM1AEMY0u6YO', '99555333', '54386712', 'medecin'),
(42, 'khazri', 'syrine', 'femme', 21, '2004-02-14', 'khazrisyrine111@gmail.com', '$2b$10$Sj3npcZghCZ/Tfq8JCiigOTRlCmP259ewuphB1KW1mtqFT4GyGdiy', '11111111', '44444444', 'admin'),
(43, 'Ben Yedder', 'Baya', 'femme', 20, '2005-11-23', 'baya@gmail.com', '$2b$10$vDR4dlGyZVbB9UHAQUYrFe3lauNyQH56X7RAsP9HBCrQrfsHvwJJe', '99999999', '77777777', 'admin'),
(44, 'Ben aouiene', 'Mohamed Dhia', 'homme', 21, '2004-05-05', 'dhia@gmail.com', '$2b$10$wUZLSLnW5FHNOp6RERTr9eSsTmtDLCkwatuAhtpO1EnogO7dZ59VO', '44444444', '00000000', 'admin');

--
-- Index pour les tables déchargées
--

--
-- Index pour la table `analyses`
--
ALTER TABLE `analyses`
  ADD PRIMARY KEY (`idAnalyse`),
  ADD KEY `idDossier` (`idDossier`),
  ADD KEY `idMedecinPrescripteur` (`idMedecinPrescripteur`);

--
-- Index pour la table `comptesbloques`
--
ALTER TABLE `comptesbloques`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `user_id` (`user_id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_blocked_date` (`blocked_date`);

--
-- Index pour la table `conversations`
--
ALTER TABLE `conversations`
  ADD PRIMARY KEY (`idConversation`),
  ADD UNIQUE KEY `unique_conversation` (`idUtilisateur1`,`idUtilisateur2`),
  ADD KEY `idUtilisateur1` (`idUtilisateur1`),
  ADD KEY `idUtilisateur2` (`idUtilisateur2`);

--
-- Index pour la table `dossiermedical`
--
ALTER TABLE `dossiermedical`
  ADD PRIMARY KEY (`idDossier`),
  ADD UNIQUE KEY `idPatient` (`idPatient`);

--
-- Index pour la table `medecin`
--
ALTER TABLE `medecin`
  ADD PRIMARY KEY (`idUtilisateur`);

--
-- Index pour la table `messages`
--
ALTER TABLE `messages`
  ADD PRIMARY KEY (`idMessage`),
  ADD KEY `idEmetteur` (`idEmetteur`),
  ADD KEY `idDestinaire` (`idDestinaire`),
  ADD KEY `date_creation` (`date_creation`);

--
-- Index pour la table `notesmedicales`
--
ALTER TABLE `notesmedicales`
  ADD PRIMARY KEY (`idNote`),
  ADD KEY `idDossier` (`idDossier`),
  ADD KEY `idMedecin` (`idMedecin`);

--
-- Index pour la table `ordonnances`
--
ALTER TABLE `ordonnances`
  ADD PRIMARY KEY (`idOrdonnance`),
  ADD KEY `idDossier` (`idDossier`),
  ADD KEY `idMedecinPrescripteur` (`idMedecinPrescripteur`);

--
-- Index pour la table `patient`
--
ALTER TABLE `patient`
  ADD PRIMARY KEY (`idUtilisateur`);

--
-- Index pour la table `rendezvous`
--
ALTER TABLE `rendezvous`
  ADD PRIMARY KEY (`idRdv`),
  ADD KEY `idPatient` (`idPatient`),
  ADD KEY `idMedecin` (`idMedecin`);

--
-- Index pour la table `suivi_sante`
--
ALTER TABLE `suivi_sante`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_patient` (`idPatient`),
  ADD KEY `idx_type_mesure` (`type_mesure`),
  ADD KEY `idx_date_creation` (`date_creation`);

--
-- Index pour la table `utilisateur`
--
ALTER TABLE `utilisateur`
  ADD PRIMARY KEY (`idUtilisateur`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT pour les tables déchargées
--

--
-- AUTO_INCREMENT pour la table `analyses`
--
ALTER TABLE `analyses`
  MODIFY `idAnalyse` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT pour la table `comptesbloques`
--
ALTER TABLE `comptesbloques`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT pour la table `conversations`
--
ALTER TABLE `conversations`
  MODIFY `idConversation` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT pour la table `dossiermedical`
--
ALTER TABLE `dossiermedical`
  MODIFY `idDossier` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT pour la table `messages`
--
ALTER TABLE `messages`
  MODIFY `idMessage` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=65;

--
-- AUTO_INCREMENT pour la table `notesmedicales`
--
ALTER TABLE `notesmedicales`
  MODIFY `idNote` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT pour la table `ordonnances`
--
ALTER TABLE `ordonnances`
  MODIFY `idOrdonnance` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT pour la table `rendezvous`
--
ALTER TABLE `rendezvous`
  MODIFY `idRdv` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT pour la table `suivi_sante`
--
ALTER TABLE `suivi_sante`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT pour la table `utilisateur`
--
ALTER TABLE `utilisateur`
  MODIFY `idUtilisateur` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=48;

--
-- Contraintes pour les tables déchargées
--

--
-- Contraintes pour la table `analyses`
--
ALTER TABLE `analyses`
  ADD CONSTRAINT `analyses_ibfk_1` FOREIGN KEY (`idDossier`) REFERENCES `dossiermedical` (`idDossier`) ON DELETE CASCADE,
  ADD CONSTRAINT `analyses_ibfk_2` FOREIGN KEY (`idMedecinPrescripteur`) REFERENCES `utilisateur` (`idUtilisateur`) ON DELETE SET NULL;

--
-- Contraintes pour la table `conversations`
--
ALTER TABLE `conversations`
  ADD CONSTRAINT `conversations_ibfk_1` FOREIGN KEY (`idUtilisateur1`) REFERENCES `utilisateur` (`idUtilisateur`) ON DELETE CASCADE,
  ADD CONSTRAINT `conversations_ibfk_2` FOREIGN KEY (`idUtilisateur2`) REFERENCES `utilisateur` (`idUtilisateur`) ON DELETE CASCADE;

--
-- Contraintes pour la table `medecin`
--
ALTER TABLE `medecin`
  ADD CONSTRAINT `medecin_ibfk_1` FOREIGN KEY (`idUtilisateur`) REFERENCES `utilisateur` (`idUtilisateur`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Contraintes pour la table `messages`
--
ALTER TABLE `messages`
  ADD CONSTRAINT `messages_ibfk_1` FOREIGN KEY (`idEmetteur`) REFERENCES `utilisateur` (`idUtilisateur`) ON DELETE CASCADE,
  ADD CONSTRAINT `messages_ibfk_2` FOREIGN KEY (`idDestinaire`) REFERENCES `utilisateur` (`idUtilisateur`) ON DELETE CASCADE;

--
-- Contraintes pour la table `notesmedicales`
--
ALTER TABLE `notesmedicales`
  ADD CONSTRAINT `notesmedicales_ibfk_1` FOREIGN KEY (`idDossier`) REFERENCES `dossiermedical` (`idDossier`) ON DELETE CASCADE,
  ADD CONSTRAINT `notesmedicales_ibfk_2` FOREIGN KEY (`idMedecin`) REFERENCES `utilisateur` (`idUtilisateur`) ON DELETE CASCADE;

--
-- Contraintes pour la table `ordonnances`
--
ALTER TABLE `ordonnances`
  ADD CONSTRAINT `ordonnances_ibfk_1` FOREIGN KEY (`idDossier`) REFERENCES `dossiermedical` (`idDossier`) ON DELETE CASCADE,
  ADD CONSTRAINT `ordonnances_ibfk_2` FOREIGN KEY (`idMedecinPrescripteur`) REFERENCES `utilisateur` (`idUtilisateur`) ON DELETE SET NULL;

--
-- Contraintes pour la table `patient`
--
ALTER TABLE `patient`
  ADD CONSTRAINT `patient_ibfk_1` FOREIGN KEY (`idUtilisateur`) REFERENCES `utilisateur` (`idUtilisateur`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Contraintes pour la table `rendezvous`
--
ALTER TABLE `rendezvous`
  ADD CONSTRAINT `rendezvous_ibfk_1` FOREIGN KEY (`idPatient`) REFERENCES `patient` (`idUtilisateur`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `rendezvous_ibfk_2` FOREIGN KEY (`idMedecin`) REFERENCES `medecin` (`idUtilisateur`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
