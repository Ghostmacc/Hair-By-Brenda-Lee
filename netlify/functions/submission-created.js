// Fires automatically on every verified Netlify form submission (Netlify's
// built-in `submission-created` trigger — no Zapier, no polling). Adds the lead
// to Brevo (VIP list) and sends the welcome email. The Brevo API key lives in
// the Netlify env var BREVO_API_KEY — never in this repo.
const BREVO = "https://api.brevo.com/v3";
const LIST_ID = 3; // "Brenda Vip"
const SENDER = { name: "Brenda", email: "book@bqhotsprings.com" };

exports.handler = async (event) => {
  try {
    const key = process.env.BREVO_API_KEY;
    if (!key) return { statusCode: 500, body: "missing BREVO_API_KEY" };

    const body = JSON.parse(event.body || "{}");
    const d = body.data || (body.payload && body.payload.data) || body;
    const email = String(d.email || "").trim();
    if (!email) return { statusCode: 200, body: "no email — skipped" };

    const name = String(d.name || "").trim();
    const first = name.split(" ")[0] || name;
    const last = name.split(" ").slice(1).join(" ");
    const attributes = {
      FIRSTNAME: first,
      LASTNAME: last,
      SMS: d.phone || "",
      CONSENT_EMAIL: d.consent_email === "true" || d.consent_email === true,
      CONSENT_SMS: d.consent_sms === "true" || d.consent_sms === true,
      SOURCE: "bqhotsprings.com",
    };
    const H = { "api-key": key, "content-type": "application/json", accept: "application/json" };

    // 1) upsert the contact into the VIP list
    await fetch(`${BREVO}/contacts`, {
      method: "POST",
      headers: H,
      body: JSON.stringify({ email, attributes, listIds: [LIST_ID], updateEnabled: true }),
    });

    // 2) send the welcome email (only if they opted in to email)
    if (attributes.CONSENT_EMAIL !== false) {
      await fetch(`${BREVO}/smtp/email`, {
        method: "POST",
        headers: H,
        body: JSON.stringify({
          sender: SENDER,
          replyTo: { email: "hairbybrendalee@gmail.com", name: "Brenda" },
          to: [{ email, name: name || undefined }],
          subject: "Welcome to Beauty Quest — 20% off your first visit",
          htmlContent: `<div style="font-family:Figtree,Arial,sans-serif;color:#4d2438;max-width:520px;margin:0 auto;line-height:1.6">
  <h1 style="font-family:'Playfair Display',Georgia,serif;color:#d4578e;font-weight:600">Welcome, ${first || "friend"} 💛</h1>
  <p>Thanks for joining <strong>Beauty Quest — Hair by Brenda Lee</strong>. As a new guest, you've got <strong>20% off your first visit</strong>.</p>
  <p>Brenda brings 24 years of bridal and color artistry to Hot Springs — balayage, lived-in color, gray blending, Brazilian blowouts, and cuts, all by appointment and never rushed.</p>
  <p style="margin:26px 0">
    <a href="https://brendasanderscurlup.glossgenius.com/services" style="background:#d4578e;color:#fff;text-decoration:none;padding:14px 26px;border-radius:999px;font-weight:700">Book your appointment →</a>
  </p>
  <p>Or call / text Brenda directly: <strong>(714) 271-2751</strong></p>
  <p style="font-size:12px;color:#a86d8b;margin-top:24px">Hot Springs, AR · By appointment · You can unsubscribe anytime.</p>
</div>`,
        }),
      });
    }

    return { statusCode: 200, body: "ok" };
  } catch (e) {
    // Never fail the submission; just log.
    return { statusCode: 200, body: "handled with error: " + String(e) };
  }
};
