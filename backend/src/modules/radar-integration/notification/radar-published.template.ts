import { formatBoliviaDateTime } from '../../../common/utils/date-time.js';
import type { NotificationTemplateDefinition } from '../../notifications/types/notification-template-definition.type.js';
import type { NotificationType } from '../../notifications/types/notification-type.enum.js';
import { truncateNotificationText } from '../../notifications/utils/truncate-notification-text.js';

export const RADAR_PUBLISHED_TEMPLATE: NotificationTemplateDefinition<NotificationType.RADAR_PUBLISHED> =
  {
    renderTitle: () => 'Nueva versión del Radar publicada',
    renderBody: ({ radarVersion, publishedAt }) =>
      truncateNotificationText(
        `La versión ${radarVersion} de tu radar se publicó el ${formatBoliviaDateTime(publishedAt)} (hora de Bolivia).`,
      ),
  };
