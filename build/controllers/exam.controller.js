"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const catchAsyncError_1 = require("../middleware/catchAsyncError");
exports.createExamQuestion = (0, catchAsyncError_1.CatchAsyncError)(async (req, res, next) => {
    try {
        const courseId = req.params.id;
        const { questionText, correctOption, options, } = req.body;
        const newExam = new ExamModel({
            questionText,
            correctOption,
            options,
            course: courseId
        });
        await newExam.save();
        res.status(201).json({
            message: "Exam added successfully",
            success: true,
        });
    }
    catch (error) {
        // Handle any errors
        res.status(500).json({
            message: error.message || "Internal Server Error",
            success: false,
            error,
        });
    }
});
