import apiClient from '../lib/apiClient';

export interface ChatMessage {
  sender: 'user' | 'assistant';
  text: string;
}

export const aiService = {
  sendMessage: async (message: string, history: ChatMessage[]): Promise<string> => {
    const response = await apiClient.post('/v1/chat', {
      message,
      history
    });
    return response.data.data.reply;
  }
};
