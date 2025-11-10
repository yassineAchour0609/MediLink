const express = require("express");
const bodyParser = require("body-parser");
const errorHandler = require('./middleware/errorHandler');

const utilisateurRoutes = require('./routes/utilisateurRoutes');
const medecinRoutes = require('./routes/medecinRoutes');
const rendezvousRoutes = require('./routes/rendezvousRoutes');
const dossierRoutes = require('./routes/dossierRoutes');
const db = require('./config/db');
const cors = require('cors');

const app = express();
const port = 3001;

app.use(bodyParser.json());
app.use(cors());

app.use("/api/utilisateur", utilisateurRoutes);
app.use("/api/medecins", medecinRoutes);
app.use("/api/rendezvous", rendezvousRoutes);
app.use("/api/dossiers", dossierRoutes);

app.get("/", (req, res) => {
  res.json({ message: "API Medilink - Serveur en fonctionnement" });
});

app.use(errorHandler);

async function ensureSchema() {
  try {
    // Add opening/closing hours to medecin
    try {
      await db.execute(
        "ALTER TABLE medecin ADD COLUMN heure_ouverture TIME NOT NULL DEFAULT '08:00:00'"
      );
    } catch (err) {
      if (!err.message.includes('Duplicate column name')) {
        throw err;
      }
    }
    try {
      await db.execute(
        "ALTER TABLE medecin ADD COLUMN heure_fermeture TIME NOT NULL DEFAULT '19:00:00'"
      );
    } catch (err) {
      if (!err.message.includes('Duplicate column name')) {
        throw err;
      }
    }

    // dossiermedical table - Extended with diagnostic
    await db.execute(`
      CREATE TABLE IF NOT EXISTS dossiermedical (
        idDossier INT AUTO_INCREMENT PRIMARY KEY,
        idPatient INT NOT NULL UNIQUE,
        date_creation DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        groupe_sanguin VARCHAR(10),
        antecedents_medicaux TEXT,
        traitements_en_cours TEXT,
        vaccinations TEXT,
        diagnostic TEXT,
        der_mise_a_jour DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (idPatient) REFERENCES utilisateur(idUtilisateur) ON DELETE CASCADE
      )
    `);

    // Add diagnostic column if it doesn't exist
    try {
      await db.execute("ALTER TABLE dossiermedical ADD COLUMN diagnostic TEXT");
    } catch (err) {
      if (!err.message.includes('Duplicate column name')) {
        throw err;
      }
    }

    // Analyses table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS analyses (
        idAnalyse INT AUTO_INCREMENT PRIMARY KEY,
        idDossier INT NOT NULL,
        type_analyse VARCHAR(255) NOT NULL,
        date_analyse DATE NOT NULL,
        resultats TEXT,
        laboratoire VARCHAR(255),
        idMedecinPrescripteur INT,
        notes TEXT,
        url_document VARCHAR(500),
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (idDossier) REFERENCES dossiermedical(idDossier) ON DELETE CASCADE,
        FOREIGN KEY (idMedecinPrescripteur) REFERENCES utilisateur(idUtilisateur) ON DELETE SET NULL
      )
    `);

    // Ordonnances table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS ordonnances (
        idOrdonnance INT AUTO_INCREMENT PRIMARY KEY,
        idDossier INT NOT NULL,
        date_ordonnance DATE NOT NULL,
        idMedecinPrescripteur INT,
        medicaments TEXT NOT NULL,
        posologie TEXT,
        duree_traitement VARCHAR(100),
        notes TEXT,
        url_document VARCHAR(500),
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (idDossier) REFERENCES dossiermedical(idDossier) ON DELETE CASCADE,
        FOREIGN KEY (idMedecinPrescripteur) REFERENCES utilisateur(idUtilisateur) ON DELETE SET NULL
      )
    `);

    // NotesMedicales table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS notesmedicales (
        idNote INT AUTO_INCREMENT PRIMARY KEY,
        idDossier INT NOT NULL,
        idMedecin INT NOT NULL,
        type_note VARCHAR(100) DEFAULT 'Consultation',
        contenu_note TEXT NOT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (idDossier) REFERENCES dossiermedical(idDossier) ON DELETE CASCADE,
        FOREIGN KEY (idMedecin) REFERENCES utilisateur(idUtilisateur) ON DELETE CASCADE
      )
    `);

    console.log('✅ Schéma vérifié/mis à jour');
  } catch (schemaError) {
    console.error('❌ Erreur de vérification du schéma MySQL:', schemaError);
  }
}

ensureSchema().finally(() => {
  app.listen(port, () => {
    console.log(`🚀 Serveur démarré sur http://localhost:${port}`);
  });
});