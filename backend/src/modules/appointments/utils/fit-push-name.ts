import { PUSH_TEXT_MAX_LENGTH } from '../../notifications/constants/push-notification.constants.js';

const ELLIPSIS = '...';

// Acorta solo el nombre para que el texto del push quepa sin perder la fecha y
// la hora. Se corta por caracteres completos para no partir un emoji en dos.
export const fitPushName = (
  name: string,
  render: (name: string) => string,
): string => {
  const body = render(name);
  if (body.length <= PUSH_TEXT_MAX_LENGTH) {
    return body;
  }
  const nameLength = Math.max(
    PUSH_TEXT_MAX_LENGTH - render('').length - ELLIPSIS.length,
    0,
  );
  let kept = '';
  for (const character of Array.from(name)) {
    if (kept.length + character.length > nameLength) {
      break;
    }
    kept += character;
  }
  return render(`${kept.trimEnd()}${ELLIPSIS}`);
};
