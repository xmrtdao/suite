/**
 * WorkspaceChatService — conversation persistence via relay API
 *
 * Stores and retrieves messages keyed by workspace user (via auth token).
 * Messages persist across sessions and are auto-loaded when the user returns.
 */

import { workspaceAuthHeaders, getWorkspaceToken } from '@/contexts/WorkspaceAuthContext';

const API_BASE = '';

export interface WorkspaceMessage {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: string;  // ISO string from server
  metadata?: Record<string, any>;
}

export class WorkspaceChatService {
  private static instance: WorkspaceChatService;
  private cache: WorkspaceMessage[] | null = null;

  static getInstance(): WorkspaceChatService {
    if (!WorkspaceChatService.instance) {
      WorkspaceChatService.instance = new WorkspaceChatService();
    }
    return WorkspaceChatService.instance;
  }

  async loadHistory(limit: number = 200, offset: number = 0): Promise<WorkspaceMessage[]> {
    const token = getWorkspaceToken();
    if (!token) return [];

    try {
      const res = await fetch(
        `${API_BASE}/api/chat/history?limit=${limit}&offset=${offset}`,
        { headers: { ...workspaceAuthHeaders() } }
      );
      if (!res.ok) return [];
      const data = await res.json();
      if (data.ok && data.messages) {
        if (offset === 0) this.cache = data.messages;
        return data.messages;
      }
      return [];
    } catch (e) {
      console.error('[workspace-chat] loadHistory error:', e);
      return [];
    }
  }

  async storeMessage(
    content: string,
    sender: 'user' | 'assistant',
    metadata?: Record<string, any>
  ): Promise<WorkspaceMessage | null> {
    const token = getWorkspaceToken();
    if (!token || !content.trim()) return null;

    try {
      const res = await fetch(`${API_BASE}/api/chat/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...workspaceAuthHeaders(),
        },
        body: JSON.stringify({ content, sender, metadata }),
      });
      if (!res.ok) return null;
      const data = await res.json();
      if (data.ok && data.message) {
        // Update cache
        if (this.cache) {
          this.cache.push(data.message);
        }
        return data.message;
      }
      return null;
    } catch (e) {
      console.error('[workspace-chat] storeMessage error:', e);
      return null;
    }
  }

  getCachedHistory(): WorkspaceMessage[] | null {
    return this.cache;
  }

  clearCache() {
    this.cache = null;
  }
}

export const workspaceChat = WorkspaceChatService.getInstance();