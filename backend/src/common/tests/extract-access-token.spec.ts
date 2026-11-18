import { describe, expect, it } from 'vitest';
import { extractAccessToken } from '../utils/extract-access-token.js';

const request = (
  headers: Record<string, string> = {},
  cookies?: Record<string, string>,
) => ({ headers, cookies }) as Parameters<typeof extractAccessToken>[0];

describe('extractAccessToken', () => {
  it('reads the bearer token from the Authorization header', () => {
    expect(
      extractAccessToken(request({ authorization: 'Bearer abc.def' })),
    ).toEqual({ token: 'abc.def', source: 'bearer' });
  });

  it('reads the token from the session cookie when there is no header', () => {
    expect(
      extractAccessToken(request({}, { umssy_access: ' cookie.jwt ' })),
    ).toEqual({ token: 'cookie.jwt', source: 'cookie' });
  });

  it('prefers the Authorization header over the cookie', () => {
    expect(
      extractAccessToken(
        request({ authorization: 'Bearer header.jwt' }, { umssy_access: 'c' }),
      ),
    ).toEqual({ token: 'header.jwt', source: 'bearer' });
  });

  it('does not fall back to the cookie when the header is malformed', () => {
    expect(
      extractAccessToken(
        request({ authorization: 'Basic abc' }, { umssy_access: 'c' }),
      ),
    ).toBeNull();
    expect(
      extractAccessToken(
        request({ authorization: 'Bearer   ' }, { umssy_access: 'c' }),
      ),
    ).toBeNull();
  });

  it('returns null when there is no credential at all', () => {
    expect(extractAccessToken(request())).toBeNull();
    expect(extractAccessToken(request({}, {}))).toBeNull();
    expect(extractAccessToken(request({}, { umssy_access: '  ' }))).toBeNull();
  });
});
