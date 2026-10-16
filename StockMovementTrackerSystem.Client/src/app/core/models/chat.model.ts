// Backend ChatRequestModel နဲ့ ကိုက်ညီတဲ့ request
export interface ChatRequestModel {
  conversationId: string | null; // null = စကားဝိုင်းအသစ်
  message: string;
}

// Backend ChatResponseModel နဲ့ ကိုက်ညီတဲ့ AI အဖြေ
export interface ChatResponseModel {
  conversationId: string;
  message: string;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  contextTokens?: number;
  maxContextTokens?: number;
}

// စကားဝိုင်းထဲက စာတစ်ကြောင်းချင်းစီ
export interface ChatHistoryMessageModel {
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
  estimatedTokens?: number;
}

// စကားဝိုင်းတစ်ခုရဲ့ အသေးစိတ် (message အားလုံးပါ)
export interface ChatHistoryResponseModel {
  conversationId: string;
  title: string;
  messages: ChatHistoryMessageModel[];
  totalEstimatedTokens?: number;
  contextTokens?: number;
  maxContextTokens?: number;
}

// ဘေးဘားက စကားဝိုင်းစာရင်းအတွက်
export interface ChatConversationListModel {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}
