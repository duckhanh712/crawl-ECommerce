import ChozoiProductModel from '../../models/chozoiProduct';
import axios, { AxiosRequestConfig } from 'axios';
import { CHOZOI_API } from '../../constants/api';
import { sleep } from '../../utils/common';
// import logTofile from '../../utils/logWriter';
const replacer = /\n/g;
export default async (shopeeShopId: string, czShopId: string, token: string) => {
    console.log(shopeeShopId, czShopId, token);
    let limit: number = 10, skip: number = 0;
    try {
        let item = 10;
        const requestConfig: AxiosRequestConfig = {
            headers: {
                'x-chozoi-token': token
            }
        }
        while (item >= 10) {
            await sleep(1500);
            const czProducts = await ChozoiProductModel.find({ shop_id: shopeeShopId }).limit(limit).skip(skip);
            for (let i = 0; i < czProducts.length; i++) {
                const productCreationUrl = `${CHOZOI_API}/v1/shops/${czShopId}/products/confirmation`;
                try {
                    const product: any = czProducts[i];
                    const description_pickingout_tmp =  product.description_pickingout.replace(replacer, "<br>")
                    product.description_pickingout = description_pickingout_tmp;
                    const response = await axios.post(productCreationUrl, product, requestConfig);
                    if (response.status === 200) {
                        await ChozoiProductModel.updateOne({ _id: product._id }, { state: 'APPROVED' });
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


    } catch (e) {
        console.error('can not find product in shop:', shopeeShopId);
    }
}