import { describe, it, expect, vi, afterEach } from 'vitest';
import * as matchers from '@testing-library/jest-dom/matchers';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { ContactProfileModal } from '../components/contact-profile-modal';
import { ChatRoom } from '../components/chat-room';
import type { Conversation, Message, UserSummary } from '../types/conversation.types';

expect.extend(matchers);

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const mockContactFull: UserSummary = {
  id: 'user-carlos-1',
  fullName: 'Carlos Rojas Murillo',
  avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
  isOnline: true,
  roleName: 'Titulado',
  email: 'carlos.rojas@est.umss.edu',
  isEmailVisible: true,
  academicTitle: 'Lic. en Ingenieria de Sistemas',
  isAcademicTitleVisible: true,
  skills: ['TypeScript', 'React', 'NestJS', 'PostgreSQL'],
  areSkillsVisible: true,
};

const mockContactWithoutPhoto: UserSummary = {
  id: 'user-ana-2',
  fullName: 'Ana Vargas',
  avatarUrl: null,
  isOnline: false,
  roleName: 'Estudiante',
  email: 'ana.vargas@est.umss.edu',
  isEmailVisible: true,
  academicTitle: 'Estudiante de Informatica',
  isAcademicTitleVisible: true,
  skills: ['Python', 'SQL'],
  areSkillsVisible: true,
};

const mockContactHiddenPrivacy: UserSummary = {
  id: 'user-privado-3',
  fullName: 'Juan Privado',
  avatarUrl: null,
  isOnline: false,
  roleName: 'Mentor',
  email: 'juan.privado@umss.edu',
  isEmailVisible: false,
  academicTitle: 'Master en Inteligencia Artificial',
  isAcademicTitleVisible: false,
  skills: ['TensorFlow', 'PyTorch'],
  areSkillsVisible: false,
};

const mockConversationA: Conversation = {
  id: 'conv-1',
  contact: mockContactFull,
  lastMessage: null,
  unreadCount: 0,
  updatedAt: new Date().toISOString(),
};

const mockConversationB: Conversation = {
  id: 'conv-2',
  contact: mockContactWithoutPhoto,
  lastMessage: null,
  unreadCount: 0,
  updatedAt: new Date().toISOString(),
};

const mockMessages: Message[] = [
  {
    id: 'msg-1',
    conversationId: 'conv-1',
    senderId: 'user-carlos-1',
    content: 'Hola que tal',
    timestamp: new Date().toISOString(),
    status: 'sent',
    createdAt: new Date().toISOString(),
  },
];

