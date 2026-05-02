const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

const sendEmail = async ({ to, subject, html }) => {
  if (!to || !subject || !html) {
    throw new Error("Missing email fields");
  }

  try {
    const response = await resend.emails.send({
      from: "Library System <onboarding@resend.dev>", 
      to,
      subject,
      html,
    });

    console.log("Email sent:", response.id);
    return response;

  } catch (error) {
    console.error("Resend error:", error);
    throw new Error("Email failed");
  }
};

module.exports = sendEmail;