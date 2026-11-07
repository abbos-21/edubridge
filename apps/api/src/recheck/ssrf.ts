import { isIP } from 'node:net';

/** True when the address is on the public internet. Everything private, local, shared or reserved is refused (ToR H11). */
export function isPublicIp(ip: string): boolean {
  const kind = isIP(ip);
  if (kind === 4) return publicV4(ip.split('.').map(Number) as [number, number, number, number]);
  if (kind === 6) return publicV6(ip.toLowerCase());
  return false;
}

function publicV4([a, b, c]: [number, number, number, number]): boolean {
  if (a === 0 || a === 10 || a === 127) return false; // this network, private, loopback
  if (a === 100 && b >= 64 && b <= 127) return false; // carrier-grade NAT
  if (a === 169 && b === 254) return false; // link-local, cloud metadata
  if (a === 172 && b >= 16 && b <= 31) return false;
  if (a === 192 && b === 0 && (c === 0 || c === 2)) return false; // IETF / documentation
  if (a === 192 && b === 168) return false;
  if (a === 192 && b === 88 && c === 99) return false;
  if (a === 198 && (b === 18 || b === 19)) return false; // benchmarking
  if (a === 198 && b === 51 && c === 100) return false;
  if (a === 203 && b === 0 && c === 113) return false;
  if (a >= 224) return false; // multicast, reserved, broadcast
  return true;
}

function publicV6(ip: string): boolean {
  // IPv4-mapped (::ffff:a.b.c.d or ::ffff:xxxx:xxxx): judge the embedded IPv4 address
  const mapped = ip.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return isPublicIp(mapped[1]!);
  const hex = ip.match(/^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/);
  if (hex) {
    const hi = parseInt(hex[1]!, 16);
    const lo = parseInt(hex[2]!, 16);
    return isPublicIp(`${hi >> 8}.${hi & 255}.${lo >> 8}.${lo & 255}`);
  }
  if (ip === '::' || ip === '::1') return false;
  if (/^(fc|fd)/.test(ip)) return false; // unique local
  if (/^fe[89ab]/.test(ip)) return false; // link-local
  if (/^ff/.test(ip)) return false; // multicast
  if (/^2001:(0)?db8:/.test(ip) || ip.startsWith('2001:0:')) return false; // documentation, Teredo
  if (ip.startsWith('64:ff9b:')) return false; // NAT64
  if (ip.startsWith('2002:')) return false; // 6to4 can wrap private IPv4
  return true;
}

/** Only http(s), no credentials in the URL, only the standard ports. */
export function checkRecheckUrl(raw: string, relaxed = false): { ok: true; url: URL } | { ok: false; reason: string } {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return { ok: false, reason: 'invalid_url' };
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return { ok: false, reason: 'bad_protocol' };
  if (url.username || url.password) return { ok: false, reason: 'credentials_in_url' };
  if (relaxed) return { ok: true, url }; // tests only: a local fake site on a random port
  if (isIP(url.hostname.replace(/^\[|\]$/g, '')) && !isPublicIp(url.hostname.replace(/^\[|\]$/g, ''))) return { ok: false, reason: 'blocked_address' };
  if (url.port && url.port !== '80' && url.port !== '443') return { ok: false, reason: 'bad_port' };
  return { ok: true, url };
}
