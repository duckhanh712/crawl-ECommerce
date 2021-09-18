import { Schema } from "mongoose";
import mongoose from "./index";
import mongoosePaginate from 'mongoose-paginate-v2';

const MailManagementSchema: Schema = new mongoose.Schema(
    {
        _id: {
            type: String,
            required: [ true, ' fileName required !']
        },

        file_name: {
            type: String,
            required: [ true, ' fileName required !']
        },
        title: {
            type: String,
            required: [ true, ' Title required !']
        },
        template: {
            type: String,
            required: [ true, ' template required !']
        },
        shop_quantity: {
            type: String,
            required: [ true, ' Shop quantity required !']
        },
        progress: {
            sent:{
                type: Number,
                default: 0
            },
            total:{
                type: Number,
                default: 0
            },
        },
        date_sent: {
            type: String,
           default: null
        },
        open_mail: {
            type: Number,
            default: 0
        },
        first_login: {
            type: Number,
            default: 0
        },
        times:{
            type: Number,
            default: 0
        },
        user: String
        
        
    },
    {
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
    }
)
MailManagementSchema.plugin(mongoosePaginate);
export default mongoose.model('mail_management', MailManagementSchema);