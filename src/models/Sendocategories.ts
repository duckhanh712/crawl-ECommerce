import { Schema } from "mongoose";
import mongoose from './index';


const SendoCategoriesSchema: Schema = new mongoose.Schema(
    {
        _id: Number,
        cz_category_id: String,
        level: Number,
        name: String,

      
    },
    {
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
    }
)
SendoCategoriesSchema.index({ name: 'text' });
export default mongoose.model('sendo_level3_categories', SendoCategoriesSchema);