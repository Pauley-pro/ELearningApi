"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUser = exports.updateUserRole = exports.getAllUsers = exports.updateProfilePicture = exports.updatePassword = exports.updateUserInfo = exports.socialAuth = exports.getUserInfo = exports.UpdateAccessToken = exports.logoutUser = exports.loginUser = exports.activateUser = exports.createActivationToken = exports.registrationUser = void 0;
require('dotenv').config();
const user_model_1 = __importDefault(require("../models/user.model"));
const ErrorHandler_1 = __importDefault(require("../utils/ErrorHandler"));
const catchAsyncError_1 = require("../middleware/catchAsyncError");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const ejs_1 = __importDefault(require("ejs"));
const path_1 = __importDefault(require("path"));
const sendMail_1 = __importDefault(require("../utils/sendMail"));
const jwt_1 = require("../utils/jwt");
const redis_1 = require("../utils/redis");
const user_service_1 = require("../services/user.service");
const cloudinary_1 = __importDefault(require("cloudinary"));
exports.registrationUser = (0, catchAsyncError_1.CatchAsyncError)(async (req, res, next) => {
    try {
        const { name, email, password } = req.body;
        const isEmailExist = await user_model_1.default.findOne({ email });
        if (isEmailExist) {
            return next(new ErrorHandler_1.default("Email already exist", 400));
        }
        ;
        const user = {
            name,
            email,
            password,
        };
        const activationToken = (0, exports.createActivationToken)(user);
        const activationCode = activationToken.activationCode;
        const data = { user: { name: user.name }, activationCode };
        const html = await ejs_1.default.renderFile(path_1.default.join(__dirname, "../mails/activation-mail.ejs"), data);
        try {
            await (0, sendMail_1.default)({
                email: user.email,
                subject: "Activate your account",
                template: "activation-mail.ejs",
                data,
            });
            res.status(201).json({
                success: true,
                message: `Please, check your email: ${user.email} to activate your account!`,
                activationToken: activationToken.token,
            });
        }
        catch (error) {
            return next(new ErrorHandler_1.default(error.message, 400));
        }
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 400));
    }
});
const createActivationToken = (user) => {
    const activationCode = Math.floor(1000 + Math.random() * 9000).toString();
    const token = jsonwebtoken_1.default.sign({
        user,
        activationCode,
    }, process.env.ACTIVATION_SECRET, {
        expiresIn: "5m",
    });
    return { token, activationCode };
};
exports.createActivationToken = createActivationToken;
exports.activateUser = (0, catchAsyncError_1.CatchAsyncError)(async (req, res, next) => {
    try {
        const { activation_token, activation_code } = req.body;
        const newUser = jsonwebtoken_1.default.verify(activation_token, process.env.ACTIVATION_SECRET);
        if (newUser.activationCode !== activation_code) {
            return next(new ErrorHandler_1.default("Invalid activation code", 400));
        }
        const { name, email, password } = newUser.user;
        const existUser = await user_model_1.default.findOne({ email });
        if (existUser) {
            return next(new ErrorHandler_1.default("Email alraedy exist", 400));
        }
        const user = await user_model_1.default.create({
            name,
            email,
            password,
        });
        res.status(201).json({
            success: true,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 400));
    }
});
exports.loginUser = (0, catchAsyncError_1.CatchAsyncError)(async (req, res, next) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return next(new ErrorHandler_1.default("Please enter email and password", 400));
        }
        ;
        const user = await user_model_1.default.findOne({ email }).select("+password");
        if (!user) {
            return next(new ErrorHandler_1.default("Invalid email or password", 400));
        }
        ;
        const isPasswordMatch = await user.comparePassword(password);
        if (!isPasswordMatch) {
            return next(new ErrorHandler_1.default("Invalid email or password", 400));
        }
        ;
        (0, jwt_1.sendToken)(user, 200, res);
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 400));
    }
});
// logout user
exports.logoutUser = (0, catchAsyncError_1.CatchAsyncError)(async (req, res, next) => {
    try {
        res.cookie("access_token", "", { maxAge: 1 });
        res.cookie("refresh_token", "", { maxAge: 1 });
        const userId = req.user?._id || "";
        redis_1.redis.del(userId);
        res.status(200).json({
            success: true,
            message: "Logged out successfully",
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 400));
    }
});
// update access token
exports.UpdateAccessToken = (0, catchAsyncError_1.CatchAsyncError)(async (req, res, next) => {
    try {
        const refresh_token = req.cookies.refresh_token;
        const decoded = jsonwebtoken_1.default.verify(refresh_token, process.env.REFRESH_TOKEN);
        const message = "Could not refresh token";
        if (!decoded) {
            return next(new ErrorHandler_1.default(message, 400));
        }
        const session = await redis_1.redis.get(decoded.id);
        if (!session) {
            return next(new ErrorHandler_1.default("Please, login to access this resource!", 400));
        }
        const user = JSON.parse(session);
        const accessToken = jsonwebtoken_1.default.sign({ id: user._id }, process.env.ACCESS_TOKEN, {
            expiresIn: "5m",
        });
        const refreshToken = jsonwebtoken_1.default.sign({ id: user._id }, process.env.REFRESH_TOKEN, {
            expiresIn: "3d",
        });
        req.user = user;
        res.cookie("access_token", accessToken, jwt_1.accessTokenOptions);
        res.cookie("refresh_token", refreshToken, jwt_1.refreshTokenOptions);
        await redis_1.redis.set(user._id, JSON.stringify(user), "EX", 604800); // 7days
        return next();
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 400));
    }
});
// get user info
exports.getUserInfo = (0, catchAsyncError_1.CatchAsyncError)(async (req, res, next) => {
    try {
        const userId = req.user?._id;
        (0, user_service_1.getUserById)(userId, res);
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 400));
    }
});
// social auth
exports.socialAuth = (0, catchAsyncError_1.CatchAsyncError)(async (req, res, next) => {
    try {
        const { email, name, avatar } = req.body;
        const user = await user_model_1.default.findOne({ email });
        if (!user) {
            const newUser = await user_model_1.default.create({ email, name, avatar });
            (0, jwt_1.sendToken)(newUser, 200, res);
        }
        else {
            (0, jwt_1.sendToken)(user, 200, res);
        }
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 400));
    }
});
exports.updateUserInfo = (0, catchAsyncError_1.CatchAsyncError)(async (req, res, next) => {
    try {
        const { name } = req.body;
        const userId = req.user?._id;
        const user = await user_model_1.default.findById(userId);
        if (name && user) {
            user.name = name;
        }
        await user?.save();
        await redis_1.redis.set(userId, JSON.stringify(user));
        res.status(201).json({
            success: true,
            user,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 400));
    }
});
exports.updatePassword = (0, catchAsyncError_1.CatchAsyncError)(async (req, res, next) => {
    try {
        const { oldPassword, newPassword } = req.body;
        if (!oldPassword || !newPassword) {
            return next(new ErrorHandler_1.default("Please, enter old and new password", 400));
        }
        const user = await user_model_1.default.findById(req.user?._id).select("+password");
        if (user?.password === undefined) {
            return next(new ErrorHandler_1.default("Invalid user", 400));
        }
        const isPasswordMatch = await user?.comparePassword(oldPassword);
        if (!isPasswordMatch) {
            return next(new ErrorHandler_1.default("Invalid old password", 400));
        }
        user.password = newPassword;
        await user.save();
        await redis_1.redis.set(req.user?._id, JSON.stringify(user));
        res.status(201).json({
            success: true,
            user,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 400));
    }
});
exports.updateProfilePicture = (0, catchAsyncError_1.CatchAsyncError)(async (req, res, next) => {
    try {
        const { avatar } = req.body;
        const userId = req.user?._id;
        const user = await user_model_1.default.findById(userId);
        if (avatar && user) {
            // if user has one avatar then, call this if
            if (user?.avatar?.public_id) {
                // first delete the old image
                await cloudinary_1.default.v2.uploader.destroy(user?.avatar?.public_id);
                const myCloud = await cloudinary_1.default.v2.uploader.upload(avatar, {
                    folder: "avatars",
                    width: 150,
                });
                user.avatar = {
                    public_id: myCloud.public_id,
                    url: myCloud.secure_url,
                };
            }
            else {
                const myCloud = await cloudinary_1.default.v2.uploader.upload(avatar, {
                    folder: "avatars",
                    width: 150,
                });
                user.avatar = {
                    public_id: myCloud.public_id,
                    url: myCloud.secure_url,
                };
            }
        }
        await user?.save();
        await redis_1.redis.set(userId, JSON.stringify(user));
        res.status(200).json({
            success: true,
            user,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 400));
    }
});
// get all users ---- only for admin
exports.getAllUsers = (0, catchAsyncError_1.CatchAsyncError)(async (req, res, next) => {
    try {
        (0, user_service_1.getAllUsersService)(res);
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 400));
    }
});
// update user role ---- only for Admin
exports.updateUserRole = (0, catchAsyncError_1.CatchAsyncError)(async (req, res, next) => {
    try {
        const { email, role } = req.body;
        const isUserExist = await user_model_1.default.findOne({ email });
        if (isUserExist) {
            const id = isUserExist._id;
            (0, user_service_1.updateUserRoleService)(res, id, role);
        }
        else {
            res.status(400).json({
                success: false,
                message: "User not found"
            });
        }
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 400));
    }
});
// delete user ---- only for admin
exports.deleteUser = (0, catchAsyncError_1.CatchAsyncError)(async (req, res, next) => {
    try {
        const { id } = req.params;
        const user = await user_model_1.default.findById(id);
        if (!user) {
            return next(new ErrorHandler_1.default("User not found", 404));
        }
        await user.deleteOne({ id });
        await redis_1.redis.del(id);
        res.status(200).json({
            success: true,
            message: "User deleted successfully"
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 400));
    }
});
{ /*
require('dotenv').config();
import { Request, Response, NextFunction } from "express";
import userModel, { IUser } from "../models/user.model";
import ErrorHandler from "../utils/ErrorHandler";
import { CatchAsyncError } from "../middleware/catchAsyncError";
import jwt, { JwtPayload, Secret } from "jsonwebtoken";
import ejs from "ejs";
import path from "path";
import sendMail from "../utils/sendMail";
import { accessTokenOptions, refreshTokenOptions, sendToken } from "../utils/jwt";
import { getAllUsersService, getUserById, updateUserRoleService } from "../services/user.service";
import cloudinary from "cloudinary";
import { addQuestion } from "./course.controller";

// register user
interface IRegistrationBody {
    name: string;
    email: string;
    password: string;
    avatar?: string;
}

export const registrationUser = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { name, email, password } = req.body;

        const isEmailExist = await userModel.findOne({ email });
        if (isEmailExist) {
            return next(new ErrorHandler("Email already exist", 400));
        };

        const user: IRegistrationBody = {
            name,
            email,
            password,
        };

        const activationToken = createActivationToken(user);
        const activationCode = activationToken.activationCode;
        const data = { user: { name: user.name }, activationCode };
        const html = await ejs.renderFile(path.join(__dirname, "../mails/activation-mail.ejs"), data);
        
        try {
            await sendMail({
                email: user.email,
                subject: "Activate your account",
                template: "activation-mail.ejs",
                data,
            });
            res.status(201).json({
                success: true,
                message: `Please, check your email: ${user.email} to activate your account!`,
                activationToken: activationToken.token,
            });
        } catch (error: any) {
            return next(new ErrorHandler(error.message, 400))
        }
    }
    catch (error: any) {
        return next(new ErrorHandler(error.message, 400));
    }
});

interface IActivationToken {
    token: string;
    activationCode: string;
}

export const createActivationToken = (user: any): IActivationToken => {
    const activationCode = Math.floor(1000 + Math.random() * 9000).toString();
    const token = jwt.sign({
        user,
        activationCode,
    },
        process.env.ACTIVATION_SECRET as Secret, {
        expiresIn: "5m",
    });
    return { token, activationCode };
};

// activate user
interface IActivationRequest{
    activation_token: string;
    activation_code: string;
}

export const activateUser = CatchAsyncError(async(req:Request,res:Response,next:NextFunction) => {
    try {
        const {activation_token, activation_code} = req.body as IActivationRequest;
        const newUser: {user: IUser; activationCode:string} = jwt.verify(
            activation_token,
            process.env.ACTIVATION_SECRET as string
        ) as {user: IUser; activationCode:string};
        
        if(newUser.activationCode !== activation_code){
            return next(new ErrorHandler("Invalid activation code",400));
        }
        const {name,email,password} = newUser.user;
        const existUser = await userModel.findOne({email});
        if(existUser){
            return next(new ErrorHandler("Email alraedy exist",400));
        }
        const user = await userModel.create({
            name,
            email,
            password,
        });
        res.status(201).json({
            success:true,
        })
    } catch (error:any) {
        return next(new ErrorHandler(error.message, 400));
    }
});

// Login user
interface ILoginRequest {
    email: string;
    password: string;
}

export const loginUser = CatchAsyncError(async(req:Request,res:Response,next:NextFunction) => {
    try{
        const {email, password} = req.body as ILoginRequest;
        if(!email || !password){
            return next(new ErrorHandler("Please enter email and password", 400));
        };
        const user = await userModel.findOne({email}).select("+password");
        if(!user){
            return next(new ErrorHandler("Invalid email or password", 400));
        };
        const isPasswordMatch = await user.comparePassword(password);
        if(!isPasswordMatch){
            return next(new ErrorHandler("Invalid email or password", 400));
        };
        sendToken(user,200,res);

    } catch (error:any) {
        return next(new ErrorHandler(error.message, 400));
    }
});

// logout user
export const logoutUser = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        res.cookie("access_token", "", { maxAge: 1 });
        res.cookie("refresh_token", "", { maxAge: 1 });
        res.status(200).json({
            success: true,
            message: "Logged out successfully",
        });
    } catch (error: any) {
        return next(new ErrorHandler(error.message, 400));
    }
});

// update access token
export const UpdateAccessToken = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const refresh_token = req.cookies.refresh_token as string;
        const decoded = jwt.verify(refresh_token, process.env.REFRESH_TOKEN as string) as JwtPayload;
        const message = "Could not refresh token";
        if (!decoded) {
            return next(new ErrorHandler(message, 400));
        }
        const user = await userModel.findById(decoded.id);
        if (!user) {
            return next(new ErrorHandler("Please, login to access this resource!", 400));
        }
        const accessToken = jwt.sign({ id: user._id }, process.env.ACCESS_TOKEN as string, {
            expiresIn: "5m",
        });
        const refreshToken = jwt.sign({ id: user._id }, process.env.REFRESH_TOKEN as string, {
            expiresIn: "3d",
        });
        req.user = user;
        res.cookie("access_token", accessToken, accessTokenOptions);
        res.cookie("refresh_token", refreshToken, refreshTokenOptions);
        return next();
    } catch (error: any) {
        return next(new ErrorHandler(error.message, 400));
    }
});

// get user info
export const getUserInfo = CatchAsyncError(async(req:Request, res:Response, next:NextFunction) => {
    try{
        const userId = req.user?._id;
        getUserById(userId, res);
    } catch(error:any) {
        return next(new ErrorHandler(error.message, 400));
    }
})

interface ISocialAuthBody{
    email: string;
    name: string;
    avatar: string;
}

// social auth
export const socialAuth = CatchAsyncError(async(req:Request, res:Response, next:NextFunction) => {
    try{
        const {email, name, avatar} = req.body as ISocialAuthBody;
        const user = await userModel.findOne({email});
        if(!user){
            const newUser = await userModel.create({email, name, avatar})
            sendToken(newUser, 200, res);
        } else{
            sendToken(user, 200, res);
        }
    } catch(error:any) {
        return next(new ErrorHandler(error.message, 400));
    }
});

// update user info
interface IUpdateUserInfo{
    name?: string;
    email?: string;
}

export const updateUserInfo = CatchAsyncError(async(req:Request, res:Response, next:NextFunction) => {
    try{
        const { name } = req.body as IUpdateUserInfo;
        const userId = req.user?._id;
        const user = await userModel.findById(userId);
        
        if(name && user){
            user.name = name;
        }
        await user?.save();
        res.status(201).json({
            success: true,
            user,
        });
    } catch (error: any) {
        return next(new ErrorHandler(error.message, 400));
    }
});

// update user password
interface IUpdatePassword{
    oldPassword: string;
    newPassword: string;
}

export const updatePassword = CatchAsyncError(async(req:Request, res:Response, next:NextFunction) => {
    try{
        const { oldPassword, newPassword } = req.body as IUpdatePassword;
        if(!oldPassword || !newPassword){
            return next(new ErrorHandler("Please, enter old and new password", 400))
        }
        const user = await userModel.findById(req.user?._id).select("+password");
        if(user?.password === undefined){
            return next(new ErrorHandler("Invalid user", 400));
        }
        const isPasswordMatch = await user?.comparePassword(oldPassword);
        if(!isPasswordMatch){
            return next(new ErrorHandler("Invalid old password", 400))
        }
        user.password = newPassword;
        await user.save();
        res.status(201).json({
            success: true,
            user,
        });
    } catch (error: any) {
        return next(new ErrorHandler(error.message, 400));
    }
});

// update profile picture
interface IUpdateProfilePicture{
    avatar: string;
}

export const updateProfilePicture = CatchAsyncError(async(req:Request, res:Response, next:NextFunction) => {
    try{
        const  { avatar } = req.body as IUpdateProfilePicture;
        const userId = req.user?._id;
        const user = await userModel.findById(userId);
        if (avatar && user) {
            // if user has one avatar then, call this if
            if (user.avatar?.public_id) {
                // first delete the old image
                await cloudinary.v2.uploader.destroy(user.avatar.public_id);

                const myCloud = await cloudinary.v2.uploader.upload(avatar, {
                    folder: "avatars",
                    width: 150,
                });
                user.avatar = {
                    public_id: myCloud.public_id,
                    url: myCloud.secure_url,
                };
            } else {
                const myCloud = await cloudinary.v2.uploader.upload(avatar, {
                    folder: "avatars",
                    width: 150,
                });
                user.avatar = {
                    public_id: myCloud.public_id,
                    url: myCloud.secure_url,
                };
            }
        }
        await user?.save();
        res.status(200).json({
            success: true,
            user,
        });
    } catch (error: any) {
        return next(new ErrorHandler(error.message, 400));
    }
});

// get all users ---- only for admin
export const getAllUsers = CatchAsyncError(async(req:Request, res:Response, next:NextFunction) => {
    try{
        getAllUsersService(res);
    } catch(error:any){
        return next(new ErrorHandler(error.message, 400));
    }
});

// update user role ---- only for Admin
export const updateUserRole = CatchAsyncError(async(req:Request, res:Response, next:NextFunction) => {
    try{
        const { email, role } = req.body;
        const isUserExist = await userModel.findOne({ email });
        if (isUserExist){
            const id = isUserExist._id;
            updateUserRoleService(res, id, role);
        }
        else{
            res.status(400).json({
                success: false,
                message: "User not found"
            })
        }
    } catch(error:any){
        return next(new ErrorHandler(error.message, 400));
    }
});


// delete user ---- only for admin
export const deleteUser = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const user = await userModel.findById(id);
        if (!user) {
            return next(new ErrorHandler("User not found", 404));
        }
        await user.deleteOne();
        res.status(200).json({
            success: true,
            message: "User deleted successfully",
        });
    } catch (error: any) {
        return next(new ErrorHandler(error.message, 400));
    }
});
*/
}
