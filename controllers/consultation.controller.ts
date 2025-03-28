import { CatchAsyncError } from "../middleware/catchAsyncError";
import { NextFunction, Request, Response } from "express";
import sendMail from "../utils/sendMail";
import path from "path";
import ejs from "ejs";
import ErrorHandler from "../utils/ErrorHandler";
import ConsultationModel from "../models/consultation.model";
import userModel from "../models/user.model";
import mongoose from "mongoose";
import mjml2html from "mjml";
import HandleMail from "../utils/HandleMail";

// User booking appointment
export const bookAppointment = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?._id;

    if (!userId) {
        return res.status(401).json({ error: "Unauthorized. Please log in to book an appointment." });
    }

    const user = await userModel.findById(userId);
    if (!user) {
        return res.status(404).json({ error: "User not found." });
    }

    const { reason, date } = req.body;

    if (!reason || !date) {
        return res.status(400).json({ error: "Reason and date are required." });
    }

    const appointmentDate = new Date(date);
    if (isNaN(appointmentDate.getTime()) || appointmentDate < new Date()) {
        return res.status(400).json({ error: "Please provide a valid future date for the appointment." });
    }

    const appointment = await ConsultationModel.create({
        user: {
            _id: user._id,
            name: user.name,
        },
        reason,
        date: appointmentDate,
        status: "pending",
    });

    await appointment.save();

    const adminEmail = process.env.ADMIN_EMAIL;

    if (!adminEmail) {
        console.error("Admin email not defined in environment variables");
        return res.status(500).json({ error: "Server configuration error" });
    }

    // admin confirmation email
    const adminEmailContent = `
    <mjml>
      <mj-body background-color="#4f5ef1">
        <mj-section>
          <mj-column>
            <mj-image width="150px" src="https://res.cloudinary.com/polad/image/upload/v1742228489/mindzyte_u9rvtw.png" alt="Mindzyte Logo" />
            <mj-text font-size="22px" color="#ffffff" font-family="Poppins, sans-serif" align="center" font-weight="bold">
              Welcome to Mindzyte
            </mj-text>
          </mj-column>
        </mj-section>

        <mj-section background-color="#ffffff" border-radius="10px" padding="20px">
          <mj-column>
            <mj-text font-size="18px" color="#000000" font-family="Poppins, sans-serif">
              Hello Admin,
            </mj-text>
            <mj-text font-size="18px" color="#000000" font-family="Poppins, sans-serif">
              I, ${user.name} with the email address ${user.email} has just booked an appointment with you.
            </mj-text>
            <mj-text font-size="18px" color="#000000" font-family="Poppins, sans-serif">
              I await to receive a confirmation or a reschedule notice.
            </mj-text>
            <mj-text font-size="18px" color="#000000" font-family="Poppins, sans-serif">
              Every other information about me will be provided on your request.
            </mj-text>
            <mj-text font-size="18px" color="#000" font-weight="bold" font-family="helvetica">Details are as follows;</mj-text>
            <mj-text font-size="15px" color="#000000" font-family="Poppins, sans-serif">
              Appointment Reason: <strong>${reason}</strong><br />
              Appointment Date: <strong>${appointmentDate.toLocaleString()}</strong>
            </mj-text>
            <mj-text font-size="18px" color="#000000" font-family="Poppins, sans-serif">
              Best regards,<br />Mindzyte Team.
            </mj-text>
          </mj-column>
        </mj-section>

        <mj-section>
          <mj-column>
            <mj-text font-size="16px" color="#ffffff" font-family="Poppins, sans-serif" align="center">
              If you have any questions, please contact our support team at 
              <a href="mailto:admin@mindzyte.com" style="color:#fff;">admin@mindzyte.com</a>
            </mj-text>
            <mj-text font-size="16px" color="#ffffff" font-family="Poppins, sans-serif" align="center">
              &copy; ${new Date().getFullYear()} Mindzyte, all rights reserved
            </mj-text>
          </mj-column>
        </mj-section>
      </mj-body>
    </mjml>
    `;

    try {
        await HandleMail({
            email: adminEmail,
            subject: "New Consultation Notification",
            mjmlTemplate: adminEmailContent,
            data: {},
        });
        console.log('Email sent successfully to admin'); // Debugging line
    } catch (mailError) {
        console.error("Error sending email to admin:", mailError);
        return res.status(500).json({ error: "Failed to send notification email to admin" });
    }

    // user confirmation email
    const userEmailContent = `
    <mjml>
      <mj-body background-color="#4f5ef1">
        <mj-section>
          <mj-column>
            <mj-image width="150px" src="https://res.cloudinary.com/polad/image/upload/v1742228489/mindzyte_u9rvtw.png" alt="Mindzyte Logo" />
            <mj-text font-size="22px" color="#ffffff" font-family="Poppins, sans-serif" align="center" font-weight="bold">
              Welcome to Mindzyte
            </mj-text>
          </mj-column>
        </mj-section>

        <mj-section background-color="#ffffff" border-radius="10px" padding="20px">
          <mj-column>
            <mj-text font-size="18px" color="#000000" font-family="Poppins, sans-serif">
              Hello ${user.name},
            </mj-text>
            <mj-text font-size="18px" color="#000000" font-family="Poppins, sans-serif">
              Thank you for booking a consultation appointment with us. We’ve received your request and our team will review it shortly.
            </mj-text>
            <mj-text font-size="18px" color="#000000" font-family="Poppins, sans-serif">
              You will receive a confirmation or a reschedule notice soon. Please keep an eye on your email for updates.
            </mj-text>
            <mj-text font-size="18px" color="#000000" font-family="Poppins, sans-serif">
              If you have any additional information to share or questions in the meantime, feel free to reach out.
            </mj-text>
            <mj-text font-size="18px" color="#000000" font-family="Poppins, sans-serif">
              Appointment Reason: <strong>${reason}</strong><br />
              Appointment Date: <strong>${appointmentDate.toLocaleString()}</strong>
            </mj-text>
            <mj-text font-size="18px" color="#000000" font-family="Poppins, sans-serif">
              Best regards,<br />Mindzyte Team.
            </mj-text>
          </mj-column>
        </mj-section>

        <mj-section>
          <mj-column>
            <mj-text font-size="16px" color="#ffffff" font-family="Poppins, sans-serif" align="center">
              If you have any questions, please contact our support team at 
              <a href="mailto:admin@mindzyte.com" style="color:#fff;">admin@mindzyte.com</a>
            </mj-text>
            <mj-text font-size="16px" color="#ffffff" font-family="Poppins, sans-serif" align="center">
              &copy; ${new Date().getFullYear()} Mindzyte, all rights reserved
            </mj-text>
          </mj-column>
        </mj-section>
      </mj-body>
    </mjml>
    `;

    try {
        await HandleMail({
            email: user.email,
            subject: "Appointment Booked Successfully",
            mjmlTemplate: userEmailContent,
            data: {},
        });

        return res.status(201).json({
            success: true,
            message: `Appointment booked successfully. We'll get back to you shortly via email: ${user.email}`,
            appointment,
        });
    } catch (mailError) {
        console.error("Error sending email to user:", mailError);
        return res.status(500).json({ error: "Appointment created but failed to send confirmation email." });
    }
});

