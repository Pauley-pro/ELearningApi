"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const consultation_controller_1 = require("../controllers/consultation.controller");
const consultationRouter = express_1.default.Router();
consultationRouter.post("/book-appointment", auth_1.isAuthenticated, consultation_controller_1.bookAppointment);
consultationRouter.get("/get-user-appointments", auth_1.isAuthenticated, consultation_controller_1.getUserAppointments);
consultationRouter.get("/get-all-appointments", auth_1.isAuthenticated, (0, auth_1.authorizeRoles)("admin"), consultation_controller_1.getAllAppointments);
consultationRouter.get("/get-single-appointment/:id", auth_1.isAuthenticated, (0, auth_1.authorizeRoles)("admin"), consultation_controller_1.getSingleAppointment);
consultationRouter.put("/update-appointment-status/:id", auth_1.isAuthenticated, (0, auth_1.authorizeRoles)("admin"), consultation_controller_1.updateAppointmentStatus);
exports.default = consultationRouter;
