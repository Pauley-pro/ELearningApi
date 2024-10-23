const mongoose = require("mongoose");

const examSchema = new mongoose.Schema({
  courseId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "courses", // Reference to the course
    required: true,
  },
  questions: [
    {
      questionText: { 
        type: String,
        required: true,
      },
      correctOption: {
        type: String,
        required: true,
      },
      options: {
        type: [String], // Array of options (objective questions)
        required: true,
      },
      totalMarks: { 
        type: Number, 
        required: true, 
      },
      passingMarks: {
        type: Number,
        required: true, 
      },
      result: [
        {
          studentId: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: "students", // Reference to the student
            required: true,
          },
          studentAnswer: { 
            type: String, 
            required: true 
          },
          studentMarks: {
            type: Number, 
            required: true 
          },
          passed: { 
            type: Boolean, 
            required: true 
          },
        }
      ],
    }
  ]
}, { 
  timestamps: true, 
});

const ExamModel = mongoose.model("Exam", examSchema);
module.exports = ExamModel;

// export default ExamModel;
