export type EnrollmentNotification = {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  mailingAddress?: string;
  classTitle: string;
  classDate: string;
  paymentIntentId: string;
  zoomJoinUrl1?: string;
  zoomJoinUrl2?: string;
};

/** Send registration details to Formspree (admin notification + email). */
export async function submitEnrollmentToFormspree(
  formId: string,
  data: EnrollmentNotification
): Promise<void> {
  if (!formId) {
    console.warn("FORMSPREE_FORM_ID is not set; skipping notification.");
    return;
  }

  const res = await fetch(`https://formspree.io/f/${formId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      name: `${data.firstName} ${data.lastName}`,
      email: data.email,
      phone: data.phone ?? "",
      mailing_address: data.mailingAddress ?? "",
      course: data.classTitle,
      class_date: data.classDate,
      payment_intent_id: data.paymentIntentId,
      zoom_join_url_1: data.zoomJoinUrl1 ?? "",
      zoom_join_url_2: data.zoomJoinUrl2 ?? "",
      _subject: `New enrollment: ${data.classTitle}`,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Formspree error: ${text}`);
  }
}

export type ContactSubmission = {
  fullName: string;
  email: string;
  phone?: string;
  message: string;
};

/** Send Contact Us page submissions to Formspree. */
export async function submitContactToFormspree(
  formId: string,
  data: ContactSubmission
): Promise<void> {
  if (!formId) {
    throw new Error("FORMSPREE_CONTACT_FORM_ID is not set");
  }

  const res = await fetch(`https://formspree.io/f/${formId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      name: data.fullName,
      email: data.email,
      phone: data.phone ?? "",
      message: data.message,
      _subject: `Contact form: ${data.fullName}`,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Formspree error: ${text}`);
  }
}

export type GuidePurchaseNotification = {
  email: string;
  firstName?: string;
  paymentIntentId: string;
  productTitle: string;
};

/** Notify admin when a daycare guide bundle is purchased. */
export async function submitGuidePurchaseToFormspree(
  formId: string,
  data: GuidePurchaseNotification
): Promise<void> {
  if (!formId) {
    console.warn("FORMSPREE_FORM_ID is not set; skipping guide purchase notification.");
    return;
  }

  const res = await fetch(`https://formspree.io/f/${formId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      name: data.firstName ? data.firstName : data.email,
      email: data.email,
      product: data.productTitle,
      payment_intent_id: data.paymentIntentId,
      _subject: `Guide purchase: ${data.productTitle}`,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Formspree error: ${text}`);
  }
}
