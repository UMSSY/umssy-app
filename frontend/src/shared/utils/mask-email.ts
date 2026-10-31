export function maskEmail(email: string): string {
  const [local = "", domain] = email.split("@");
  if (!domain) return email;
  const visible = local.slice(0, Math.min(2, Math.max(1, local.length - 1)));
  return `${visible}***@${domain}`;
}

