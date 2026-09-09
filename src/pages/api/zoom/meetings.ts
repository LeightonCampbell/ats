import type { APIRoute } from "astro";
import { getZoomCredentials } from "../../../lib/worker-env";
import { getUpcomingMeetings } from "../../../lib/zoom";

const PT_TIME_ZONE = "America/Los_Angeles";

/** PT weekday for display labels only — never use for pairing/matching. */
function getPTWeekday(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    timeZone: PT_TIME_ZONE,
    weekday: "long",
  });
}

export const GET: APIRoute = async () => {
  try {
    const sessions = await getUpcomingMeetings(getZoomCredentials());

    const fmt = (iso: string) => {
      const dateTime = new Date(iso).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        timeZone: PT_TIME_ZONE,
        timeZoneName: "short",
      });
      return `${getPTWeekday(iso)}, ${dateTime}`;
    };

    // Monday 6PM PT is stored as Tuesday 01:00 UTC (getUTCDay() === 2)
    const mondays = sessions.filter(
      (s: any) => new Date(s.start_time).getUTCDay() === 2
    );

    const weeks: any[] = [];

    for (const monday of mondays) {
      const mondayMs = new Date(monday.start_time).getTime();
      const tuesday = sessions.find(
        (s: any) =>
          new Date(s.start_time).getTime() === mondayMs + 24 * 60 * 60 * 1000
      );

      if (!tuesday) continue;
      const gap =
        new Date(tuesday.start_time).getTime() -
        new Date(monday.start_time).getTime();
      if (gap !== 24 * 60 * 60 * 1000) continue; // must be exactly 24 hours apart

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
      JSON.stringify({ classes: weeks.slice(0, 14), timezone: PT_TIME_ZONE }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
