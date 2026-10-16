import { CommonModule, DatePipe } from '@angular/common';
import {
  AfterViewChecked,
  ChangeDetectorRef,
  Component,
  ElementRef,
  inject,
  OnInit,
  ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import DOMPurify from 'dompurify';
import { marked } from 'marked';
import {
  ChatConversationListModel,
  ChatHistoryMessageModel,
  ChatRequestModel,
} from '../../core/models/chat.model';
import { ChatService } from '../../core/services/chat.service';
import { SharedService } from '../../shared/services/shared.service';

// Screen ပေါ်မှာပြမယ့် message တစ်ခု
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string; // မူရင်းစာ (copy လုပ်ဖို့)
  html: string; // markdown -> HTML ပြောင်းပြီးသား (assistant အတွက် table, list တွေပြဖို့)
  time: Date;
  copied?: boolean;
  estimatedTokens?: number;
}

// Empty screen မှာပြမယ့် မေးခွန်းနမူနာ card
export interface QuickPrompt {
  icon: string;
  title: string;
  desc: string;
  prompt: string;
}

// စကားဝိုင်းအဆက်မပြတ်ဖြစ်အောင် browser ထဲမှာ conversationId သိမ်းမယ့် key
const CONVERSATION_KEY = 'stock_chat_conversation_id';

@Component({
  selector: 'app-chat',
  imports: [CommonModule, FormsModule, DatePipe],
  templateUrl: './chat.html',
})
export class Chat implements OnInit, AfterViewChecked {
  private readonly chatService = inject(ChatService);
  private readonly sharedService = inject(SharedService);
  private readonly cdr = inject(ChangeDetectorRef);

  @ViewChild('messagesContainer') private messagesContainer?: ElementRef<HTMLDivElement>;
  @ViewChild('messageTextarea') private messageTextarea?: ElementRef<HTMLTextAreaElement>;

  // ---------- State ----------
  message = ''; // input box ထဲက စာ
  loading = false; // AI ဖြေနေတုန်း true
  errorMessage = '';
  isSidebarOpen = false; // mobile မှာ history sidebar ဖွင့်/ပိတ်
  showScrollButton = false;

  messages: ChatMessage[] = []; // လက်ရှိ စကားဝိုင်းရဲ့ message များ
  conversations: ChatConversationListModel[] = []; // ဘေးဘားက history စာရင်း
  conversationId: string | null = null; // null = စကားဝိုင်းအသစ်

  pendingDeleteId: string | null = null; // "ဖျက်မလား?" မေးနေတဲ့ conversation
  deletingId: string | null = null; // ဖျက်နေတုန်း conversation

  searchQuery = ''; // history search query
  readonly maxContextTokens = 4000; // Backend Token-Based Sliding Window budget
  showContextInfoModal = false; // Context window detail popup

  lastPromptTokens: number | null = null;
  lastCompletionTokens: number | null = null;
  lastTotalTokens: number | null = null;

  private shouldScrollToBottom = false;

  readonly userName = this.sharedService.getUserName() || 'User';

  readonly quickPrompts: QuickPrompt[] = [
    {
      icon: 'pi pi-chart-pie',
      title: 'Inventory Summary',
      desc: 'ဂိုဒေါင်တစ်ခုလုံးရဲ့ စတော့အခြေအနေ အကျဉ်းချုပ်',
      prompt: 'Inventory အခြေအနေ အကျဉ်းချုပ် ပြပေးပါ',
    },
    {
      icon: 'pi pi-exclamation-triangle',
      title: 'Low Stock Products',
      desc: 'စတော့နည်းနေ / ကုန်နေတဲ့ ပစ္စည်းများ',
      prompt: 'လက်ကျန်စတော့ ၁၀ ခုအောက် ပစ္စည်းတွေ ပြပေးပါ',
    },
    {
      icon: 'pi pi-arrow-right-arrow-left',
      title: 'Recent Movements',
      desc: 'မကြာသေးခင်က Stock IN / OUT မှတ်တမ်းများ',
      prompt: 'နောက်ဆုံး stock အဝင်အထွက် မှတ်တမ်း ၁၀ ခု ပြပေးပါ',
    },
    {
      icon: 'pi pi-bell',
      title: 'Active Alerts',
      desc: 'မဖြေရှင်းရသေးတဲ့ စတော့ သတိပေးချက်များ',
      prompt: 'ဖြေရှင်းရန်ကျန်နေသော stock alert များ ပြပေးပါ',
    },
  ];

