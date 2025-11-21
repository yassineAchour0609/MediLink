import { Component, OnInit, AfterViewChecked, ViewChild, ElementRef } from '@angular/core';
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
export class ChatBot implements OnInit, AfterViewChecked {
  @ViewChild('chatBox', { static: false }) chatBox!: ElementRef;
  
  id: number | null = null;
  message = '';
  messages: { from: string, text: string, time: string }[] = [];
  private shouldScroll = false;
  
  constructor(private route: ActivatedRoute, private botService: Botservice) {}
  
  ngOnInit(): void {
    this.id = this.route.parent?.snapshot.params['idp'];
  }

  ngAfterViewChecked(): void {
    if (this.shouldScroll) {
      this.scrollToBottom();
      this.shouldScroll = false;
    }
  }

  getCurrentTime(): string {
    const now = new Date();
    return now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }

  scrollToBottom(): void {
    try {
      if (this.chatBox) {
        setTimeout(() => {
          const element = this.chatBox.nativeElement;
          element.scrollTo({
            top: element.scrollHeight,
            behavior: 'smooth'
          });
        }, 100);
      }
    } catch (err) {
      console.error('Error scrolling to bottom:', err);
    }
  }
  
  // Envoie le message de l'utilisateur au chatbot
  envoyer() {
    // Ne rien faire si le message est vide
    if (!this.message.trim()) return;

    const currentTime = this.getCurrentTime();

    // Ajoute le message de l'utilisateur à l'historique
    this.messages.push({ from: 'user', text: this.message, time: currentTime });
    this.shouldScroll = true;

    // Appelle le service pour envoyer le message au backend
    this.botService.envoyerMessage(this.message).subscribe({
      next: (res) => {
        // Ajoute la réponse du bot à l'historique
        this.messages.push({ from: 'bot', text: res.reply, time: this.getCurrentTime() });
        this.shouldScroll = true;
      },
      error: (err) => {
        console.error('Erreur chatbot:', err);
        // Affiche un message d'erreur côté utilisateur
        this.messages.push({ from: 'bot', text: 'Erreur serveur 😢', time: this.getCurrentTime() });
        this.shouldScroll = true;
      }
    });

    // Réinitialise le champ de saisie
    this.message = '';
  }
}
