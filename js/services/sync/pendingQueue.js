/**
 * Offline-first pending sync queue (localStorage).
 */
const QUEUE_KEY = "ikigai_sync_queue_v1";

function readQueue() {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeQueue(items) {
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(items.slice(-100)));
  } catch {
    /* ignore */
  }
}

export function enqueueSyncJob(job) {
  const queue = readQueue();
  queue.push({
    id: `job_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    createdAt: new Date().toISOString(),
    ...job
  });
  writeQueue(queue);
  return queue;
}

export function listSyncJobs() {
  return readQueue();
}

export function clearSyncJobs() {
  writeQueue([]);
}

export function removeSyncJob(id) {
  writeQueue(readQueue().filter((j) => j.id !== id));
}
