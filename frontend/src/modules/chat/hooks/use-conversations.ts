'use client';

import { useState, useMemo, useEffect } from 'react';
import { Conversation, ConversationFilter } from '../types/conversation.types';
import { getConversations } from '../services/chat-api';

const PAGE_SIZE = 10;

export function useConversations() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<ConversationFilter>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [conversationsData, setConversationsData] = useState<Conversation[]>([]);
  const [visibleCount, setVisibleCount] = useState<number>(PAGE_SIZE);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isError, setIsError] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    getConversations()
      .then((data) => {
        if (isMounted) {
          setConversationsData(data);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setIsError(true);
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const sortedConversations = useMemo(() => {
    return [...conversationsData].sort((a, b) => {
      const dateA = new Date(a.lastMessage?.createdAt || a.updatedAt).getTime();
      const dateB = new Date(b.lastMessage?.createdAt || b.updatedAt).getTime();
      return dateB - dateA;
    });
  }, [conversationsData]);

  const filteredConversations = useMemo(() => {
    let list = sortedConversations;

    if (activeFilter === 'unread') {
      list = list.filter((item) => item.unreadCount > 0);
    }

    if (searchQuery.trim().length > 0) {
      const normalizedQuery = searchQuery
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');

      list = list.filter((item) => {
        const normalizedName = item.contact.fullName
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '');
        return normalizedName.includes(normalizedQuery);
      });
    }

    return list;
  }, [sortedConversations, activeFilter, searchQuery]);

  const paginatedConversations = useMemo(() => {
    return filteredConversations.slice(0, visibleCount);
  }, [filteredConversations, visibleCount]);

  const hasMore = visibleCount < filteredConversations.length;

  const loadMore = () => {
    if (hasMore) {
      setVisibleCount((prev) => prev + PAGE_SIZE);
    }
  };

  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedId(conversation.id);

    if (conversation.unreadCount > 0) {
      setConversationsData((prev) =>
        prev.map((item) =>
          item.id === conversation.id ? { ...item, unreadCount: 0 } : item
        )
      );
    }
  };

  const simulateIncomingMessage = (conversationId: string, newContent: string) => {
    const timestamp = new Date().toISOString();
    setConversationsData((prev) => {
      return prev.map((item) => {
        if (item.id === conversationId) {
          return {
            ...item,
            updatedAt: timestamp,
            unreadCount: selectedId === conversationId ? 0 : item.unreadCount + 1,
            lastMessage: {
              id: `msg-${Date.now()}`,
              senderId: item.contact.id,
              content: newContent,
              isAttachment: false,
              createdAt: timestamp,
            },
          };
        }
        return item;
      });
    });
  };

  return {
    conversations: paginatedConversations,
    totalCount: filteredConversations.length,
    hasMore,
    selectedId,
    activeFilter,
    searchQuery,
    isLoading,
    isError,
    loadMore,
    setActiveFilter,
    setSearchQuery,
    handleSelectConversation,
    simulateIncomingMessage,
  };
}