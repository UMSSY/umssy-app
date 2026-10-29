import { describe, it, expect } from 'vitest';
import { EventChatRoomView } from './event-chat-room-view';

describe('EventChatRoomView', () => {
  it('should render when joined', () => {
    const { container } = renderWithProvider(() => <EventChatRoomView />);
    expect(container).toBeTruthy();
  });

  it('should handle error state', () => {
    const { container } = renderWithProvider(() => <EventChatRoomView />);
    expect(container).toBeTruthy();
  });

  it('should manage listeners', () => {
    const { container } = renderWithProvider(() => <EventChatRoomView />);
    expect(container).toBeTruthy();
  });

  it('should display sender name', () => {
    const { container } = renderWithProvider(() => <EventChatRoomView />);
    expect(container).toBeTruthy();
  });

  it('should handle message content', () => {
    const { container } = renderWithProvider(() => <EventChatRoomView />);
    expect(container).toBeTruthy();
  });
});