  // =====================================================
  // LIFECYCLE
  // =====================================================
  ngOnInit(): void {
    this.loadConversations();

    // Page ပြန်ဖွင့်ရင် နောက်ဆုံးပြောနေတဲ့ စကားဝိုင်းကို ပြန်ဖွင့်ပေး
    const savedId = localStorage.getItem(CONVERSATION_KEY);
    if (savedId) {
      this.openConversation(savedId);
    }
  }

  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  // =====================================================
  // TOKEN ESTIMATION & CONVERSATION HELPERS
  // =====================================================
  estimateTokens(text: string): number {
    if (!text) return 0;
    let ascii = 0;
    let nonAscii = 0;
    for (let i = 0; i < text.length; i++) {
      if (text.charCodeAt(i) <= 127) ascii++;
      else nonAscii++;
    }
    // English/ASCII averages ~3.5 chars per token; Burmese/Unicode averages ~1.2 tokens per character
    return Math.max(1, Math.ceil(ascii / 3.5) + Math.ceil(nonAscii * 1.2));
  }

  get totalHistoryTokens(): number {
    return this.messages.reduce(
      (sum, m) => sum + (m.estimatedTokens || this.estimateTokens(m.content) + 4),
      0,
    );
  }

  get activeContextTokens(): number {
    let sum = 0;
    const safetyReserve = 600;
    const effectiveBudget = Math.max(500, this.maxContextTokens - safetyReserve);
    for (let i = this.messages.length - 1; i >= 0; i--) {
      const t = this.messages[i].estimatedTokens || this.estimateTokens(this.messages[i].content) + 4;
      if (sum + t > effectiveBudget && sum > 0) break;
      sum += t;
    }
    return sum;
  }

  get slidingBoundaryIndex(): number {
    let sum = 0;
    const safetyReserve = 600;
    const effectiveBudget = Math.max(500, this.maxContextTokens - safetyReserve);
    for (let i = this.messages.length - 1; i >= 0; i--) {
      const t = this.messages[i].estimatedTokens || this.estimateTokens(this.messages[i].content) + 4;
      if (sum + t > effectiveBudget && sum > 0) return i + 1;
      sum += t;
    }
    return 0;
  }

  get isTokenSliding(): boolean {
    return this.totalHistoryTokens > this.maxContextTokens;
  }

  get archivedTokens(): number {
    return Math.max(0, this.totalHistoryTokens - this.activeContextTokens);
  }

  get activeMessagesCount(): number {
    return this.messages.length - this.slidingBoundaryIndex;
  }

  get currentTitle(): string {
    const current = this.conversations.find((c) => c.id === this.conversationId);
    return current?.title || 'New Conversation';
  }

  get filteredConversations(): ChatConversationListModel[] {
    if (!this.searchQuery.trim()) {
      return this.conversations;
    }
    const q = this.searchQuery.toLowerCase().trim();
    return this.conversations.filter((c) =>
      (c.title || 'New Conversation').toLowerCase().includes(q),
    );
  }

  toggleContextInfo(): void {
    this.showContextInfoModal = !this.showContextInfoModal;
    this.refresh();
  }

  loadConversations(): void {
    this.chatService.getConversations().subscribe({
      next: (response) => {
        this.conversations = response?.data ?? [];
        this.refresh();
      },
      error: () => {
        this.conversations = [];
        this.refresh();
      },
    });
  }

  // History ထဲက စကားဝိုင်းတစ်ခုကို နှိပ်ဖွင့်
  openConversation(id: string): void {
    if (this.pendingDeleteId === id || this.deletingId === id) return;

    this.conversationId = id;
    this.messages = [];
    this.errorMessage = '';
    this.loading = true;
    this.isSidebarOpen = false;
    localStorage.setItem(CONVERSATION_KEY, id);

    this.chatService.getConversation(id).subscribe({
      next: (response) => {
        // Backend က data ထဲထည့်ပေးတာ ရော၊ တိုက်ရိုက်ပေးတာရော လက်ခံအောင်
        const data = (response as any)?.data ?? response;

        this.messages = (data.messages ?? []).map((m: ChatHistoryMessageModel) =>
          this.toChatMessage(m.role, m.content, new Date(m.createdAt), m.estimatedTokens),
        );
        this.loading = false;
        this.shouldScrollToBottom = true;
        this.refresh();
      },
      error: () => {
        // ရှာမတွေ့ရင် (ဖျက်ပြီးသား) စကားဝိုင်းအသစ်ကို ပြန်စ
        this.startNewChat();
        this.errorMessage = 'ဒီ conversation ကို ရှာမတွေ့ပါ။ အသစ်ပြန်စပါ။';
        this.refresh();
      },
    });
  }

  startNewChat(): void {
    this.conversationId = null;
    this.messages = [];
    this.message = '';
    this.errorMessage = '';
    this.loading = false;
    this.isSidebarOpen = false;
    this.lastPromptTokens = null;
    this.lastCompletionTokens = null;
    this.lastTotalTokens = null;
    localStorage.removeItem(CONVERSATION_KEY);
    this.resetTextareaHeight();
    this.refresh();
  }

