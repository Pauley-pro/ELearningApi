import { NextFunction, Request, Response } from "express";
import { CatchAsyncError } from "../middleware/catchAsyncError";
import ErrorHandler from "../utils/ErrorHandler";
import cloudinary from "cloudinary";
import { createCourse, getAllCoursesService } from "../services/course.service";
import CourseModel from "../models/course.model";
import mongoose from "mongoose";
import ejs from "ejs";
import path from "path";
import sendMail from "../utils/sendMail";
import NotificationModel from "../models/notification.model";
import axios from 'axios';


// upload course
export const uploadCourse = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const data = req.body;
        const thumbnail = data.thumbnail;
        if (thumbnail) {
            const myCloud = await cloudinary.v2.uploader.upload(thumbnail, {
                folder: "courses"
            });
            data.thumbnail = {
                public_id: myCloud.public_id,
                url: myCloud.secure_url
            }
        } createCourse(data, res, next);
    } catch (error: any) {
        return next(new ErrorHandler(error.message, 500));
    }
});

// upload course for manager
export const uploadCourseManager = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const data = req.body;
        const thumbnail = data.thumbnail;
        if (thumbnail) {
            const myCloud = await cloudinary.v2.uploader.upload(thumbnail, {
                folder: "courses"
            });
            data.thumbnail = {
                public_id: myCloud.public_id,
                url: myCloud.secure_url
            }
        } createCourse(data, res, next);
    } catch (error: any) {
        return next(new ErrorHandler(error.message, 500));
    }
});

//edit course
export const editCourse = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const data = req.body;
        const thumbnail = data.thumbnail;
        const courseId = req.params.id;
        const courseData = await CourseModel.findById(courseId) as any;
        if (thumbnail && !thumbnail.startsWith("https")) {
            await cloudinary.v2.uploader.destroy(courseData.thumbnail.public_id);
            const myCloud = await cloudinary.v2.uploader.upload(thumbnail, {
                folder: "courses",
            });
            data.thumbnail = {
                public_id: myCloud.public_id,
                url: myCloud.secure_url,
            };
        }

        if (thumbnail.startsWith("https")) {
            data.thumbnail = {
                public_id: courseData?.thumbnail.public_id,
                url: courseData?.thumbnail.url,
            };
        }

        const course = await CourseModel.findByIdAndUpdate(
            courseId,
            {
                $set: data,
            },
            {
                new: true
            }
        );
        res.status(201).json({
            success: true,
            course,
        });
    } catch (error: any) {
        return next(new ErrorHandler(error.message, 500));
    }
});

//edit course for manager
export const editCourseManager = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const data = req.body;
        const thumbnail = data.thumbnail;
        const courseId = req.params.id;
        const courseData = await CourseModel.findById(courseId) as any;
        if (thumbnail && !thumbnail.startsWith("https")) {
            await cloudinary.v2.uploader.destroy(courseData.thumbnail.public_id);
            const myCloud = await cloudinary.v2.uploader.upload(thumbnail, {
                folder: "courses",
            });
            data.thumbnail = {
                public_id: myCloud.public_id,
                url: myCloud.secure_url,
            };
        }

        if (thumbnail.startsWith("https")) {
            data.thumbnail = {
                public_id: courseData?.thumbnail.public_id,
                url: courseData?.thumbnail.url,
            };
        }

        const course = await CourseModel.findByIdAndUpdate(
            courseId,
            {
                $set: data,
            },
            {
                new: true
            }
        );
        res.status(201).json({
            success: true,
            course,
        });
    } catch (error: any) {
        return next(new ErrorHandler(error.message, 500));
    }
});

// get single course --- without purchasing
export const getSingleCourse = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const courseId = req.params.id;
        const course = await CourseModel.findById(courseId)
        .select("-courseData.videoUrl -courseData.suggestion -courseData.questions -courseData.links")
        .populate("courseTestData");
        
        if (!course) {
            return next(new ErrorHandler("Course not found", 404));
        }
        // console.log("Course Test Data:", course.courseTestData);

        res.status(200).json({
            success: true,
            course,
        });
    } catch (error: any) {
        return next(new ErrorHandler(error.message, 500));
    }
});

