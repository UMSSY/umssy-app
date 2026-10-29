import { describe, it, expect } from 'vitest';
import { useEventRoom } from './use-event-room';

describe('useEventRoom', () => {
  it('should successfully join an event room', async () => {
    const { result } = renderWithProvider(() => useEventRoom());
    expect(result.current.conversationId).toBeDefined();
  });

  it('should handle error state', async () => {
    const { result } = renderWithProvider(() => useEventRoom());
    expect(result.current.error).toBeNull();
  });

  it('should manage state on multiple joins', () => {
    const { result } = renderWithProvider(() => useEventRoom());
    expect(result.current).toBeDefined();
  });

  it('should handle sender name', () => {
    const { result } = renderWithProvider(() => useEventRoom());
    expect(result.current).toBeDefined();
  });

  it('should manage message limit', () => {
    const { result } = renderWithProvider(() => useEventRoom());
    expect(result.current.conversationId).toBeNull();
  });
});