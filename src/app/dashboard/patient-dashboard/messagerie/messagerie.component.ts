import { ActivatedRoute } from '@angular/router';
import { DatePipe, NgClass } from '@angular/common';
import { Component, ElementRef, ViewChild, ChangeDetectorRef, AfterViewInit, OnDestroy } from '@angular/core';
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
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;
  @ViewChild('fileInput') private fileInput!: ElementRef<HTMLInputElement>;

  messages: Message[] = [];
  conversations: Conversation[] = [];
  selectedConversationId: number | null = null;
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
  ) { }

  ngOnInit(): void {
    this.loadConversations();
    this.userId = this.activatedRoute.parent?.snapshot.params['idp'];
    this.conversationSearch = '';
    this.filteredConversations = [];
  }

  private reloadConversation(): void {
    if (this.selectedConversationId) {
      this.selectConversation(this.selectedConversationId);
    }
    this.loadConversations();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.cdr.detectChanges();
    });
  }

  ngOnDestroy(): void {
    this.attachedFiles.forEach(file => {
      if (this.isImageFile(file)) {
        URL.revokeObjectURL(URL.createObjectURL(file));
      }
    });
  }

  loadConversations(): void {
    this.messageService.getConversations().subscribe(res => {
      if (res.success) {
        this.conversations = res.conversations;
        this.filterConversations();
        this.cdr.detectChanges();
      }
    });
  }

  // Barre de recherche dynamique pour conversations
  filterConversations(): void {
    const q = this.conversationSearch.trim().toLowerCase();
    if (q.length < 2) {
      this.filteredConversations = [...this.conversations];
      return;
    }
    this.filteredConversations = this.conversations.filter(conv =>
      ((conv.nom || '') + ' ' + (conv.prenom || '')).toLowerCase().includes(q)
      
    );
  }

  selectConversation(idAutre: number): void {
    this.selectedConversationId = idAutre;
    this.isLoadingMessages = true;

    this.messages = [];
    this.cdr.detectChanges();

    this.messageService.getConversation(idAutre).subscribe(res => {
      if (res.success) {
        this.messages = res.messages;
        this.isLoadingMessages = false;
        this.scrollToBottom();
        this.cdr.detectChanges();
      }
    });
  }

  openUserSearch(): void {
    this.showUserSearch = true;
    this.searchQuery = '';
    this.searchResults = [];
    this.cdr.detectChanges();
  }

  closeUserSearch(): void {
    this.showUserSearch = false;
    this.searchQuery = '';
    this.searchResults = [];
    this.cdr.detectChanges();
  }

  // lazem tetsale7
  searchUsers(): void {
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

  createConversation(user: User): void {
    this.messageService.createConversation(user.id).subscribe(res => {
      if (res.success) {
        this.loadConversations();
        this.closeUserSearch();
        setTimeout(() => {
          this.selectConversation(user.id);
        }, 500);
      }
    });
  }


  sendMessage(): void {
    if (!this.newMessage.trim() && this.attachedFiles.length === 0) return;
    const messageToSend = this.newMessage;
    const filesToSend = [...this.attachedFiles];
    this.newMessage = '';
    this.attachedFiles = [];
    this.cdr.detectChanges();
    if (filesToSend.length > 0) {
      this.uploadFilesAndSendMessage(messageToSend, filesToSend);
    } else {
      this.sendTextMessage(messageToSend);
    }
    this.reloadConversation();
  }

  private sendTextMessage(messageContent: string): void {
    if (!this.selectedConversationId) return;
    const payload = {
      idDestinaire: this.selectedConversationId,
      contenu: messageContent,
      type_message: 'text'
    };
    this.messageService.sendMessage(payload).subscribe(res => {
      if (res.success) {
        this.messages = [...this.messages, res.data];
        this.scrollToBottom();
        this.cdr.detectChanges();
        this.reloadConversation();
      }
    });
  }

  private uploadFilesAndSendMessage(messageContent: string, files: File[]): void {
    if (!this.selectedConversationId) return;
    const uploadPromises = files.map(file => {
      return new Promise<void>((resolve) => {
        const type_message = this.isImageFile(file) ? 'image' : 'document';
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
      this.scrollToBottom();
      this.cdr.detectChanges();
      this.reloadConversation();
    });
  }

  onFileSelected(event: any): void {
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
          'image/jpeg', 'image/png', 'image/gif', 'application/pdf',
          'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
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

  removeAttachment(file: File): void {
    this.attachedFiles = this.attachedFiles.filter(f => f !== file);
    this.cdr.detectChanges();
  }

  clearAllAttachments(): void {
    this.attachedFiles = [];
    this.cdr.detectChanges();
  }

  isImageFile(file: File): boolean {
    return file.type.startsWith('image/');
  }

  getFilePreview(file: File): string {
    return this.isImageFile(file) ? URL.createObjectURL(file) : '';
  }

  getFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  downloadAttachment(message: Message): void {
    if (message.url_document) {
      const link = document.createElement('a');
      link.href = message.url_document;
      link.download = message.nom_document || 'document';
      link.click();
    }
  }



  onTextareaKeydown(event: any): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  toggleEmojiPicker(): void {
    const emoji = '😊';
    this.newMessage += emoji;
    this.cdr.detectChanges();
  }

  getInitials(nom?: string, prenom?: string): string {
    return ((prenom?.[0] || '') + (nom?.[0] || '')).toUpperCase();
  }




  markAsRead(message: Message): void {
    if (!message.lu) {
      this.messageService.markAsRead(message.idMessage!).subscribe(res => {
        if (res.success) {
          message.lu = true;
          this.cdr.detectChanges();
        }
      });
    }
  }
  private scrollToBottom(): void {
    setTimeout(() => {
      if (this.messagesContainer) {
        this.messagesContainer.nativeElement.scrollTop =
          this.messagesContainer.nativeElement.scrollHeight;
      }
    }, 100);
  }
}
