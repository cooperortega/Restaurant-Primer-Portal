import fs from "fs";
import path from "path";
import { Redis } from "@upstash/redis";

const DATA_DIR = path.join(process.cwd(), "data");

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function readJsonSync<T>(filename: string, fallback: T): T {
  try {
    ensureDataDir();
    const fp = path.join(DATA_DIR, filename);
    if (!fs.existsSync(fp)) return fallback;
    return JSON.parse(fs.readFileSync(fp, "utf-8")) as T;
  } catch {
    return fallback;
  }
}

function writeJsonSync<T>(filename: string, data: T): void {
  try {
    ensureDataDir();
    fs.writeFileSync(path.join(DATA_DIR, filename), JSON.stringify(data, null, 2), "utf-8");
  } catch {}
}

const useRedis = !!(
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
);

let _redis: Redis | null = null;
function getRedis(): Redis {
  if (!_redis) {
    _redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
  }
  return _redis;
}

async function readData<T>(key: string, fallback: T): Promise<T> {
  if (useRedis) {
    try {
      const data = await getRedis().get<T>(key);
      if (data !== null && data !== undefined) return data;
    } catch {}
  }
  return readJsonSync(key + ".json", fallback);
}

async function writeData<T>(key: string, data: T): Promise<void> {
  if (useRedis) {
    try {
      await getRedis().set(key, data);
    } catch {}
  } else {
    writeJsonSync(key + ".json", data);
  }
}

