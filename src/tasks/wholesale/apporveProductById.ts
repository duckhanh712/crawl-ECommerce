import axios, { AxiosRequestConfig } from 'axios';
import wholeesaleProduct from '../../models/wholeesaleProduct';
import WholesaleShopModel from '../../models/wholesaleShop';
import { loginZS } from '../../utils/zasi';
import { ZASI_API } from '../../constants/api';
// const ZASI_API = `https://api.zasi.vn`
const replacer = /\n/g;
export default async (shopId: string, productIds: string[]) => {
    try {

        const shopDetail = await WholesaleShopModel.findById(shopId);
        const phone = shopDetail.phone_number;
        const password = shopDetail.password;
        const shopIdZS = shopDetail.zs_shop_id;
        const token = await loginZS(phone, password);
        const productCreationUrl = `${ZASI_API}/v1/product/seller/${shopIdZS}/create`;
        const requestConfig: AxiosRequestConfig = {
            headers: {
                'x-zasi-token': token
            }
        }
        for (let index = 0; index < productIds.length; index++) {
            try {
                const product = await wholeesaleProduct.findById(productIds[index]);
                let imagesReq = product.images;
                if (product.images.length > 10) {
                    imagesReq = product.images.slice(0, 9);

                }
                const inventoryTmp = Number((product.prices.slice(-1))[0].number) * 3;
                const desTmp = product.description == "" ? product.name : product.description;
                console.log("desTmp", desTmp);
                
                const description = desTmp.replace(replacer, "<br>");
                console.log("description", description);
                
                const productRequest = {
                    category_id: product.category.category_id,
                    attributes: [],
                    name: product.name,
                    description: description,
                    images: imagesReq,
                    weight: product.weight,
                    packing_size: product.packing_size,
                    classifies: [],
                    unit: !product.unit ? `Cái` : product.unit,
                    variants: [
                        {
                            attributes: [],
                            prices: product.prices,
                            inventory: inventoryTmp
                        }
                    ],
                    state: `PUBLIC`
                }

                const response = await axios.post(productCreationUrl, productRequest, requestConfig);
                console.log(response.status);

                if (response.status === 200) {
                    await wholeesaleProduct.updateOne({ _id: productIds[index] }, { state: "APPROVED" });
                }

            } catch (error) {
                console.log('cant approve to Zasi because ', error);

            }



        }

        const productCount: number = await wholeesaleProduct.countDocuments({ shop_id: shopId , state: "APPROVED"});
        await WholesaleShopModel.updateOne({ _id: shopId }, { product_approve: productCount })
    } catch (error) {

    }
}
