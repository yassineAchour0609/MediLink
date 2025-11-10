import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Botservice } from './botservice';
import { FormsModule } from '@angular/forms';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-chat-bot',
  imports: [FormsModule,NgClass],
  templateUrl: './chat-bot.html',
  styleUrl: './chat-bot.css'
})
export class ChatBot implements OnInit {
  id: number | null = null;
  message = '';
  messages: { from: string, text: string }[] = [];
  constructor(private route: ActivatedRoute, private botService: Botservice) {}
  ngOnInit(): void {
    this.id = this.route.parent?.snapshot.params['idp'];
  }
  // Envoie le message de l'utilisateur au chatbot
  envoyer() {
    // Ne rien faire si le message est vide
    if (!this.message.trim()) return;

    // Ajoute le message de l'utilisateur à l'historique
    this.messages.push({ from: 'user', text: this.message });

    // Appelle le service pour envoyer le message au backend
    this.botService.envoyerMessage(this.message).subscribe({
      next: (res) => {
        // Ajoute la réponse du bot à l'historique
        this.messages.push({ from: 'bot', text: res.reply });
      },
      error: (err) => {
        console.error('Erreur chatbot:', err);
        // Affiche un message d'erreur côté utilisateur
        this.messages.push({ from: 'bot', text: 'Erreur serveur 😢' });
      }
    });

    // Réinitialise le champ de saisie
    this.message = '';
  }
}
