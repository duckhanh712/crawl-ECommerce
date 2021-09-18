import { Schema } from "mongoose";
import mongoose from "./index";

const FileState: Schema = new mongoose.Schema(
    {
        _id: {
            type: Number,
            required: [true, 'Id required!']
        },
        skip: Number,
        limit: Number,
        type: String
        
    },
    {
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
    }
)
export default mongoose.model('file_state', FileState);