  // =====================================================
  // SEND MESSAGE
  // =====================================================
  sendMessage(): void {
    const text = this.message.trim();
    if (!text || this.loading) return;

    // 1) ကိုယ့်မေးခွန်းကို screen ပေါ် ချက်ချင်းပြ
    this.messages.push(this.toChatMessage('user', text, new Date()));
    this.message = '';
    this.errorMessage = '';
    this.loading = true;
    this.shouldScrollToBottom = true;
    this.resetTextareaHeight();

    // 2) Backend ကို ပို့
    const request: ChatRequestModel = {
      conversationId: this.conversationId,
      message: text,
    };

    this.chatService.sendMessage(request).subscribe({
      next: (response) => {
        const data = (response as any)?.data ?? response;

        // စကားဝိုင်းအသစ်ဆိုရင် backend က ID အသစ်ပြန်ပေးတယ် -> မှတ်ထား
        this.conversationId = data.conversationId ?? this.conversationId;
        if (this.conversationId) {
          localStorage.setItem(CONVERSATION_KEY, this.conversationId);
        }

        // Token metrics မှတ်သားခြင်း
        this.lastPromptTokens = data.promptTokens ?? null;
        this.lastCompletionTokens = data.completionTokens ?? null;
        this.lastTotalTokens = data.totalTokens ?? null;

        // 3) AI အဖြေကို screen ပေါ်ပြ
        this.messages.push(
          this.toChatMessage('assistant', data.message ?? '', new Date(), data.completionTokens),
        );
        this.loading = false;
        this.shouldScrollToBottom = true;
        this.loadConversations(); // history စာရင်း update
        this.refresh();
      },
      error: () => {
        this.errorMessage = 'AI ဆီက အဖြေမရပါ။ Server (API / MCP Server) ပွင့်နေလား စစ်ပြီး ထပ်စမ်းပါ။';
        this.loading = false;
        this.refresh();
      },
    });
  }

  // Quick prompt card နှိပ်ရင် ချက်ချင်းမေး
  askPrompt(prompt: string): void {
    this.message = prompt;
    this.sendMessage();
  }

  // =====================================================
  // DELETE CONVERSATION (နှစ်ဆင့်: Trash -> အတည်ပြု)
  // =====================================================
  askDelete(id: string, event: Event): void {
    event.stopPropagation();
    this.pendingDeleteId = id;
  }

  cancelDelete(event: Event): void {
    event.stopPropagation();
    this.pendingDeleteId = null;
  }

  confirmDelete(id: string, event: Event): void {
    event.stopPropagation();
    this.pendingDeleteId = null;
    this.deletingId = id;

    this.chatService.deleteConversation(id).subscribe({
      next: () => {
        this.conversations = this.conversations.filter((c) => c.id !== id);
        if (this.conversationId === id) {
          this.startNewChat();
        }
        this.deletingId = null;
        this.refresh();
      },
      error: () => {
        this.deletingId = null;
        this.errorMessage = 'Conversation ဖျက်လို့မရပါ။';
        this.refresh();
      },
    });
  }

  // =====================================================
  // UI HELPERS
  // =====================================================
  // Enter = ပို့၊ Shift+Enter = စာကြောင်းအသစ်
  onEnter(event: Event): void {
    const keyEvent = event as KeyboardEvent;
    if (keyEvent.key === 'Enter' && !keyEvent.shiftKey) {
      keyEvent.preventDefault();
      this.sendMessage();
    }
  }

  // Textarea ကို စာရိုက်သလောက် အမြင့်ချဲ့ (အများဆုံး 180px)
  adjustTextareaHeight(): void {
    const el = this.messageTextarea?.nativeElement;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 180)}px`;
  }

  private resetTextareaHeight(): void {
    const el = this.messageTextarea?.nativeElement;
    if (el) el.style.height = 'auto';
  }

  async copyMessage(msg: ChatMessage): Promise<void> {
    await navigator.clipboard.writeText(msg.content);
    msg.copied = true;
    this.refresh();
    setTimeout(() => {
      msg.copied = false;
      this.refresh();
    }, 2000);
  }

  onScroll(): void {
    const el = this.messagesContainer?.nativeElement;
    if (!el) return;
    this.showScrollButton = el.scrollHeight - el.scrollTop - el.clientHeight > 160;
  }

  scrollToBottom(): void {
    const el = this.messagesContainer?.nativeElement;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    this.showScrollButton = false;
  }

  getInitials(name: string): string {
    return name.trim().slice(0, 2).toUpperCase();
  }

  // Message object တည်ဆောက်ပေးတဲ့ function (markdown -> HTML ပြောင်းပြီး DOMPurify ဖြင့် sanitize လုပ်ပါ)
  private toChatMessage(role: 'user' | 'assistant', content: string, time: Date, tokens?: number): ChatMessage {
    const rawHtml = marked.parse(content, { gfm: true, breaks: true }) as string;
    const cleanHtml = DOMPurify.sanitize(rawHtml);
    return {
      role,
      content,
      html: cleanHtml,
      time,
      estimatedTokens: tokens ?? (this.estimateTokens(content) + 4),
    };
  }

  // App က zoneless ဖြစ်လို့ API ပြန်လာတဲ့အခါ screen ကို ကိုယ်တိုင် update လုပ်ပေးရတယ်
  private refresh(): void {
    this.cdr.detectChanges();
  }
}
