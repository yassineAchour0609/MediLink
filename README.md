# MediLink Backend

Backend Node.js/Express pour une plateforme de médecine complète avec authentification JWT, messagerie en temps réel et gestion des rendez-vous.

## Fonctionnalités

### Authentification & Profils
- ✅ Inscription et connexion avec JWT
- ✅ Gestion des profils utilisateur (Patient & Médecin)
- ✅ Changement de mot de passe sécurisé
- ✅ Contrôle d'accès basé sur les rôles

### Rendez-vous
- ✅ Création et gestion des rendez-vous
- ✅ Annulation avec notifications WebSocket en temps réel
- ✅ Statuts: prévu, annulé, terminé
- ✅ Historique des rendez-vous

### Messagerie en Temps Réel
- ✅ Chat en direct avec Socket.IO
- ✅ Upload de documents (PDF, images, documents)
- ✅ Indicateurs de saisie
- ✅ Historique des conversations
- ✅ Marquer les messages comme lus

### Dossier Médical
- ✅ Gestion des dossiers patients
- ✅ Historique médical (antécédents, traitements, vaccinations)
- ✅ Groupe sanguin et allergies
- ✅ Analyses et résultats
- ✅ Ordonnances
- ✅ Notes médicales

### Sécurité
- ✅ Blocage de comptes suspects (sans suppression)
- ✅ Hachage des mots de passe avec bcryptjs
- ✅ Validation des uploads de fichiers
- ✅ Limitation de taille (10MB)
- ✅ Middleware d'authentification

## Installation

### Prérequis
- Node.js 14+
- MySQL/MariaDB 10.4+
- npm ou yarn

### Étapes

1. **Cloner le repo**
```bash
git clone https://github.com/yassineAchour0609/MediLink.git
cd MediLink-backend
```

2. **Installer les dépendances**
```bash
npm install
```

3. **Configurer la base de données**
```bash
# Créer la base de données
mysql -u root -p
CREATE DATABASE dbmedilink;

# Importer le schéma
mysql -u root -p dbmedilink < dbmedilink.sql

# Exécuter les migrations
mysql -u root -p dbmedilink < migrations/001_create_messages_table.sql
mysql -u root -p dbmedilink < migrations/002_create_admin_tables.sql
```

4. **Configurer les variables d'environnement** (optionnel)
```bash
# Créer un fichier .env
echo "DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=dbmedilink
PORT=3001
JWT_SECRET=your_secret_key_here" > .env
```

5. **Démarrer le serveur**
```bash
npm start
```

Le serveur démarre sur `http://localhost:3001`

## Structure du Projet

```
├── controllers/           # Logique métier
│   ├── utilisateurController.js
│   ├── medecinController.js
│   ├── patientController.js
│   ├── rendezvousController.js
│   ├── messageController.js
│   ├── dossierMedicalController.js
│   └── adminController.js
├── routes/              # Points d'accès API
│   ├── utilisateurRoutes.js
│   ├── medecinRoutes.js
│   ├── patientRoutes.js
│   ├── rendezvousRoutes.js
│   ├── messageRoutes.js
│   ├── dossierMedicalRoutes.js
│   └── adminRoutes.js
├── middleware/          # Middleware personnalisé
│   ├── authMiddleware.js
│   ├── uploadMiddleware.js
│   └── errorHandler.js
├── migrations/          # Schémas SQL
│   ├── 001_create_messages_table.sql
│   └── 002_create_admin_tables.sql
├── config/
│   └── db.js           # Configuration base de données
├── server.js           # Point d'entrée
├── package.json        # Dépendances
└── dbmedilink.sql      # Schéma complet
```

## API Endpoints

### Authentification
```
POST   /api/utilisateur/register      - Créer un compte
POST   /api/utilisateur/login         - Se connecter
GET    /api/utilisateur/profile       - Profil utilisateur (protégé)
PUT    /api/utilisateur/profile       - Modifier profil (protégé)
POST   /api/utilisateur/change-pwd    - Changer mot de passe (protégé)
```

### Médecins
```
GET    /api/medecins/list             - Lister tous les médecins
GET    /api/medecins/:id              - Détails médecin
GET    /api/medecins/profile          - Profil du médecin connecté (protégé)
PUT    /api/medecins/profile          - Modifier profil médecin (protégé)
```

