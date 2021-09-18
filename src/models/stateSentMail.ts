import { Schema } from "mongoose";
import mongoose from "./index";
import mongoosePaginate from 'mongoose-paginate-v2';

const StateSentMailSchema: Schema = new mongoose.Schema(
    {
        _id: {
            type: String,
            required: [true, 'Id required!']
        },
        username: {
            type: String,
        },
        password: String,
        email: {
            type: String,
        },
        sent_count: {
            type: Number,
            default: 0
        },
        sent: {
            type: Number,
            default: 0
        },
        opened_mail:{
            type: Boolean,
            
        },
        open_mail: {
            type: Number,
            default: 0
        },
        first_login: {
            type: Boolean,
            default: false
        },
        file_name: String,
        
    },
    {
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
    }
)
StateSentMailSchema.plugin(mongoosePaginate);
export default mongoose.model('state_mail_shop', StateSentMailSchema);