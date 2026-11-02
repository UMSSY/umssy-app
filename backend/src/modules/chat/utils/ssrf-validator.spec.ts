import { describe, expect, it } from 'vitest';
import {
  isPrivateOrReservedIPv4,
  isPrivateOrReservedIPv6,
  isPrivateOrReservedIp,
  validateSafeUrl,
} from './ssrf-validator.js';

describe('SSRF Validator', () => {
  describe('isPrivateOrReservedIPv4', () => {
    it('identifies loopback addresses as private/reserved', () => {
      expect(isPrivateOrReservedIPv4('127.0.0.1')).toBe(true);
      expect(isPrivateOrReservedIPv4('127.0.0.254')).toBe(true);
    });

    it('identifies RFC 1918 private ranges as private', () => {
      expect(isPrivateOrReservedIPv4('10.0.0.1')).toBe(true);
      expect(isPrivateOrReservedIPv4('172.16.0.1')).toBe(true);
      expect(isPrivateOrReservedIPv4('172.31.255.255')).toBe(true);
      expect(isPrivateOrReservedIPv4('192.168.1.1')).toBe(true);
    });

    it('identifies link-local and cloud metadata as private/reserved', () => {
      expect(isPrivateOrReservedIPv4('169.254.169.254')).toBe(true);
      expect(isPrivateOrReservedIPv4('169.254.1.1')).toBe(true);
    });

    it('identifies 0.0.0.0, multicast, and broadcast as reserved', () => {
      expect(isPrivateOrReservedIPv4('0.0.0.0')).toBe(true);
      expect(isPrivateOrReservedIPv4('224.0.0.1')).toBe(true);
      expect(isPrivateOrReservedIPv4('255.255.255.255')).toBe(true);
    });

    it('allows public IPv4 addresses', () => {
      expect(isPrivateOrReservedIPv4('8.8.8.8')).toBe(false);
      expect(isPrivateOrReservedIPv4('1.1.1.1')).toBe(false);
      expect(isPrivateOrReservedIPv4('93.184.216.34')).toBe(false);
    });

    it('treats malformed IPs as reserved/unsafe', () => {
      expect(isPrivateOrReservedIPv4('invalid.ip')).toBe(true);
      expect(isPrivateOrReservedIPv4('999.999.999.999')).toBe(true);
    });
  });

  describe('isPrivateOrReservedIPv6', () => {
    it('identifies IPv6 loopback as reserved', () => {
      expect(isPrivateOrReservedIPv6('::1')).toBe(true);
      expect(isPrivateOrReservedIPv6('0:0:0:0:0:0:0:1')).toBe(true);
    });

    it('identifies IPv6 unique local (fc00::/7) as private', () => {
      expect(isPrivateOrReservedIPv6('fc00::1')).toBe(true);
      expect(isPrivateOrReservedIPv6('fd12:3456:789a::1')).toBe(true);
    });

    it('identifies IPv6 link-local (fe80::/10) as private', () => {
      expect(isPrivateOrReservedIPv6('fe80::1')).toBe(true);
    });

    it('identifies IPv4-mapped IPv6 pointing to private addresses', () => {
      expect(isPrivateOrReservedIPv6('::ffff:127.0.0.1')).toBe(true);
      expect(isPrivateOrReservedIPv6('::ffff:192.168.1.1')).toBe(true);
    });

    it('allows public IPv6 addresses', () => {
      expect(isPrivateOrReservedIPv6('2606:4700:4700::1111')).toBe(false);
      expect(isPrivateOrReservedIPv6('2001:4860:4860::8888')).toBe(false);
    });
  });

  describe('isPrivateOrReservedIp', () => {
    it('handles both IPv4 and IPv6', () => {
      expect(isPrivateOrReservedIp('192.168.0.1')).toBe(true);
      expect(isPrivateOrReservedIp('8.8.4.4')).toBe(false);
      expect(isPrivateOrReservedIp('::1')).toBe(true);
      expect(isPrivateOrReservedIp('not-an-ip')).toBe(true);
    });
  });

  describe('validateSafeUrl', () => {
    it('rejects invalid or non-http protocols', async () => {
      expect(await validateSafeUrl('javascript:alert(1)')).toBe(false);
      expect(await validateSafeUrl('ftp://example.com')).toBe(false);
      expect(await validateSafeUrl('file:///etc/passwd')).toBe(false);
      expect(await validateSafeUrl('not a url')).toBe(false);
    });

    it('rejects localhost and local domains', async () => {
      expect(await validateSafeUrl('http://localhost:3000')).toBe(false);
      expect(await validateSafeUrl('http://sub.localhost')).toBe(false);
      expect(await validateSafeUrl('http://app.local')).toBe(false);
      expect(await validateSafeUrl('http://api.internal')).toBe(false);
    });

    it('rejects private and loopback IP URLs directly', async () => {
      expect(await validateSafeUrl('http://127.0.0.1/admin')).toBe(false);
      expect(await validateSafeUrl('http://169.254.169.254/latest/meta-data')).toBe(false);
      expect(await validateSafeUrl('http://192.168.1.10')).toBe(false);
      expect(await validateSafeUrl('http://10.0.0.1:8080')).toBe(false);
      expect(await validateSafeUrl('http://[::1]/status')).toBe(false);
    });

    it('rejects integer and hex obfuscated IPs', async () => {
      expect(await validateSafeUrl('http://2130706433/test')).toBe(false);
      expect(await validateSafeUrl('http://0x7f000001/')).toBe(false);
    });

    it('rejects unresolvable domains safely', async () => {
      expect(await validateSafeUrl('http://non-existent-domain-xyz-12345.org')).toBe(false);
    });
  });
});

