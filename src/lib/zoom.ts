export type ZoomCredentials = {
  accountId: string;
  clientId: string;
  clientSecret: string;
};

const ZOOM_TOKEN_URL = "https://zoom.us/oauth/token";
const ZOOM_API_BASE = "https://api.zoom.us/v2";

const MEETING_ID = "88312217147";

export async function registerForOccurrence(
  creds: ZoomCredentials,
  startTime: string, // ISO start_time of the specific session
  registrant: { first_name: string; last_name: string; email: string; phone?: string },
  token?: string
): Promise<{ join_url: string; registrant_id: string }> {
  const accessToken = token ?? (await getZoomToken(creds));

  // Convert ISO start_time to occurrence_id format Zoom expects: YYYYMMDDTHHmmssZ
  const occurrenceId = startTime.replace(/[-:]/g, "").replace(".000", "");

  const res = await fetch(
    `https://api.zoom.us/v2/meetings/${MEETING_ID}/registrants?occurrence_ids=${occurrenceId}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(registrant),
    }
  );

  if (!res.ok) throw new Error(`Zoom registration error: ${await res.text()}`);
  return (await res.json()) as { join_url: string; registrant_id: string };
}

function classTimeZone(): string {
  return (
    import.meta.env.ZOOM_CLASS_TIMEZONE || "America/Los_Angeles"
  ).toString();
}

/** Monday start (first night of Mon+Tue class) in your class timezone. */
export function isMondaySessionStart(iso: string, timeZone = classTimeZone()): boolean {
  return weekdayShortInTimeZone(iso, timeZone) === "Mon";
}

export function isTuesdaySessionStart(iso: string, timeZone = classTimeZone()): boolean {
  return weekdayShortInTimeZone(iso, timeZone) === "Tue";
}

export function weekdayShortInTimeZone(iso: string, timeZone: string): string {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return "";
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
  }).format(d);
}

/** Calendar date YYYY-MM-DD in `timeZone` (for pairing Mon → Tue). */
export function calendarDateInTimeZone(iso: string, timeZone: string): string {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return "";
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

/** Zoom user path: S2S OAuth often requires the host user id or email, not `me`. */
function meetingsUserPath(): string {
  const host =
    import.meta.env.ZOOM_HOST_EMAIL ||
    import.meta.env.ZOOM_HOST_USER_ID ||
    "me";
  if (host === "me") return "/users/me/meetings";
  return `/users/${encodeURIComponent(host)}/meetings`;
}

// Fetches a fresh Server-to-Server OAuth token (valid 1 hour)
export async function getZoomToken(creds: ZoomCredentials): Promise<string> {
  const { accountId, clientId, clientSecret } = creds;

  if (!accountId || !clientId || !clientSecret) {
    throw new Error(
      `Missing Zoom credentials. accountId: ${!!accountId}, clientId: ${!!clientId}, clientSecret: ${!!clientSecret}`
    );
  }

  const credentials = btoa(`${clientId}:${clientSecret}`);

  const res = await fetch(
    `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${accountId}`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Zoom token error: ${text}`);
  }

  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}

/**
 * Lists host meetings. Prefer `upcoming` so recurring series aren't anchored on old dates.
 */
export async function listHostMeetings(
  creds: ZoomCredentials,
  meetingType: "upcoming" | "scheduled" = "upcoming",
  opts?: { from?: string; to?: string }
): Promise<Record<string, unknown>[]> {
  const token = await getZoomToken(creds);
  const collected: Record<string, unknown>[] = [];
  let nextPageToken: string | undefined;

  do {
    const params = new URLSearchParams({
      type: meetingType,
      page_size: "300",
    });
    if (opts?.from) params.set("from", opts.from);
    if (opts?.to) params.set("to", opts.to);
    if (nextPageToken) params.set("next_page_token", nextPageToken);

    const url = `${ZOOM_API_BASE}${meetingsUserPath()}?${params}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error(`Zoom meetings error: ${await res.text()}`);
    const data = (await res.json()) as {
      meetings?: Record<string, unknown>[];
      next_page_token?: string;
    };
    collected.push(...(data.meetings ?? []));
    nextPageToken = data.next_page_token;
  } while (nextPageToken);

  return collected;
}

export type ZoomMeetingDetails = {
  id?: string | number;
  topic?: string;
  start_time?: string;
  duration?: number;
  occurrences?: Array<{
    occurrence_id: string;
    start_time: string;
    duration: number;
    status?: string;
  }>;
};

/** Upcoming host sessions for the ATS class meeting (raw Zoom start_times). */
export async function getUpcomingMeetings(
  creds: ZoomCredentials
): Promise<
  Array<{
    id: string | number;
    start_time: string;
    uuid?: string;
    join_url?: string;
  }>
> {
  const token = await getZoomToken(creds);
  const res = await fetch(
    `${ZOOM_API_BASE}${meetingsUserPath()}?type=upcoming&page_size=50`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (!res.ok) throw new Error(`Zoom API error: ${await res.text()}`);
  const data = (await res.json()) as {
    meetings?: Array<{
      id: string | number;
      start_time: string;
      uuid?: string;
      join_url?: string;
    }>;
  };

  const now = new Date();
  return (data.meetings ?? [])
    .filter(
      (m) => String(m.id) === MEETING_ID && new Date(m.start_time) > now
    )
    .sort(
      (a, b) =>
        new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
    );
}

export async function getMeetingDetails(
  creds: ZoomCredentials,
  meetingId: string
): Promise<ZoomMeetingDetails> {
  const token = await getZoomToken(creds);
  const res = await fetch(
    `${ZOOM_API_BASE}/meetings/${encodeURIComponent(meetingId)}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok)
    throw new Error(`Zoom meeting ${meetingId}: ${await res.text()}`);
  return (await res.json()) as ZoomMeetingDetails;
}

// Registers a user for a meeting (recurring: pass occurrence_ids for Mon+Tue same week)
export async function registerForMeeting(
  creds: ZoomCredentials,
  meetingId: string,
  registrant: {
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
  },
  occurrenceIds?: string[]
): Promise<{ join_url: string; registrant_id: string }> {
  const token = await getZoomToken(creds);
  const body: Record<string, unknown> = { ...registrant };
  const ids = (occurrenceIds ?? []).filter(Boolean);
  if (ids.length > 0) body.occurrence_ids = ids;

  const res = await fetch(
    `${ZOOM_API_BASE}/meetings/${encodeURIComponent(meetingId)}/registrants`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );
  if (!res.ok) throw new Error(`Zoom registration error: ${await res.text()}`);
  return (await res.json()) as { join_url: string; registrant_id: string };
}
