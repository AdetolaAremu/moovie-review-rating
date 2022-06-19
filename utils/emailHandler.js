const nodemailer = require("nodemailer");
const pug = require("pug");
// const { htmlToText } = require("html-to-text");

module.exports = class emailHandler {
  constructor(user, url) {
    (this.to = user.email),
      (this.first_name = user.first_name.split(" ")[0]),
      (this.url = url),
      (this.from = `Moovy <${process.env.EMAIL_FROM}>`);
  }

  newTransport() {
    if (process.env.NODE_ENV === "production") {
      return "hello";
    }

    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  // send actual mail
  async sendMail(template, subject) {
    // Render html template
    const html = pug.renderFile(
      `${__dirname}/../views/emails/${template}.pug`,
      {
        firstName: this.first_name,
        url: this.url,
        subject,
      }
    );

    // define mail options
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
      // text: htmlToText(html),
    };

    // Transport and send mail
    await this.newTransport().sendMail(mailOptions);
  }

  async sendWelcomeEmail() {
    await this.sendMail("welcome", "Welcome to the natours family");
  }

  async sendPasswordResetEmail() {
    await this.sendMail("resetPassword", "Reset your password here");
  }
};