// for user
export const getUserAppointments = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?._id;

    const appointments = await ConsultationModel.find({ "user._id": userId }).sort({ date: -1 });

    return res.status(200).json({
        success: true,
        appointments,
    });
});

// for admin
export const getAllAppointments = CatchAsyncError(async (_req: Request, res: Response, _next: NextFunction) => {
    const appointments = await ConsultationModel.find().sort({ date: -1 });

    return res.status(200).json({
        success: true,
        total: appointments.length,
        appointments,
    });
});

// for admin to get an appointment
export const getSingleAppointment = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    const appointment = await ConsultationModel.findById(id);

    if (!appointment) {
        return next(new ErrorHandler("Appointment not found", 404));
    }

    return res.status(200).json({
        success: true,
        appointment,
    });
});

// for update of appointment
export const updateAppointmentStatus = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { status, rescheduledDate } = req.body;

    const appointment = await ConsultationModel.findById(id);
    if (!appointment) {
        return next(new ErrorHandler("Appointment not found", 404));
    }

    // Get user info (to send email)
    const user = await userModel.findById(appointment.user._id);
    if (!user) {
        return next(new ErrorHandler("User not found for this appointment", 404));
    }

    let emailSubject = "";
    let emailMJML = "";

    // APPROVE
    if (status === "approved") {
        appointment.status = "approved";

        emailSubject = "Your Appointment Has Been Approved";
        emailMJML = `
        <mjml>
      <mj-body background-color="#4f5ef1">
        <mj-section>
          <mj-column>
            <mj-image width="150px" src="https://res.cloudinary.com/polad/image/upload/v1742228489/mindzyte_u9rvtw.png" alt="Mindzyte Logo" />
            <mj-text font-size="22px" color="#ffffff" font-family="Poppins, sans-serif" align="center" font-weight="bold">
              Appointment Approved
            </mj-text>
          </mj-column>
        </mj-section>

        <mj-section background-color="#ffffff" border-radius="10px" padding="20px">
          <mj-column>
            <mj-text font-size="18px" color="#000000" font-family="Poppins, sans-serif">
              Hello ${user.name},
            </mj-text>
            <mj-text font-size="18px" color="#000000" font-family="Poppins, sans-serif">
              Great news! Your consultation appointment scheduled for <strong>${appointment.date.toLocaleString()}</strong> has been <strong>approved</strong>.
            </mj-text>
            <mj-text font-size="18px" color="#000000" font-family="Poppins, sans-serif">
              We look forward to seeing you then!
            </mj-text>
            <mj-text font-size="18px" color="#000000" font-family="Poppins, sans-serif">
              Best regards,<br />Mindzyte Team.
            </mj-text>
          </mj-column>
        </mj-section>

        <mj-section>
          <mj-column>
            <mj-text font-size="16px" color="#ffffff" font-family="Poppins, sans-serif" align="center">
              If you have any questions, please contact our support team at 
              <a href="mailto:admin@mindzyte.com" style="color:#fff;">admin@mindzyte.com</a>
            </mj-text>
            <mj-text font-size="16px" color="#ffffff" font-family="Poppins, sans-serif" align="center">
              &copy; ${new Date().getFullYear()} Mindzyte, all rights reserved
            </mj-text>
          </mj-column>
        </mj-section>
      </mj-body>
    </mjml>
        `;
    }

    // RESCHEDULE
    if (status === "rescheduled") {
        if (!rescheduledDate || isNaN(new Date(rescheduledDate).getTime())) {
            return res.status(400).json({ error: "Please provide a valid reschedule date." });
        }

        const newDate = new Date(rescheduledDate);
        appointment.status = "rescheduled";
        appointment.rescheduledDate = newDate;
        appointment.date = newDate;

        emailSubject = "Your Appointment Has Been Rescheduled";
        emailMJML = `
        <mjml>
      <mj-body background-color="#4f5ef1">
        <mj-section>
          <mj-column>
            <mj-image width="150px" src="https://res.cloudinary.com/polad/image/upload/v1742228489/mindzyte_u9rvtw.png" alt="Mindzyte Logo" />
            <mj-text font-size="22px" color="#ffffff" font-family="Poppins, sans-serif" align="center" font-weight="bold">
              Appointment Rescheduled
            </mj-text>
          </mj-column>
        </mj-section>

        <mj-section background-color="#ffffff" border-radius="10px" padding="20px">
          <mj-column>
            <mj-text font-size="18px" color="#000000" font-family="Poppins, sans-serif">
              Hello ${user.name},
            </mj-text>
            <mj-text font-size="18px" color="#000000" font-family="Poppins, sans-serif">
                Your consultation appointment has been <strong>rescheduled</strong>.
            </mj-text>
            <mj-text font-size="18px" color="#000000" font-family="Poppins, sans-serif">
              New Appointment Date: <strong>${newDate.toLocaleString()}</strong>
            </mj-text>
            <mj-text font-size="18px" color="#000000" font-family="Poppins, sans-serif">
              If you have any questions or need to make further changes, feel free to contact us.
            </mj-text>
            <mj-text font-size="18px" color="#000000" font-family="Poppins, sans-serif">
              Best regards,<br />Mindzyte Team.
            </mj-text>
          </mj-column>
        </mj-section>

        <mj-section>
          <mj-column>
            <mj-text font-size="16px" color="#ffffff" font-family="Poppins, sans-serif" align="center">
              If you have any questions, please contact our support team at 
              <a href="mailto:admin@mindzyte.com" style="color:#fff;">admin@mindzyte.com</a>
            </mj-text>
            <mj-text font-size="16px" color="#ffffff" font-family="Poppins, sans-serif" align="center">
              &copy; ${new Date().getFullYear()} Mindzyte, all rights reserved
            </mj-text>
          </mj-column>
        </mj-section>
      </mj-body>
    </mjml>
        `;
    }

    await appointment.save();

    // Send email if action is valid
    if (emailSubject && emailMJML) {
        try {
            await HandleMail({
                email: user.email,
                subject: emailSubject,
                mjmlTemplate: emailMJML,
                data: {},
            });
        } catch (mailError) {
            console.error("Error sending status update email:", mailError);
        }
    }

    return res.status(200).json({
        success: true,
        message: "Appointment updated successfully.",
        appointment,
    });
});

