import axios from "axios";
import { SHOPEE_API } from '../../constants/api';
import ChozoiProductModel from '../../models/chozoiProduct';
import ShopeeProductId from "../../models/shopeeProductId";
// import { filterMorePhoneNumbers } from '../../utils/phoneNumberFilter';
// import { filterMorePhoneEmails } from '../../utils/emailFilter';
import { Platforms } from '../../constants/common';
import CategoriesMapModel from '../../models/categoryMap'
import chozoiShop from "../../models/chozoiShop";
import logWriter from "../../utils/logWriter";

export const saveProduct = (productId: string, shopId: string) => {
    return new Promise(async (resolve, reject) => {
        try {
            let product = await ChozoiProductModel.findById(productId);

            if (!product) {
                const productApiUrl = `${SHOPEE_API}/v2/item/get?itemid=${productId}&shopid=${shopId}`;
                try {
                    const productResponse = await axios.get(productApiUrl, { timeout: 4000 });
                    let product = productResponse.data.item;
                    console.log('product.name ', product.name);

                    let description: string = !(product?.description === null) ? product.name : product.description;
                    const catShopee: string = product.categories[2].catid;
                    const czCategory: any = await CategoriesMapModel.findById(catShopee);

                    if (!czCategory) {
                        await chozoiShop.updateOne({ _id: shopId }, { error_status: 'REJECT' });
                        reject(new Error('Category of Product is not mapped'));
                    }

                    let images = [];
                    product.images.map((item, index) => {
                        images.push({
                            image_url: `https://cf.shopee.vn/file/${item}`,
                            sort: index
                        });
                    })

                    const variants = {
                        attributes: [],
                        price: Number(product.price_before_discount) / 100000,
                        sale_price: Number(product.price) / 100000,
                        sku: '',
                        inventory: {
                            in_quantity: product.stock ? product.stock : 1
                        }
                    }
                    const category = {
                        id: Number(czCategory.cz_category_id),
                        name: czCategory.cz_category_name
                    }


                    let productChozoi = {
                        _id: `${Platforms.shopee}.${productId}`,
                        product_id: productId,
                        shop_id: `${Platforms.shopee}.${shopId}`,
                        name: product.name,
                        description,
                        images,
                        category,
                        variants,
                        platform: Platforms.shopee,
                    }

                    await ChozoiProductModel.create(productChozoi).catch(_e => {
                        console.log(_e);
                    });
                    console.log('saving product:', productId);
                    resolve(1);
                }
                catch (e) {
                    console.log('can not get product:', productId, e);
                    await ShopeeProductId.updateOne({ shop_id: shopId }, { state: "FAIL" });
                    await chozoiShop.updateOne({ _id: shopId }, { error_status: 'FETCHING_PRODUCT_FAIL' });
                    reject(e);
                }
            }
            else {
                console.log('saved product:', productId);
                resolve(1);
            }
        }
        catch (e) {
            resolve(0);
        }
    });
}

const replacer = /shopee/g;
const description = 'Hàng đẹp, giá tốt \n Đảm bảo hoàn trả \n Sản phẩm đúng với mô tả';
// export default (productId: string, shopId: string, phoneNumbers: any, emails: any) => {
export default (productId: string, shopId: string) => {
    return new Promise(async (resolve, reject) => {
        try {
            let product = await ChozoiProductModel.findById(productId);

            if (product) {
                const headers = {
                    'if-none-match-': '5503-b'
                }
                const productApiUrl = `${SHOPEE_API}/v2/item/get?itemid=${productId}&shopid=${shopId}`;
                try {
                    const productResponse = await axios.get(productApiUrl, { headers, timeout: 10000 });
                    let product = productResponse.data.item;


                    console.log('product.name ', product.name);
                    let productDescription: string = !(product?.description === null) ? product.name : product.description;
                    const description_pickingout = productDescription.replace(replacer, 'chozoi');
                    const catShopee: string = product.categories[2].catid;
                    const czCategory: any = await CategoriesMapModel.findById(catShopee);
                    let category;
                    let state: string = 'DRAFT';
                    if (!czCategory) {
                        await chozoiShop.updateOne({ _id: `${Platforms.shopee}.${shopId}` }, { error_status: 'REJECT' });
                        // reject(new Error('Category of Product is not mapped'));
                        category = {
                            id: 0,
                            name: 'NONE'
                        }
                        state = 'FAIL';
                    }
                    else {
                        category = {
                            id: Number(czCategory.cz_category_id),
                            name: czCategory.cz_category_name
                        }
                    }
                    // await filterMorePhoneEmails(description, emails);
                    // await filterMorePhoneNumbers(description, phoneNumbers);

                    let images = [];
                    product.images.map((item, index) => {
                        images.push({
                            image_url: `https://cf.shopee.vn/file/${item}`,
                            sort: index
                        });
                    })

                    const check_price = Number(product.price_before_discount) % 100000;
                    const check_sale_price = Number(product.price) % 100000
                    if (check_price > 0 || check_sale_price > 0) {
                        state = 'BLOCKED'
                    }

                    const variants = [
                        {
                            attributes: [],
                            price: Number(product.price_before_discount) / 100000,
                            sale_price: Number(product.price) / 100000,
                            sku: '',
                            inventory: {
                                in_quantity: product.stock ? product.stock : 1
                            }
                        }
                    ]
                    console.log(product.price_before_discount, product.price);

                    let productChozoi = {
                        _id: `${Platforms.shopee}.${productId}`,
                        product_id: productId,
                        shop_id: `${Platforms.shopee}.${shopId}`,
                        name: product.name,
                        description_pickingout,
                        description,
                        images,
                        category,
                        variants,
                        state,
                        platform: Platforms.shopee,
                    }

                    await ChozoiProductModel.create(productChozoi).catch(_e => {
                        console.log(_e);
                    });
                    console.log('saving product:', productId);
                    resolve(1);
                }
                catch (e) {
                    logWriter(productId, shopId, e, productApiUrl);
                    console.log('can not get product:', productId, e);
                    await ShopeeProductId.updateOne({ shop_id: shopId }, { state: "FAIL" });
                    await chozoiShop.updateOne({ _id: shopId }, { error_status: 'FETCHING_PRODUCT_FAIL' });
                    reject(e);
                }

            }
            else {

                console.log('saved product:', productId);
                resolve(1);
            }
        }
        catch (e) {
            logWriter(productId, shopId, e, 'loi');
            console.log('can not get:', productId, e);
            reject(e);
        }
    });
}

