import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ChatConversationListModel,
  ChatHistoryResponseModel,
  ChatRequestModel,
  ChatResponseModel,
} from '../models/chat.model';
import { RootModel } from '../models/master/root.model';

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.main_url}/chat`;

  // GET /api/chat -> စကားဝိုင်းစာရင်း (ResponseHelper သုံးထားလို့ data ထဲမှာပါလာမယ်)
  getConversations(): Observable<RootModel> {
    return this.http.get<RootModel>(this.apiUrl);
  }

  // GET /api/chat/{id} -> စကားဝိုင်းတစ်ခုရဲ့ message အားလုံး
  getConversation(conversationId: string): Observable<ChatHistoryResponseModel> {
    return this.http.get<ChatHistoryResponseModel>(`${this.apiUrl}/${conversationId}`);
  }

  // POST /api/chat -> AI ကို မေးခွန်းပို့
  sendMessage(model: ChatRequestModel): Observable<ChatResponseModel> {
    return this.http.post<ChatResponseModel>(this.apiUrl, model);
  }

  // DELETE /api/chat/{id}
  deleteConversation(conversationId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${conversationId}`);
  }
}
