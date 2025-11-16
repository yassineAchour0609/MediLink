const express = require("express");
const bodyParser = require("body-parser");
const errorHandler = require('./middleware/errorHandler');

const utilisateurRoutes = require('./routes/utilisateurRoutes');
const medecinRoutes = require('./routes/medecinRoutes');
const rendezvousRoutes = require('./routes/rendezvousRoutes');
const dossierMedicalRoutes = require('./routes/dossierMedicalRoutes');
const cors = require('cors');

const app = express();
const port = 3001;

app.use(bodyParser.json());
app.use(cors());

app.use("/api/utilisateur", utilisateurRoutes);
app.use("/api/medecins", medecinRoutes);
app.use("/api/rendezvous", rendezvousRoutes);
app.use("/api/dossier-medical", dossierMedicalRoutes);

app.get("/", (req, res) => {
  res.json({ message: "API Medilink - Serveur en fonctionnement" });
});

app.use(errorHandler);

app.listen(port, () => {
  console.log(`🚀 Serveur démarré sur http://localhost:${port}`);
});