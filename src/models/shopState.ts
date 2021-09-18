// import { Schema } from "mongoose";
// import mongoose from "./index";
// import mongoosePaginate from 'mongoose-paginate-v2';


// const ShopState: Schema = new mongoose.Schema(
//     {
//         _id: {
//             type: String,
//             required: [true, 'Id required!']
//         },
//         shop_id: {
//             type: String,
//             required: [true, 'Shop Id required!']
//         },
//         platform: {
//             type: String,
//             required: [true, 'Platform required!']
//         },
//         name: String,
//         username: String,
//         link: String,
//         state: String,      // INIT, PROCESSING, DONE
//         updatable: {
//             type: Boolean,
//             default: true
//         },
//         phone_numbers: {
//             type: Array,
//             default: []
//         },
//     },
//     {
//         timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
//     }
// )

// ShopState.index({ platform: 1, shop_id: 1 });
// ShopState.index({ platform: 1, username: 1 });
// ShopState.on('index', e => {
//     console.log('index error:', e);
// })
// ShopState.plugin(mongoosePaginate);


// export default mongoose.model('shop_state', ShopState);

