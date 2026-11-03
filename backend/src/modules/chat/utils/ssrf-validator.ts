import * as dns from 'node:dns/promises';
import * as net from 'node:net';

/**
 * Checks if an IPv4 address is in private, loopback, link-local, or reserved ranges.
 */
export function isPrivateOrReservedIPv4(ip: string): boolean {
  const parts = ip.split('.').map((part) => Number.parseInt(part, 10));
  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part) || part < 0 || part > 255)) {
    return true; // Malformed IPv4 is treated as unsafe
  }

  const [p0, p1, p2] = parts;

  // 0.0.0.0/8 (Current network)
  if (p0 === 0) return true;

  // 10.0.0.0/8 (Private-Use)
  if (p0 === 10) return true;

  // 100.64.0.0/10 (Shared Address Space / CGNAT)
  if (p0 === 100 && p1 >= 64 && p1 <= 127) return true;

  // 127.0.0.0/8 (Loopback)
  if (p0 === 127) return true;

  // 169.254.0.0/16 (Link-Local & Cloud Metadata, e.g. 169.254.169.254)
  if (p0 === 169 && p1 === 254) return true;

  // 172.16.0.0/12 (Private-Use: 172.16.0.0 - 172.31.255.255)
  if (p0 === 172 && p1 >= 16 && p1 <= 31) return true;

  // 192.0.0.0/24 (IETF Protocol Assignments)
  if (p0 === 192 && p1 === 0 && p2 === 0) return true;

  // 192.0.2.0/24 (Documentation / TEST-NET-1)
  if (p0 === 192 && p1 === 0 && p2 === 2) return true;

  // 192.168.0.0/16 (Private-Use)
  if (p0 === 192 && p1 === 168) return true;

  // 198.18.0.0/15 (Benchmarking)
  if (p0 === 198 && (p1 === 18 || p1 === 19)) return true;

  // 198.51.100.0/24 (Documentation / TEST-NET-2)
  if (p0 === 198 && p1 === 51 && p2 === 100) return true;

  // 203.0.113.0/24 (Documentation / TEST-NET-3)
  if (p0 === 203 && p1 === 0 && p2 === 113) return true;

  // 224.0.0.0/4 (Multicast)
  if (p0 >= 224 && p0 <= 239) return true;

  // 240.0.0.0/4 (Reserved for future use & 255.255.255.255 broadcast)
  if (p0 >= 240) return true;

  return false;
}

/**
 * Checks if an IPv6 address is loopback, unique local, link-local, or IPv4-mapped private.
 */
export function isPrivateOrReservedIPv6(ip: string): boolean {
  const normalized = ip.toLowerCase().trim();

  // :: or ::1 (Unspecified / Loopback)
  if (normalized === '::' || normalized === '::1' || normalized === '0:0:0:0:0:0:0:1') {
    return true;
  }

  // IPv4-mapped IPv6 (::ffff:192.168.1.1 or ::ffff:c0a8:0101)
  if (normalized.startsWith('::ffff:') || normalized.startsWith('0:0:0:0:0:ffff:')) {
    const rawIpv4 = normalized.split(':').pop() ?? '';
    if (net.isIPv4(rawIpv4)) {
      return isPrivateOrReservedIPv4(rawIpv4);
    }
    return true;
  }

  // Unique Local Address (fc00::/7 -> fc00... or fd00...)
  if (normalized.startsWith('fc') || normalized.startsWith('fd')) {
    return true;
  }

  // Link-Local Unicast (fe80::/10 -> fe8, fe9, fea, feb...)
  if (/^fe[89ab]/i.test(normalized)) {
    return true;
  }

  return false;
}

/**
 * Validates that an IP address (v4 or v6) is safe for external requests.
 */
export function isPrivateOrReservedIp(ip: string): boolean {
  if (net.isIPv4(ip)) {
    return isPrivateOrReservedIPv4(ip);
  }
  if (net.isIPv6(ip)) {
    return isPrivateOrReservedIPv6(ip);
  }
  return true;
}

/**
 * Validates a URL against Server-Side Request Forgery (SSRF).
 * Returns true if the URL is safe to fetch, or false if it targets local/internal/private resources.
 */
export async function validateSafeUrl(rawUrl: string): Promise<boolean> {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return false;
  }

  // Protocol must be strictly http: or https:
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return false;
  }

  const hostname = parsed.hostname.toLowerCase().trim();

  // Hostname must be present
  if (!hostname) {
    return false;
  }

  // Reject obvious local domain names
  if (
    hostname === 'localhost' ||
    hostname.endsWith('.localhost') ||
    hostname.endsWith('.local') ||
    hostname.endsWith('.internal') ||
    hostname.endsWith('.lan') ||
    hostname.endsWith('.home') ||
    hostname.endsWith('.corp')
  ) {
    return false;
  }

  // Direct IP address in hostname
  if (net.isIP(hostname)) {
    return !isPrivateOrReservedIp(hostname);
  }

  // Decimal/Octal/Hex IP bypass checks (e.g., 2130706433 or 0x7f.1)
  if (/^0x[0-9a-f]+$/i.test(hostname) || /^\d+$/.test(hostname)) {
    return false;
  }

  // Resolve hostname via DNS to prevent DNS rebinding / domain aliasing
  try {
    const records = await dns.lookup(hostname, { all: true });
    if (!records || records.length === 0) {
      return false;
    }

    for (const record of records) {
      if (isPrivateOrReservedIp(record.address)) {
        return false;
      }
    }
  } catch {
    // If domain cannot be resolved, reject it safely
    return false;
  }

  return true;
}

