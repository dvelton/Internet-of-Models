/// <reference types="vite/client" />

interface SparkKV {
  get<T>(key: string): Promise<T | null>;
  set(key: string, value: unknown): Promise<void>;
  delete(key: string): Promise<void>;
}

interface SparkUser {
  id: string;
  login: string;
  email: string;
  avatarUrl: string;
  isOwner: boolean;
}

interface Spark {
  kv: SparkKV;
  user(): Promise<SparkUser>;
}

declare const spark: Spark;