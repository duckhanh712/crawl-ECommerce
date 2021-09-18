import { Schema } from "mongoose";
import mongoose from './index';

const shopeeProductIdSchema: Schema = new mongoose.Schema(
    {
        _id: {
            type: String,
            required: [true, 'ID is required!']
        },
        product_id: {
            type: String,
            required: [true, 'Product ID is required!']
        },
        shop_id: String,
        state: {
            type: String,
            default: 'INIT' // INIT, FAIL, SUCCESS
        },
        link: String
    },
    {
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
    }
);

shopeeProductIdSchema.index({ shop_id: 1, product_id: 1 });
shopeeProductIdSchema.index({ product_id: 1 });
shopeeProductIdSchema.on('index', e => {
    console.log('index error:', e);
});


export default mongoose.model('shopee_product_ids', shopeeProductIdSchema);
