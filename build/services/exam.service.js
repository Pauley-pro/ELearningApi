"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const catchAsyncError_1 = require("../middleware/catchAsyncError");
exports.createExamQuestion = (0, catchAsyncError_1.CatchAsyncError)(async (data, res) => {
    const newExam = await ExamModel.create(data);
    res.status(201).json({
        success: true,
        newExam,
    });
});
