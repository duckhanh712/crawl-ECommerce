import { Schema } from "mongoose";
import mongoose from "./index";
import mongoosePaginate from 'mongoose-paginate-v2';

const SendoSchema: Schema = new mongoose.Schema(
    {
        _id: {
            // SHOPEE.234213
            type: String,
            required: [true, 'Id required!']
        },
        username: String,
        password: {
            type: String,
            default: 'chozoi123'
        },
        name: String,
        phone_number: {
            type: String,
            default: null
        },
        email: {
            type: String,
            default: null
        },
        contact_name: {
            type: String,
            default: null
        },
        img_avatar_url: String,
        img_cover_url: String,
        description: String,
        link: String,
        cz_shop_id: {
            type: String,
            default: null
        },
        total_products: {
            type: Number,
            default: 0
        },
        approve_state: { // INIT APPROVING APPROVED
            type: String,
            default: 'INIT'
        },
        approve_date: { // INIT APPROVING APPROVED
            type: Date,

        },
        error_status: String,
        product_approve: {
            type: Number,
            default: 0
        },
        address: {
            province:{
                province_id: Number,
                province_name: String
            } ,
            district: {
                district_id: Number,
                district_name: String
            },
            ward: {
                ward_id: Number,
                ward_name: String
            },
            address_detail: String,
        },
        product_crawled: {
            type: Number,
            default: 0
        },
        approve_error: Object

    },
    {
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
    }
)

SendoSchema.plugin(mongoosePaginate);

export default mongoose.model('sendo_shops', SendoSchema);