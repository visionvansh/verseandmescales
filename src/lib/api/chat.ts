// lib/api/chat.ts
const API_BASE = '/api/chat';

export interface FetchMessagesParams {
  roomId: string;
  cursor?: string;
  limit?: number;
}

export interface FetchParticipantsParams {
  roomId: string;
}

export class ChatAPI {
  private static async fetchWithAuth(url: string, options: RequestInit = {}) {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  static async getOrCreateRoom(courseId: string) {
    return this.fetchWithAuth(`${API_BASE}/rooms/course/${courseId}`, {
      method: 'POST',
    });
  }

  static async getRoomDetails(roomId: string) {
    return this.fetchWithAuth(`${API_BASE}/rooms/${roomId}`);
  }

  static async fetchMessages({ roomId, cursor, limit = 50 }: FetchMessagesParams) {
    const params = new URLSearchParams({
      limit: limit.toString(),
      ...(cursor && { cursor }),
    });

    return this.fetchWithAuth(`${API_BASE}/rooms/${roomId}/messages?${params}`);
  }

  static async fetchParticipants({ roomId }: FetchParticipantsParams) {
    return this.fetchWithAuth(`${API_BASE}/rooms/${roomId}/participants`);
  }
}