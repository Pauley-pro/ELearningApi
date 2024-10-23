import { Response } from "express";
import { CatchAsyncError } from "../middleware/catchAsyncError";

exports.createExamQuestion = CatchAsyncError(async (data: any, res: Response) => {
    const newExam = await ExamModel.create(data);
    res.status(201).json({
        success: true,
        newExam,
    });
});

