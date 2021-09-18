import { Schema } from "mongoose";
import mongoose from './index';


const ProductSchema: Schema = new mongoose.Schema(
    {
        _id: {
            type: String,
            required: [true, 'Product ID is required!']
        },
        shop_id: String,
        name: String,
        description: String
    },
    {
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
    }
)

export default mongoose.model('products', ProductSchema);
