import {
  AttachmentType,
  Conversation,
  Message,
  MessageStatus,
  SendMessagePayload,
  SendMessageOptions,
  SendMessageResponse,
  StandardApiResponse,
} from '../types/conversation.types';
import type { MessageAttachment } from '../types/attachment.types';
import type { LinkPreviewResponse } from '../types/link-preview.types';
import { toast } from 'sonner';
import { User } from '../types/user.types';
import {
  getMessagesByConversation,
  saveStoredMessage,
  markStoredConversationAsRead,
} from './message-storage';

import {
  applyStoredReadState,
  saveConversationReadAt,
} from './conversation-read-storage';
import { apiClient } from '@/shared/services/api-client';
import { getAccessToken } from '@/shared/services/storage/access-token-storage';
import type { UserRole } from '../types/user.types';
const MIN_SEARCH_CHARS = 2;
const DEFAULT_MESSAGE_PAGE_SIZE = 10;

export function getCurrentSessionUserId(): string {
  const token = getAccessToken();
  if (!token) return '';

  try {
    const parts = token.split('.');
    if (parts.length >= 2) {
      const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const json = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join(''),
      );
      const parsed = JSON.parse(json);
      if (parsed && typeof parsed.sub === 'string' && parsed.sub.length > 0) {
        return parsed.sub;
      }
    }
  } catch {
  }

  return '';
}

export interface GetPaginatedMessagesParams {
  conversationId: string;
  cursor?: string | null;
  limit?: number;
}

export interface PaginatedMessagesResponse {
  data: Message[];
  nextCursor: string | null;
  hasMore: boolean;
}

interface RawBackendAttachmentItem {
  id: string;
  messageId?: string;
  fileName: string;
  mimeType?: string | null;
  fileSize?: number | null;
  url?: string | null;
  thumbnailUrl?: string | null;
  type?: string | { title?: string } | null;
  createdAt?: string;
}

interface RawBackendMessageItem {
  id?: string;
  conversationId?: string;
  senderId?: string;
  content?: string;
  timestamp?: string;
  createdAt?: string;
  sentAt?: string;
  status?: string;
  isAttachment?: boolean;
  attachmentType?: AttachmentType | null;
  attachment?: RawBackendAttachmentItem | null;
  attachments?: RawBackendAttachmentItem[];
}

interface ChatUserResponse {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  headline: string | null;
  role: string;
  isOnline: boolean;
}

export async function getConversations(): Promise<Conversation[]> {
  const response = await apiClient.get<
    Conversation[] | { data: Conversation[] }
  >('/chat/conversations');

  const body = response.data;

  const items = Array.isArray(body)
    ? body
    : Array.isArray(body?.data)
      ? body.data
      : [];

  return applyStoredReadState(items.map(withBlockState)).sort((a, b) => {
    const dateA = new Date(
      a.lastMessage?.createdAt || a.updatedAt,
    ).getTime();

    const dateB = new Date(
      b.lastMessage?.createdAt || b.updatedAt,
    ).getTime();

    return dateB - dateA;
  });
}



/**
 * HU-2: búsqueda de contactos.
 * Llama a GET /chat/users/search?q=... en el backend.
 * El backend excluye al usuario de la sesión, filtra inactivos
 * y no expone email/teléfono.
 */
export async function searchUsers(rawQuery: string): Promise<User[]> {
  const query = rawQuery.trim();

  if (query.length < MIN_SEARCH_CHARS) {
    return [];
  }

  const response = await apiClient.get<
    ChatUserResponse[] | StandardApiResponse<ChatUserResponse[]>
  >('/chat/users/search', { params: { q: query } });

  const body = response.data;
  const items: ChatUserResponse[] = Array.isArray(body)
    ? body
    : Array.isArray((body as { data?: ChatUserResponse[] })?.data)
      ? (body as { data: ChatUserResponse[] }).data
      : [];

  return items.map((u) => ({
    id: u.id,
    fullName: u.fullName,
    avatarUrl: u.avatarUrl,
    headline: u.headline,
    role: u.role as UserRole,
    isActive: true,
  }));
}

export async function getMessages(
  conversationId: string,
): Promise<Message[]> {
  try {
    const res = await getPaginatedMessages({
      conversationId,
      limit: 100,
    });
    return res.data;
  } catch {
    return getMessagesByConversation(conversationId);
  }
}