describe('HU-12 ContactProfileModal y Acceso desde Avatar de Cabecera', () => {
  it('criterio 1: abre el modal PERFIL DE CONTACTO al hacer clic en el avatar del encabezado', () => {
    render(
      <ChatRoom
        conversation={mockConversationA}
        messages={mockMessages}
        currentUserId="user-me"
        onBack={vi.fn()}
        onSendMessage={vi.fn()}
      />
    );

    const trigger = screen.getByTestId('chat-contact-profile-trigger');
    fireEvent.click(trigger);

    expect(screen.getByTestId('contact-profile-modal')).toBeInTheDocument();
    expect(screen.getByText('PERFIL DE CONTACTO')).toBeInTheDocument();
  });

  it('criterio 2: el nombre mostrado corresponde al contacto seleccionado', () => {
    render(
      <ContactProfileModal
        isOpen={true}
        onClose={vi.fn()}
        contact={mockContactFull}
      />
    );

    expect(screen.getByTestId('contact-profile-name')).toHaveTextContent(
      'Carlos Rojas Murillo'
    );
  });

  it('criterio 3: el acceso al perfil tiene el texto Ver perfil de usuario en el hover', () => {
    render(
      <ChatRoom
        conversation={mockConversationA}
        messages={mockMessages}
        currentUserId="user-me"
        onBack={vi.fn()}
        onSendMessage={vi.fn()}
      />
    );

    const trigger = screen.getByTestId('chat-contact-profile-trigger');
    expect(trigger).toHaveAttribute('title', 'Ver perfil de usuario');
    expect(trigger).toHaveAttribute('aria-label', 'Ver perfil de usuario');
  });

  it('criterio 4: muestra unicamente la informacion que esta autorizado a visualizar cuando la privacidad oculta campos', () => {
    render(
      <ContactProfileModal
        isOpen={true}
        onClose={vi.fn()}
        contact={mockContactHiddenPrivacy}
      />
    );

    expect(screen.queryByTestId('section-contact-info')).not.toBeInTheDocument();
    expect(screen.queryByTestId('contact-profile-email')).not.toBeInTheDocument();
    expect(screen.queryByTestId('section-academic-background')).not.toBeInTheDocument();
    expect(screen.queryByTestId('contact-profile-academic-title')).not.toBeInTheDocument();
    expect(screen.queryByTestId('section-skills')).not.toBeInTheDocument();
  });

  it('criterio 5: al pulsar el boton Cerrar el modal se cierra', () => {
    const handleClose = vi.fn();
    render(
      <ContactProfileModal
        isOpen={true}
        onClose={handleClose}
        contact={mockContactFull}
      />
    );

    const closeButton = screen.getByTestId('contact-profile-close-button');
    expect(closeButton).toHaveTextContent('Cerrar');
    fireEvent.click(closeButton);

    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('criterio 6: al cerrar el modal el usuario permanece en la misma conversacion', () => {
    render(
      <ChatRoom
        conversation={mockConversationA}
        messages={mockMessages}
        currentUserId="user-me"
        onBack={vi.fn()}
        onSendMessage={vi.fn()}
      />
    );

    const trigger = screen.getByTestId('chat-contact-profile-trigger');
    fireEvent.click(trigger);

    expect(screen.getByTestId('contact-profile-modal')).toBeInTheDocument();

    const closeButton = screen.getByTestId('contact-profile-close-button');
    fireEvent.click(closeButton);

    expect(screen.queryByTestId('contact-profile-modal')).not.toBeInTheDocument();
    expect(screen.getByTestId('messages-container')).toBeInTheDocument();
    expect(screen.getByText('Hola que tal')).toBeInTheDocument();
  });

  it('criterio 7: al cambiar de conversacion y abrir el modal se muestra el perfil del nuevo contacto', () => {
    const { rerender } = render(
      <ChatRoom
        conversation={mockConversationA}
        messages={mockMessages}
        currentUserId="user-me"
        onBack={vi.fn()}
        onSendMessage={vi.fn()}
      />
    );

    const triggerA = screen.getByTestId('chat-contact-profile-trigger');
    fireEvent.click(triggerA);

    expect(screen.getByTestId('contact-profile-name')).toHaveTextContent(
      'Carlos Rojas Murillo'
    );

    const closeButton = screen.getByTestId('contact-profile-close-button');
    fireEvent.click(closeButton);

    rerender(
      <ChatRoom
        conversation={mockConversationB}
        messages={mockMessages}
        currentUserId="user-me"
        onBack={vi.fn()}
        onSendMessage={vi.fn()}
      />
    );

    const triggerB = screen.getByTestId('chat-contact-profile-trigger');
    fireEvent.click(triggerB);

    expect(screen.getByTestId('contact-profile-name')).toHaveTextContent(
      'Ana Vargas'
    );
  });

  it('criterio 8: muestra la foto cuando esta registrada y muestra iniciales cuando no tiene foto', () => {
    const { unmount } = render(
      <ContactProfileModal
        isOpen={true}
        onClose={vi.fn()}
        contact={mockContactFull}
      />
    );

    const img = screen.getByTestId('contact-profile-avatar-img');
    expect(img).toHaveAttribute('src', mockContactFull.avatarUrl);

    unmount();

    render(
      <ContactProfileModal
        isOpen={true}
        onClose={vi.fn()}
        contact={mockContactWithoutPhoto}
      />
    );

    expect(screen.queryByTestId('contact-profile-avatar-img')).not.toBeInTheDocument();
    expect(screen.getByTestId('contact-profile-avatar-initials')).toHaveTextContent('AV');
  });

  it('criterio 9: muestra el rol registrado para el contacto', () => {
    render(
      <ContactProfileModal
        isOpen={true}
        onClose={vi.fn()}
        contact={mockContactFull}
      />
    );

    expect(screen.getByTestId('contact-profile-role')).toHaveTextContent('Titulado');
  });

  it('criterio 10: muestra el correo visible en la seccion INFORMACION DE CONTACTO', () => {
    render(
      <ContactProfileModal
        isOpen={true}
        onClose={vi.fn()}
        contact={mockContactFull}
      />
    );

    expect(screen.getByText('INFORMACIÓN DE CONTACTO')).toBeInTheDocument();
    expect(screen.getByTestId('contact-profile-email')).toHaveTextContent(
      'carlos.rojas@est.umss.edu'
    );
  });

  it('criterio 11: muestra el titulo academico registrado y visible en FORMACION ACADEMICA', () => {
    render(
      <ContactProfileModal
        isOpen={true}
        onClose={vi.fn()}
        contact={mockContactFull}
      />
    );

    expect(screen.getByText('FORMACIÓN ACADÉMICA')).toBeInTheDocument();
    expect(screen.getByTestId('contact-profile-academic-title')).toHaveTextContent(
      'Lic. en Ingenieria de Sistemas'
    );
  });

  it('criterio 12: muestra las competencias tecnicas registradas y visibles en COMPETENCIAS TECNICAS', () => {
    render(
      <ContactProfileModal
        isOpen={true}
        onClose={vi.fn()}
        contact={mockContactFull}
      />
    );

    expect(screen.getByText('COMPETENCIAS TÉCNICAS')).toBeInTheDocument();
    expect(screen.getByText('TypeScript')).toBeInTheDocument();
    expect(screen.getByText('React')).toBeInTheDocument();
    expect(screen.getByText('NestJS')).toBeInTheDocument();
    expect(screen.getByText('PostgreSQL')).toBeInTheDocument();
  });
});
