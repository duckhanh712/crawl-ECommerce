import axios from 'axios';
import WholesaleShopModel from '../../models/wholesaleShop';
import { sleep } from '../../utils/common';
import ApproveProductsById from '../../tasks/wholesale/apporveProductById';
import wholeesaleProduct from '../../models/wholeesaleProduct';
import { ZASI_API } from '../../constants/api';

const SELLER_CREATION_URL = `${ZASI_API}/v1/accounts/internal/crm/shops`;
// const replacer = /\n/g;

export default async (shopIds: string[], type: number) => {
    console.log(SELLER_CREATION_URL);
    for (let i = 0; i < shopIds.length; i++) {
        try {
            const shop: any = await WholesaleShopModel.findById(shopIds[i]);
            const descTmp: string = shop.description ? shop.description : shop.sort_description;
            const des = descTmp == "" ? shop.name : descTmp;
            const shopRequestData = {
                img_avatar_url: shop.avatar_url,
                phone_number: shop.phone_numbers[0],
                phone_numbers: shop.phone_numbers,
                name: shop.name,
                password: shop.password,
                contact_name: !shop.contact_name ? shop.name : shop.contact_name,
                description: des,
                detail_address: shop.address.address_detail,
                province_id: shop.address.province.province_id,
                district_id: shop.address.district.district_id,
                ward_id: shop.address.ward.ward_id,

            }
            console.log(shopRequestData);

            try {
                const response = await axios.post(SELLER_CREATION_URL, shopRequestData);
                console.log('response', response.status);
                if (response.status === 200) {
                    const zsShopId = response.data.data.shopId;
                    const approve_date = new Date;
                    await WholesaleShopModel.updateOne({ _id: shop._id }, { zs_shop_id: zsShopId, approve_state: 'APPROVED', approve_date: approve_date });
                    if (type == 2) {
                        const products: any = await wholeesaleProduct.find({ shop_id: shop._id }).select('_id');

                        if (products.length > 0) {
                            let productIds = products.map(item => {
                                return item._id;
                            });

                            await ApproveProductsById(shop._id, productIds);
                        }

                    }
                }

            } catch (error) {

                console.log('can not create seller:', shopIds[i]);
            }


        } catch (error) {
            console.log(error);

        }
        await sleep(1000)
    }

}