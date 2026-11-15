import { eventsService } from './events.service';
import { eventCategoriesService } from '@/modules/event-categories/services/event-categories.service';

export async function prepareOfflineEvents(token: string, signal: AbortSignal) {
  await eventCategoriesService.getAll(signal, token, true);
  let page = 1;
  while (!signal.aborted) {
    const result = await eventsService.getEvents(
      { page, limit: 50, includeProposals: true },
      signal,
      token,
      true,
    );
    for (let index = 0; index < result.data.length; index += 4) {
      signal.throwIfAborted();
      await Promise.all(
        result.data
          .slice(index, index + 4)
          .map((event) =>
            eventsService.getEvent(event.id, signal, token, true),
          ),
      );
    }
    if (result.data.length < 50) return;
    page++;
  }
  signal.throwIfAborted();
}
