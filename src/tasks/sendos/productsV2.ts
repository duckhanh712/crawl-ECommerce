import axios from 'axios';
import { Platforms } from '../../constants/common';
import sendoProducts from '../../models/sendoProducts';
import sendoShops from '../../models/sendoShops';

const descriptionProduct = 'Hàng đẹp, giá tốt \n Đảm bảo hoàn trả \n Sản phẩm đúng với mô tả';
export const getProductByAPI =  async (productUrl: string, phoneShop) => {
    const product = new URL(productUrl).pathname;
    const PRODUCT_API = `https://detail-api.sendo.vn/full${product.slice(0, -5)}?platform=web`;
    const result = await axios.get(PRODUCT_API);
    
    try {
        const product = result.data.data;
        const images = product.media.map( item => {
             return { image_url: item.image_500x500 }  
        });
        const variants = [
            {
                attributes: [],
                price: product.price,
                sale_price: product.final_price_max,
                sku: '',
                inventory: {
                    in_quantity: product.quantity
                }
            }
        ]
        const productSendo = {
            _id: `${Platforms.sendo}.${product.id}`,
            product_id: product.id,
            shop_id: `${Platforms.sendo}.${phoneShop}`,
            name: product.name,
            description_pickingout: product.description_info.description,
            description: descriptionProduct,
            images: images,
            category: { id: null , name: "NONE" },
            variants,
            state:  "FAIL",
            platform: Platforms.sendo,
            link: productUrl
        }
        await sendoProducts.create(productSendo).catch(_e => {
            console.log(_e);
        });
        const countProduct: number = await sendoProducts.countDocuments({ shop_id: `${Platforms.sendo}.${phoneShop}`});
        await sendoShops.updateOne({ _id: `${Platforms.sendo}.${phoneShop}`}, { product_crawled: countProduct })
    } catch (error) {
        console.log(error);

    }

}