// localStorage-backed mock for @github/spark KV store
// Replaces Spark dependency so the app can run as a standalone static site

const STORAGE_PREFIX = 'iom:';

class KVStore {
  async get<T>(key: string): Promise<T | null> {
    try {
      const raw = localStorage.getItem(STORAGE_PREFIX + key);
      return raw ? JSON.parse(raw) as T : null;
    } catch {
      return null;
    }
  }

  async set(key: string, value: unknown): Promise<void> {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
  }

  async delete(key: string): Promise<void> {
    localStorage.removeItem(STORAGE_PREFIX + key);
  }
}

class SparkMock {
  kv = new KVStore();

  async user() {
    return {
      id: 'demo-user',
      login: 'demo',
      email: 'demo@example.com',
      avatarUrl: '',
      isOwner: true,
    };
  }
}

const spark = new SparkMock();

// Attach to window as the global `spark` object (matching Spark runtime behavior)
(window as any).spark = spark;

export default spark;
