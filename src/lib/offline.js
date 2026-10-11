const QUEUE_KEY = 'kinetica:saveQueue';
const PROGRESS_KEY = 'kinetica:progress';

export const isOnline = () =>
  typeof navigator === 'undefined' ? true : navigator.onLine;

export function getQueuedResults() {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
  } catch {
    return [];
  }
}

export function queueResult(payload) {
  const queue = getQueuedResults();
  queue.push({ ...payload, _queuedAt: Date.now() });
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch {
    /* storage full or unavailable */
  }
}

/**
 * Attempts to send every queued result to the backend.
 * Items that fail (still offline) stay in the queue, up to 3 attempts.
 */
export async function flushQueue(createFn) {
  if (!isOnline()) return { flushed: 0, remaining: 0 };
  const queue = getQueuedResults();
  if (queue.length === 0) return { flushed: 0, remaining: 0 };

  const remaining = [];
  let flushed = 0;
  for (const item of queue) {
    const attempts = (item._attempts || 0) + 1;
    try {
      const { _queuedAt, _attempts, ...payload } = item;
      await createFn(payload);
      flushed += 1;
    } catch {
      if (attempts < 3) {
        remaining.push({ ...item, _attempts: attempts });
      }
    }
  }
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(remaining));
  } catch {
    /* storage unavailable */
  }
  return { flushed, remaining: remaining.length };
}

export function getLocalProgress() {
  try {
    return JSON.parse(localStorage.getItem(PROGRESS_KEY) || 'null');
  } catch {
    return null;
  }
}

export function setLocalProgress(data) {
  try {
    const { loading, ...rest } = data;
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(rest));
  } catch {
    /* storage unavailable */
  }
}