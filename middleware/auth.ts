import { Request, Response, NextFunction } from "express";
import { CatchAsyncError } from "./catchAsyncError";
import ErrorHandler from "../utils/ErrorHandler";
import jwt, { JwtPayload } from "jsonwebtoken";
import { UpdateAccessToken } from "../controllers/user.controller";
import userModel from "../models/user.model";

// authenticated user
export const isAuthenticated = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    const access_token = req.cookies.access_token as string;
    if (!access_token) {
        return next(new ErrorHandler("Please, login to access this resource", 400));
    }
    const decoded = jwt.decode(access_token) as JwtPayload;
    if (!decoded) {
        return next(new ErrorHandler("access token is not valid", 400));
    }
    // check if the access token is expired
    if (decoded.exp && decoded.exp <= Date.now() / 1000) {
        try {
            await UpdateAccessToken(req, res, next);
        } catch (error) {
            return next(error);
        }
    } else {
        const user = await userModel.findById(decoded.id);
        if (!user) {
            return next(new ErrorHandler("Please, login to access this resource!", 400));
        }
        req.user = user;
        next();
    }
});

// validate user role
export const authorizeRoles = (...roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!roles.includes(req.user?.role || "")) {
            return next(new ErrorHandler(`Role: ${req.user?.role} is not allowed to access this resource`, 403))
        }
        next();
    }
}