export async function getPaginatedMessages({
  conversationId,
  cursor = null,
  limit = DEFAULT_MESSAGE_PAGE_SIZE,
}: GetPaginatedMessagesParams): Promise<PaginatedMessagesResponse> {
  if (!conversationId) {
    throw new Error(
      'El identificador de conversacion es requerido',
    );
  }

  if (!Number.isInteger(limit) || limit <= 0) {
    throw new Error(
      'El limite debe ser un numero entero mayor a 0',
    );
  }

  try {
    const response = await apiClient.get<
      | StandardApiResponse<PaginatedMessagesResponse>
      | PaginatedMessagesResponse
    >(`/conversations/${conversationId}/messages`, {
      params: {
        cursor: cursor ?? undefined,
        limit,
      },
    });

    const body = response?.data;
    if (body) {
      const payload =
        typeof body === 'object' &&
        body !== null &&
        'data' in body &&
        body.data !== null &&
        typeof body.data === 'object' &&
        'data' in body.data &&
        Array.isArray((body.data as { data?: unknown[] }).data)
          ? (body.data as PaginatedMessagesResponse)
          : (body as PaginatedMessagesResponse);

      const rawMessages = (
        Array.isArray(payload.data) ? payload.data : []
      ) as RawBackendMessageItem[];

      const combined = [...rawMessages].sort(
        (a, b) =>
          new Date(a.timestamp || a.createdAt || a.sentAt || '').getTime() -
          new Date(b.timestamp || b.createdAt || b.sentAt || '').getTime(),
      );

      if (
        combined.length > 0 ||
        payload.nextCursor !== undefined ||
        payload.hasMore !== undefined
      ) {
        const mappedMessages: Message[] = combined.map(
          (m: RawBackendMessageItem) => {
            const rawAttachments = m.attachments || (m.attachment ? [m.attachment] : []);
            const mappedAttachments: MessageAttachment[] = rawAttachments.map((att) => ({
              id: att.id,
              messageId: att.messageId || m.id,
              fileName: att.fileName,
              mimeType: att.mimeType || 'application/octet-stream',
              fileSize: att.fileSize || 0,
              url: att.url || `/api/chat/attachments/${att.id}/download`,
              thumbnailUrl: att.thumbnailUrl ?? null,
              type:
                typeof att.type === 'object' && att.type !== null
                  ? att.type.title
                  : (att.type ?? null),
              createdAt: att.createdAt,
            }));

            const firstAtt = mappedAttachments[0] ?? null;
            const isAttachment = Boolean(
              m.isAttachment ?? firstAtt ?? m.content?.startsWith('[Archivo]'),
            );
            const attachmentType: AttachmentType | null =
              m.attachmentType ??
              (firstAtt
                ? (firstAtt.type?.toLowerCase() === 'image' || firstAtt.mimeType.startsWith('image/')
                    ? 'image'
                    : 'file')
                : m.content?.startsWith('[Archivo]')
                  ? 'file'
                  : null);

            return {
              id: m.id || '',
              conversationId: m.conversationId || conversationId,
              senderId: m.senderId || '',
              content: m.content || '',
              timestamp:
                m.timestamp || m.createdAt || m.sentAt || new Date().toISOString(),
              createdAt:
                m.createdAt || m.sentAt || m.timestamp || new Date().toISOString(),
              status: (m.status as MessageStatus) || 'sent',
              isAttachment,
              attachmentType,
              attachment: firstAtt,
              attachments: mappedAttachments,
            };
          },
        );

        return {
          data: mappedMessages,
          nextCursor: payload.nextCursor ?? null,
          hasMore: Boolean(payload.hasMore),
        };
      }
    }
  } catch (error){
    throw error;
  }

  const messages = getMessagesByConversation(conversationId);

  if (messages.length === 0) {
    return {
      data: [],
      nextCursor: null,
      hasMore: false,
    };
  }

  const chronologicalMessages = [...messages].sort(
    (a, b) =>
      new Date(a.timestamp || a.createdAt || '').getTime() -
      new Date(b.timestamp || b.createdAt || '').getTime(),
  );

  let endIndex = chronologicalMessages.length;

  if (cursor) {
    const cursorIndex = chronologicalMessages.findIndex(
      (message) => message.id === cursor,
    );

    if (cursorIndex === -1) {
      throw new Error('Cursor de mensajes no valido');
    }

    endIndex = cursorIndex;
  }

  const startIndex = Math.max(0, endIndex - limit);

  const pageMessages = chronologicalMessages.slice(
    startIndex,
    endIndex,
  );

  const hasMore = startIndex > 0;

  const nextCursor =
    hasMore && pageMessages.length > 0
      ? pageMessages[0].id
      : null;

  return {
    data: pageMessages,
    nextCursor,
    hasMore,
  };
}


