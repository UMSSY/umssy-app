import { UnauthorizedException } from '@nestjs/common';
import { extractUserId, USER_ID_HEADER } from './current-user-id.decorator.js';

const USER_ID = '6f1c2b1e-4b7a-4c1e-9d3f-2a5b8c9d0e1f';

describe('extractUserId', () => {
  it('returns the user id sent in the header', () => {
    expect(extractUserId({ headers: { [USER_ID_HEADER]: USER_ID } })).toBe(
      USER_ID,
    );
  });

  it('uses the first value when the header is repeated', () => {
    expect(
      extractUserId({ headers: { [USER_ID_HEADER]: [USER_ID, 'other'] } }),
    ).toBe(USER_ID);
  });

  it.each([undefined, '', 'not-a-uuid'])(
    'rejects the header value %s',
    (value) => {
      expect(() =>
        extractUserId({ headers: { [USER_ID_HEADER]: value } }),
      ).toThrow(UnauthorizedException);
    },
  );
});
