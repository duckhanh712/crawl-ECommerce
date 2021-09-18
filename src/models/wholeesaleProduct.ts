import { Schema } from 'mongoose';
import mongoose from './index';
import mongoosePaginate from 'mongoose-paginate-v2';

const WholesaleProductSchema: Schema = new mongoose.Schema(
    {
        name: String,
        price: Number,
        minimum: Number,
        stock: Number,
        images: Array,
        shop_id: String,
        category: {
            category_name:{
                type: String,
                required: [true, 'ID is required!']
            } ,
            category_id: {
                type: Number,
                required: [true, 'ID is required!']
            }
        },
        link: String,
        description: String,
        state: {
            type: String,
            default: 'DRAFT'
        },
        unit: String,
        packing_size:{
            type: Array,
            default: [10, 10, 10]
        },
        variants: {
            type: Array,
            default: []
        },
        prices: {
            type: Array,
            default: []
        },
        inventory: {
            type: Number,
            default: 100
        },
        weight: {
            type: Number,
            default: 10
        }
    
    }, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
}
);
WholesaleProductSchema.plugin(mongoosePaginate);
export default mongoose.model('tts_products', WholesaleProductSchema)