/**
 * HU-2: obtiene o crea la conversación con un contacto.
 * Llama a POST /chat/conversations.
 * El backend usa el JWT para saber quién es el usuario de la sesión,
 * y aplica la regla del par ordenado (no duplica conversaciones).
 */
export async function getOrCreateConversation(
  contactId: string,
): Promise<Conversation> {
  const { data } = await apiClient.post<
    Conversation | StandardApiResponse<Conversation>
  >('/chat/conversations', { contactId });

  if (
    typeof data === 'object' &&
    data !== null &&
    'data' in data &&
    data.data !== null &&
    typeof data.data === 'object' &&
    'id' in data.data
  ) {
    return data.data as Conversation;
  }

  return data as Conversation;
}

/** HU-13: asegura que isBlockedByMe siempre sea booleano (false si el backend no lo envía). */
function withBlockState(conversation: Conversation): Conversation {
  return { ...conversation, isBlockedByMe: Boolean(conversation.isBlockedByMe) };
}

/** HU-13: POST /chat/blocks. Sin catch: la interfaz muestra el error. */
export async function blockUser(contactId: string): Promise<void> {
  await apiClient.post('/chat/blocks', { userId: contactId });
}

/** HU-13: DELETE /chat/blocks/:userId. Sin catch: la interfaz muestra el error. */
export async function unblockUser(contactId: string): Promise<void> {
  await apiClient.delete(`/chat/blocks/${encodeURIComponent(contactId)}`);
}

export async function sendMessage(
  payload: SendMessagePayload,
  options?: SendMessageOptions,
): Promise<SendMessageResponse> {
  const isBrowserOffline =
    typeof navigator !== 'undefined' && !navigator.onLine;

  if (options?.forceOffline || isBrowserOffline) {
    throw new Error(
      'Error de red: Sin conexion a internet',
    );
  }

  if (options?.forceError) {
    throw new Error(
      'Error del servidor: No se pudo procesar el envio del mensaje',
    );
  }

  if (!payload.conversationId) {
    throw new Error(
      'El identificador de conversacion es requerido',
    );
  }

  const trimmedContent = payload.content.trim();

  if (trimmedContent.length === 0) {
    throw new Error(
      'El contenido del mensaje no puede estar vacio',
    );
  }

  try {
    const response = await apiClient.post<
      | StandardApiResponse<Message>
      | Message
    >('/chat/messages', {
      conversationId: payload.conversationId,
      content: trimmedContent,
    });

    const body = response?.data;
    const msg =
      typeof body === 'object' &&
      body !== null &&
      'data' in body &&
      body.data !== null &&
      typeof body.data === 'object' &&
      'id' in body.data
        ? (body.data as Message)
        : (body as Message);

    if (!msg || !msg.id) {
      throw new Error(
        'Error del servidor: No se pudo procesar el envio del mensaje',
      );
    }

    const createdMessage: Message = {
      id: msg.id,
      conversationId: msg.conversationId || payload.conversationId,
      senderId:
        msg.senderId || payload.senderId || getCurrentSessionUserId(),
      content: msg.content || trimmedContent,
      timestamp:
        msg.timestamp || msg.createdAt || new Date().toISOString(),
      status: (msg.status as MessageStatus) || 'sent',
      createdAt:
        msg.createdAt || msg.timestamp || new Date().toISOString(),
      isAttachment: Boolean(msg.isAttachment),
      attachmentType: msg.attachmentType || null,
    };

    saveStoredMessage(createdMessage);
    markStoredConversationAsRead(payload.conversationId);

    return {
      statusCode: 201,
      ok: true,
      detail: 'Mensaje enviado exitosamente',
      data: createdMessage,
    };
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(
      'Error del servidor: No se pudo procesar el envio del mensaje',
    );
  }
}

export async function markConversationAsRead(
  conversationId: string,
): Promise<void> {
  markStoredConversationAsRead(conversationId);
 saveConversationReadAt(conversationId);
  try {
    await apiClient.patch(`/chat/messages/${conversationId}/read`);
  } catch {
    // Graceful fallback
  }
}

