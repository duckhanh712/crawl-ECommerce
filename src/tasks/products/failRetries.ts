import ShopeeProductId from "../../models/shopeeProductId";
import { saveProduct } from './productCrawler';

export default () => {
    return new Promise(async (resolve, _reject) => {
        try {
            const products = await ShopeeProductId.find({ state: "FAIL" })
            if (products.length !== 0) {
                for (let i = 0; i < products.length; i++) {
                    const productId: any = products[i];
                    try {
                        await saveProduct(productId.product_id, productId.shop_id);
                    }
                    catch (e) {
                        console.error(e);
                    }
                }
            }
            resolve(true);
        }
        catch (e) {
            console.error(e);
        }
    })
}