import { getShopDetail } from '../../utils/shopee';
import { crawlProductsByShopId } from '../products/productsCrawler';
import filterPhoneNumbers from '../../utils/phoneNumberFilter';
import { Platforms } from '../../constants/common';
import ChozoiShop from '../../models/chozoiShop';
import filterEmails from '../../utils/emailFilter';
import ShoppeProductIds from '../../models/shopeeProductId';
import { getLocationShop } from '../../tasks/shops/processingShopCrawler';
import chozoiProduct from '../../models/chozoiProduct';
import { getProductLinks } from '../shopeeV2/products';
const markShop = (shopLink: string, shopIds: string[]) => {
    return new Promise(async (resolve, reject) => {
        const shopUrl = new URL(shopLink);
        const shopName = shopUrl.pathname.substring(1);

        try {
            const shopState: any = await ChozoiShop.findOne({ username: shopName });
            if (shopState == null) {
                const shopDetail = await getShopDetail(shopName);
                const shopId: string = shopDetail.shopid;
                let totalProducts: number = 0;
                try {
                    const productIds = await ShoppeProductIds.find({ shop_id: shopId });
                    totalProducts = productIds.length;
                } catch (e) {
                    totalProducts;
                }
                const newLink: string = `https://${shopUrl.hostname}${shopUrl.pathname}`;
                const phoneNumers = filterPhoneNumbers(shopDetail.description)
                const emails = filterEmails(shopDetail.description)
                const description = shopDetail.description;

                console.log('phone set:', phoneNumers);
                let portrait = '', cover = '';
                if (shopDetail.account.portrait !== '') {
                    portrait = `https://cf.shopee.vn/file/${shopDetail.account.portrait}_tn`
                }
                if (shopDetail.cover !== '') {
                    cover = `https://cf.shopee.vn/file/${shopDetail.cover}`;
                }
                const address = await getLocationShop(shopId);
                shopIds.push(shopId);
                ChozoiShop.create({
                    _id: `${Platforms.shopee}.${shopId}`,
                    username: shopDetail.account.username,
                    phone_numbers: phoneNumers,
                    emails: emails,
                    name: shopDetail.name,
                    total_products: totalProducts,
                    img_avatar_url: portrait,
                    img_cover_url: cover,
                    description: description,
                    link: newLink,
                    address: address,
                    state: 'DONE'

                });
                await crawlProductsByShopId(shopId);
                const products: any [] = await chozoiProduct.find({  shop_id: `${Platforms.shopee}.${shopId}` });
                await ChozoiShop.updateOne({ _id: `${Platforms.shopee}.${shopId}` }, { product_crawled: products.length, state: 'DONE' });
                console.log('crawlingggggg shop:', shopId, products.length);

                resolve(true);
            }
            else {
                resolve(false);
            }
        }
        catch (e) {
            console.log(shopName, ' can not save:', e);
            reject(e);
        }
    });
}
export const creatShop = (shopLink: string) => {
    return new Promise(async (resolve, reject) => {
        const shopUrl = new URL(shopLink);
        const shopName = shopUrl.pathname.substring(1);

        try {
            const shopDetail = await getShopDetail(shopName);
            const shopId: string = shopDetail.shopid;
            let totalProducts: number = 0;
            try {
                const productIds = await ShoppeProductIds.find({ shop_id: shopId });
                totalProducts = productIds.length;
            } catch (e) {
                totalProducts;
            }
            const newLink: string = `https://${shopUrl.hostname}${shopUrl.pathname}`;
            const phoneNumers = filterPhoneNumbers(shopDetail.description)
            const emails = filterEmails(shopDetail.description)
            const description = shopDetail.description;

            console.log('phone set:', phoneNumers);
            let portrait = '', cover = '';
            if (shopDetail.account.portrait !== '') {
                portrait = `https://cf.shopee.vn/file/${shopDetail.account.portrait}_tn`
            }
            if (shopDetail.cover !== '') {
                cover = `https://cf.shopee.vn/file/${shopDetail.cover}`;
            }
            const address = await getLocationShop(shopId);
            ChozoiShop.create({
                _id: `${Platforms.shopee}.${shopId}`,
                username: shopDetail.account.username,
                phone_numbers: phoneNumers,
                emails: emails,
                name: shopDetail.name,
                total_products: totalProducts,
                img_avatar_url: portrait,
                img_cover_url: cover,
                description: description,
                link: newLink,
                address: address,
                state: 'DONE'

            });
         
            const products: any [] = await chozoiProduct.find({ shop_id: `${Platforms.shopee}.${shopId}`});
            await ChozoiShop.updateOne({ _id: `${Platforms.shopee}.${shopId}` }, { product_crawled: products.length, state: 'DONE' });
            console.log('crawlingggggg shop:', shopId, products.length);

            resolve(true);

        }
        catch (e) {
            console.log(shopName, ' can not save:', e);
            reject(e);
        }
    });
}

export default async (shopLinks: string[]) => {
    let shopIds: string[] = [];
    for (let i = 0; i < shopLinks.length; i++) {
        const shopLink: string = shopLinks[i];
        await markShop(shopLink, shopIds);
    };
    let shopId: string = shopIds.shift();

    while (shopId) {
        console.log('Shop ID:', shopId);
        await getProductLinks(shopId);
        shopId = shopIds.shift();
    }
}