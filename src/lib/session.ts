export interface SubscriberSession {
  name: string;
  email: string;
}

export function getSession(): SubscriberSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("rp_subscriber");
    return raw ? (JSON.parse(raw) as SubscriberSession) : null;
  } catch {
    return null;
  }
}

export function setSession(session: SubscriberSession): void {
  localStorage.setItem("rp_subscriber", JSON.stringify(session));
}

export function clearSession(): void {
  localStorage.removeItem("rp_subscriber");
}
