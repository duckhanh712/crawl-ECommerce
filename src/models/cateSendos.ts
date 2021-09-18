import { Schema } from "mongoose";
import mongoose from "./index";

const CateSenDo: Schema = new mongoose.Schema(
    {

        name: String

    },
    {
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
    }
)
export default mongoose.model('cate_sendoss', CateSenDo);