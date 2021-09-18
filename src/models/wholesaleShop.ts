import  { Schema } from 'mongoose';
import mongoose from './index';
import mongoosePaginate from 'mongoose-paginate-v2';

const WholeSaleShopSchema: Schema = new mongoose.Schema(
    {
        _id: {
            
            type: String,
            required: [true, 'Id required!']
        },
        name: String,
        address_detail: String,
        email: String,
        detail_address: String,
        password: {
            type: String,
            default: 'zasi123'
        },
        phone_number: {
            type: String,
            required: [true, 'Id required!']
        },
        phone_numbers: {
            type: Array,
           
        },
        contact_name: String,
        avatar_url: String,
        sort_description: String,
        views: Number,
        followers: Number,
        product_total: Number,
        product_crawled: Number,
        operation_time: Number,
        businessType: String,
        businessModel: String,
        tax_code: String,
        area: String,
        induss: Array,
        descrtry: String,
        description: String,
        approve_state_cz: String,
        cz_shop_id: String,
        approve_state: { // INIT APPROVING APPROVED
            type: String,
            default: 'INIT'
        },
        product_approve: {
            type: Number,
            default: 0
        },
        link: String,
        approve_date: { // INIT APPROVING APPROVED
            type: Date,

        },
        zs_shop_id: String,

        address: {
            province:{
                province_id: Number,
                province_name: String
            } ,
            district: {
                district_id: Number,
                district_name: String
            },
            ward: {
                ward_id: Number,
                ward_name: String
            },
            address_detail: String,
        },
        
      
    },{
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
    }
);

WholeSaleShopSchema.plugin(mongoosePaginate);
export default mongoose.model('tts_shops', WholeSaleShopSchema)