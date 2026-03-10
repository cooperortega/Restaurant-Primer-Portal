import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readJson<T>(filename: string, fallback: T): T {
  ensureDataDir();
  const fp = path.join(DATA_DIR, filename);
  if (!fs.existsSync(fp)) {
    writeJson(filename, fallback);
    return fallback;
  }
  return JSON.parse(fs.readFileSync(fp, "utf-8")) as T;
}

function writeJson<T>(filename: string, data: T): void {
  try {
    ensureDataDir();
    fs.writeFileSync(path.join(DATA_DIR, filename), JSON.stringify(data, null, 2), "utf-8");
  } catch {
    // Vercel and other read-only hosts: writes fail silently.
    // Reads still work from the bundled data files.
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

export const db = {
  subscribers: {
    getAll: (): Subscriber[] => readJson("subscribers.json", []),
    getByEmail: (email: string): Subscriber | null => {
      const all = readJson<Subscriber[]>("subscribers.json", []);
      return all.find((s) => s.email.toLowerCase() === email.toLowerCase()) ?? null;
    },
    getById: (id: string): Subscriber | null => {
      const all = readJson<Subscriber[]>("subscribers.json", []);
      return all.find((s) => s.id === id) ?? null;
    },
    create: (name: string, email: string): Subscriber => {
      const all = readJson<Subscriber[]>("subscribers.json", []);
      const sub: Subscriber = {
        id: "sub-" + Date.now(),
        name,
        email,
        createdAt: new Date().toISOString(),
      };
      all.push(sub);
      writeJson("subscribers.json", all);
      return sub;
    },
  },
  newsletters: {
    getAll: (): Newsletter[] => readJson("newsletters.json", []),
    getLatest: (): Newsletter | null => {
      const all = readJson<Newsletter[]>("newsletters.json", []);
      if (!all.length) return null;
      return all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
    },
    getById: (id: string): Newsletter | null => {
      const all = readJson<Newsletter[]>("newsletters.json", []);
      return all.find((n) => n.id === id) ?? null;
    },
  },
  tokens: {
    getAll: (): AccessToken[] => readJson("tokens.json", []),
    getByToken: (token: string): AccessToken | null => {
      const all = readJson<AccessToken[]>("tokens.json", []);
      return all.find((t) => t.token === token) ?? null;
    },
    create: (subscriberId: string, newsletterId: string): AccessToken => {
      const all = readJson<AccessToken[]>("tokens.json", []);
      const t: AccessToken = {
        id: "tok-" + Date.now(),
        token: crypto.randomUUID(),
        subscriberId,
        newsletterId,
        createdAt: new Date().toISOString(),
      };
      all.push(t);
      writeJson("tokens.json", all);
      return t;
    },
  },
  logs: {
    getAll: (): AccessLog[] =>
      readJson<AccessLog[]>("access_logs.json", []).sort(
        (a, b) => new Date(b.accessedAt).getTime() - new Date(a.accessedAt).getTime()
      ),
    create: (entry: Omit<AccessLog, "id" | "accessedAt">): AccessLog => {
      const all = readJson<AccessLog[]>("access_logs.json", []);
      const log: AccessLog = {
        ...entry,
        id: "log-" + Date.now(),
        accessedAt: new Date().toISOString(),
      };
      all.push(log);
      writeJson("access_logs.json", all);
      return log;
    },
  },
  surveys: {
    getAll: (): SurveyResponse[] =>
      readJson<SurveyResponse[]>("surveys.json", []).sort(
        (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
      ),
    getBySubscriber: (subscriberId: string): SurveyResponse | null => {
      const all = readJson<SurveyResponse[]>("surveys.json", []);
      return all.find((s) => s.subscriberId === subscriberId) ?? null;
    },
    create: (entry: Omit<SurveyResponse, "id" | "submittedAt">): SurveyResponse => {
      const all = readJson<SurveyResponse[]>("surveys.json", []);
      const survey: SurveyResponse = {
        ...entry,
        id: "srv-" + Date.now(),
        submittedAt: new Date().toISOString(),
      };
      all.push(survey);
      writeJson("surveys.json", all);
      return survey;
    },
  },
  accessRequests: {
    getAll: (): AccessRequest[] =>
      readJson<AccessRequest[]>("access_requests.json", []).sort(
        (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
      ),
    create: (name: string, email: string, message: string): AccessRequest => {
      const all = readJson<AccessRequest[]>("access_requests.json", []);
      const req: AccessRequest = {
        id: "req-" + Date.now(),
        name,
        email,
        message,
        status: "pending",
        submittedAt: new Date().toISOString(),
      };
      all.push(req);
      writeJson("access_requests.json", all);
      return req;
    },
    updateStatus: (id: string, status: "added" | "granted" | "dismissed"): void => {
      const all = readJson<AccessRequest[]>("access_requests.json", []);
      const idx = all.findIndex(r => r.id === id);
      if (idx !== -1) {
        all[idx].status = status;
        writeJson("access_requests.json", all);
      }
    },
  },
};
