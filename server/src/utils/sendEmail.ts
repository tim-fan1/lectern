import config from "../config";
import nodemailer from "nodemailer";

/**
 * Please provide company_email_address and company_email_password in the environment variables
 * @param to Email address of receiver.
 * @param subject
 * @param html
 */
export default async function sendEmail(
    to: string,
    subject: string,
    html: string
) {
    if (!config.isProduction) {
        console.log(`send_email
                     To: ${to}
                     Subject: ${subject}
                     ${html}`);
        return;
    }

    let transporter = nodemailer.createTransport({
        host: "smtp.googlemail.com", // Gmail Host
        port: 465, // Port
        secure: true, // this is true as port is 465
        auth: {
            user: config.companyEmailAddress,
            pass: config.companyEmailPassword,
        },
    });
    // send mail with defined transport object
    try {
        await transporter.sendMail({
            from: config.companyEmailAddress,
            to: to,
            subject: subject,
            html: html,
        });
    } catch (e: Error | any) {
        console.log("(sendEmail) " + e.message);
    }
}
