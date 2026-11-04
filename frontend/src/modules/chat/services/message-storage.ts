import { readLocalStorage, writeLocalStorage, removeLocalStorage, canUseLocalStorage } from "@/shared/services/storage/browser-local-storage";
import { Message, MessageStatus } from '../types/conversation.types';

export const CHAT_MESSAGES_STORAGE_KEY = 'umssy_chat_messages_v1';
export const CHAT_READ_STATUS_STORAGE_KEY = 'umssy_chat_read_status_v1';

let memoryMessageCache: Message[] | null = null;
let memoryConversationReadStateCache: Record<string, number> | null = null;

function cloneMessages(messages: Message[]): Message[] {
  return messages.map((msg) => ({ ...msg }));
}

export function getStoredMessages(): Message[] {
  if (!canUseLocalStorage()) {
    if (!memoryMessageCache) {
      memoryMessageCache = [];
    }
    return cloneMessages(memoryMessageCache);
  }

  try {
    const serializedData = readLocalStorage(CHAT_MESSAGES_STORAGE_KEY);
    if (!serializedData) {
      const initialMessages: Message[] = [];
      writeLocalStorage(
        CHAT_MESSAGES_STORAGE_KEY,
        JSON.stringify(initialMessages)
      );
      memoryMessageCache = initialMessages;
      return cloneMessages(initialMessages);
    }

    const parsedData = JSON.parse(serializedData);
    if (Array.isArray(parsedData)) {
      memoryMessageCache = parsedData;
      return cloneMessages(parsedData);
    }

    const fallbackMessages: Message[] = [];
    writeLocalStorage(
      CHAT_MESSAGES_STORAGE_KEY,
      JSON.stringify(fallbackMessages)
    );
    memoryMessageCache = fallbackMessages;
    return cloneMessages(fallbackMessages);
  } catch {
    if (!memoryMessageCache) {
      memoryMessageCache = [];
    }
    return cloneMessages(memoryMessageCache);
  }
}

export function getMessagesByConversation(conversationId: string): Message[] {
  const allMessages = getStoredMessages();
  return allMessages
    .filter((message) => message.conversationId === conversationId)
    .sort((a, b) => {
      const timeA = new Date(a.timestamp || a.createdAt || '').getTime();
      const timeB = new Date(b.timestamp || b.createdAt || '').getTime();
      return timeA - timeB;
    });
}

export function saveStoredMessage(message: Message): Message {
  const allMessages = getStoredMessages();
  const existingIndex = allMessages.findIndex((item) => item.id === message.id);

  let updatedMessages: Message[];
  if (existingIndex >= 0) {
    updatedMessages = [...allMessages];
    updatedMessages[existingIndex] = { ...message };
  } else {
    updatedMessages = [...allMessages, { ...message }];
  }

  memoryMessageCache = updatedMessages;

  if (canUseLocalStorage()) {
    try {
      writeLocalStorage(
        CHAT_MESSAGES_STORAGE_KEY,
        JSON.stringify(updatedMessages)
      );
    } catch {
      
    }
  }

  return { ...message };
}


export function updateStoredMessageStatus(
  messageId: string,
  newStatus: MessageStatus
): Message | null {
  const allMessages = getStoredMessages();
  const targetMessage = allMessages.find((item) => item.id === messageId);

  if (!targetMessage) {
    return null;
  }

  const updatedMessage: Message = {
    ...targetMessage,
    status: newStatus,
  };

  saveStoredMessage(updatedMessage);
  return updatedMessage;
}

export function rehydrateStoredMessages(): Message[] {
  return getStoredMessages();
}

export function clearStoredMessages(): void {
  const initialMessages: Message[] = [];
  memoryMessageCache = initialMessages;
  clearStoredConversationReadState();

  if (canUseLocalStorage()) {
    try {
      writeLocalStorage(
        CHAT_MESSAGES_STORAGE_KEY,
        JSON.stringify(initialMessages)
      );
    } catch {
    
    }
  }
}

export function getStoredConversationReadState(): Record<string, number> {
  if (!canUseLocalStorage()) {
    return memoryConversationReadStateCache ? { ...memoryConversationReadStateCache } : {};
  }

  try {
    const serialized = readLocalStorage(CHAT_READ_STATUS_STORAGE_KEY);
    if (!serialized) {
      return memoryConversationReadStateCache ? { ...memoryConversationReadStateCache } : {};
    }
    const parsed = JSON.parse(serialized);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      memoryConversationReadStateCache = parsed;
      return { ...parsed };
    }
    return {};
  } catch {
    return memoryConversationReadStateCache ? { ...memoryConversationReadStateCache } : {};
  }
}

export function setStoredConversationUnreadCount(
  conversationId: string,
  unreadCount: number
): void {
  const currentState = getStoredConversationReadState();
  currentState[conversationId] = Math.max(0, unreadCount);
  memoryConversationReadStateCache = currentState;

  if (canUseLocalStorage()) {
    try {
      writeLocalStorage(
        CHAT_READ_STATUS_STORAGE_KEY,
        JSON.stringify(currentState)
      );
    } catch {
      
    }
  }
}

export function markStoredConversationAsRead(conversationId: string): void {
  setStoredConversationUnreadCount(conversationId, 0);
}

export function clearStoredConversationReadState(): void {
  memoryConversationReadStateCache = null;
  if (canUseLocalStorage()) {
    try {
      removeLocalStorage(CHAT_READ_STATUS_STORAGE_KEY);
    } catch {
    }
  }
}


