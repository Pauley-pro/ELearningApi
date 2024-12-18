import express from "express";
import { 
    addAnswer, addQuestion, addReplyToReview, addReview, 
    deleteCourse, deleteCourseManager, editCourse, editCourseManager, generateVideoUrl, 
    getAllCourses, getAllCoursesByAdmin, getAllCoursesManager, getCourseByUser, getSingleCourse, 
    uploadCourse, uploadCourseManager 
} from "../controllers/course.controller";
import { authorizeRoles, isAuthenticated } from "../middleware/auth";
const courseRouter = express.Router();

courseRouter.post("/create-course", isAuthenticated, authorizeRoles("admin"), uploadCourse);
courseRouter.post("/create-course-manager", isAuthenticated, authorizeRoles("manager"), uploadCourseManager);
courseRouter.put("/edit-course/:id", isAuthenticated, authorizeRoles("admin"), editCourse);
courseRouter.put("/edit-course-manager/:id", isAuthenticated, authorizeRoles("manager"), editCourseManager);
courseRouter.get("/get-course/:id", getSingleCourse);
courseRouter.get("/get-courses", getAllCourses);
courseRouter.get("/get-admin-courses", isAuthenticated, authorizeRoles("admin"), getAllCoursesByAdmin);
courseRouter.get("/get-manager-courses", isAuthenticated, authorizeRoles("manager"), getAllCoursesManager);
courseRouter.get("/get-course-content/:id", isAuthenticated, getCourseByUser);
// courseRouter.post("/evaluate-test", isAuthenticated, evaluateTest);
courseRouter.put("/add-question", isAuthenticated, addQuestion);
courseRouter.put("/add-answer", isAuthenticated, addAnswer);
courseRouter.put("/add-review/:id", isAuthenticated, addReview);
courseRouter.put("/add-reply", isAuthenticated, authorizeRoles("admin"), addReplyToReview);
// courseRouter.get("/get-all-courses", isAuthenticated, authorizeRoles("admin"), getAllCoursesByAdmin);
courseRouter.post("/getVdoCipherOTP", generateVideoUrl);
courseRouter.delete("/delete-course/:id", isAuthenticated, authorizeRoles("admin"), deleteCourse);
courseRouter.delete("/delete-course-manager/:id", isAuthenticated, authorizeRoles("manager"), deleteCourseManager);

export default courseRouter;