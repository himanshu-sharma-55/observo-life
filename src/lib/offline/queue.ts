"use client";

const DB_NAME = "observolife-offline";
const STORE_NAME = "pending-events";

type PendingEvent = {
  id: string;
  rawText: string;
  occurredAt?: string;
  tags?: string[];
  createdAt: string;
};

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export function isOnline() {
  return typeof navigator !== "undefined" ? navigator.onLine : true;
}

export async function enqueueOfflineEvent(event: {
  rawText: string;
  occurredAt?: string;
  tags?: string[];
}) {
  const db = await openDb();

  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put({
      id: crypto.randomUUID(),
      rawText: event.rawText,
      occurredAt: event.occurredAt,
      tags: event.tags,
      createdAt: new Date().toISOString(),
    } satisfies PendingEvent);

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function flushOfflineQueue(
  postEvent: (payload: Record<string, unknown>) => Promise<unknown>,
) {
  if (!isOnline()) return;

  const db = await openDb();
  const pending = await new Promise<PendingEvent[]>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const request = tx.objectStore(STORE_NAME).getAll();
    request.onsuccess = () => resolve(request.result as PendingEvent[]);
    request.onerror = () => reject(request.error);
  });

  for (const item of pending) {
    try {
      await postEvent({
        rawText: item.rawText,
        occurredAt: item.occurredAt,
        tags: item.tags?.length ? item.tags : undefined,
      });
    } catch {
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("observolife-offline-sync-error"));
      }
      break;
    }

    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      tx.objectStore(STORE_NAME).delete(item.id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }
}

export function registerOfflineSync(postEvent: (payload: Record<string, unknown>) => Promise<unknown>) {
  if (typeof window === "undefined") return;

  window.addEventListener("online", () => {
    flushOfflineQueue(postEvent).catch(() => undefined);
  });
}
