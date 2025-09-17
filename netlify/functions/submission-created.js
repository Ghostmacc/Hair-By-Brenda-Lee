// Sends a thank-you email with a coupon after Netlify form submission
export const handler = async (event) => {
  try {
    const payload = JSON.parse(event.body);
    const data = payload && payload.payload ? payload.payload : {};
    if (!data || !data.data) return { statusCode: 200, body: "No submission data" };

    const name  = (data.data.name || "").trim();
    const email = (data.data.email || "").trim();
    if (!email) return { statusCode: 200, body: "No email provided" };

    const COUPON_CODE    = process.env.COUPON_CODE || "WELCOME15";
    const COUPON_DETAILS = process.env.COUPON_DETAILS || "15% off first service";
    const SENDER_EMAIL   = process.env.SENDER_EMAIL || "no-reply@example.com";
    const SENDER_NAME    = process.env.SENDER_NAME  || "Brenda • Bridal & Color";
    const apiKey         = process.env.SENDGRID_API_KEY;

    const subject = `You’re in! Here’s your coupon: ${COUPON_CODE}`;
    const html = `
      <div style="font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial">
        <h2>Thanks${name ? ", " + name : ""}!</h2>
        <p>You’re on the VIP list. Here’s your coupon for your next visit:</p>
        <p style="font-size:18px;font-weight:700;margin:16px 0">CODE: ${COUPON_CODE}</p>
        <p>${COUPON_DETAILS}</p>
        <p>Book online: <a href="https://brendasanderscurlup.glossgenius.com/">GlossGenius</a></p>
        <p style="color:#6b7280;font-size:12px;margin-top:24px">
          You received this because you opted in on the website. Reply STOP to end SMS; use the unsubscribe link for emails.
        </p>
      </div>
    `;

    const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email }] , subject }],
        from: { email: SENDER_EMAIL, name: SENDER_NAME },
        content: [{ type: "text/html", value: html }]
      })
    });

    if (!res.ok) {
      const msg = await res.text();
      console.error("SendGrid error:", res.status, msg);
      return { statusCode: 500, body: "Email send failed" };
    }

    return { statusCode: 200, body: "Email sent" };
  } catch (e) {
    console.error("Handler error:", e);
    return { statusCode: 500, body: "Function error" };
  }
};