export async function downloadAttachment(
  attachmentId: string,
  fileName: string,
): Promise<void> {
  if (!attachmentId) {
    throw new Error('El identificador de adjunto es requerido');
  }

  try {
    const response = await apiClient.get(
      `/chat/attachments/${attachmentId}/download`,
      { responseType: 'blob' },
    );

    const blob = new Blob([response.data as BlobPart], {
      type:
        (response.headers as Record<string, string> | undefined)?.[
          'content-type'
        ] || 'application/octet-stream',
    });

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName || 'adjunto');
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    toast.error('No se pudo descargar el archivo.');
    throw error;
  }
}

export async function sendAttachmentMessage(
  conversationId: string,
  file: File,
  content?: string,
): Promise<SendMessageResponse> {
  const isBrowserOffline =
    typeof navigator !== 'undefined' && !navigator.onLine;

  if (isBrowserOffline) {
    throw new Error('Error de red: Sin conexion a internet');
  }

  if (!conversationId) {
    throw new Error('El identificador de conversacion es requerido');
  }

  if (!file) {
    throw new Error('El archivo adjunto es requerido');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('conversationId', conversationId);
  const trimmedContent = (content || '').trim();
  if (trimmedContent.length > 0) {
    formData.append('content', trimmedContent);
  }

  try {
    const response = await apiClient.post<
      | StandardApiResponse<Message>
      | Message
    >('/chat/messages/attachment', formData);

    const body = response?.data;
    const msg =
      typeof body === 'object' &&
      body !== null &&
      'data' in body &&
      body.data !== null &&
      typeof body.data === 'object' &&
      'id' in body.data
        ? (body.data as Message)
        : (body as Message);

    if (!msg || !msg.id) {
      throw new Error(
        'Error del servidor: No se pudo procesar el envio del archivo adjunto',
      );
    }

    const isImage = file.type.startsWith('image/') || /\.(jpe?g|png)$/i.test(file.name);
    const createdMessage: Message = {
      id: msg.id,
      conversationId: msg.conversationId || conversationId,
      senderId:
        msg.senderId || getCurrentSessionUserId(),
      content: msg.content || trimmedContent || file.name,
      timestamp:
        msg.timestamp || msg.createdAt || new Date().toISOString(),
      status: (msg.status as MessageStatus) || 'sent',
      createdAt:
        msg.createdAt || msg.timestamp || new Date().toISOString(),
      isAttachment: true,
      attachmentType: msg.attachmentType || (isImage ? 'image' : 'file'),
      attachment: msg.attachment ?? {
        id: `att-${msg.id}`,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        url: `/api/chat/attachments/att-${msg.id}/download`,
        type: isImage ? 'IMAGE' : 'PDF',
      },
      attachments: msg.attachments,
    };

    saveStoredMessage(createdMessage);
    markStoredConversationAsRead(conversationId);

    return {
      statusCode: 201,
      ok: true,
      detail: 'Mensaje con archivo adjunto enviado exitosamente',
      data: createdMessage,
    };
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(
      'Error del servidor: No se pudo procesar el envio del archivo adjunto',
    );
  }
}

const linkPreviewCache = new Map<string, Promise<LinkPreviewResponse | null>>();

export function clearLinkPreviewCache(): void {
  linkPreviewCache.clear();
}

export async function getLinkPreview(
  rawUrl: string,
): Promise<LinkPreviewResponse | null> {
  const trimmedUrl = (rawUrl || '').trim();
  if (
    !trimmedUrl ||
    (!trimmedUrl.startsWith('http://') && !trimmedUrl.startsWith('https://'))
  ) {
    return null;
  }

  const cached = linkPreviewCache.get(trimmedUrl);
  if (cached) {
    return cached;
  }

  const promise = (async () => {
    try {
      const response = await apiClient.get<
        StandardApiResponse<LinkPreviewResponse> | LinkPreviewResponse
      >(`/chat/link-preview?url=${encodeURIComponent(trimmedUrl)}`);

      const body = response?.data;
      const data =
        typeof body === 'object' && body !== null && 'data' in body
          ? (body.data as LinkPreviewResponse)
          : (body as LinkPreviewResponse);

      if (data && typeof data === 'object' && data.hasPreview) {
        return data;
      }
      linkPreviewCache.delete(trimmedUrl);
      return null;
    } catch {
      linkPreviewCache.delete(trimmedUrl);
      return null;
    }
  })();

  linkPreviewCache.set(trimmedUrl, promise);
  return promise;
}

export function fetchCachedLinkPreview(
  url: string,
): Promise<LinkPreviewResponse | null> {
  return getLinkPreview(url);
}
