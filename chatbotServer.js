const express = require("express");
const cors = require("cors");
const fs = require("fs");

const chatbotServer = express();
chatbotServer.use(cors());
chatbotServer.use(express.json());

const specialitesData = JSON.parse(fs.readFileSync("specialites.json", "utf8"));

// Normaliser le texte (minuscules, supprimer accents)
function normaliserTexte(text) {
  return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
}

// Distance de Levenshtein pour calculer la similarité
function levenshteinDistance(str1, str2) {
  const s1 = normaliserTexte(str1);
  const s2 = normaliserTexte(str2);
  const matrix = [];
  
  for (let i = 0; i <= s2.length; i++) matrix[i] = [i];
  for (let j = 0; j <= s1.length; j++) matrix[0][j] = j;
  
  for (let i = 1; i <= s2.length; i++) {
    for (let j = 1; j <= s1.length; j++) {
      if (s2[i - 1] === s1[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[s2.length][s1.length];
}

// Mots non médicaux à ignorer
const motsNonMedicaux = new Set([
  "aaa", "bbb", "ccc", "ddd", "eee", "fff", "ggg", "hhh", "iii", "jjj",
  "kkk", "lll", "mmm", "nnn", "ooo", "ppp", "qqq", "rrr", "sss", "ttt",
  "uuu", "vvv", "www", "xxx", "yyy", "zzz",
  "cristano", "cristiano", "ronaldo", "messi", "neymar", "mbappe",
  "maria", "jean", "pierre", "paul", "jacques", "michel", "thomas",
  "test", "teste", "testing", "chose", "truc", "machin", "bidule"
]);

// Vérifier si un mot est médicalement pertinent
function estMotMedical(mot, messageOriginal = "") {
  const motNorm = normaliserTexte(mot);
  
  if (motNorm.length < 3) return false;
  if (motsNonMedicaux.has(motNorm)) return false;
  if (/^(.)\1+$/.test(motNorm)) return false; // Répétitions (aaa, bbb)
  
  // Ignorer les noms propres (mots commençant par majuscule et longs)
  if (mot.length >= 6 && /^[A-Z]/.test(mot)) {
    const nomsPropres = ["cristiano", "cristano", "ronaldo", "messi", "neymar"];
    if (nomsPropres.includes(motNorm)) return false;
    
    // Vérifier si c'est un symptôme connu
    for (const specialite of specialitesData.specialites) {
      for (const symptome of specialite.symptomes) {
        if (normaliserTexte(symptome).includes(motNorm) || motNorm.includes(normaliserTexte(symptome))) {
          return true;
        }
      }
    }
    return false;
  }
  
  return true;
}

// Calculer le score de confiance entre deux mots
function calculerConfiance(mot1, mot2) {
  const norm1 = normaliserTexte(mot1);
  const norm2 = normaliserTexte(mot2);
  
  if (norm1 === norm2) return 1.0;
  
  if (norm1.includes(norm2) || norm2.includes(norm1)) {
    const minLength = Math.min(norm1.length, norm2.length);
    const maxLength = Math.max(norm1.length, norm2.length);
    if (maxLength <= minLength * 1.5) return 0.9;
  }
  
  const distance = levenshteinDistance(norm1, norm2);
  const maxLength = Math.max(norm1.length, norm2.length);
  return 1 - distance / maxLength;
}

// Analyser le message et extraire les symptômes
function analyserSymptomes(message) {
  const messageNormalise = normaliserTexte(message);
  const mots = messageNormalise.split(/[\s,.;!?]+/)
    .filter(m => estMotMedical(m, message) && m.length >= 3);
  
  if (mots.length === 0) return [];
  
  // Vérifier qu'au moins un mot ressemble à un symptôme (80% confiance)
  let aUnMotMedicalValide = false;
  for (const mot of mots) {
    for (const specialite of specialitesData.specialites) {
      for (const symptome of specialite.symptomes) {
        const motsSymptome = normaliserTexte(symptome).split(/[\s,.;!?]+/);
        for (const motSymptome of motsSymptome) {
          if (motSymptome.length >= 4 && mot.length >= 4) {
            if (calculerConfiance(mot, motSymptome) >= 0.8) {
              aUnMotMedicalValide = true;
              break;
            }
          }
        }
        if (aUnMotMedicalValide) break;
      }
      if (aUnMotMedicalValide) break;
    }
    if (aUnMotMedicalValide) break;
  }
  
  if (!aUnMotMedicalValide) return [];
  
  // Chercher les symptômes correspondants
  const symptomesTrouves = [];
  const scoresConfiance = new Map();
  
  for (const specialite of specialitesData.specialites) {
    for (const symptome of specialite.symptomes) {
      const symptomeNormalise = normaliserTexte(symptome);
      if (symptomeNormalise.length < 4) continue;
      
      let meilleurScore = 0;
      let trouve = false;
      
      // Vérification exacte
      if (messageNormalise.includes(symptomeNormalise)) {
        trouve = true;
        meilleurScore = 1.0;
      } else {
        // Vérification par mots
        const motsSymptome = symptomeNormalise.split(/[\s,.;!?]+/).filter(m => m.length >= 3);
        for (const mot of mots) {
          if (mot.length < 3) continue;
          for (const motSymptome of motsSymptome) {
            if (motSymptome.length < 3) continue;
            
            const score = calculerConfiance(mot, motSymptome);
            const minConfiance = motSymptome.length <= 5 ? 0.80 : 0.85;
            
            if (motSymptome.length <= 4 && mot.length <= 4 && score < 0.9) continue;
            
            if (score >= minConfiance) {
              trouve = true;
              meilleurScore = Math.max(meilleurScore, score);
            }
          }
        }
      }
      
      if (trouve && meilleurScore >= 0.80) {
        const cle = `${specialite.nom}-${symptome}`;
        if (!scoresConfiance.has(cle) || scoresConfiance.get(cle) < meilleurScore) {
          scoresConfiance.set(cle, meilleurScore);
          const index = symptomesTrouves.findIndex(s => s.symptome === symptome && s.specialite === specialite.nom);
          if (index === -1) {
            symptomesTrouves.push({ symptome, specialite: specialite.nom, confiance: meilleurScore });
          } else {
            symptomesTrouves[index].confiance = meilleurScore;
          }
        }
      }
    }
  }
  
  return symptomesTrouves.filter(s => s.confiance >= 0.80);
}

// Vérifier si le message contient un mot-clé
function contientMotCle(message, motsCles) {
  const messageNorm = normaliserTexte(message);
  for (const motCle of motsCles) {
    if (messageNorm.includes(normaliserTexte(motCle))) return true;
  }
  return false;
}

// Route POST /api/chat
chatbotServer.post("/api/chat", (req, res) => {
  const { message } = req.body;
  console.log("📨 Message reçu:", message);
  
  let reply = "Je suis un assistant médical. Décrivez vos symptômes pour que je puisse vous orienter vers la bonne spécialité.";
  
  if (contientMotCle(message, ["bonjour", "salut", "bonsoir", "hello", "hi"])) {
    reply = "Bonjour ! Je suis votre assistant médical. Décrivez vos symptômes et je vous dirai vers quel spécialiste vous orienter.";
  } else if (contientMotCle(message, ["merci", "merci beaucoup", "thanks", "thank you"])) {
    reply = "Je vous en prie ! N'hésitez pas à consulter un professionnel de santé pour un diagnostic précis.";
  } else {
    const messageNormalise = normaliserTexte(message);
    const mots = messageNormalise.split(/[\s,.;!?]+/).filter(m => estMotMedical(m, message) && m.length >= 3);
    
    if (message.length < 5 || mots.length === 0) {
      reply = "Je suis un assistant médical. Pourriez-vous décrire vos symptômes de manière plus précise ? Par exemple : 'j'ai des maux de tête' ou 'je ressens des douleurs à la poitrine'.";
    } else {
      const symptomesTrouves = analyserSymptomes(message);
      
      if (symptomesTrouves.length > 0 && symptomesTrouves.some(s => s.confiance >= 0.80)) {
        symptomesTrouves.sort((a, b) => (b.confiance || 0) - (a.confiance || 0));
        const specialitesUniques = [...new Set(symptomesTrouves.map(s => s.specialite))];
        
        if (specialitesUniques.length === 1) {
          const specialite = specialitesData.specialites.find(s => s.nom === specialitesUniques[0]);
          reply = `Basé sur vos symptômes, je vous recommande de consulter un ${specialite.nom}.\n\n${specialite.description}`;
        } else {
          reply = `Plusieurs spécialités pourraient correspondre à vos symptômes :\n\n`;
          specialitesUniques.forEach(spec => {
            const specialite = specialitesData.specialites.find(s => s.nom === spec);
            reply += `• ${specialite.nom} : ${specialite.description}\n`;
          });
          reply += `\nJe vous conseille de commencer par consulter votre médecin généraliste.`;
        }
      } else if (message.length > 10 && contientMotCle(message, ["mal", "douleur", "symptome", "symptôme", "j'ai", "je ressens", "souffre", "souffrir"])) {
        reply = "Je n'ai pas pu identifier clairement vos symptômes. Pouvez-vous les décrire plus précisément ? Par exemple : 'j'ai des maux de tête et des nausées'.";
      } else {
        reply = "Je suis un assistant médical spécialisé dans l'orientation vers les spécialistes. Pourriez-vous me décrire vos symptômes de manière plus précise ? Par exemple : 'j'ai des maux de tête', 'je ressens des douleurs à la poitrine', ou 'j'ai des nausées'.";
      }
    }
  }
  
  console.log("✅ Réponse:", reply);
  res.json({ reply });
});

// Route GET /api/specialites
chatbotServer.get("/api/specialites", (req, res) => {
  res.json(specialitesData);
});

// Démarrer le serveur
chatbotServer.listen(3000, () => {
  console.log("✅ Serveur backend sur http://localhost:3000");
});
