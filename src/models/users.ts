import { Schema } from "mongoose";
import mongoose from './index';
import mongoosePaginate from 'mongoose-paginate-v2';

const UserSchema: Schema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Name is required!'],
            trim: true,
        },
        email: {
            type: String,
            unique: [true, 'Email is unique!'],
            required: [true, 'Email is required!'],
            lowercase: true,

        },
        password: {
            type: String,
            required: [true, 'Password is required!'],
            minlength: 6,
        },
        role: {
            type: String,
            required: [true, ' Role is required !'],
        },
        refresh_token: {
            type: String,
            default: ''
        },
        status: {
            type: String,
            default: 'ACTIVE'
        }
    }
);

UserSchema.index({ email: 1 });

UserSchema.plugin(mongoosePaginate);
export default mongoose.model('users', UserSchema)
