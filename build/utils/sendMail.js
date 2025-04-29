"use strict";
/*
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
*/
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require('dotenv').config();
const nodemailer_1 = __importDefault(require("nodemailer"));
const ejs_1 = __importDefault(require("ejs"));
const path_1 = __importDefault(require("path"));
const sendMail = async (options) => {
    const transporter = nodemailer_1.default.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || "587"),
        service: process.env.SMTP_SERVICE,
        auth: {
            user: process.env.SMTP_MAIL,
            pass: process.env.SMTP_PASSWORD,
        },
    });
    const { email, subject, template, data } = options;
    // get the path to the email template file
    const templatePath = path_1.default.join(__dirname, '../mails', template);
    // render the email template with ejs
    const html = await ejs_1.default.renderFile(templatePath, data);
    const mailOptions = {
        from: process.env.SMTP_MAIL,
        to: email,
        subject,
        html,
    };
    await transporter.sendMail(mailOptions);
};
exports.default = sendMail;
