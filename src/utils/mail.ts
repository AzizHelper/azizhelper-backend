import nodemailer from "nodemailer";

const mail = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: 587,
  secure: false, // Use `true` for port 465, `false` for all other ports
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

export default mail;
