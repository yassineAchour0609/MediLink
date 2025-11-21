const express = require("express");
const bodyParser = require("body-parser");
const errorHandler = require('./middleware/errorHandler');
const http = require('http');
const { Server } = require('socket.io');

const utilisateurRoutes = require('./routes/utilisateurRoutes');
const medecinRoutes = require('./routes/medecinRoutes');
const patientRoutes = require('./routes/patientRoutes');
const rendezvousRoutes = require('./routes/rendezvousRoutes');
const dossierMedicalRoutes = require('./routes/dossierMedicalRoutes');
const messageRoutes = require('./routes/messageRoutes');
const adminRoutes = require('./routes/adminRoutes'); // ✅

const cors = require('cors');

const app = express();
const port = 3001;

const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

app.use(bodyParser.json());
app.use(cors());
app.use('/uploads', express.static('uploads'));

const userSockets = {};

io.on('connection', (socket) => {
  console.log(`🔌 Utilisateur connecté: ${socket.id}`);
  socket.on('register-user', (userId) => {
    userSockets[userId] = socket.id;
    console.log(`✅ Utilisateur ${userId} enregistré avec socket ${socket.id}`);
  });
  // ... tes autres events
  socket.on('disconnect', () => {
    const userId = Object.keys(userSockets).find(key => userSockets[key] === socket.id);
    if (userId) {
      delete userSockets[userId];
      console.log(`❌ Utilisateur ${userId} déconnecté`);
    }
  });
});

app.use((req, res, next) => {
  req.io = io;
  req.userSockets = userSockets;
  next();
});

app.use("/api/utilisateur", utilisateurRoutes);
app.use("/api/medecins", medecinRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/rendezvous", rendezvousRoutes);
app.use("/api/dossier-medical", dossierMedicalRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/admin", adminRoutes);  // ✅ IMPORTANT

app.get("/", (req, res) => {
  res.json({ message: "API Medilink - Serveur en fonctionnement" });
});

app.use(errorHandler);

server.listen(3001, () => {
  console.log(`🚀 Serveur démarré sur http://localhost:3001`);
});
