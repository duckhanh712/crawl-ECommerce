import { SHOPEE_API } from '../../constants/api';
import axios from 'axios';
import filterPhoneNumbers from '../../utils/phoneNumberFilter';
import filterEmails from '../../utils/emailFilter';
import { Platforms } from '../../constants/common';
import ChozoiShopModel from '../../models/chozoiShop';
import shopeeProductId from '../../models/shopeeProductId';
import { getLocationShop } from './processingShopCrawler';
import { getProductLinks } from '../shopeeV2/products';

const replacer = /hopee/g;
export const convertShop = async (shopName: string) => {
    try {


        let shop = await ChozoiShopModel.findOne({ username: shopName });
        if (!shop) {
            const shopDetailUrl = `${SHOPEE_API}/v4/shop/get_shop_detail?username=${shopName}`;
            let totalProducts: number = 0;
            try {
                const response: any = await axios.get(shopDetailUrl, { timeout: 10000 });
                const shopDetailResponse = response.data.data;
                const shopeeShopId = shopDetailResponse.shopid;
                const shopDescription = (!shopDetailResponse.description) ? shopDetailResponse.name : shopDetailResponse.description;
                const description = shopDescription.replace(replacer, 'chozoi');
                const phoneNumers = await filterPhoneNumbers(description);
                const productIds = await shopeeProductId.countDocuments({ shop_id: shopeeShopId });
                totalProducts = productIds;
                if (phoneNumers.length > 0 || productIds > 0) {

                    const newLink: string = `https://shopee.vn/${shopDetailResponse.account.username}`;

                    const emails = await filterEmails(description);
                    let portrait = '', cover = '';
                    if (shopDetailResponse.account.portrait !== '') {
                        portrait = `https://cf.shopee.vn/file/${shopDetailResponse.account.portrait}_tn`
                    }
                    if (shopDetailResponse.cover !== '') {
                        cover = `https://cf.shopee.vn/file/${shopDetailResponse.cover}`;
                    }
                    const address = await getLocationShop(shopeeShopId);
                    const shop = {
                        _id: `${Platforms.shopee}.${shopeeShopId}`,
                        username: shopDetailResponse.account.username,
                        phone_numbers: phoneNumers,
                        name: shopDetailResponse.name,
                        emails: emails,
                        total_products: totalProducts,
                        img_avatar_url: portrait,
                        img_cover_url: cover,
                        description: description,
                        address: address,
                        link: newLink,
                        state: 'DONE'
                    }

                    await ChozoiShopModel.create(shop);
                    await getProductLinks(shopeeShopId);

                }
            }
            catch (_e) {
                console.log('can not get shop:', shopName, _e);
            }
        }
        else {
            console.log('saved shop:', shopName);
        }
    }
    catch (e) {
        console.log('can not find shop:', shopName, e);
    }
}
