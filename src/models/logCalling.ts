import { Schema } from "mongoose";
import mongoose from "./index";

const LogCalling: Schema = new mongoose.Schema(
    {

        shop_id: {
            type: String,
            default: null
        },
        status: {
            type: String,
            default: null
        },
        note: {
            type: String,
            default: null
        },
        user: {
            type: String,
            default: null
        },
        phone_number: {
            type: Number,
            default: null
        }

    },
    {
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
    }
)


export default mongoose.model('log_calling', LogCalling);