/*export const evaluateTest = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    const { courseId, userAnswers } = req.body;

    const course = await CourseModel.findById(courseId);
    if (!course) {
        return next(new ErrorHandler("Course not found", 404));
    }

    let score = 0;

    // Assuming courseTestData is available in course
    const { courseTestData } = course;

    courseTestData.forEach((testData, index) => {
        if (testData.correctOption === userAnswers[index]) {
            score++;
        }
    });

    // Check if the student scored 100%
    const passed = score === courseTestData.length;

    if (passed) {
        // Logic to issue a certificate can be added here
        return res.status(200).json({
            success: true,
            passed,
            message: "Congratulations! You've passed the test and can receive your certificate.",
        });
    } else {
        return res.status(200).json({
            success: false,
            passed,
            message: "You did not pass the test. Please try again.",
        });
    }
});*/

// get all courses ---without purchasing
export const getAllCourses = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const courses = await CourseModel.find().select("-courseData.videoUrl -courseData.suggestion -courseData.questins -courseData.links");
        res.status(200).json({
            success: true,
            courses,
        });
    } catch (error: any) {
        return next(new ErrorHandler(error.message, 500));
    }
});

//get course content --only for valid user
export const getCourseByUser = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userCourseList = req.user?.courses;
        const courseId = req.params.id;
        const courseExists = userCourseList?.find((course: any) => course._id.toString() === courseId);
        if (!courseExists) {
            return next(new ErrorHandler("You are not eligible to access this course", 404));
        }
        /*const course = await CourseModel.findById(courseId).select('courseData courseTestData'); // Select specific fields
        const content = course?.courseData;
        const courseTestData = course?.courseTestData; // Adjust this line based on your actual data structure
        console.log("Course Test Data:", courseTestData);*/

        const course = await CourseModel.findById(courseId);
        const content = course?.courseData;

        res.status(200).json({
            success: true,
            content,
        });
    } catch (error: any) {
        return next(new ErrorHandler(error.message, 500));
    }
});

// add question in course
interface IAddQuestionData {
    question: string;
    courseId: string;
    contentId: string;
}

export const addQuestion = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { question, courseId, contentId }: IAddQuestionData = req.body;
        const course = await CourseModel.findById(courseId);
        if (!mongoose.Types.ObjectId.isValid(contentId)) {
            return next(new ErrorHandler("Invalid content id", 400))
        }
        const courseContent = course?.courseData?.find((item: any) => item._id.equals(contentId));
        if (!courseContent) {
            return next(new ErrorHandler("Invalid content id", 400))
        }
        // create a new question object
        const newQuestion: any = {
            user: req.user,
            question,
            questionReplies: [],
        };

        // add this question to our course content
        courseContent.questions.push(newQuestion);

        await NotificationModel.create({
            user: req.user?._id,
            title: "New Question Received",
            message: `You have a new question in ${courseContent?.title}`,
        });

        // save the updated course
        await course?.save();
        res.status(200).json({
            success: true,
            course
        });
    } catch (error: any) {
        return next(new ErrorHandler(error.message, 500));
    }
})

// add replies in course question
interface IAddAnswerData {
    answer: string;
    courseId: string;
    contentId: string;
    questionId: string;
}

export const addAnswer = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { answer, courseId, contentId, questionId }: IAddAnswerData = req.body;
        const course = await CourseModel.findById(courseId);
        if (!mongoose.Types.ObjectId.isValid(contentId)) {
            return next(new ErrorHandler("Invalid content id", 400))
        }
        const courseContent = course?.courseData?.find((item: any) => item._id.equals(contentId));
        if (!courseContent) {
            return next(new ErrorHandler("Invalid content id", 400))
        }
        const question = courseContent?.questions?.find((item: any) => item._id.equals(questionId));
        if (!question) {
            return next(new ErrorHandler("Invalid question id", 400));
        }

        if (!question.questionReplies) {
            question.questionReplies = [];
        }

        //create a new answer object
        const newAnswer: any = {
            user: req.user,
            answer,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        }

        // add this answer to our course content
        question.questionReplies.push(newAnswer);
        await course?.save();
        if (req.user?._id === question.user._id) {
            // create a notification
            await NotificationModel.create({
                user: req.user?.id,
                title: "New Question Reply Received",
                message: `You have a new question reply in ${courseContent.title}`
            })
        } else {
            const data = {
                name: question.user.name,
                title: courseContent.title,
            }
            const html = await ejs.renderFile(path.join(__dirname, "../mails/question-reply.ejs"), data);
            try {
                await sendMail({
                    email: question.user.email,
                    subject: "Question Reply",
                    template: "question-reply.ejs",
                    data,
                });
            } catch (error: any) {
                return next(new ErrorHandler(error.message, 500));
            }
        }
        res.status(200).json({
            success: true,
            course,
        })

    } catch (error: any) {
        return next(new ErrorHandler(error.message, 500));
    }
})

