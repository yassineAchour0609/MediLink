import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Message } from './message';
import { Conversation } from './conversation';



export interface User {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  specialite?: string;
}

@Injectable({
  providedIn: 'root'
})
export class MessageService {
private messagesUrl = 'http://localhost:3001/api/messages';
  private usersUrl    = 'http://localhost:3001/api/utilisateur';

  constructor(private http: HttpClient) { }

  sendMessage(payload: any): Observable<{success: boolean, message: string, data: Message}> {
    return this.http.post<{success: boolean, message: string, data: Message}>(`${this.messagesUrl}/`, payload);
  }

  getConversation(idAutre: number): Observable<{success: boolean, messages: Message[]}> {
    return this.http.get<{success: boolean, messages: Message[]}>(`${this.messagesUrl}/conversation/${idAutre}`);
  }

  getConversations(): Observable<{success: boolean, conversations: Conversation[]}> {
    return this.http.get<{success: boolean, conversations: Conversation[]}>(`${this.messagesUrl}/list/all`);
  }

  markAsRead(idMessage: number): Observable<{success: boolean, message: string}> {
    return this.http.put<{success: boolean, message: string}>(`${this.messagesUrl}/${idMessage}/read`, {});
  }

  deleteMessage(idMessage: number): Observable<{success: boolean, message: string}> {
    return this.http.delete<{success: boolean, message: string}>(`${this.messagesUrl}/${idMessage}`);
  }

  getUsers(): Observable<{success: boolean, utilisateurs: User[]}> {
    return this.http.get<{success: boolean, utilisateurs: User[]}>(`${this.usersUrl}`);
  }

  searchUsers(user: string): Observable<{success: boolean, results: User[]}> {
    return this.http.get<{success: boolean, results: User[]}>(`${this.usersUrl}/search?q=${encodeURIComponent(user)}`);
  }

  createConversation(userId: number): Observable<{success: boolean, message: string, conversationId: number}> {
    return this.http.post<{success: boolean, message: string, conversationId: number}>(
      'http://localhost:3001/api/messages/conversations',
      { idDestinaire: userId }
    );
  }

  deleteConversation(conversationId: number): Observable<{success: boolean, message: string}> {
    return this.http.delete<{success: boolean, message: string}>(
      `http://localhost:3001/api/messages/conversation/${conversationId}`
    );
  }
}
