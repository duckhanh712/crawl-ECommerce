import axios, { AxiosRequestConfig } from 'axios';
import ChozoiShopModel from '../../models/chozoiShop';
import { loginCZ } from '../../utils/chozoi';
import ChozoiProductModel from '../../models/chozoiProduct';
import { CHOZOI_API } from '../../constants/api';
import logTofile from '../../utils/logWriter';
import chozoiProduct from '../../models/chozoiProduct';
import { sleep } from '../../utils/common';
const replacer = /\n/g;

export default async (shopId: string, productIds: string[]) => {
    try {
        const shopDetail = await ChozoiShopModel.findById(shopId)
        const username = shopDetail.username;
        const password = shopDetail.password;
        const czShopId = shopDetail.cz_shop_id;
        const token = await loginCZ(username, password);
        const productCreationUrl = `${CHOZOI_API}/v1/shops/${czShopId}/products/confirmation`;

        const requestConfig: AxiosRequestConfig = {
            headers: {
                'x-chozoi-token': token
            }
        }
        let log;
        let productApprove: number = Number(shopDetail.product_approve);
        for (let i = 0; i < productIds.length; i++) {
            await sleep(1500)
            const product = await ChozoiProductModel.findById(productIds[i]);
            try {
                const description_pickingout_tmp =  product.description_pickingout.replace(replacer, "<br>")
                product.description_pickingout = description_pickingout_tmp;
                const response = await axios.post(productCreationUrl, product, requestConfig);
                if (response.status === 200) {
                    productApprove = + 1;
                    await ChozoiShopModel.updateOne({ _id: shopId }, { product_approve: (productApprove) });
                    await ChozoiProductModel.updateOne({ _id: product._id }, { state: 'APPROVED' });
                }
            }
            catch (e) {
                logTofile(product._id, shopId, e, log)
                console.error('can not create product: ', product._id, e);
            }
        }
        const products = await chozoiProduct.find({ shop_id: shopId, state: 'APPROVED' });
        await ChozoiShopModel.updateOne({ _id: shopId }, { product_approve: products.length });
    }
    catch {
        console.error('can not find product in shop:', shopId);
    }
}