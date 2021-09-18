import SendoShopModel from '../../models/sendoShops';
import axios, { AxiosRequestConfig } from 'axios';
import { CHOZOI_API } from '../../constants/api';
import { Platforms } from '../../constants/common';
import { loginCZ } from '../../utils/chozoi';
import sendoProducts from '../../models/sendoProducts';
const SELLER_CREATION_URL = `${CHOZOI_API}/v1/auth/create_account`;


export default (shopIds: string[], type: Number) => {
    console.log(SELLER_CREATION_URL,type);
    shopIds.forEach(async shopId => {
        try {
            const shop = await SendoShopModel.findById(shopId)
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
                platform: Platforms.sendo,
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
                    await SendoShopModel.updateOne({ _id: shopId }, { cz_shop_id: czShopId, approve_state: 'APPROVED', approve_date: approve_date });
                }

            }
            catch (e) {
                
                let approve_error: any = e.response.data;
                approve_error.data = e.response.config.data;
                approve_error.status = e.response.status;
                await SendoShopModel.updateOne({ _id: shopId },{approve_state: "FAIL" , approve_error });
                console.log('can not create seller:', e);
            }
         
        }
        catch (e) {
            console.log(e);
        }
    })
}

export const approveProducts = async ( shopId: string, productIds: string []) => {
    try {
        const shop = await SendoShopModel.findById(shopId);
        const token = await loginCZ(shop.username,shop.password);
        const requestConfig: AxiosRequestConfig = {
            headers: {
                'x-chozoi-token': token
            }
        }
        const productCreationUrl = `${CHOZOI_API}/v1/shops/${shop.cz_shop_id}/products/confirmation`;
        if (productIds && productIds.length > 0) {
            const products = await sendoProducts.find({ _id: { $in: productIds } });
            for (let i = 0; i < products.length; i++) {
                try {
                    const product: any = products[i];
                    const response = await axios.post(productCreationUrl, product, requestConfig);
                    if (response.status === 200) {
                        await sendoProducts.updateOne({ _id: product._id }, { state: 'APPROVED' });
                    }
                }
                catch (e) {
                    console.log('can not create czProducts[i]: ', products[i]._id, e);
                    // logTofile(czProducts[i], shopeeShopId ,e , log);
                }
                
            }
        }else{

            let limit: number = 10, skip: number = 0;let item = 10;
            while (item >= 10) {
                const czProducts = await sendoProducts.find({ shop_id: shopId , state: "DRAFT" }).limit(limit).skip(skip);
                for (let i = 0; i < czProducts.length; i++) {
                    try {
                        const product: any = czProducts[i];
                        const response = await axios.post(productCreationUrl, product, requestConfig);
                        if (response.status === 200) {
                            await sendoProducts.updateOne({ _id: product._id }, { state: 'APPROVED' });
                        }
                    }
                    catch (e) {
                        console.log('can not create czProducts[i]: ', czProducts[i]._id, e);
                        // logTofile(czProducts[i], shopeeShopId ,e , log);
                    }
                }
                skip += 10;
                item = czProducts.length;
            }
        }
    } catch (error) {
        console.log(error);
        
    }
}