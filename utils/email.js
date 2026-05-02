const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  connectionTimeout: 5000,
  greetingTimeout: 5000,
  socketTimeout: 5000,
});

transporter.verify()
.then(() => console.log("Email ready"))
.catch(err => console.error("Email config error:", err));

// SEND EMAIL FUNCTION
const sendEmail = async ({ to, subject, text, html }) => {
  try {
    if (!to || !subject || (!text && !html)) {
      throw new Error("Missing email fields");
    }

    const mailOptions = {
      from: `"Library System" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html,
    };

    const info = await transporter.sendMail(mailOptions);

    console.log("Email sent:", info.messageId);

    return info;

  } catch (error) {
    console.error("Email sending failed:", error.message);
    throw new Error("Email service failed");
  }
};

module.exports = sendEmail;