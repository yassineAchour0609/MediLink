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
const adminRoutes = require('./routes/adminRoutes');
const cors = require('cors');

const app = express();
const port = 3001;

// Créer le serveur HTTP
const server = http.createServer(app);

// Initialiser Socket.IO avec CORS
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(bodyParser.json());
app.use(cors());

// Servir les fichiers uploadés
app.use('/uploads', express.static('uploads'));

// Stocker les connexions des utilisateurs (userId -> socketId)
const userSockets = {};

// Événements Socket.IO
io.on('connection', (socket) => {
  console.log(`🔌 Utilisateur connecté: ${socket.id}`);

  // Enregistrer l'utilisateur connecté
  socket.on('register-user', (userId) => {
    userSockets[userId] = socket.id;
    console.log(`✅ Utilisateur ${userId} enregistré avec socket ${socket.id}`);
  });

  // Événement pour envoyer un message en temps réel
  socket.on('send-message', (data) => {
    const { idDestinaire, idEmetteur, contenu, type_message } = data;
    
    // Envoyer le message au destinaire s'il est connecté
    if (userSockets[idDestinaire]) {
      const destinatairSocketId = userSockets[idDestinaire];
      io.to(destinatairSocketId).emit('receive-message', {
        idEmetteur,
        idDestinaire,
        contenu,
        type_message: type_message || 'text',
        date_creation: new Date(),
        lu: 0
      });
      console.log(`📨 Message envoyé à l'utilisateur ${idDestinaire}`);
    }
  });

  // Événement pour indiquer que quelqu'un tape
  socket.on('typing', (data) => {
    const { idDestinaire, idEmetteur, nom_emetteur } = data;
    if (userSockets[idDestinaire]) {
      const destinatairSocketId = userSockets[idDestinaire];
      io.to(destinatairSocketId).emit('user-typing', {
        idEmetteur,
        nom_emetteur
      });
    }
  });

  // Événement pour indiquer que quelqu'un a arrêté de taper
  socket.on('stop-typing', (data) => {
    const { idDestinaire, idEmetteur } = data;
    if (userSockets[idDestinaire]) {
      const destinatairSocketId = userSockets[idDestinaire];
      io.to(destinatairSocketId).emit('user-stop-typing', {
        idEmetteur
      });
    }
  });

  // Gérer la déconnexion
  socket.on('disconnect', () => {
    // Trouver et supprimer l'utilisateur
    const userId = Object.keys(userSockets).find(key => userSockets[key] === socket.id);
    if (userId) {
      delete userSockets[userId];
      console.log(`❌ Utilisateur ${userId} déconnecté`);
    }
  });
});

// Rendre io accessible dans les routes/contrôleurs
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
app.use("/admin", adminRoutes);

app.get("/", (req, res) => {
  res.json({ message: "API Medilink - Serveur en fonctionnement" });
});

app.use(errorHandler);

server.listen(port, () => {
  console.log(`🚀 Serveur démarré sur http://localhost:${port}`);
});