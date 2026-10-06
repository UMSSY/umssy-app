import type { AvailabilityBlock } from "./availability-block.types"

export type CacheEntry = {
  blocks: AvailabilityBlock[]
  fetchedAt: number
}
