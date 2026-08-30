import apiClient from '../../../lib/apiClient';

export interface ChatMessage {
  sender: 'user' | 'assistant';
  text: string;
}

export interface ChatReply {
  reply: string;
  /**
   * The lookups the backend actually ran to produce this answer. Surfaced in
   * the UI so a figure can be traced to its source rather than taken on
   * trust — the assistant's answers are only as credible as the data behind
   * them, and this is the cheapest way to show that data exists.
   */
  usedTools: string[];
}

/** Backend tool names are internal identifiers; these are what a user should see. */
const TOOL_LABELS: Record<string, string> = {
  queryCosts: 'your cost data',
  getForecast: 'month-end forecast',
  getRecentAlerts: 'anomaly alerts',
  getAccountStatus: 'account status',
};

export const describeTools = (tools: string[]): string | null => {
  const labels = tools.map((t) => TOOL_LABELS[t] ?? t);
  return labels.length ? `Checked ${labels.join(', ')}` : null;
};

export class ChatError extends Error {
  constructor(message: string, public readonly kind: 'quota' | 'network') {
    super(message);
    this.name = 'ChatError';
  }
}

export const aiService = {
  sendMessage: async (message: string, history: ChatMessage[]): Promise<ChatReply> => {
    try {
      const response = await apiClient.post('/v1/chat', { message, history });
      return {
        reply: response.data.data.reply,
        usedTools: response.data.data.usedTools ?? [],
      };
    } catch (error: unknown) {
      // A daily-limit rejection is a normal, explainable outcome — showing it
      // as a generic connection failure would tell the user to retry
      // something that cannot succeed until tomorrow.
      const status = (error as { response?: { status?: number; data?: { error?: string } } })?.response?.status;
      if (status === 429) {
        const detail = (error as { response?: { data?: { error?: string } } })?.response?.data?.error;
        throw new ChatError(detail ?? 'You have reached your question limit for today.', 'quota');
      }
      throw new ChatError('I am having trouble connecting to the server. Please try again in a moment.', 'network');
    }
  },
};
