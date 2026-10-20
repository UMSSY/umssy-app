import { describe, expect, it } from 'vitest';
import { sendMessageSchema } from './send-message.schema.js';

describe('sendMessageSchema', () => {
  const validUuid = '123e4567-e89b-12d3-a456-426614174000';

  it('accepts valid text messages', () => {
    const result = sendMessageSchema.safeParse({
      conversationId: validUuid,
      content: 'Hola mundo',
    });
    expect(result.success).toBe(true);
  });

  it('accepts messages containing 250, 251 and 500 simple emojis (😀)', () => {
    expect(
      sendMessageSchema.safeParse({
        conversationId: validUuid,
        content: '😀'.repeat(250),
      }).success,
    ).toBe(true);

    expect(
      sendMessageSchema.safeParse({
        conversationId: validUuid,
        content: '😀'.repeat(251),
      }).success,
    ).toBe(true);

    expect(
      sendMessageSchema.safeParse({
        conversationId: validUuid,
        content: '😀'.repeat(500),
      }).success,
    ).toBe(true);
  });

  it('accepts messages containing 250, 251 and 500 flags (🇧🇴)', () => {
    expect(
      sendMessageSchema.safeParse({
        conversationId: validUuid,
        content: '🇧🇴'.repeat(250),
      }).success,
    ).toBe(true);

    expect(
      sendMessageSchema.safeParse({
        conversationId: validUuid,
        content: '🇧🇴'.repeat(251),
      }).success,
    ).toBe(true);

    expect(
      sendMessageSchema.safeParse({
        conversationId: validUuid,
        content: '🇧🇴'.repeat(500),
      }).success,
    ).toBe(true);
  });

  it('accepts messages containing 250, 251 and 500 heart emojis (❣️)', () => {
    expect(
      sendMessageSchema.safeParse({
        conversationId: validUuid,
        content: '❣️'.repeat(250),
      }).success,
    ).toBe(true);

    expect(
      sendMessageSchema.safeParse({
        conversationId: validUuid,
        content: '❣️'.repeat(251),
      }).success,
    ).toBe(true);

    expect(
      sendMessageSchema.safeParse({
        conversationId: validUuid,
        content: '❣️'.repeat(500),
      }).success,
    ).toBe(true);
  });

  it('accepts messages with 250 text characters and 250 heart emojis (500 total)', () => {
    const result = sendMessageSchema.safeParse({
      conversationId: validUuid,
      content: 'a'.repeat(250) + '❣️'.repeat(250),
    });
    expect(result.success).toBe(true);
  });

  it('rejects messages with more than 500 emojis or characters', () => {
    expect(
      sendMessageSchema.safeParse({
        conversationId: validUuid,
        content: '🇧🇴'.repeat(501),
      }).success,
    ).toBe(false);

    expect(
      sendMessageSchema.safeParse({
        conversationId: validUuid,
        content: '❣️'.repeat(501),
      }).success,
    ).toBe(false);
  });

  it('rejects empty or whitespace-only messages', () => {
    const result = sendMessageSchema.safeParse({
      conversationId: validUuid,
      content: '   ',
    });
    expect(result.success).toBe(false);
  });
});
