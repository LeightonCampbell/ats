import { useState, useEffect, useMemo } from "react";
import type { CSSProperties } from "react";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";

const MEETING_ID = "88312217147";
const COURSE_TITLE = "Preventive Health & Safety Training";
const COURSE_PRICE = "$80.00";

interface WeekSlot {
  start_time: string;
  occurrenceId?: string;
}

interface BookableWeek {
  id: string;
  meetingId: string;
  title: string;
  monday: WeekSlot;
  tuesday: WeekSlot;
  label?: string;
  session1_time?: string;
  session2_time?: string;
}

function calendarDateInTz(iso: string, tz: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(iso));
}

function monthKeyForWeek(w: BookableWeek, tz: string): string {
  const d = new Date(w.monday.start_time);
  const y = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    year: "numeric",
  }).format(d);
  const m = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    month: "2-digit",
  }).format(d);
  return `${y}-${m}`;
}

function CalendarPicker({
  classes,
  selectedClass,
  onSelect,
}: {
  classes: any[];
  selectedClass: any;
  onSelect: (c: any) => void;
}) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  // Build a Set of all session ISO dates for quick lookup (YYYY-MM-DD in PT)
  const sessionDateMap = new Map<string, any>();
  for (const c of classes) {
    const d1 = toLocaleDateStr(c.session1_time);
    const d2 = toLocaleDateStr(c.session2_time);
    sessionDateMap.set(d1, c);
    sessionDateMap.set(d2, c);
  }

  const selectedDates = selectedClass
    ? new Set([
        toLocaleDateStr(selectedClass.session1_time),
        toLocaleDateStr(selectedClass.session2_time),
      ])
    : new Set<string>();

  // Build calendar grid
  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const formatSelectedLabel = () => {
    if (!selectedClass) return null;
    const d = new Date(selectedClass.session1_time);
    return d.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      timeZone: "America/Los_Angeles",
    });
  };

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      timeZone: "America/Los_Angeles",
    });

  return (
    <div
      style={{
        border: "1px solid #e0e0e0",
        borderRadius: 12,
        overflow: "hidden",
        marginBottom: 24,
      }}
    >
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
        {/* Left: Calendar */}
        <div style={{ padding: "20px 16px", borderRight: "1px solid #e0e0e0" }}>
          {/* Date input display */}
          <div
            style={{
              border: "1px solid #ccc",
              borderRadius: 6,
              padding: "8px 12px",
              fontSize: 14,
              color: "#333",
              marginBottom: 12,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span>
              {selectedClass
                ? new Date(selectedClass.session1_time).toLocaleDateString(
                    "en-US",
                    {
                      month: "2-digit",
                      day: "2-digit",
                      year: "numeric",
                      timeZone: "America/Los_Angeles",
                    }
                  )
                : "Select a date"}
            </span>
            <span style={{ color: "#888" }}>📅</span>
          </div>

          {/* Month/Year selectors */}
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <select
              value={viewMonth}
              onChange={(e) => setViewMonth(Number(e.target.value))}
              style={{
                flex: 1,
                padding: "4px 8px",
                borderRadius: 4,
                border: "1px solid #ccc",
                fontSize: 13,
              }}
            >
              {monthNames.map((m, i) => (
                <option key={m} value={i}>
                  {m}
                </option>
              ))}
            </select>
            <select
              value={viewYear}
              onChange={(e) => setViewYear(Number(e.target.value))}
              style={{
                width: 80,
                padding: "4px 8px",
                borderRadius: 4,
                border: "1px solid #ccc",
                fontSize: 13,
              }}
            >
              {[2026, 2027].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          {/* Day headers */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(7, 1fr)",
              marginBottom: 4,
            }}
          >
            {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map((d) => (
              <div
                key={d}
                style={{
                  textAlign: "center",
                  fontSize: 10,
                  fontWeight: 700,
                  color: d === "MON" || d === "TUE" ? "#1B3A5C" : "#aaa",
                  padding: "4px 0",
                }}
              >
                {d}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div
            style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}
          >
            {cells.map((day, idx) => {
              if (!day) return <div key={idx} />;
              const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(
                2,
                "0"
              )}-${String(day).padStart(2, "0")}`;
              const hasSession = sessionDateMap.has(dateStr);
              const isSelected = selectedDates.has(dateStr);
              const isPast = new Date(dateStr) < new Date(today.toDateString());
              const sessionForDay = sessionDateMap.get(dateStr);
              // Only make Mondays clickable (clicking Monday selects the pair)
              const isMonday =
                sessionForDay &&
                toLocaleDateStr(sessionForDay.session1_time) === dateStr;

              return (
                <div
                  key={idx}
                  onClick={() =>
                    isMonday && !isPast ? onSelect(sessionForDay) : undefined
                  }
                  style={{
                    textAlign: "center",
                    padding: "6px 2px",
                    borderRadius: 6,
                    fontSize: 13,
                    cursor: isMonday && !isPast ? "pointer" : "default",
                    fontWeight: hasSession ? 700 : 400,
                    background: isSelected ? "#1B3A5C" : "transparent",
                    color: isSelected
                      ? "#fff"
                      : isPast
                      ? "#ccc"
                      : hasSession
                      ? "#1B3A5C"
                      : "#555",
                    border: isSelected
                      ? "none"
                      : hasSession && !isPast
                      ? "1px solid #C8D8E8"
                      : "1px solid transparent",
                  }}
                >
                  {day}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Selected session info */}
        <div style={{ padding: "20px 16px", background: "#fafafa" }}>
          <div
            style={{
              fontWeight: 700,
              fontSize: 15,
              color: "#1B3A5C",
              marginBottom: 16,
            }}
          >
            {selectedClass ? formatSelectedLabel() : "Select a Monday to book"}
          </div>

          {selectedClass ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {/* Session 1 time slot */}
              <div
                style={{
                  background: "#1B3A5C",
                  color: "#fff",
                  borderRadius: 8,
                  padding: "10px 16px",
                  fontSize: 14,
                  fontWeight: 600,
                  textAlign: "center",
                }}
              >
                Mon · {formatTime(selectedClass.session1_time)}
              </div>
              {/* Session 2 time slot */}
              <div
                style={{
                  background: "#1B3A5C",
                  color: "#fff",
                  borderRadius: 8,
                  padding: "10px 16px",
                  fontSize: 14,
                  fontWeight: 600,
                  textAlign: "center",
                }}
              >
                Tue · {formatTime(selectedClass.session2_time)}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: "#86868b",
                  marginTop: 4,
                  lineHeight: 1.5,
                }}
              >
                Both sessions required · 4 hrs each
              </div>
            </div>
          ) : (
            <div style={{ color: "#86868b", fontSize: 13, lineHeight: 1.6 }}>
              Classes run Monday + Tuesday evenings, 6:00 - 10:00 PM PT.
              <br />
              <br />
              Bold dates have available sessions. Click any Monday to select that
              week.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Helper: convert ISO string to YYYY-MM-DD in PT
function toLocaleDateStr(iso: string): string {
  return new Date(iso).toLocaleDateString("en-CA", {
    timeZone: "America/Los_Angeles",
  }); // en-CA gives YYYY-MM-DD format
}

export default function BookingWidget({
  paypalClientId,
}: {
  paypalClientId: string;
}) {
  const [weeks, setWeeks] = useState<BookableWeek[]>([]);
  const [apiTz, setApiTz] = useState("America/Los_Angeles");
  const [selectedWeek, setSelectedWeek] = useState<BookableWeek | null>(null);
  const [monthKey, setMonthKey] = useState<string>("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [step, setStep] = useState<
    "calendar" | "info" | "pay" | "success" | "error"
  >("calendar");
  const [joinUrl, setJoinUrl] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [classesLoadError, setClassesLoadError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/zoom/meetings")
      .then(async (r) => {
        const data = (await r.json()) as {
          weeks?: BookableWeek[];
          classes?: Array<{
            id: string;
            session1_time: string;
            session2_time: string;
            session1_uuid?: string;
            session2_uuid?: string;
            join_url?: string;
            label: string;
          }>;
          timezone?: string;
          error?: string;
        };
        return { ok: r.ok, status: r.status, data };
      })
      .then(({ ok, status, data }) => {
        if (!ok || data.error) {
          setClassesLoadError(
            data.error ?? `Could not load classes (HTTP ${status}).`
          );
          setWeeks([]);
          setSelectedWeek(null);
        } else {
          setClassesLoadError("");
          const w =
            data.weeks ??
            (data.classes ?? []).map((c) => ({
              id: c.id,
              meetingId: MEETING_ID,
              title: COURSE_TITLE,
              monday: {
                start_time: c.session1_time,
                occurrenceId: c.session1_uuid,
              },
              tuesday: {
                start_time: c.session2_time,
                occurrenceId: c.session2_uuid,
              },
              label: c.label,
              session1_time: c.session1_time,
              session2_time: c.session2_time,
            }));
          setWeeks(w);
          const tz = data.timezone || "America/Los_Angeles";
          setApiTz(tz);
          if (w.length > 0) {
            const firstMk = monthKeyForWeek(w[0]!, tz);
            setMonthKey(firstMk);
            setSelectedWeek(w[0]!);
          } else {
            setSelectedWeek(null);
          }
        }
        setLoading(false);
      })
      .catch(() => {
        setClassesLoadError(
          "Could not reach the server. Is `npm run dev` running?"
        );
        setLoading(false);
      });
  }, []);

  const monthKeys = useMemo(() => {
    const keys = new Set<string>();
    for (const w of weeks) keys.add(monthKeyForWeek(w, apiTz));
    return Array.from(keys).sort();
  }, [weeks, apiTz]);

  const weeksInMonth = useMemo(
    () => weeks.filter((w) => monthKeyForWeek(w, apiTz) === monthKey),
    [weeks, monthKey, apiTz]
  );

  const formatSession = (iso: string) =>
    new Date(iso).toLocaleString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZone: apiTz,
      timeZoneName: "short",
    });

  const classDateSummary = (w: BookableWeek) =>
    `${formatSession(w.monday.start_time)} · then ${formatSession(w.tuesday.start_time)}`;

  const classes = weeks;
  const selectedClass = selectedWeek;
  const setSelectedClass = setSelectedWeek;

  const personalInfoReady = Boolean(firstName && lastName && email);

  if (!paypalClientId) {
    return (
      <p style={{ color: "#86868b", fontSize: 14 }}>
        PayPal is not configured. Add{" "}
        <code>PUBLIC_PAYPAL_CLIENT_ID</code> to your environment.
      </p>
    );
  }

  return (
    <div
      style={{
        maxWidth: 520,
        margin: "0 auto",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      {step !== "success" && step !== "error" && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 8,
            marginBottom: 18,
          }}
        >
          {[
            { id: "calendar", label: "1. Calendar" },
            { id: "info", label: "2. Personal Info" },
            { id: "pay", label: "3. Payment" },
          ].map((s) => {
            const active = step === s.id;
            return (
              <div
                key={s.id}
                style={{
                  borderRadius: 999,
                  padding: "8px 10px",
                  textAlign: "center",
                  fontSize: 12,
                  fontWeight: 700,
                  color: active ? "white" : "#1B3A5C",
                  background: active ? "#1B3A5C" : "#EEF2F7",
                  border: "1px solid #C8D8E8",
                }}
              >
                {s.label}
              </div>
            );
          })}
        </div>
      )}

      {step === "calendar" && (
        <>
          <div style={{ marginBottom: 22 }}>
            <label style={labelStyle}>Choose upcoming class *</label>
            {classesLoadError ? (
              <p style={{ color: "#b42318", fontSize: 14, lineHeight: 1.5 }}>
                {classesLoadError}
              </p>
            ) : loading ? (
              <p style={{ color: "#86868b", fontSize: 14 }}>
                Loading available classes...
              </p>
            ) : weeks.length === 0 ? (
              <p style={{ color: "#86868b", fontSize: 14 }}>
                No upcoming Monday-Tuesday class weeks found. Please check back
                soon or{" "}
                <a href="mailto:info@alerttrainingservices.com">contact us</a>.
              </p>
            ) : (
              <CalendarPicker
                classes={classes}
                selectedClass={selectedClass}
                onSelect={setSelectedClass}
              />
            )}
          </div>

          <button
            type="button"
            onClick={() => setStep("info")}
            disabled={!selectedWeek}
            style={{
              ...primaryBtn,
              opacity: selectedWeek ? 1 : 0.4,
              cursor: selectedWeek ? "pointer" : "not-allowed",
            }}
          >
            Continue to Personal Info →
          </button>
        </>
      )}

      {step === "info" && (
        <>
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Selected Class</label>
            <div style={{ ...summaryBoxStyle, marginBottom: 0 }}>
              <div style={{ fontWeight: 700, color: "#1B3A5C", fontSize: 14 }}>
                {selectedWeek?.title ?? COURSE_TITLE}
              </div>
              <div style={{ fontSize: 13, color: "#515154", marginTop: 6 }}>
                {selectedWeek ? classDateSummary(selectedWeek) : "No class selected"}
              </div>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 12,
              marginBottom: 12,
            }}
          >
            <div>
              <label style={labelStyle}>First Name *</label>
              <input
                style={inputStyle}
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Jane"
              />
            </div>
            <div>
              <label style={labelStyle}>Last Name *</label>
              <input
                style={inputStyle}
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Smith"
              />
            </div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>Email *</label>
            <input
              style={inputStyle}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jane@email.com"
            />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={labelStyle}>Phone (optional)</label>
            <input
              style={inputStyle}
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(323) 000-0000"
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <button
              type="button"
              onClick={() => setStep("calendar")}
              style={{ ...backBtn, marginTop: 0 }}
            >
              ← Back to Calendar
            </button>
            <button
              type="button"
              onClick={() => setStep("pay")}
              disabled={!personalInfoReady || !selectedWeek}
              style={{
                ...primaryBtn,
                opacity: personalInfoReady && selectedWeek ? 1 : 0.4,
                cursor:
                  personalInfoReady && selectedWeek ? "pointer" : "not-allowed",
              }}
            >
              Continue to Payment →
            </button>
          </div>
        </>
      )}

      {step === "pay" && selectedWeek && (
        <>
          <div style={{ ...summaryBoxStyle, marginBottom: 24 }}>
            <div
              style={{
                fontWeight: 600,
                color: "#1B3A5C",
                marginBottom: 4,
              }}
            >
              {selectedWeek.title}
            </div>
            <div style={{ fontSize: 13, color: "#515154" }}>
              {classDateSummary(selectedWeek)}
            </div>
            <div style={{ fontSize: 13, color: "#515154" }}>
              {firstName} {lastName} · {email}
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: 12,
                paddingTop: 12,
                borderTop: "1px solid #d0dce8",
              }}
            >
              <span style={{ color: "#1B3A5C", fontWeight: 700 }}>Total</span>
              <span style={{ color: "#1B3A5C", fontWeight: 700 }}>
                {COURSE_PRICE}
              </span>
            </div>
          </div>

          <PayPalScriptProvider
            options={{ clientId: paypalClientId, currency: "USD" }}
          >
            <PayPalButtons
              style={{
                layout: "vertical",
                color: "blue",
                shape: "pill",
                label: "pay",
              }}
              createOrder={async () => {
                const res = await fetch("/api/paypal/create-order", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    classTitle: selectedWeek.title,
                    classDate: classDateSummary(selectedWeek),
                  }),
                });
                const data = (await res.json()) as { id?: string };
                if (!data.id) throw new Error("Could not create order");
                return data.id;
              }}
              onApprove={async (data) => {
                const res = await fetch("/api/paypal/capture-order", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    orderId: data.orderID,
                    meetingId: MEETING_ID,
                    firstName,
                    lastName,
                    email,
                    phone,
                    classTitle: COURSE_TITLE,
                    classDate:
                      selectedWeek.label ?? classDateSummary(selectedWeek),
                    session1_time: selectedWeek.session1_time,
                    session2_time: selectedWeek.session2_time,
                  }),
                });
                const result = (await res.json()) as {
                  success?: boolean;
                  joinUrl?: string;
                  error?: string;
                };
                if (result.success) {
                  setJoinUrl(result.joinUrl ?? "");
                  setStep("success");
                } else {
                  setErrorMsg(result.error ?? "Something went wrong.");
                  setStep("error");
                }
              }}
              onError={(err) => {
                setErrorMsg("PayPal encountered an error. Please try again.");
                setStep("error");
                console.error(err);
              }}
            />
          </PayPalScriptProvider>

          <button type="button" onClick={() => setStep("info")} style={backBtn}>
            ← Back to Personal Info
          </button>
        </>
      )}

      {step === "success" && (
        <div style={{ textAlign: "center", padding: "24px 0" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
          <h3
            style={{
              color: "#1B3A5C",
              fontSize: 22,
              fontWeight: 700,
              marginBottom: 8,
            }}
          >
            You're enrolled!
          </h3>
          <p
            style={{
              color: "#515154",
              fontSize: 15,
              lineHeight: 1.6,
              marginBottom: 24,
            }}
          >
            Check your email for your receipt and Zoom link. See you in class!
          </p>
          {joinUrl && (
            <a
              href={joinUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={primaryBtn}
            >
              Join Class on Zoom →
            </a>
          )}
          <p style={{ color: "#86868b", fontSize: 13, marginTop: 16 }}>
            A receipt has been sent to <strong>{email}</strong>
          </p>
        </div>
      )}

      {step === "error" && (
        <div style={{ textAlign: "center", padding: "24px 0" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
          <h3
            style={{
              color: "#1B3A5C",
              fontSize: 20,
              fontWeight: 700,
              marginBottom: 8,
            }}
          >
            Something went wrong
          </h3>
          <p
            style={{ color: "#515154", fontSize: 14, marginBottom: 20 }}
          >
            {errorMsg}
          </p>
          <p style={{ color: "#515154", fontSize: 13 }}>
            Please call us at{" "}
            <a href="tel:3239216244" style={{ color: "#E02B2B" }}>
              323-921-6244
            </a>{" "}
            and we'll get you sorted immediately.
          </p>
          <button
            type="button"
            onClick={() => setStep("calendar")}
            style={{ ...primaryBtn, marginTop: 16 }}
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}

const labelStyle: CSSProperties = {
  display: "block",
  fontSize: "0.68rem",
  fontWeight: 700,
  letterSpacing: "0.07em",
  textTransform: "uppercase",
  color: "#1B3A5C",
  marginBottom: 5,
};

const inputStyle: CSSProperties = {
  width: "100%",
  background: "#f5f5f7",
  border: "1px solid rgba(0,0,0,0.08)",
  borderRadius: 10,
  padding: "11px 14px",
  fontFamily: "system-ui, sans-serif",
  fontSize: "0.91rem",
  color: "#1d1d1f",
  outline: "none",
};

const summaryBoxStyle: CSSProperties = {
  background: "#EEF2F7",
  border: "1px solid #C8D8E8",
  borderRadius: 10,
  padding: "16px 20px",
  marginBottom: 16,
};

const primaryBtn: CSSProperties = {
  display: "block",
  width: "100%",
  background: "#1B3A5C",
  color: "white",
  border: "none",
  padding: "15px 32px",
  borderRadius: 980,
  fontSize: "0.95rem",
  fontWeight: 700,
  cursor: "pointer",
  textAlign: "center",
  textDecoration: "none",
  letterSpacing: "-0.01em",
};

const backBtn: CSSProperties = {
  display: "block",
  width: "100%",
  background: "transparent",
  color: "#1B3A5C",
  border: "1.5px solid #C8D8E8",
  padding: "12px 32px",
  borderRadius: 980,
  fontSize: "0.9rem",
  fontWeight: 500,
  cursor: "pointer",
  marginTop: 10,
};
