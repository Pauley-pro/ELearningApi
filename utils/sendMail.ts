require('dotenv').config();
import nodeMailer, { Transporter } from "nodemailer";
import ejs from "ejs";
import path from "path";

interface EmailOptions {
    email: string;
    subject: string;
    template: string;
    data: { [key: string]: any };
}

const sendMail = async (options: EmailOptions): Promise<void> => {
    let transporter: Transporter;

    // Smart switching based on environment
    if (process.env.NODE_ENV === 'production') {
        // Production: Use SendGrid API
        transporter = nodeMailer.createTransport({
            service: 'SendGrid',
            auth: {
                user: 'apikey', // Literally the word "apikey"
                pass: process.env.SENDGRID_API_KEY, // Your SendGrid API Key
            },
        });
    } else {
        // Development: Use your SMTP settings
        transporter = nodeMailer.createTransport({
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT || "587"),
            auth: {
                user: process.env.SMTP_MAIL,
                pass: process.env.SMTP_PASSWORD,
            },
        });
    }

    const { email, subject, template, data } = options;
    const templatePath = path.join(__dirname, '../mails', template);

    const html: string = await ejs.renderFile(templatePath, data);

    const mailOptions = {
        from: process.env.SMTP_MAIL,
        to: email,
        subject,
        html,
    };

    await transporter.sendMail(mailOptions);
};

export default sendMail;


/*
require('dotenv').config();
import nodeMailer, {Transporter} from "nodemailer";
import ejs from "ejs";
import path from "path";

interface EmailOptions {
    email: string;
    subject: string;
    template: string;
    data: { [key: string]: any };
}

const sendMail = async (options: EmailOptions):Promise <void> => {
    const transporter: Transporter = nodeMailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || "587"),
        service: process.env.SMTP_SERVICE,
        auth: {
            user: process.env.SMTP_MAIL,
            pass: process.env.SMTP_PASSWORD,
        },
    });
    
    const {email, subject, template, data} = options;
    // get the path to the email template file
    const templatePath = path.join(__dirname, '../mails', template);

    // render the email template with ejs
    const html:string = await ejs.renderFile(templatePath, data);

    const mailOptions = {
        from: process.env.SMTP_MAIL,
        to: email,
        subject,
        html,
    };

    await transporter.sendMail(mailOptions)
};

export default sendMail;
*/