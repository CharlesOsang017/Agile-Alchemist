import nodemailer from "nodemailer";


// Create a transporter using SMTP
const transporter = nodemailer.createTransport({
  host: "sandbox.smtp.mailtrap.io",
  port: 2525,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});


// Function to send email
export const sendEmail = async (to, subject, text, html) => {
  try {
   const response =  await transporter.sendMail({
      from: process.env.SENDER_EMAIL,
      to,
      subject,
      text,
      html,
    });
    console.log("Email sent successfully", response);
    return response;
  } catch (error) {
    console.error("Error sending email:", error);
    return error;
  }
};

export default sendEmail;