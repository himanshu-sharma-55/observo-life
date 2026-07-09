export const EVENTS_PAGE_SIZE = 50;
export const SEARCH_PAGE_SIZE = 25;
export const FEED_PAGE_SIZE = 20;

export function hasMoreResults(count: number, limit: number) {
  return count === limit;
}
