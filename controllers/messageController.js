const db = require('../config/db');

const messageController = {
  // Envoyer un message
  sendMessage: async (req, res) => {
    try {
        const io = req.app.get("io");
      const { idDestinaire, contenu, type_message, url_document, nom_document } = req.body;
      const idEmetteur = req.user.id;

      if (!idDestinaire || !contenu) {
        return res.status(400).json({
          success: false,
          message: "Destinaire et contenu requis"
        });
      }

      const [result] = await db.execute(
        `INSERT INTO messages (idEmetteur, idDestinaire, contenu, type_message, url_document, nom_document)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [idEmetteur, idDestinaire, contenu, type_message || 'text', url_document || null, nom_document || null]
      );

      const messageId = result.insertId;

      // Récupérer le message créé avec infos émetteur
      const [messages] = await db.execute(
        `SELECT m.*, u.nom, u.prenom, u.idUtilisateur
         FROM messages m
         JOIN utilisateur u ON m.idEmetteur = u.idUtilisateur
         WHERE m.idMessage = ?`,
        [messageId]
      );
        const message = messages[0];
      //  Émission d’une notification Socket.IO au destinataire
      io.to(String(idDestinaire)).emit("nouveau_message", {
        message,
        from: idEmetteur,
        to: idDestinaire
      });

      //  Notif pour mettre à jour liste des conversations
      io.to(String(idDestinaire)).emit("notif_message", {
        idEmetteur,
        idDestinaire,
        extrait: contenu.substring(0, 30),
        date: message.date_creation
      });

      res.status(201).json({
        success: true,
        message: "Message envoyé",
        data: message
      });
    } catch (error) {
      console.error("Erreur envoi message:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Récupérer les messages d'une conversation
  getConversation: async (req, res) => {
    try {
      const { idAutre } = req.params;
      const idUtilisateur = req.user.id;

      const [messages] = await db.execute(
        `SELECT m.*, u.nom, u.prenom
         FROM messages m
         JOIN utilisateur u ON m.idEmetteur = u.idUtilisateur
         WHERE (m.idEmetteur = ? AND m.idDestinaire = ?)
            OR (m.idEmetteur = ? AND m.idDestinaire = ?)
         ORDER BY m.date_creation ASC`,
        [idUtilisateur, idAutre, idAutre, idUtilisateur]
      );

      // Marquer les messages comme lus
      await db.execute(
        `UPDATE messages SET lu = 1, date_lecture = NOW()
         WHERE idDestinaire = ? AND idEmetteur = ? AND lu = 0`,
        [idUtilisateur, idAutre]
      );

      res.json({
        success: true,
        messages
      });
    } catch (error) {
      console.error("Erreur récupération conversation:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Récupérer toutes les conversations de l'utilisateur
  getConversations: async (req, res) => {
    try {
      const idUtilisateur = req.user.id;

      const [conversations] = await db.execute(
        `SELECT DISTINCT 
           CASE 
             WHEN m.idEmetteur = ? THEN m.idDestinaire
             ELSE m.idEmetteur
           END as idAutre,
           u.nom, u.prenom, u.email,
           (SELECT COUNT(*) FROM messages 
            WHERE idDestinaire = ? AND idEmetteur = CASE 
              WHEN m.idEmetteur = ? THEN m.idDestinaire
              ELSE m.idEmetteur
            END AND lu = 0) as messages_non_lus,
           (SELECT date_creation FROM messages 
            WHERE (idEmetteur = ? AND idDestinaire = CASE 
              WHEN m.idEmetteur = ? THEN m.idDestinaire
              ELSE m.idEmetteur
            END) OR (idEmetteur = CASE 
              WHEN m.idEmetteur = ? THEN m.idDestinaire
              ELSE m.idEmetteur
            END AND idDestinaire = ?)
            ORDER BY date_creation DESC LIMIT 1) as dernier_message_date
         FROM messages m
         JOIN utilisateur u ON u.idUtilisateur = CASE 
           WHEN m.idEmetteur = ? THEN m.idDestinaire
           ELSE m.idEmetteur
         END
         WHERE m.idEmetteur = ? OR m.idDestinaire = ?
         ORDER BY dernier_message_date DESC`,
        [idUtilisateur, idUtilisateur, idUtilisateur, idUtilisateur, idUtilisateur, idUtilisateur, idUtilisateur, idUtilisateur, idUtilisateur, idUtilisateur]
      );

      res.json({
        success: true,
        conversations
      });
    } catch (error) {
      console.error("Erreur récupération conversations:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Supprimer un message
  deleteMessage: async (req, res) => {
    try {
      const { idMessage } = req.params;
      const idUtilisateur = req.user.id;

      // Vérifier que l'utilisateur est l'émetteur
      const [msg] = await db.execute(
        `SELECT idEmetteur FROM messages WHERE idMessage = ?`,
        [idMessage]
      );

      if (msg.length === 0) {
        return res.status(404).json({ success: false, message: "Message non trouvé" });
      }

      if (msg[0].idEmetteur !== idUtilisateur) {
        return res.status(403).json({ success: false, message: "Vous ne pouvez supprimer que vos messages" });
      }

      await db.execute(
        `DELETE FROM messages WHERE idMessage = ?`,
        [idMessage]
      );

      res.json({
        success: true,
        message: "Message supprimé"
      });
    } catch (error) {
      console.error("Erreur suppression message:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Marquer un message comme lu
  markAsRead: async (req, res) => {
    try {
      const { idMessage } = req.params;

      await db.execute(
        `UPDATE messages SET lu = 1, date_lecture = NOW() WHERE idMessage = ?`,
        [idMessage]
      );

      res.json({
        success: true,
        message: "Message marqué comme lu"
      });
    } catch (error) {
      console.error("Erreur marquage message:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  }
};

module.exports = messageController;
