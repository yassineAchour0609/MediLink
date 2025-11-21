-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Hôte : 127.0.0.1
-- Généré le : lun. 10 nov. 2025 à 21:47
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
(1, 1, 'test', '2025-11-14', 'test1', 'test', 18, 'test', NULL, '2025-11-07 20:51:54');

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
(1, 16, '2025-11-07 19:00:30', 'A+', 'Diabète type 2, Hypertension', 'Metformine 500mg, Amlodipine 5mg', 'COVID-19, Grippe, Hépatite B', '2025-11-10 19:11:11', 'Diabète type 2 et hypertension contrôlés');

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
(18, 'Dermatologue', 'Clinique Ibn Khaldoun, Sousse', 1, 110, '08:00:00', '19:00:00');

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

--
-- Déchargement des données de la table `notesmedicales`
--

INSERT INTO `notesmedicales` (`idNote`, `idDossier`, `idMedecin`, `type_note`, `contenu_note`, `created_at`) VALUES
(1, 1, 18, 'Consultation', 'test', '2025-11-07 20:52:23');

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
(1, 1, '2025-11-29', 18, 'test', 'test', 'test', 'test', NULL, '2025-11-07 20:52:18');

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
(16, NULL),
(17, NULL);

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
(6, '2025-10-29', '21:49:00', 'annulé', 16, 18),
(10, '2025-11-09', '08:19:00', 'prévu', 16, 18),
(11, '2025-11-11', '08:00:00', 'prévu', 16, 18);

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
(16, 'Un', 'Patient', 'Femme', 30, '1995-04-15', 'patient1@email.com', '$2b$10$QHjrOZvG8xKpxT5CwoD3geKTeBqtC5IiPXxRLelVI3jhF9gJg.15O', '99881122', '11223344', 'patient'),
(17, 'Deux', 'Patient', 'Homme', 40, '1985-08-20', 'patient2@email.com', '$2b$10$ePyKVLeFXTxW8gATvLcSBuU8Vm7hBtR7JgGYpSa8SvgThgF80Hfoq', '99774455', '22334455', 'patient'),
(18, 'Ons', 'Riahi', 'Femme', 50, '1975-11-02', 'medecin@email.com', '$2b$10$2FfCoBUiG6WWhcyH1v0K5eNrKbhTSnww4JRsc.LXV/eP5AzkdUg4K', '99887766', '55667788', 'medecin');

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
  MODIFY `idAnalyse` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT pour la table `dossiermedical`
--
ALTER TABLE `dossiermedical`
  MODIFY `idDossier` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT pour la table `notesmedicales`
--
ALTER TABLE `notesmedicales`
  MODIFY `idNote` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT pour la table `ordonnances`
--
ALTER TABLE `ordonnances`
  MODIFY `idOrdonnance` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT pour la table `rendezvous`
--
ALTER TABLE `rendezvous`
  MODIFY `idRdv` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT pour la table `utilisateur`
--
ALTER TABLE `utilisateur`
  MODIFY `idUtilisateur` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=19;

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
-- Contraintes pour la table `medecin`
--
ALTER TABLE `medecin`
  ADD CONSTRAINT `medecin_ibfk_1` FOREIGN KEY (`idUtilisateur`) REFERENCES `utilisateur` (`idUtilisateur`) ON DELETE CASCADE ON UPDATE CASCADE;

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
