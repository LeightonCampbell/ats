/**
 * HubSpot: submit booking data via the Forms integration API so submissions
 * appear under the form (Marketing → Forms → [your form] → Submissions) and
 * still map to contact properties defined on that form.
 *
 * In HubSpot: create a form, add fields (use hidden fields for server-only
 * data). Each field `name` below must exist on that form with matching
 * internal names (standard: email, firstname, lastname, phone; custom props
 * use their CRM internal names, e.g. chosen_class).
 */

type HubSpotBookingPayload = {
  submissionDateIso: string;
  chosenClass: string;
  classSessionLabel: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  mailingAddress?: string;
  paypalOrderId: string;
  zoomSession1Time?: string;
  zoomSession2Time?: string;
  zoomJoinUrl1?: string;
  zoomJoinUrl2?: string;
  flowStatus: "paid" | "zoom_registered" | "zoom_failed" | "email_sent" | "email_failed";
};

const CONTACT_OBJECT_TYPE_ID = "0-1";

function formField(name: string, value: string) {
  return { objectTypeId: CONTACT_OBJECT_TYPE_ID, name, value };
}

function toFormFields(payload: HubSpotBookingPayload) {
  return [
    formField("email", payload.email),
    formField("firstname", payload.firstName),
    formField("lastname", payload.lastName),
    formField("phone", payload.phone ?? ""),
    formField("submission_date", payload.submissionDateIso),
    formField("chosen_class", payload.chosenClass),
    formField("class_session_label", payload.classSessionLabel),
    formField("mailing_address", payload.mailingAddress ?? ""),
    formField("paypal_order_id", payload.paypalOrderId),
    formField("zoom_session_1_time", payload.zoomSession1Time ?? ""),
    formField("zoom_session_2_time", payload.zoomSession2Time ?? ""),
    formField("zoom_join_url_1", payload.zoomJoinUrl1 ?? ""),
    formField("zoom_join_url_2", payload.zoomJoinUrl2 ?? ""),
    formField("flow_status", payload.flowStatus),
  ];
}

/**
 * POSTs to HubSpot Forms API (authenticated). Requires a Private App token
 * with permission to submit forms, plus portal ID and the target form GUID.
 */
export async function submitHubSpotBookingForm(
  payload: HubSpotBookingPayload
): Promise<void> {
  const portalId = import.meta.env.HUBSPOT_PORTAL_ID ?? "";
  const formGuid = import.meta.env.HUBSPOT_FORM_GUID ?? "";
  const token = import.meta.env.HUBSPOT_ACCESS_TOKEN ?? "";

  if (!portalId || !formGuid) {
    throw new Error(
      "HUBSPOT_PORTAL_ID and HUBSPOT_FORM_GUID must be configured for form submissions"
    );
  }
  if (!token) throw new Error("HUBSPOT_ACCESS_TOKEN is not configured");

  const url = `https://api.hsforms.com/submissions/v3/integration/secure/submit/${portalId}/${formGuid}`;

  const body = {
    submittedAt: Date.now(),
    fields: toFormFields(payload),
    context: {
      pageUri: "https://alerttrainingservices.com/preventative-health-and-safety-training",
      pageName: "Class booking — payment complete",
    },
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HubSpot form submit error (${res.status}): ${text}`);
  }
}
