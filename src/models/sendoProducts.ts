import { Schema } from "mongoose";
import mongoose from './index';
import mongoosePaginate from 'mongoose-paginate-v2';

const SendoProductSchema: Schema = new mongoose.Schema(
    {
        _id: {
            type: String,
            required: [true, 'Product ID is required!']
        },
        product_id: String,
        shop_id: String,
        name: String,
        packing_size: {
            type: Array,
            default: [10, 10, 10]
        },
        images: {
            type: Array,
            default: []
        },
        description: {
            type: String,
            default: ''
        },
        category: Object,

        type: {
            type: String,
            default: 'NORMAL'
        },
        condition: {
            type: String,
            default: 'NEW'
        },
        is_quantity_limited: {
            type: Boolean,
            default: true
        },
        weight: {
            type: Number,
            default: 1
        },
        auto_public: {
            type: Boolean,
            default: true
        },
        variants: {
            type: Array,
            default: []
        },
        free_ship_status: {
            type: Boolean,
            default: false
        },
        platform: {
            type: String,
            required: [true, 'Platform required!']
        },
        shipping_partner_code: {
            type: String,
            default: "SELLER_EXPRESS"
        },
        state: {
            type: String,
        },
        description_pickingout: String,
        link: String

    },
    {
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
    }
);

SendoProductSchema.plugin(mongoosePaginate);
export default mongoose.model('sendo_products', SendoProductSchema);
