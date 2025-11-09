// lib/api/questions.ts
import Cookies from 'js-cookie';

const getAuthHeaders = () => {
  const token = Cookies.get('auth-token');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

// ✅ Helper to send WebSocket events
function sendWebSocketEvent(event: string, data: any) {
  if (typeof window !== 'undefined') {
    // Send to WebSocket for broadcasting to other users
    window.dispatchEvent(new CustomEvent('ws-event', {
      detail: { event, data }
    }));
    
    // ✅ ALSO dispatch locally for immediate UI update
    window.dispatchEvent(new CustomEvent(event, {
      detail: data
    }));
    
    console.log(`📡 Dispatched: ${event}`, data);
  }
}

export const QuestionAPI = {
  async fetchQuestions(params: {
    roomId: string;
    lessonId?: string;
    moduleId?: string;
    userId?: string;
    status?: string;
  }) {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value) queryParams.append(key, value);
    });

    const response = await fetch(`/api/chat/questions?${queryParams}`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch questions');
    }

    return response.json();
  },

  async getQuestion(questionId: string) {
    const response = await fetch(`/api/chat/questions/${questionId}`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch question');
    }

    return response.json();
  },

  async createQuestion(data: {
    roomId: string;
    lessonId: string;
    moduleId: string;
    title: string;
    description?: string;
    tags?: string[];
    videoTimestamp?: string;
    visibility: string;
  }) {
    const response = await fetch('/api/chat/questions', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to create question');
    }

    const result = await response.json();
    
    // ✅ This is correct - just trigger the custom event
    sendWebSocketEvent('question:new', {
      roomId: data.roomId,
      question: result.question
    });

    return result;
  },

  // Add this new method to QuestionAPI object
async toggleAnswerUpvote(questionId: string, answerId: string) {
  const response = await fetch(
    `/api/chat/questions/${questionId}/answer/${answerId}/upvote`,
    {
      method: 'POST',
      headers: getAuthHeaders(),
    }
  );

  if (!response.ok) {
    throw new Error('Failed to toggle answer upvote');
  }

  const result = await response.json();
  
  // ✅ Broadcast via WebSocket
  if (result.roomId) {
    sendWebSocketEvent('answer:upvote', {
      roomId: result.roomId,
      questionId: result.questionId,
      answerId: result.answerId,
      userId: result.userId,
      upvoted: result.upvoted,
      upvoteCount: result.answer.upvoteCount,
      hasUpvoted: result.answer.hasUpvoted
    });
  }

  return result;
},

  async toggleUpvote(questionId: string) {
  const response = await fetch(`/api/chat/questions/${questionId}/upvote`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to toggle upvote');
  }

  const result = await response.json();
  
  // ✅ Send with ALL required data
  if (result.roomId) {
    sendWebSocketEvent('question:upvote', {
      roomId: result.roomId,
      questionId: result.questionId,
      userId: result.userId,
      upvoted: result.upvoted,
      upvoteCount: result.question.upvoteCount, // ✅ From nested object
      hasUpvoted: result.question.hasUpvoted    // ✅ From nested object
    });
  }

  return result;
},

  async trackView(questionId: string) {
    const response = await fetch(`/api/chat/questions/${questionId}/view`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to track view');
    }

    const result = await response.json();
    
    // ✅ Views are personal, no need to broadcast
    return result;
  },

  async createAnswer(questionId: string, content: string, parentAnswerId?: string) {
  const response = await fetch(`/api/chat/questions/${questionId}/answer`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ content, parentAnswerId }),
  });

  if (!response.ok) {
    throw new Error('Failed to create answer');
  }

  const result = await response.json();
  
  // ✅ FIXED: Send complete answer data
  if (result.roomId) {
    sendWebSocketEvent('question:answer', {
      roomId: result.roomId,
      questionId: result.questionId,
      answer: result.answer,           // ✅ Full answer object
      answerCount: result.answerCount,
      status: result.status
    });
  }

  return result;
},

  async giveThanks(questionId: string, answerId: string) {
    const response = await fetch(
      `/api/chat/questions/${questionId}/answer/${answerId}/thanks`,
      {
        method: 'POST',
        headers: getAuthHeaders(),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to give thanks');
    }

    const result = await response.json();
    
    // ✅ Trigger WebSocket event
    if (result.roomId) {
      sendWebSocketEvent('answer:thanked', {
        roomId: result.roomId,
        questionId: result.questionId,
        answerId: result.answerId,
        isThanked: true,
        thanksGivenCount: result.thanksGivenCount
      });
    }

    return result;
  },

  async removeThanks(questionId: string, answerId: string) {
    const response = await fetch(
      `/api/chat/questions/${questionId}/answer/${answerId}/thanks`,
      {
        method: 'DELETE',
        headers: getAuthHeaders(),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to remove thanks');
    }

    const result = await response.json();
    
    // ✅ Trigger WebSocket event
    if (result.roomId) {
      sendWebSocketEvent('answer:thanked', {
        roomId: result.roomId,
        questionId: result.questionId,
        answerId: result.answerId,
        isThanked: false,
        thanksGivenCount: result.thanksGivenCount
      });
    }

    return result;
  }
};