import { CatchAsyncError } from "../middleware/catchAsyncError";
import { NextFunction, Request, Response } from "express";


exports.createExamQuestion = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const courseId = req.params.id;
    const {questionText, correctOption, options, } = req.body;

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
  } catch (error: any) {
    // Handle any errors
    res.status(500).json({
      message: error.message || "Internal Server Error",
      success: false,
      error,
    });
  }
});
