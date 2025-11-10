const express = require("express");
const cors = require("cors");
const fs = require("fs");

const chatbotServer = express();
chatbotServer.use(cors());
chatbotServer.use(express.json());

const specialitesData = JSON.parse(fs.readFileSync("specialites.json", "utf8"));


// Fonction pour analyser le message et extraire les symptômes
function analyserSymptomes(message) {
  const mots = message.toLowerCase().split(/[\s,.;!?]+/);
  const symptomesTrouves = [];

  for (const specialite of specialitesData.specialites) {
    for (const symptome of specialite.symptomes) {
      if (
        mots.includes(symptome.toLowerCase()) ||
        message.toLowerCase().includes(symptome.toLowerCase())
      ) {
        symptomesTrouves.push({
          symptome: symptome,
          specialite: specialite.nom,
        });
      }
    }
  }
  return symptomesTrouves;
}

chatbotServer.post("/api/chat", (req, res) => {
  const { message } = req.body;
  console.log("📨 Message reçu:", message);

  let reply =
    "Je suis un assistant médical. Décrivez vos symptômes pour que je puisse vous orienter vers la bonne spécialité.";
  
  if (message.toLowerCase().includes("bonjour")) {
    reply =
      "Bonjour ! Je suis votre assistant médical. Décrivez vos symptômes et je vous dirai vers quel spécialiste vous orienter.";
  }
  else if (message.toLowerCase().includes("merci")) {
    reply =
      "Je vous en prie ! N'hésitez pas à consulter un professionnel de santé pour un diagnostic précis.";
  }
  // Recherche de symptômes
  else {
    const symptomesTrouves = analyserSymptomes(message);

    if (symptomesTrouves.length > 0) {
      const specialitesUniques = [
        ...new Set(symptomesTrouves.map((s) => s.specialite)),
      ];

      if (specialitesUniques.length === 1) {
        const specialite = specialitesData.specialites.find(
          (s) => s.nom === specialitesUniques[0]
        );
        reply = ` Basé sur vos symptômes, je vous recommande de consulter un ${specialite.nom}. \n\n${specialite.description}`;
      } else {
        reply = ` Plusieurs spécialités pourraient correspondre à vos symptômes :\n\n`;
        specialitesUniques.forEach((spec) => {
          const specialite = specialitesData.specialites.find(
            (s) => s.nom === spec
          );
          reply += `• ${specialite.nom} : ${specialite.description}\n`;
        });
        reply += `\nJe vous conseille de commencer par consulter votre médecin généraliste.`;
      }
    }
    // Si aucun symptôme trouvé mais message médical
    else if (
      message.length > 10 &&
      (message.toLowerCase().includes("mal") ||
        message.toLowerCase().includes("douleur") ||
        message.toLowerCase().includes("symptôme") ||
        message.toLowerCase().includes("j'ai") ||
        message.toLowerCase().includes("je ressens"))
    ) {
      reply =
        "Je n'ai pas pu identifier clairement vos symptômes. Pouvez-vous les décrire plus précisément ? Par exemple : 'j'ai des maux de tête et des nausées'.";
    }
  }

  console.log(" Réponse:", reply);
  res.json({ reply });
});

chatbotServer.get("/api/specialites", (req, res) => {
  res.json(specialitesData);
});

chatbotServer.listen(3000, () => {
  console.log(" Serveur backend sur http://localhost:3000");
});
