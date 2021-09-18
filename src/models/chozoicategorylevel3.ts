import { Schema } from "mongoose";
import mongoose from './index';


const CategoriesMapSchema: Schema = new mongoose.Schema(
    {
        _id: String,
        parent_id: String,
        level: String,
        sort: String,
        name: String,
        avatar_url: String,
        description: String
    },
    {
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
    }
)
CategoriesMapSchema.index({ name: 'text' });
export default mongoose.model('chozoi_level3_categories', CategoriesMapSchema);
