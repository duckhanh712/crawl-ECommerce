import axios from 'axios';
import { CHOZOI_API } from '../../constants/api';
import approveProducts from '../products/approveProducts';
import { loginCZ } from '../../utils/chozoi';
import ChozoiShopModel from '../../models/chozoiShop';
import { Platforms } from '../../constants/common';
import chozoiProduct from '../../models/chozoiProduct';
import { sleep } from '../../utils/common';

const SELLER_CREATION_URL = `${CHOZOI_API}/v1/auth/create_account`;
// const SELLER_CREATION_URL = `https://api.chozoi.vn/v1/auth/create_account`;
export default (shopIds: string[], type: Number) => {
    console.log(SELLER_CREATION_URL);
    
    shopIds.forEach(async shopId => {
        try {
            const shop = await ChozoiShopModel.findById(shopId)
            const description: string = !shop.description ? '' :shop.description ;
            const phone = shop.phone_number ? shop.phone_number : shop.phone_numbers[0];
            const shopRequestData = {
                username: shop.username,
                phoneNumber: phone,
                contactName: shop.contact_name,
                email: shop.email,
                password: shop.password,
                name: shop.name,
                imgAvatarUrl: shop.img_avatar_url,
                imgCoverUrl: shop.img_cover_url,
                platform: Platforms.shopee,
                province_id: shop.address.province.province_id,
                district_id: shop.address.district.district_id,
                ward_id: shop.address.ward.ward_id,
                address_detail: shop.address.address_detail,
                description: description.length < 251 ? description : description.substring(0, 249)
            }
           
            try {

                const response = await axios.post(SELLER_CREATION_URL, shopRequestData, { timeout: 10000 });
                console.log('status:', response.status);
                if (response.status == 200) {
                   
                    const czShopId: string = response.data.shopId;
                    const approve_date = new Date;
                    console.log('approve_date',approve_date);
                    await ChozoiShopModel.updateOne({ _id: shopId }, { cz_shop_id: czShopId, approve_state: 'APPROVED', approve_date: approve_date });
                    if (type == 2) {
                        const token = await loginCZ(shop.username, shop.password);
                        await approveProducts(shopId, czShopId, token);
                        const products = await chozoiProduct.find({ shop_id: shopId, state: 'APPROVED' });
                        await ChozoiShopModel.updateOne({ _id: shopId },{product_approve: products.length  });
                    }

                }

            }
            catch (e) {
                
                let approve_error: any = e.response.data;
                approve_error.data = e.response.config.data;
                approve_error.status = e.response.status;
                await ChozoiShopModel.updateOne({ _id: shopId },{approve_state: "FAIL" , approve_error });
                console.log('can not create seller:', e);
            }
            await sleep(3000);

        }
        catch (e) {
            console.log(e);
        }
    })
}