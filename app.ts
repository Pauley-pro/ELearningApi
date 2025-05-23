require("dotenv").config();
import express, { NextFunction, Request, Response } from "express";
export const app = express();
import cors from "cors";
import cookieParser from "cookie-parser";
import { ErrorMiddleware } from "./middleware/error";
import userRouter from "./routes/user.route";
import courseRouter from "./routes/course.route";
import orderRouter from "./routes/order.route";
import notificationRouter from "./routes/notification.route";
import analyticsRouter from "./routes/analytics.route";
import layoutRouter from "./routes/layout.route";
import { rateLimit } from "express-rate-limit";
import consultationRouter from "./routes/consultation.route";


// body parser
app.use(express.json({ limit: "50mb" }));

// cookie parser
app.use(cookieParser());

// cors => cross origin resource sharing
const corsOptions = {
    // origin: "https://e-learning-client-phi.vercel.app",
    // origin: "http://localhost:3000",
    origin: "https://www.mindzyte.com",
    credentials: true,
};

app.use(cors(corsOptions));

/*app.use(
    cors({
        // origin: "https://e-learning-client-phi.vercel.app",
        origin: "http://localhost:3000",
        credentials: true,
    })
);*/

// api request limit
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 100,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
})

// routes
app.use(
    "/api/v1",
    userRouter,
    courseRouter,
    orderRouter,
    notificationRouter,
    analyticsRouter,
    layoutRouter,
    consultationRouter
);


// testing api
app.get("/test", (req: Request, res: Response, next: NextFunction) => {
    res.status(200).json({
        success: true,
        message: "API is working",
    });
});

// unknown route
app.all("*", (req: Request, res: Response, next: NextFunction) => {
    const err = new Error(`Route ${req.originalUrl} not found`) as any;
    err.statusCode = 404;
    next(err);
});

app.use(limiter);
app.use(ErrorMiddleware);


//for the upstash database-----console.upstash.com for redis