// export const productCrawl = (productId: string, shop: string, key: string, link: string) => {
//     console.log('dasdadadadadd');

//     const shopId = shop.split('.')[1];
//     return new Promise(async (resolve, reject) => {
//         try {

//             const headers = {
//                 'if-none-match-': key
//             }
//             const productApiUrl = `${SHOPEE_API}/v2/item/get?itemid=${productId}&shopid=${shopId}`;


//             try {
//                 const productResponse = await axios.get(productApiUrl, { headers, timeout: 10000 });
//                 let product = productResponse.data.item;


//                 console.log('product.name ', product.name);
//                 let productDescription: string = !(product?.description === null) ? product.name : product.description;
//                 const description_pickingout = productDescription.replace(replacer, 'chozoi');
//                 const catShopee: string = product.categories[2].catid;
//                 const czCategory: any = await CategoriesMapModel.findById(catShopee);
//                 let category;
//                 let state: string = 'DRAFT';
//                 if (!czCategory) {
//                     await chozoiShop.updateOne({ _id: `${Platforms.shopee}.${shopId}` }, { error_status: 'REJECT' });
//                     // reject(new Error('Category of Product is not mapped'));
//                     category = {
//                         id: 0,
//                         name: 'NONE'
//                     }
//                     state = 'FAIL';
//                 }
//                 else {
//                     category = {
//                         id: Number(czCategory.cz_category_id),
//                         name: czCategory.cz_category_name
//                     }
//                 }
//                 // await filterMorePhoneEmails(description, emails);
//                 // await filterMorePhoneNumbers(description, phoneNumbers);

//                 let images = [];
//                 product.images.map((item, index) => {
//                     images.push({
//                         image_url: `https://cf.shopee.vn/file/${item}`,
//                         sort: index
//                     });
//                 })

//                 const check_price = Number(product.price_before_discount) % 100000;
//                 const check_sale_price = Number(product.price) % 100000
//                 if (check_price > 0 || check_sale_price > 0) {
//                     state = 'BLOCKED'
//                 }

//                 const variants = [
//                     {
//                         attributes: [],
//                         price: Number(product.price_before_discount) / 100000,
//                         sale_price: Number(product.price) / 100000,
//                         sku: '',
//                         inventory: {
//                             in_quantity: product.stock ? product.stock : 1
//                         }
//                     }
//                 ]
//                 console.log(product.price_before_discount, product.price);

//                 const productChozoi = {

//                     _id: `${Platforms.shopee}.${productId}`,
//                     product_id: productId,
//                     shop_id: `${Platforms.shopee}.${shopId}`,
//                     name: product.name,
//                     description_pickingout,
//                     description,
//                     images,
//                     category,
//                     variants,
//                     state,
//                     platform: Platforms.shopee,
//                     link: link
//                 }
//                 console.log(productChozoi);
//                 await ChozoiProductModel.create(productChozoi).catch(_e => {
//                     console.log(_e);
//                 });
//                 console.log('saving product:', productId);
//                 resolve(1);
//             }
//             catch (e) {
//                 logWriter(productId, shopId, e, productApiUrl);
//                 console.log('can not get product:', productId, e);
//                 await ShopeeProductId.updateOne({ shop_id: shopId }, { state: "FAIL" });
//                 await chozoiShop.updateOne({ _id: shop }, { error_status: 'FETCHING_PRODUCT_FAIL' });
//                 reject(e);
//             }
//             resolve;
//         }
//         catch (e) {
//             logWriter(productId, shopId, e, 'loi');
//             console.log('can not get:', productId, e);
//             reject(e);
//         }
//     });