export interface Subscriber {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface Newsletter {
  id: string;
  title: string;
  filename: string;
  issueDate: string;
  createdAt: string;
}

export interface AccessToken {
  id: string;
  token: string;
  subscriberId: string;
  newsletterId: string;
  createdAt: string;
}

export interface AccessLog {
  id: string;
  subscriberId: string;
  subscriberName: string;
  subscriberEmail: string;
  newsletterId: string;
  newsletterTitle: string;
  tokenId: string | null;
  ipAddress: string;
  userAgent: string;
  accessedAt: string;
}

export interface SurveyResponse {
  id: string;
  subscriberId: string;
  subscriberName: string;
  subscriberEmail: string;
  newsletterId: string;
  newsletterTitle: string;
  rating: number;
  mostValuable: string;
  wouldRecommend: "yes" | "probably" | "not_yet";
  futureTopics: string;
  comments: string;
  submittedAt: string;
}

export interface AccessRequest {
  id: string;
  name: string;
  email: string;
  message: string;
  status: "pending" | "added" | "granted" | "dismissed";
  submittedAt: string;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export const db = {
  subscribers: {
    getAll: (): Promise<Subscriber[]> => readData("subscribers", []),
    getByEmail: async (email: string): Promise<Subscriber | null> => {
      const all = await readData<Subscriber[]>("subscribers", []);
      return all.find((s) => s.email.toLowerCase() === email.toLowerCase()) ?? null;
    },
    getById: async (id: string): Promise<Subscriber | null> => {
      const all = await readData<Subscriber[]>("subscribers", []);
      return all.find((s) => s.id === id) ?? null;
    },
    create: async (name: string, email: string): Promise<Subscriber> => {
      const all = await readData<Subscriber[]>("subscribers", []);
      const sub: Subscriber = {
        id: "sub-" + Date.now(),
        name,
        email,
        createdAt: new Date().toISOString(),
      };
      all.push(sub);
      await writeData("subscribers", all);
      return sub;
    },
    remove: async (id: string): Promise<void> => {
      const all = await readData<Subscriber[]>("subscribers", []);
      await writeData("subscribers", all.filter((s) => s.id !== id));
    },
  },

  newsletters: {
    getAll: (): Promise<Newsletter[]> => readData("newsletters", []),
    getLatest: async (): Promise<Newsletter | null> => {
      const all = await readData<Newsletter[]>("newsletters", []);
      if (!all.length) return null;
      return all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
    },
    getById: async (id: string): Promise<Newsletter | null> => {
      const all = await readData<Newsletter[]>("newsletters", []);
      return all.find((n) => n.id === id) ?? null;
    },
  },

  tokens: {
    getAll: (): Promise<AccessToken[]> => readData("tokens", []),
    getByToken: async (token: string): Promise<AccessToken | null> => {
      const all = await readData<AccessToken[]>("tokens", []);
      return all.find((t) => t.token === token) ?? null;
    },
    create: async (subscriberId: string, newsletterId: string): Promise<AccessToken> => {
      const all = await readData<AccessToken[]>("tokens", []);
      const t: AccessToken = {
        id: "tok-" + Date.now(),
        token: crypto.randomUUID(),
        subscriberId,
        newsletterId,
        createdAt: new Date().toISOString(),
      };
      all.push(t);
      await writeData("tokens", all);
      return t;
    },
  },

  logs: {
    getAll: async (): Promise<AccessLog[]> => {
      const all = await readData<AccessLog[]>("access_logs", []);
      return all.sort((a, b) => new Date(b.accessedAt).getTime() - new Date(a.accessedAt).getTime());
    },
    create: async (entry: Omit<AccessLog, "id" | "accessedAt">): Promise<AccessLog> => {
      const all = await readData<AccessLog[]>("access_logs", []);
      const log: AccessLog = {
        ...entry,
        id: "log-" + Date.now(),
        accessedAt: new Date().toISOString(),
      };
      all.push(log);
      await writeData("access_logs", all);
      return log;
    },
  },

  surveys: {
    getAll: async (): Promise<SurveyResponse[]> => {
      const all = await readData<SurveyResponse[]>("surveys", []);
      return all.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
    },
    getBySubscriber: async (subscriberId: string): Promise<SurveyResponse | null> => {
      const all = await readData<SurveyResponse[]>("surveys", []);
      return all.find((s) => s.subscriberId === subscriberId) ?? null;
    },
    create: async (entry: Omit<SurveyResponse, "id" | "submittedAt">): Promise<SurveyResponse> => {
      const all = await readData<SurveyResponse[]>("surveys", []);
      const survey: SurveyResponse = {
        ...entry,
        id: "srv-" + Date.now(),
        submittedAt: new Date().toISOString(),
      };
      all.push(survey);
      await writeData("surveys", all);
      return survey;
    },
  },

  accessRequests: {
    getAll: async (): Promise<AccessRequest[]> => {
      const all = await readData<AccessRequest[]>("access_requests", []);
      return all.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
    },
    create: async (name: string, email: string, message: string): Promise<AccessRequest> => {
      const all = await readData<AccessRequest[]>("access_requests", []);
      const req: AccessRequest = {
        id: "req-" + Date.now(),
        name,
        email,
        message,
        status: "pending",
        submittedAt: new Date().toISOString(),
      };
      all.push(req);
      await writeData("access_requests", all);
      return req;
    },
    updateStatus: async (id: string, status: "added" | "granted" | "dismissed"): Promise<void> => {
      const all = await readData<AccessRequest[]>("access_requests", []);
      const idx = all.findIndex((r) => r.id === id);
      if (idx !== -1) {
        all[idx].status = status;
        await writeData("access_requests", all);
      }
    },
  },

  admins: {
    getAll: (): Promise<AdminUser[]> => readData("admins", []),
    create: async (name: string, email: string): Promise<AdminUser> => {
      const all = await readData<AdminUser[]>("admins", []);
      const admin: AdminUser = {
        id: "admin-" + Date.now(),
        name,
        email,
        createdAt: new Date().toISOString(),
      };
      all.push(admin);
      await writeData("admins", all);
      return admin;
    },
    remove: async (id: string): Promise<void> => {
      const all = await readData<AdminUser[]>("admins", []);
      await writeData("admins", all.filter((a) => a.id !== id));
    },
  },
};
