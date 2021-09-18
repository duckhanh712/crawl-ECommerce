import ProductIdModel from '../../models/shopeeProductId';
// import saveProduct from './productCrawler';
import { getProducts } from '../../utils/shopee';
import ChozoiShopModel from '../../models/chozoiShop';
import { Platforms } from '../../constants/common';
import chozoiProduct from '../../models/chozoiProduct';
// import logWriter from '../../utils/logWriter';
import puppeteer from 'puppeteer';
// import ApproveShop from '../../tasks/shops/approveShops'

export const crawlProductsByShopId = (shopId: string) => {
    return new Promise(async (resolve, reject) => {
        const _id = `${Platforms.shopee}.${shopId}`;
        let limit: number = 5, skip: number = 0;
        let item = 5
        while (item > 0) {
            try {
                const productIds = await ProductIdModel.find({ shop_id: shopId }).limit(limit).skip(skip);
                if (productIds.length > 0) {
                    const browser = await puppeteer.launch({
                        // headless: false,
                        // executablePath: '/usr/bin/chromium-browser',
                        ignoreDefaultArgs: ['--disable-extensions'],
                        args: [
                            '--no-sandbox',
                            '--disable-setuid-sandbox'
                        ]
                    });
                    try {
                        for (let i = 0; i < productIds.length; i++) {
                            const productId: any = productIds[i];
                            try {
                                const product = await chozoiProduct.findById(`${Platforms.shopee}.${productId.product_id}`);
                                if (!product) {
                                    await getProducts(browser, productId.link);
                                } else {
                                    continue;
                                }
                            }
                            catch (e) {
                                console.log('skip product:', productId.product_id, e);
                                const products = await chozoiProduct.find({ shop_id: _id });
                                const total_products = await ProductIdModel.countDocuments({ shop_id: shopId });
                                await ChozoiShopModel.updateOne({ _id: _id }, { product_crawled: products.length, state: 'DONE', total_products: total_products, error_status: 'Reject' });
                                // logWriter(productId.product_id, shopId, e, 'loi');
                            }
                        }
                      
                    } catch (error) {
                        console.log(error);
                    }

                    await browser.close();
                }

                const products = await chozoiProduct.find({ shop_id: _id });
                const total_products = await ProductIdModel.countDocuments({ shop_id: shopId });
                await ChozoiShopModel.updateOne({ _id: _id }, { product_crawled: products.length, state: 'DONE', total_products: total_products });
                // await ChozoiShopModel.updateOne({ _id: _id }, { product_crawled: products.length, state: 'DONE' , phone_numbers: [...phoneNumberSet], emails: [...emailSet] });

                skip = skip + limit;
                item = productIds.length;
                resolve(1);
            } catch (e) {
                reject(e)
                console.log('can not products in shop:', shopId,e);
                const products = await chozoiProduct.find({ shop_id: _id });
                await ChozoiShopModel.updateOne({ _id: _id }, { product_crawled: products.length, state: 'DONE', error_status: 'Reject' });
            }

        }
    });
}