const nodeMailer = require('nodemailer');

function sendEmail(to, subject, text) {
    let mailTransporter = nodeMailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD
        }
    });
  let details = {
        from: process.env.EMAIL_USER,
        to: to,
        subject: subject,
        text: text
    }; 

    mailTransporter.sendMail(details, (err) => {
        if (err) {
            console.log("The error is ", err);
        } else {
            console.log("Email has been sent");
        }
    });
}

module.exports = sendEmail;