// add review in course
interface IAddReviewData {
    review: string;
    courseId: string;
    rating: number;
    userId: string;
}

export const addReview = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userCourseList = req.user?.courses;
        const courseId = req.params.id;
        const courseExists = userCourseList?.some((course: any) => course._id.toString() === courseId.toString());
        
        if (!courseExists) {
            return next(new ErrorHandler("You are not eligible to access this course", 400));
        }
        
        const course = await CourseModel.findById(courseId);
        const { review, rating } = req.body as IAddReviewData;
        
        const reviewData: any = {
            user: req.user,
            comment: review,
            rating,
        };
        
        course?.reviews.push(reviewData);
        
        let avg = 0;
        course?.reviews.forEach((rev: any) => {
            avg += rev.rating;
        });
        
        if (course) {
            course.ratings = avg / course.reviews.length;
        }
        
        await course?.save();

        // create notification
        await NotificationModel.create({
            user: req.user?._id,
            title: "New Review Received",
            message: `You have a new review in ${course?.name}`,
        });

        res.status(200).json({
            success: true,
            course,
        });
    } catch (error: any) {
        return next(new ErrorHandler(error.message, 500));
    }
});

// add reply in review
interface IAddReviewData {
    comment: string;
    courseId: string;
    reviewId: string;
}

export const addReplyToReview = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { comment, courseId, reviewId } = req.body as IAddReviewData;
        const course = await CourseModel.findById(courseId);
        
        if (!course) {
            return next(new ErrorHandler("Course not found", 404));
        }
        
        const review = course.reviews.find((rev: any) => rev._id.toString() === reviewId);
        
        if (!review) {
            return next(new ErrorHandler("Review not found", 404));
        }
        
        const replyData: any = {
            user: req.user,
            comment,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        
        if (!review.commentReplies) {
            review.commentReplies = [];
        }
        
        review.commentReplies.push(replyData);
        await course.save();
        
        res.status(200).json({
            success: true,
            course,
        });
    } catch (error: any) {
        return next(new ErrorHandler(error.message, 500));
    }
});

// get all courses --- only for admin
export const getAllCoursesByAdmin = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        getAllCoursesService(res);
    } catch (error: any) {
        return next(new ErrorHandler(error.message, 400));
    }
});

// get all courses --- only for manager
export const getAllCoursesManager = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        getAllCoursesService(res);
    } catch (error: any) {
        return next(new ErrorHandler(error.message, 400));
    }
});

// delete course ---- only for admin
export const deleteCourse = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const course = await CourseModel.findById(id);
        
        if (!course) {
            return next(new ErrorHandler("Course not found", 404));
        }
        
        await course.deleteOne({ _id: id });
        
        res.status(200).json({
            success: true,
            message: "Course deleted successfully"
        });
    } catch (error: any) {
        return next(new ErrorHandler(error.message, 400));
    }
});

// delete course ---- only for manager
export const deleteCourseManager = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const course = await CourseModel.findById(id);
        
        if (!course) {
            return next(new ErrorHandler("Course not found", 404));
        }
        
        await course.deleteOne({ _id: id });
        
        res.status(200).json({
            success: true,
            message: "Course deleted successfully"
        });
    } catch (error: any) {
        return next(new ErrorHandler(error.message, 400));
    }
});

// generate video url
export const generateVideoUrl = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { videoId } = req.body;
        const response = await axios.post(
            `https://dev.vdocipher.com/api/videos/${videoId}/otp`,
            { ttl: 300 },
            {
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    Authorization: `Apisecret ${process.env.VDOCIPHER_API_SECRET}`,
                },
            }
        );
        res.json(response.data);
    } catch (error: any) {
        return next(new ErrorHandler(error.message, 400))
    }
})
