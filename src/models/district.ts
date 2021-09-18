import { Schema } from "mongoose";
import mongoose from './index';


const DistrictSchema: Schema = new mongoose.Schema(
    {
        _id: Number,
        district_name: String,
        province_id: Number
    },
    {
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
    }
)

DistrictSchema.index({district_name: 'text'});

export default mongoose.model('cz_districts', DistrictSchema);