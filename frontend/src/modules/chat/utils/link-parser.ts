export interface TextSegment {
  type: "text" | "link";
  content: string;
  url?: string;
}

const URL_SEARCH_REGEX = /(https?:\/\/[^\s<]+)/gi;

export function isSafeHttpUrl(rawUrl: string): boolean {
  if (!rawUrl || typeof rawUrl !== "string") return false;
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return false;
    }
    if (!parsed.hostname || parsed.hostname.trim() === "") {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export function extractDomainFromUrl(rawUrl: string): string | null {
  try {
    const parsed = new URL(rawUrl);
    return parsed.hostname.replace(/^www\./i, "");
  } catch {
    return null;
  }
}

export function cleanTrailingPunctuation(rawUrl: string): {
  url: string;
  trailing: string;
} {
  let url = rawUrl;
  let trailing = "";

  while (url.length > 0) {
    const lastChar = url[url.length - 1];
    if ([",", ".", "!", "?", ";", ":", '"', "'", ">", "`"].includes(lastChar)) {
      trailing = lastChar + trailing;
      url = url.slice(0, -1);
    } else if (lastChar === ")") {
      const openCount = (url.match(/\(/g) || []).length;
      const closeCount = (url.match(/\)/g) || []).length;
      if (closeCount > openCount) {
        trailing = lastChar + trailing;
        url = url.slice(0, -1);
      } else {
        break;
      }
    } else if (lastChar === "]") {
      const openCount = (url.match(/\[/g) || []).length;
      const closeCount = (url.match(/\]/g) || []).length;
      if (closeCount > openCount) {
        trailing = lastChar + trailing;
        url = url.slice(0, -1);
      } else {
        break;
      }
    } else {
      break;
    }
  }

  return { url, trailing };
}

export function parseMessageWithLinks(text: string): TextSegment[] {
  if (!text) return [];

  const segments: TextSegment[] = [];
  let lastIndex = 0;

  const matches = Array.from(text.matchAll(URL_SEARCH_REGEX));

  for (const match of matches) {
    const matchIndex = match.index ?? 0;
    const rawMatch = match[0];

    // Texto previo al enlace
    if (matchIndex > lastIndex) {
      segments.push({
        type: "text",
        content: text.slice(lastIndex, matchIndex),
      });
    }

    const { url, trailing } = cleanTrailingPunctuation(rawMatch);

    if (isSafeHttpUrl(url)) {
      segments.push({
        type: "link",
        content: url,
        url,
      });
      if (trailing) {
        segments.push({
          type: "text",
          content: trailing,
        });
      }
    } else {
      // Si la URL no es segura o válida, se mantiene como texto plano
      segments.push({
        type: "text",
        content: rawMatch,
      });
    }

    lastIndex = matchIndex + rawMatch.length;
  }

  // Texto restante tras la última coincidencia
  if (lastIndex < text.length) {
    segments.push({
      type: "text",
      content: text.slice(lastIndex),
    });
  }

  // Combinar segmentos de texto consecutivos para mantener un DOM limpio
  const combinedSegments: TextSegment[] = [];
  for (const segment of segments) {
    const previous = combinedSegments[combinedSegments.length - 1];
    if (previous && previous.type === "text" && segment.type === "text") {
      previous.content += segment.content;
    } else {
      combinedSegments.push(segment);
    }
  }

  return combinedSegments;
}

export function extractFirstValidUrl(text: string): string | null {
  if (!text) return null;
  const segments = parseMessageWithLinks(text);
  for (const segment of segments) {
    if (segment.type === "link" && segment.url) {
      return segment.url;
    }
  }
  return null;
}

