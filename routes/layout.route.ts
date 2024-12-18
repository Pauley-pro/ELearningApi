import express from "express";
import { authorizeRoles, isAuthenticated } from "../middleware/auth";
import { createLayout, createLayoutManager, editLayout, editLayoutManager, getLayoutByType } from "../controllers/layout.controller";
const layoutRouter = express.Router();

layoutRouter.post("/create-layout", isAuthenticated, authorizeRoles("admin"), createLayout);
layoutRouter.post("/create-layout-manager", isAuthenticated, authorizeRoles("manager"), createLayoutManager);
layoutRouter.put("/edit-layout", isAuthenticated, authorizeRoles("admin"), editLayout);
layoutRouter.put("/edit-layout-manager", isAuthenticated, authorizeRoles("manager"), editLayoutManager);
layoutRouter.get("/get-layout/:type", getLayoutByType);

export default layoutRouter;