import { app } from "./app";
import { v2 as cloudinary } from "cloudinary";
import http from "http";
import connectDB from "./utils/db";
import { initSocketServer } from "./socketServer";
require('dotenv').config();
const server = http.createServer(app);


// cloudinary config
cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_API_KEY,
    api_secret: process.env.CLOUD_API_SECRET,
});

initSocketServer(server)

// create server
app.listen(process.env.PORT, () => {
    console.log(`Server is connected with ${process.env.PORT}`);
    connectDB();
});

