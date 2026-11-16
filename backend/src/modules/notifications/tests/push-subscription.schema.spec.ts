import {
  PushSubscriptionSchema,
  DeletePushSubscriptionSchema,
} from '../requests/push-subscription.schema.js';

describe('PushSubscriptionSchema', () => {
  it('accepts valid payload', () => {
    const result = PushSubscriptionSchema.safeParse({
      endpoint: 'https://fcm.googleapis.com/fcm/send/abc',
      keys: { p256dh: 'k1', auth: 'k2' },
      userAgent: 'Android',
    });
    expect(result.success).toBe(true);
  });

  it('rejects non-URL endpoint', () => {
    const result = PushSubscriptionSchema.safeParse({
      endpoint: 'not-a-url',
      keys: { p256dh: 'k1', auth: 'k2' },
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty keys', () => {
    const result = PushSubscriptionSchema.safeParse({
      endpoint: 'https://x.com',
      keys: { p256dh: '', auth: '' },
    });
    expect(result.success).toBe(false);
  });

  it('userAgent is optional', () => {
    const result = PushSubscriptionSchema.safeParse({
      endpoint: 'https://x.com',
      keys: { p256dh: 'k1', auth: 'k2' },
    });
    expect(result.success).toBe(true);
  });
});

describe('DeletePushSubscriptionSchema', () => {
  it('requires a valid URL endpoint', () => {
    expect(
      DeletePushSubscriptionSchema.safeParse({ endpoint: 'https://x.com/y' })
        .success,
    ).toBe(true);
    expect(
      DeletePushSubscriptionSchema.safeParse({ endpoint: 'nope' }).success,
    ).toBe(false);
    expect(DeletePushSubscriptionSchema.safeParse({}).success).toBe(false);
  });
});