import express from "express";
import { authorizeRoles, isAuthenticated } from "../middleware/auth";
import { bookAppointment, getAllAppointments, getSingleAppointment, getUserAppointments, updateAppointmentStatus } from "../controllers/consultation.controller";
const consultationRouter = express.Router();

consultationRouter.post("/book-appointment", isAuthenticated, bookAppointment);
consultationRouter.get("/get-user-appointments", isAuthenticated, getUserAppointments)
consultationRouter.get("/get-all-appointments", isAuthenticated, authorizeRoles("admin"), getAllAppointments)
consultationRouter.get("/get-single-appointment/:id", isAuthenticated, authorizeRoles("admin"), getSingleAppointment);
consultationRouter.put("/update-appointment-status/:id", isAuthenticated, authorizeRoles("admin"), updateAppointmentStatus);


export default consultationRouter;