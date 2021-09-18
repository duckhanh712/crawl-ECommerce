import { Schema } from "mongoose";
import mongoose from './index';


const AddressSchema: Schema = new mongoose.Schema(
    {
        _id: Schema.Types.ObjectId,
        name: String,
        cz_id: String
    },
    {
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
    }
)
AddressSchema.index({ name: 'text' });
export default mongoose.model('cz_addresses', AddressSchema);