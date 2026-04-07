import type { APIRoute } from "astro";
import { getZoomToken } from "../../../lib/zoom";

const MEETING_ID = "88312217147";
const PT_TIME_ZONE = "America/Los_Angeles";

function getPTWeekday(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    timeZone: PT_TIME_ZONE,
    weekday: "long",
  });
}

function getPTDateKey(iso: string): string {
  return new Date(iso).toLocaleDateString("en-CA", {
    timeZone: PT_TIME_ZONE,
  });
}

export const GET: APIRoute = async () => {
  try {
    const token = await getZoomToken();

    const res = await fetch(
      `https://api.zoom.us/v2/users/me/meetings?type=upcoming&page_size=50`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (!res.ok) throw new Error(`Zoom API error: ${await res.text()}`);
    const data = await res.json();

    const now = new Date();

    // Filter to only this meeting's future sessions, sorted ascending
    const sessions = (data.meetings ?? [])
      .filter((m: any) => String(m.id) === MEETING_ID && new Date(m.start_time) > now)
      .sort((a: any, b: any) =>
        new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
      );

    const fmt = (iso: string) =>
      new Date(iso).toLocaleDateString("en-US", {
        weekday: "long",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        timeZone: PT_TIME_ZONE,
        timeZoneName: "short",
      });

    const mondays = sessions.filter((s: any) => getPTWeekday(s.start_time) === "Monday");

    const weeks: any[] = [];

    for (const monday of mondays) {
      const mondayPT = getPTDateKey(monday.start_time);
      const tuesday = sessions.find(
        (s: any) =>
          getPTWeekday(s.start_time) === "Tuesday" &&
          (() => {
            const tuesdayPtDate = new Date(getPTDateKey(s.start_time));
            const mondayPtDate = new Date(mondayPT);
            const diffMs = tuesdayPtDate.getTime() - mondayPtDate.getTime();
            return diffMs === 24 * 60 * 60 * 1000;
          })()
      );

      if (!tuesday) continue; // skip if no matching Tuesday found

      weeks.push({
        id: `${monday.start_time}|${tuesday.start_time}`,
        session1_time: monday.start_time,
        session2_time: tuesday.start_time,
        session1_uuid: monday.uuid,
        session2_uuid: tuesday.uuid,
        join_url: monday.join_url,
        label: `${fmt(monday.start_time)}  +  ${fmt(tuesday.start_time)}`,
      });
    }

    return new Response(
      JSON.stringify({ classes: weeks.slice(0, 6), timezone: PT_TIME_ZONE }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};
