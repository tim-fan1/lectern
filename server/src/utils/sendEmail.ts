import {
    company_email_address,
    company_email_password,
} from "../config.private";
const nodemailer = require("nodemailer");
/**
 * Please provide company_email_address and company_email_password in ../config.private.ts.
 * @param to Email address of receiver.
 * @param subject
 * @param html
 */
export default async function send_email(
    to: string,
    subject: string,
    html: string
) {
    let transporter = nodemailer.createTransport({
        host: "smtp.googlemail.com", // Gmail Host
        port: 465, // Port
        secure: true, // this is true as port is 465
        auth: {
            user: company_email_address,
            pass: company_email_password,
        },
    });
    // send mail with defined transport object
    let info = await transporter.sendMail({
        from: company_email_address,
        to: to,
        subject: subject,
        html: html,
    });
}
