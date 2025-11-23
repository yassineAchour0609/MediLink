import { ActivatedRoute } from '@angular/router';
import { DatePipe, NgClass } from '@angular/common';
import {
  Component,
  ElementRef,
  ViewChild,
  ChangeDetectorRef,
  AfterViewInit,
  OnDestroy
} from '@angular/core';
import { MessageService, User } from '../../../message.service';
import { FormsModule } from '@angular/forms';
import { Message } from '../../../message';
import { Conversation } from '../../../conversation';

@Component({
  selector: 'app-messagerie',
  standalone: true,
  imports: [DatePipe, FormsModule, NgClass],
  templateUrl: './messagerie.component.html',
  styleUrl: './messagerie.component.css'
})
export class MessagerieComponent implements AfterViewInit, OnDestroy {
   // Récupère la référence au conteneur des messages dans le DOM (pour le scroll)
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;
  @ViewChild('fileInput') private fileInput!: ElementRef<HTMLInputElement>;

  messages: Message[] = [];
  conversations: Conversation[] = [];
  selectedConversationId: number | null = null; // ID de l’utilisateur avec qui on discute 
  newMessage: string = '';
  userId: any;
  isLoadingMessages: boolean = false;
  attachedFiles: File[] = [];

  // Recherche conversations
  conversationSearch: string = '';
  filteredConversations: Conversation[] = [];

  // Recherche utilisateurs
  showUserSearch: boolean = false;
  searchQuery: string = '';
  searchResults: User[] = [];
  isSearching: boolean = false;

  constructor(
    private messageService: MessageService,
    private activatedRoute: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.chargerConversations();
    this.userId = this.activatedRoute.parent?.snapshot.params['idp'];
    this.conversationSearch = '';
    this.filteredConversations = [];
  }

