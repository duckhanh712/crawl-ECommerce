import { Schema } from "mongoose";
import mongoose from './index';


const ZasiCategoriesSchema: Schema = new mongoose.Schema(
    {
        _id: Number,
        parent_id: Number,
        level: Number,
        sort: Number,
        name: String,

      
    },
    {
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
    }
)
ZasiCategoriesSchema.index({ name: 'text' });
export default mongoose.model('zasi_level3_categories', ZasiCategoriesSchema);