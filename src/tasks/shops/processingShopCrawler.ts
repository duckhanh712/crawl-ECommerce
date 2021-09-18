import ChozoiShopModel from '../../models/chozoiShop';
import { crawlProductsByShopId } from '../products/productsCrawler';
// import schedule from 'node-schedule';
// import ShopeeShopModel from '../../models/shopeeShop';
import { convertDate } from '../../utils/convertDate';
import { Platforms } from '../../constants/common';
import AddressModel from '../../models/address'
import { SHOPEE_API, CHOZOI_API } from '../../constants/api';
import axios from 'axios';
import DistrictModel from '../../models/district';
import chozoiProduct from '../../models/chozoiProduct';
import shopeeProductId from '../../models/shopeeProductId';
import { sleep } from '../../utils/common';

const SELLER_CREATION_URL = `${CHOZOI_API}/v1/auth/create_account`;

// const crawl = async () => {
//     const shops = await ChozoiShopModel.find({ state: { $ne: 'DONE' } })
//     if (shops.length !== 0) {
//         for (let i = 0; i < shops.length; i++) {
//             const shopId: any = shops[i];
//             console.log('shopId._id', shopId._id);

//             // await ChozoiShopModel.updateOne({ _id: shopId._id }, { state: 'REJECT' });
//             try {
//                 console.log('shop', shopId._id);

//                 await crawlProductsByShopId(shopId._id);
//                 await ChozoiShopModel.updateOne({ _id: shopId._id }, { state: 'DONE' });
//             } catch (e) {

//             }

//         }
//     }
// }

// export default () => {
//     const cronExpress = '0 0 */2 * * *';
//     schedule.scheduleJob(cronExpress, function () {
//         crawl();
//     });


// }

export const defineShopCategory = async () => {
    let limit: number = 20, skip: number = 0;
    console.log('========================');
    try {
        let item = 20;
        while (item == 20) {
            const shops: any = await ChozoiShopModel.find({ product_crawled: { $gt: 0 } }).limit(limit).skip(skip);
            for (let i = 0; i < shops.length; i++) {
                const product = await chozoiProduct.findOne({ shop_id: shops[i]._id }).limit(1);
                try {

                    const category = product.category;
                    if (category) {


                        await ChozoiShopModel.updateOne({ _id: shops[i]._id }, { category });
                    } else {
                        await ChozoiShopModel.updateOne({ _id: shops[i]._id }, { category: null });
                    }

                }
                catch (e) {
                    console.log(e);
                }
            }
            skip += 20;
            item = shops.length;
        }
    }
    catch (e) {
        console.log(e);

    }
}

export const processingState = async () => {
    let limit: number = 20, skip: number = 0;
    console.log('========================');
    try {
        let item = 20;
        while (item >= 20) {

            const shops: any = await ChozoiShopModel.find({ state: 'PROCESSING' }).limit(limit).skip(skip);
            item = shops.length;
            for (let i = 0; i < shops.length; i++) {
                const shopId = shops[i]._id.split('.')
                const shopeeShopId = shopId[1];
                const products = await chozoiProduct.find({ shop_id: shops[i]._id });
                const productIds = await shopeeProductId.find({ shop_id: shopeeShopId });
                try {
                    await ChozoiShopModel.updateOne({ _id: shops[i]._id }, { product_crawled: products.length, total_products: productIds.length, state: "DONE" })
                    await crawlProductsByShopId(shopeeShopId)
                }
                catch (e) {
                    console.log(e);
                    await ChozoiShopModel.updateOne({ _id: shops[i]._id }, { product_crawled: products.length, total_products: productIds.length, state: "DONE" })

                }
            }
            skip += 20;
            item = shops.length;
        }
    }
    catch (e) {
        console.log(e);

    }
}




