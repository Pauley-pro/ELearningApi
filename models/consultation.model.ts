import mongoose, { Document, Model, Schema, Types } from "mongoose";
import { IUser } from "./user.model";

interface IConsultation extends Document {
    user: {
        _id: Types.ObjectId;
        name: string;
    };
    reason: string;
    date: Date;
    status: "pending" | "approved" | "rescheduled";
    rescheduledDate?: Date;
}

const consultationSchema = new Schema<IConsultation>({
    user: {
        _id: {
            type: Schema.Types.ObjectId,
            required: true,
            ref: "User",
        },
        name: {
            type: String,
            required: true,
        }
    },
    reason: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        required: true,
    },
    status: {
        type: String,
        enum: ["pending", "approved", "rescheduled"],
        default: "pending"
    },
    rescheduledDate: {
        type: Date
    }
}, { timestamps: true });

const ConsultationModel: Model<IConsultation> = mongoose.model('Consultation', consultationSchema);

export default ConsultationModel;

/*
const consultationSchema = new mongoose.Schema({
    userName: { type: String, required: true },
    email: { type: String, required: true },
    date: { type: Date, required: true },
    status: { type: String, enum: ["pending", "approved", "rescheduled"], default: "pending" },
    rescheduledDate: { type: Date }
}, { timestamps: true });
*/

// export default mongoose.model("Consultation", consultationSchema);
