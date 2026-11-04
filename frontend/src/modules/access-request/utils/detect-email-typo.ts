import { KNOWN_EMAIL_DOMAINS, KNOWN_EMAIL_TLDS } from "../constants/personal-data-rules.constants";

function editDistance(source: string, target: string): number {
  const distances: number[][] = Array.from({ length: source.length + 1 }, (_, row) =>
    Array.from({ length: target.length + 1 }, (_, column) => (row === 0 ? column : column === 0 ? row : 0)),
  );

  for (let row = 1; row <= source.length; row += 1) {
    for (let column = 1; column <= target.length; column += 1) {
      const cost = source[row - 1] === target[column - 1] ? 0 : 1;
      let best = Math.min(distances[row - 1][column] + 1, distances[row][column - 1] + 1, distances[row - 1][column - 1] + cost);
      if (row > 1 && column > 1 && source[row - 1] === target[column - 2] && source[row - 2] === target[column - 1]) {
        best = Math.min(best, distances[row - 2][column - 2] + 1);
      }
      distances[row][column] = best;
    }
  }

  return distances[source.length][target.length];
}

const closest = (value: string, options: readonly string[]) => options.find((option) => editDistance(value, option) === 1);

const splitDomain = (domain: string) => {
  const lastDot = domain.lastIndexOf(".");
  return { name: domain.slice(0, lastDot), tld: domain.slice(lastDot + 1) };
};

export function detectEmailTypo(email: string): string | null {
  const domain = email.slice(email.lastIndexOf("@") + 1);
  if (domain.length === 0 || (KNOWN_EMAIL_DOMAINS as readonly string[]).includes(domain)) return null;

  const { name, tld } = splitDomain(domain);

  if (!(KNOWN_EMAIL_TLDS as readonly string[]).includes(tld)) {
    const closestTld = closest(tld, KNOWN_EMAIL_TLDS);
    return closestTld ? `${name}.${closestTld}` : null;
  }

  const sameTld = KNOWN_EMAIL_DOMAINS.filter((known) => splitDomain(known).tld === tld).map((known) => splitDomain(known).name);
  const closestName = closest(name, sameTld);
  return closestName ? `${closestName}.${tld}` : null;
}