export const getLocationShop = async (shopId) => {



    try {
        let province_id: number;
        let district_id: number;
        let ward_id: Number;
        let address_detail: string;
        let address;
        const apiUrl = `${SHOPEE_API}/v2/shop/get?is_brief=1&shopid=${shopId}`;
        console.log(apiUrl);
        const shopDetailResponse = await axios.get(apiUrl, { timeout: 10000 });
        const place = shopDetailResponse.data.data.place;

        if (!place || place == "" || shopDetailResponse.data.data.shop_location == "Quốc Tế") {
            console.log('Số 272 phố Nguyễn Lân, phường Phương Liệt, quận Thanh Xuân, thành phố Hà Nội');
            // default address: Số 272 phố Nguyễn Lân, phường Phương Liệt, quận Thanh Xuân, thành phố Hà Nội
            province_id = 24; //thành phố Hà Nội
            district_id = 9; //quận Thanh Xuân
            ward_id = 123;  // phường Phương Liệt
            address_detail = 'Số 272 Phố Nguyễn Lân, Phường Phương Liệt, Quận Thanh Xuân, Thành phố Hà Nội';
            console.log(province_id, district_id, ward_id, address_detail);
            address = {
                province: {
                    province_id: province_id,
                    province_name: 'Thành phố Hà Nội'
                },
                district: {
                    district_id: district_id,
                    district_name: 'Quận Thanh Xuân'
                },
                ward: {
                    ward_id: ward_id,
                    ward_name: 'Phường Phương Liệt'
                },
                address_detail: address_detail
            }
        } else {

            const district_name = place.split(',')[0];
            const province_name = place.split(',')[1];
            const proAdrs = await AddressModel.find({ $text: { $search: province_name } }, { score: { $meta: 'textScore' } }).sort({ score: { $meta: 'textScore' } }).limit(1);
            province_id = Number(proAdrs[0].cz_id);
            const disAdrs = await DistrictModel.find({ $text: { $search: district_name } }, { score: { $meta: 'textScore' } }).sort({ score: { $meta: 'textScore' } }).limit(2);
            const result = disAdrs.find(item => item.province_id === province_id);
            district_id = result._id;
            try {
                const apiUrl = `${CHOZOI_API}/v1/wards?districtId=${district_id}`;
                const wardResponse: any = await axios.get(apiUrl, { timeout: 10000 });
                const ward = wardResponse.data.wards[0];
                ward_id = ward.id;
                address_detail = `${ward.wardName}, ${district_name}, ${province_name}`;
                console.log(province_id, district_id, ward_id, address_detail);
                address = {
                    province: {
                        province_id: province_id,
                        province_name: province_name
                    },
                    district: {
                        district_id: district_id,
                        district_name: district_name
                    },
                    ward: {
                        ward_id: ward_id,
                        ward_name: ward.wardName
                    },
                    address_detail: address_detail
                }

            }
            catch (e) {
                console.log(e);

            }


        }
        console.log(address);

        return address;
    }
    catch (e) {

        let province_id: number;
        let district_id: number;
        let ward_id: Number;
        let address_detail: string;
        province_id = 24; //thành phố Hà Nội
        district_id = 9; //quận Thanh Xuân
        ward_id = 123;  // phường Phương Liệt
        address_detail = 'Số 272 Phố Nguyễn Lân, Phường Phương Liệt, Quận Thanh Xuân, Thành phố Hà Nội';
        console.log(province_id, district_id, ward_id, address_detail);
        const address = {
            province: {
                province_id: province_id,
                province_name: 'Thành phố Hà Nội'
            },
            district: {
                district_id: district_id,
                district_name: 'Quận Thanh Xuân'
            },
            ward: {
                ward_id: ward_id,
                ward_name: 'Phường Phương Liệt'
            },
            address_detail: address_detail
        }
        console.log(e)
        return address
    }


}

export const updateLocationShop = async () => {

    let limit: number = 10, skip: number = 0;

    try {
        let item = 10
        while (item >= 10) {


            const shops: any = await ChozoiShopModel.find({ address: { $exists: false } }).limit(limit).skip(skip);
            for (let i = 0; i < shops.length; i++) {
                const shopId = shops[i]._id.split(".")[1]
                const address = await getLocationShop(shopId); console.log(address);

                await ChozoiShopModel.updateOne({ _id: shops[i]._id }, { address })
            }

            skip = skip + 10;
            item = shops.length;
            console.log(item);

        }
    }
    catch (e) {

    }
}

export const defineStateProduct = async () => {

    let limit: number = 10, skip: number = 0;
    // const start = new Date('2021-02-01');
    // const end = new Date('2021-03-04');
    // console.log(start, end);

    try {
        let item = 10
        while (item >= 10) {

            const products: any = await chozoiProduct.find({}).limit(limit).skip(skip);

            for (let i = 0; i < products.length; i++) {
                try {
                    const sale_price = products[i].variants[0].sale_price;
                    console.log(sale_price);

                    if (!Number.isInteger(sale_price)) {
                        await chozoiProduct.updateOne({ _id: products[i]._id }, { state: 'FAIL' })
                    }
                }
                catch (e) {
                    console.log(e);

                }
            }
            skip = skip + 10;
            item = products.length;
        }
    }
    catch (e) {
        console.log(e);

    }

}

export const approveAuto = async () => {

    let limit: number = 30, skip: number = 0;

    try {
        let item = 30
        while (item > 0) {

            const shops: any = await ChozoiShopModel.find({ approve_state: "INIT", product_crawled: 0 }).limit(limit).skip(skip);


            for (let i = 0; i < shops.length; i++) {

                try {

                    const shop = shops[i];

                    console.log(shop.name);
                    const description: string = !shop.description ? '' : shop.description;
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
                        if (response.status == 200) {
                            console.log(response.data);
                            const czShopId: string = response.data.shopId;
                            const timestamp = Date.now();
                            const date = convertDate(timestamp);
                            const approve_date = new Date(date);
                            await ChozoiShopModel.updateOne({ _id: shop._id }, { cz_shop_id: czShopId, approve_state: 'APPROVED', approve_date: approve_date });
                            await sleep(10000);
                        }
                    }
                    catch (e) {

                        let approve_error: any = e.response.data;
                        approve_error.data = e.response.config.data;
                        approve_error.status = e.response.status;
                        await ChozoiShopModel.updateOne({ _id: shop._id }, { approve_state: "FAIL", approve_error });
                        console.log('can not create seller:', e);

                    }

                }
                catch (e) {
                    console.log(e);

                }
                await sleep(5000);
            }
            skip = skip + limit;
            item = shops.length;
        }
    }
    catch (e) {
        console.log(e);

    }
}


export const processingProducts = async () => {

    let limit: number = 10, skip: number = 0;
    try {
        let item = 10
        while (item >= 10) {

            const shops: any = await ChozoiShopModel.find({ total_products: { $gt: 0 }, product_crawled: 0 }).select('_id').limit(limit).skip(skip);

            for (let i = 0; i < shops.length; i++) {
                try {
                    const shopIdSP = shops[i]._id.split('.')[1];
                    await crawlProductsByShopId(shopIdSP)
                }
                catch (e) {
                    console.log(e);

                }
            }
            skip = skip + 10;
            item = shops.length;
        }
    }
    catch (e) {
        console.log(e);

    }
}