// }
export const productCrawl = (responseBody, link: string) => {
    return new Promise(async (resolve, _reject) => {
        try {
            let product = responseBody.item;
            console.log(product);

            const productId = product.itemid;
            const shopId = product.shopid;
            let productDescription: string = (!product.description) ? product.name : product.description;
            const description_pickingout = productDescription.replace(replacer, 'chozoi');
            const catShopee: string = product.categories[2].catid;
            const czCategory: any = await CategoriesMapModel.findById(catShopee);
            let category;
            let state: string = 'DRAFT';
            if (!czCategory) {

                category = {
                    id: 0,
                    name: 'NONE'
                }
                state = 'FAIL';
            }
            else {
                category = {
                    id: Number(czCategory.cz_category_id),
                    name: czCategory.cz_category_name
                }
            }

            let images = [];
            product.images.map((item, index) => {
                images.push({
                    image_url: `https://cf.shopee.vn/file/${item}`,
                    sort: index
                });
            })

            const check_price = Number(product.price_before_discount) % 100000;
            const check_sale_price = Number(product.price) % 100000
            if (check_price > 0 || check_sale_price > 0) {
                state = 'BLOCKED'
            }
            const variants = [
                {
                    attributes: [],
                    price: Number(product.price_before_discount) / 100000,
                    sale_price: Number(product.price) / 100000,
                    sku: '',
                    inventory: {
                        in_quantity: product.stock ? product.stock : 1
                    }
                }
            ]
            const productChozoi = {
                _id: `${Platforms.shopee}.${productId}`,
                product_id: productId,
                shop_id: `${Platforms.shopee}.${shopId}`,
                name: product.name,
                description_pickingout,
                description,
                images,
                category,
                variants,
                state,
                platform: Platforms.shopee,
                link: link
            }
            // console.log(productChozoi.name);
            await ChozoiProductModel.create(productChozoi).catch(_e => {
                console.log(_e);
            });
            console.log('saving product:', productId, productChozoi.name);
            resolve(1);
        }
        catch (e) {
            console.log(e);
            // reject(e);
        }
    });

};

export const productUpdate = (responseBody, link: string) => {

    return new Promise(async (resolve, reject) => {

        try {

            let product = responseBody.item;
            const productId = product.itemid;
            const shopId = product.shopid;
            console.log('product.name ', product.name);
            let productDescription: string = (!product.description) ? product.name : product.description;
            const description_pickingout = productDescription.replace(replacer, 'chozoi');
            console.log('description_pickingout', description_pickingout);

            const catShopee: string = product.categories[2].catid;
            const czCategory: any = await CategoriesMapModel.findById(catShopee);
            let category;
            let state: string = 'DRAFT';
            if (!czCategory) {
                await chozoiShop.updateOne({ _id: `${Platforms.shopee}.${shopId}` }, { error_status: 'REJECT' });
                // reject(new Error('Category of Product is not mapped'));
                category = {
                    id: 0,
                    name: 'NONE'
                }
                state = 'FAIL';
            }
            else {
                category = {
                    id: Number(czCategory.cz_category_id),
                    name: czCategory.cz_category_name
                }
            }

            let images = [];
            product.images.map((item, index) => {
                images.push({
                    image_url: `https://cf.shopee.vn/file/${item}`,
                    sort: index
                });
            })

            const check_price = Number(product.price_before_discount) % 100000;
            const check_sale_price = Number(product.price) % 100000
            if (check_price > 0 || check_sale_price > 0) {
                state = 'BLOCKED'
            }
            const variants = [
                {
                    attributes: [],
                    price: Number(product.price_before_discount) / 100000,
                    sale_price: Number(product.price) / 100000,
                    sku: '',
                    inventory: {
                        in_quantity: product.stock ? product.stock : 1
                    }
                }
            ]
            console.log(product.price_before_discount, product.price);
            const productChozoi = {
                _id: `${Platforms.shopee}.${productId}`,
                product_id: productId,
                shop_id: `${Platforms.shopee}.${shopId}`,
                name: product.name,
                description_pickingout,
                description,
                images,
                category,
                variants,
                state,
                platform: Platforms.shopee,
                link: link
            }
          
            await ChozoiProductModel.deleteOne({ product_id: productId });
            await ChozoiProductModel.create(productChozoi).catch(_e => {
                console.log(_e);
            });
            console.log('saving product:', productId);
            resolve(1);
        }
        catch (e) {

            reject(e);
        }

    });

};

