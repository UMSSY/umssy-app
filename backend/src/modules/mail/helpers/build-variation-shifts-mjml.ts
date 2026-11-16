export interface VariationShiftRow {
  questionStatement: string;
  optionLabel: string;
  currentPercentage: number;
  previousPercentage: number;
  difference: number;
  direction: 'up' | 'down';
}

const COLORS = {
  up: { text: '#0a7a3d', background: '#e8f6ee' },
  down: { text: '#b42318', background: '#fdecea' },
};

function escapeMjml(value: string): string {
  return value.replace(
    /[&<>"'{}]/g,
    (char) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
        '{': '&#123;',
        '}': '&#125;',
      })[char]!,
  );
}

function formatDifference(shift: VariationShiftRow): string {
  const arrow = shift.direction === 'up' ? '▲' : '▼';
  const sign = shift.difference > 0 ? '+' : '';
  return `${arrow} ${sign}${shift.difference} pp`;
}

/**
 * Agrupa las variaciones por pregunta y resalta la opción que superó el umbral
 * con color según suba o baje. Devuelve markup MJML con los datos ya escapados.
 */
export function buildVariationShiftsMjml(shifts: VariationShiftRow[]): string {
  const groups = new Map<string, VariationShiftRow[]>();
  for (const shift of shifts) {
    groups.set(shift.questionStatement, [
      ...(groups.get(shift.questionStatement) ?? []),
      shift,
    ]);
  }

  return [...groups.entries()]
    .map(([question, rows]) => {
      const body = rows
        .map((shift) => {
          const color = COLORS[shift.direction];
          return (
            `<tr style="background-color:${color.background};">` +
            `<td style="padding:8px 10px;font-weight:700;color:${color.text};">${escapeMjml(shift.optionLabel)}</td>` +
            `<td style="padding:8px 10px;white-space:nowrap;">${shift.previousPercentage}% → ${shift.currentPercentage}%</td>` +
            `<td style="padding:8px 10px;white-space:nowrap;font-weight:700;color:${color.text};text-align:right;">${formatDifference(shift)}</td>` +
            `</tr>`
          );
        })
        .join('');
      return (
        `<mj-text font-weight="700" padding="12px 0 4px">«${escapeMjml(question)}»</mj-text>` +
        `<mj-table padding="0 0 8px" font-size="13px">${body}</mj-table>`
      );
    })
    .join('');
}