### Patients
```
GET    /api/patients/profile          - Profil patient (protégé)
PUT    /api/patients/profile          - Modifier profil (protégé)
POST   /api/patients/dossier-medical  - Créer/modifier dossier (protégé)
GET    /api/patients/appointments     - Mes rendez-vous (protégé)
```

### Rendez-vous
```
POST   /api/rendezvous/create         - Créer rendez-vous (protégé)
GET    /api/rendezvous/patient/:id    - RDV du patient (protégé)
GET    /api/rendezvous/medecin/:id    - RDV du médecin (protégé)
DELETE /api/rendezvous/:id            - Annuler rendez-vous (protégé)
```

### Messages
```
POST   /api/messages/                 - Envoyer un message (protégé)
POST   /api/messages/upload           - Upload fichier (protégé)
GET    /api/messages/conversation/:id - Conversation (protégé)
GET    /api/messages/list/all         - Toutes les conversations (protégé)
PUT    /api/messages/:id/read         - Marquer comme lu (protégé)
DELETE /api/messages/:id              - Supprimer message (protégé)
```

### Dossier Médical
```
GET    /api/dossier-medical/patient/:id  - Dossier patient (protégé)
POST   /api/dossier-medical/create       - Créer dossier (protégé)
PUT    /api/dossier-medical/update       - Modifier dossier (protégé)
```

### Administration
```
POST   /admin/bloquer-compte          - Bloquer un compte
POST   /admin/debloquer-compte        - Débloquer un compte
GET    /admin/comptes-bloques         - Lister bloqués
GET    /admin/estbloque?userId=X      - Vérifier si bloqué
```

## WebSocket Events (Socket.IO)

```javascript
// Client envoie
socket.emit('register-user', userId);
socket.emit('send-message', {idDestinaire, contenu});
socket.emit('typing', {idDestinaire, idEmetteur});
socket.emit('stop-typing', {idDestinaire, idEmetteur});

// Client reçoit
socket.on('receive-message', (data) => {...});
socket.on('user-typing', (data) => {...});
socket.on('user-stop-typing', (data) => {...});
socket.on('appointment-cancelled', (data) => {...});
```

## Exemples d'Utilisation

### 1. S'inscrire
```bash
curl -X POST http://localhost:3001/api/utilisateur/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "patient@example.com",
    "motDePasse": "SecurePass123",
    "nom": "Dupont",
    "prenom": "Jean",
    "role": "patient",
    "sexe": "Homme",
    "age": 35,
    "date_naissance": "1989-05-15",
    "telephone": "99123456",
    "num_cin": "12345678"
  }'
```

### 2. Se connecter
```bash
curl -X POST http://localhost:3001/api/utilisateur/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "patient@example.com",
    "motDePasse": "SecurePass123"
  }'
```

### 3. Envoyer un message
```bash
curl -X POST http://localhost:3001/api/messages/ \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "idDestinaire": 18,
    "contenu": "Bonjour Dr, comment allez-vous?"
  }'
```

### 4. Upload un document
```bash
curl -X POST http://localhost:3001/api/messages/upload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@prescription.pdf"
```

## 🔒 Authentification

Tous les endpoints protégés nécessitent un JWT dans le header:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Le JWT est obtenu via login et expire après 7 jours.

## 📱 Utilisateurs Test

| Email | Mot de passe | Rôle |
|-------|-------------|------|
| patient1@email.com | - | Patient |
| patient2@email.com | - | Patient |
| medecin@email.com | - | Médecin |

*Les mots de passe sont hachés dans la base de données*

## Dépannage

### "Database not found"
```bash
mysql -u root -p < dbmedilink.sql
```

### "Port 3001 already in use"
```bash
Get-Process node | Stop-Process -Force  # Windows
kill $(lsof -t -i:3001)                # Linux/Mac
```

### "JWT invalid"
- Assurez-vous que le token est envoyé correctement
- Vérifiez que le token n'a pas expiré (7 jours)

## Dépendances Principales

- **express** ^5.1.0 - Framework web
- **mysql2** ^3.0.0 - Client MySQL
- **jsonwebtoken** ^9.0.0 - JWT
- **bcryptjs** ^2.4.3 - Hachage mots de passe
- **socket.io** ^4.5.4 - WebSocket temps réel
- **multer** ^1.4.5 - Upload fichiers
- **cors** ^2.8.5 - CORS middleware

## License

MIT

## Auteur

**Yassine Achour**
**Syrine Khazri**
**Med Dhia Ben Aouiene**
**Beya Ben Yedder**

## Support

Pour toute question ou problème, créez une issue sur GitHub.