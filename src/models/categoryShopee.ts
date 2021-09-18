import mongoose from './index';
import { Schema } from 'mongoose';


const ShopeeCategory: Schema = new mongoose.Schema(

    {
        _id: { 
            type: String,
            required: [true, "ID required !"]
        },
        category_1: String, 
        category_2: String, 
        category_3: String, 
        name: String,
        link: String,
        level: Number 
    },
    {
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
    }

)
export default mongoose.model('shopee_categories', ShopeeCategory);
