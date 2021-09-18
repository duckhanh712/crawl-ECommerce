import  { Schema } from 'mongoose';
import mongoose from './index';
import mongoosePaginate from 'mongoose-paginate-v2';

const DistributorSchema: Schema = new mongoose.Schema(
    {
        _id: {
            type: String,
            required: [ true, 'ID is required!']
        },
        title: String,
        category: {
            category_name: String,
            cate_slug: String
        },
        priority_area: String,
        phone: String,
        images: {
            type: Array,
            default: []
        },
        content: String,
        links: {
            type: Array,
            default: []
        },
        emails: {
            type: Array,
            default: []
        },
        industry: String,
        contact_name: String
      
    },{
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
    }
);

DistributorSchema.plugin(mongoosePaginate);
export default mongoose.model('distributors', DistributorSchema)