  private rechargerConversation(): void {
    if (this.selectedConversationId) {
      this.selectionnerConversation(this.selectedConversationId);
    }
    this.chargerConversations();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.cdr.detectChanges();
    });
  }

  ngOnDestroy(): void {
    this.attachedFiles.forEach(file => {
      if (this.estFichierImage(file)) {
        URL.revokeObjectURL(URL.createObjectURL(file));
      }
    });
  }

  chargerConversations(): void {
    this.messageService.getConversations().subscribe(res => {
      if (res.success) {
        this.conversations = res.conversations;
        this.filtrerConversations();
        this.cdr.detectChanges();
      }
    });
  }

  // Barre de recherche dynamique pour conversations
  filtrerConversations(): void {
    const q = this.conversationSearch.trim().toLowerCase();

    if (q.length < 2) {
      this.filteredConversations = [...this.conversations];
      return;
    }

    this.filteredConversations = this.conversations.filter(conv =>
      ((conv.nom || '') + ' ' + (conv.prenom || '')).toLowerCase().includes(q)
    );
  }

  selectionnerConversation(idAutre: number): void {
    this.selectedConversationId = idAutre;
    this.isLoadingMessages = true;

    this.messages = [];
    this.cdr.detectChanges();

    this.messageService.getConversation(idAutre).subscribe(res => {
      if (res.success) {
        this.messages = res.messages;
        this.isLoadingMessages = false;
        this.defilerVersBas();
        this.cdr.detectChanges();
      }
    });
  }

  ouvrirRechercheUtilisateurs(): void {
    this.showUserSearch = true;
    this.searchQuery = '';
    this.searchResults = [];
    this.cdr.detectChanges();
  }

  fermerRechercheUtilisateurs(): void {
    this.showUserSearch = false;
    this.searchQuery = '';
    this.searchResults = [];
    this.cdr.detectChanges();
  }

  rechercherUtilisateurs(): void {
    const q = this.searchQuery.trim();

    if (q.length < 2) {
      this.searchResults = [];
      return;
    }

    this.isSearching = true;

    this.messageService.searchUsers(q).subscribe({
      next: (res) => {
        this.isSearching = false;
        this.searchResults = res.success ? res.results : [];
        this.cdr.detectChanges();
      },
      error: () => {
        this.isSearching = false;
        this.searchResults = [];
        this.cdr.detectChanges();
      }
    });
  }

  creerConversation(user: User): void {
    this.messageService.createConversation(user.id).subscribe(res => {
      if (res.success) {
        this.chargerConversations();
        this.fermerRechercheUtilisateurs();
        setTimeout(() => {
          this.selectionnerConversation(user.id);
        }, 500);
      }
    });
  }

  envoyerMessage(): void {
    if (!this.newMessage.trim() && this.attachedFiles.length === 0) return;

    const messageAEnvoyer = this.newMessage;
    const fichiersAEnvoyer = [...this.attachedFiles];

    this.newMessage = '';
    this.attachedFiles = [];
    this.cdr.detectChanges();

    if (fichiersAEnvoyer.length > 0) {
      this.envoyerMessageAvecFichiers(messageAEnvoyer, fichiersAEnvoyer);
    } else {
      this.envoyerMessageTexte(messageAEnvoyer);
    }

    this.rechargerConversation();
  }

  private envoyerMessageTexte(messageContent: string): void {
    if (!this.selectedConversationId) return;

    const payload = {
      idDestinaire: this.selectedConversationId,
      contenu: messageContent,
      type_message: 'text'
    };

    this.messageService.sendMessage(payload).subscribe(res => {
      if (res.success) {
        this.messages = [...this.messages, res.data];
        this.defilerVersBas();
        this.cdr.detectChanges();
        this.rechargerConversation();
      }
    });
  }

  private envoyerMessageAvecFichiers(messageContent: string, files: File[]): void {
    if (!this.selectedConversationId) return;

    const uploadPromises = files.map(file => {
      return new Promise<void>((resolve) => {
        const type_message = this.estFichierImage(file) ? 'image' : 'document';
        const fakeUploadedFile = {
          url_document: URL.createObjectURL(file),
          nom_document: file.name
        };

        const payload = {
          idDestinaire: this.selectedConversationId,
          contenu: messageContent,
          type_message: type_message,
          ...fakeUploadedFile
        };

        this.messageService.sendMessage(payload).subscribe(res => {
          if (res.success) {
            this.messages = [...this.messages, res.data];
            resolve();
          }
        });
      });
    });

    Promise.all(uploadPromises).then(() => {
      this.defilerVersBas();
      this.cdr.detectChanges();
      this.rechargerConversation();
    });
  }

  surFichiersSelectionnes(event: any): void {
    const files: FileList = event.target.files;
    if (files.length > 0) {
      const newFiles: File[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        if (file.size > 10 * 1024 * 1024) {
          alert(`Le fichier ${file.name} est trop volumineux. Maximum 10MB.`);
          continue;
        }

        const allowedTypes = [
          'image/jpeg',
          'image/png',
          'image/gif',
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'text/plain'
        ];

        if (!allowedTypes.includes(file.type)) {
          alert(`Le type de fichier ${file.type} n'est pas autorisé.`);
          continue;
        }

        newFiles.push(file);
      }

      this.attachedFiles = [...this.attachedFiles, ...newFiles];
      this.cdr.detectChanges();
      this.fileInput.nativeElement.value = '';
    }
  }

  supprimerPieceJointe(file: File): void {
    this.attachedFiles = this.attachedFiles.filter(f => f !== file);
    this.cdr.detectChanges();
  }

  estFichierImage(file: File): boolean {
    return file.type.startsWith('image/');
  }

  obtenirApercuFichier(file: File): string {
    return this.estFichierImage(file) ? URL.createObjectURL(file) : '';
  }

  obtenirTailleFichier(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  telechargerPieceJointe(message: Message): void {
    if (message.url_document) {
      const link = document.createElement('a');
      link.href = message.url_document;
      link.download = message.nom_document || 'document';
      link.click();
    }
  }

  surToucheTextarea(event: any): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.envoyerMessage();
    }
  }

  private defilerVersBas(): void {
    setTimeout(() => {
      if (this.messagesContainer) {
        this.messagesContainer.nativeElement.scrollTop =
          this.messagesContainer.nativeElement.scrollHeight;
      }
    }, 100);
  }
}
