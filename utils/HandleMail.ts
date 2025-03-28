require('dotenv').config();
import nodeMailer, {Transporter} from "nodemailer";
import mjml2html from "mjml";
import ejs from "ejs";
import path from "path";

interface EmailOptions {
    email: string;
    subject: string;
    mjmlTemplate: string;
    data: { [key: string]: any };
}

const HandleMail = async (options: EmailOptions):Promise <void> => {
    try {
        const transporter: Transporter = nodeMailer.createTransport({
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT || "587"),
            service: process.env.SMTP_SERVICE,
            auth: {
                user: process.env.SMTP_MAIL,
                pass: process.env.SMTP_PASSWORD,
            },
        });

        const { html } = mjml2html(options.mjmlTemplate);

        const mailOptions = {
            from: process.env.SMTP_MAIL,
            to: options.email,
            subject: options.subject,
            html,
        };

        await transporter.sendMail(mailOptions);
    } catch (error) {
        console.error('Error sending email:', error); // Error handling
        throw error;
    }
};

export default HandleMail;