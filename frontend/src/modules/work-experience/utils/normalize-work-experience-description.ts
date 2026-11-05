
export function normalizeWorkExperienceDescription(
  description: string | null,
): string | null {
  if (description === null) {
    return null;
  }

  const protectedTerms = [
    { pattern: /\bc\+\+/gu, placeholder: "\uE000", value: "c++" },
    { pattern: /\bc#/gu, placeholder: "\uE001", value: "c#" },
    { pattern: /\bf#/gu, placeholder: "\uE002", value: "f#" },
    { pattern: /\.net\b/gu, placeholder: "\uE003", value: ".net" },
    { pattern: /\bnode\.js\b/gu, placeholder: "\uE004", value: "node.js" },
  ];

  let normalized = description
    .normalize("NFC")
    .toLocaleLowerCase("es");

  for (const term of protectedTerms) {
    normalized = normalized.replace(term.pattern, term.placeholder);
  }

  normalized = normalized
    .replace(/[^\p{L}\p{N}\s\uE000-\uE004]/gu, " ")
    .replace(/\s+/gu, " ")
    .trim();

  for (const term of protectedTerms) {
    normalized = normalized.replaceAll(term.placeholder, term.value);
  }

  return normalized;
}
