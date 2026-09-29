'use client';

import { useConversations } from '../hooks/use-conversations';
import { ConversationList } from '../components/conversation-list';
import { EmptyChatState } from '../components/empty-chat-state';

export function ChatView() {
  const {
    conversations,
    hasMore,
    loadMore,
    selectedId,
    activeFilter,
    searchQuery,
    isLoading,
    setActiveFilter,
    setSearchQuery,
    handleSelectConversation,
  } = useConversations();

  const selectedConversation = conversations.find((item) => item.id === selectedId);

  const handleBackToList = () => {
    handleSelectConversation({ id: '' } as any);
  };

  return (
    <div className="flex h-screen w-full bg-slate-50 overflow-hidden font-sans">
      <aside
        className={`w-full md:w-80 lg:w-96 h-full shrink-0 ${
          selectedId ? 'hidden md:block' : 'block'
        }`}
      >
        <ConversationList
          conversations={conversations}
          selectedId={selectedId}
          isLoading={isLoading}
          hasMore={hasMore}
          activeFilter={activeFilter}
          searchQuery={searchQuery}
          onSelectConversation={handleSelectConversation}
          onFilterChange={setActiveFilter}
          onSearchChange={setSearchQuery}
          onLoadMore={loadMore}
          onStartNewChat={() => {
            alert('Iniciar nueva conversacion');
          }}
        />
      </aside>

      <main
        className={`flex-1 h-full bg-white flex flex-col ${
          !selectedId ? 'hidden md:flex' : 'flex'
        }`}
      >
        {selectedConversation ? (
          <div className="flex flex-col h-full">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-white">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleBackToList}
                  className="md:hidden p-1.5 -ml-1 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
                  aria-label="Volver a la lista de chats"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                <div className="relative">
                  {selectedConversation.contact.avatarUrl ? (
                    <img
                      src={selectedConversation.contact.avatarUrl}
                      alt={selectedConversation.contact.fullName}
                      className="w-10 h-10 rounded-full object-cover border border-slate-200"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs border border-slate-300">
                      {selectedConversation.contact.fullName.substring(0, 2).toUpperCase()}
                    </div>
                  )}
                  {selectedConversation.contact.isOnline && (
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full" />
                  )}
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-900 leading-tight">
                    {selectedConversation.contact.fullName}
                  </h3>
                  <span className="text-xs text-emerald-600 font-medium">
                    {selectedConversation.contact.isOnline ? 'En linea' : 'Desconectado'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex-1 p-6 bg-slate-50 flex items-center justify-center">
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-blue-50 text-[#0B2545] flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-slate-600">
                  Sala de chat con {selectedConversation.contact.fullName}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Envio e historial de mensajes
                </p>
              </div>
            </div>
          </div>
        ) : (
          <EmptyChatState
            description="Selecciona una conversacion existente en el panel izquierdo o inicia una nueva para comenzar a comunicarte."
            actionLabel="Iniciar una nueva conversacion"
            onAction={() => {
              alert('Iniciar nueva conversacion');
            }}
          />
        )}
      </main>
    </div>
  );
}