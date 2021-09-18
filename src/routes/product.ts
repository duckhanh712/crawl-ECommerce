import express, { Request, Response, Router } from 'express';
import axios from "axios";
import ProductModel from '../models/product';
// import ShopeeProductModel from '../models/shopeeProduct';
import { PRODUCT_NOT_FOUND } from '../constants/response';
import { SHOPEE_API } from '../constants/api';
// import CategoriesMapModel from '../models/categoryMap'
const router: Router = express.Router();

router.post('', async (req: Request, resp: Response) => {
    const productLink: string = req.body.product;
    let linkParts = productLink.split('.');
    const shopId = linkParts[2];
    const productId = linkParts[3];

    const product = await ProductModel.findById(productId);
    if (product) {
        resp.send(product);
        return;
    }

    ProductModel.findById(productId, async (_e, product: any) => {
        if (_e) {
            resp.status(500).send({ error: _e });
            return;
        }

        if (!product) {
            
            const productUrl = `${SHOPEE_API}/v2/item/get?itemid=${productId}&shopid=${shopId}`;
            console.log(productUrl);

            axios.get(productUrl)
                .then((productResponse) => {
                    const productInfo = productResponse.data.item;

                    product = {
                        _id: productId,
                        shop_id: shopId,
                        name: productInfo.name,
                        description: productInfo.description,
                    }

                    ProductModel.create(product).catch((_e) => { });
                    resp.send(product);
                })
                .catch((error) => {
                    resp.send({
                        status: false,
                        message: 'Can not get product',
                        error
                    })
                })
        }
        else {
            resp.send(product);
        }
    })
});


router.get('/:productId', (req: Request, resp: Response) => {
    const productId: string = req.params.productId;
    ProductModel.findById(productId, (_e, product) => {
        if (!product) {
            resp.send(PRODUCT_NOT_FOUND);
            return;
        }

        resp.send(product);
    })
});


router.post('/awm', async (req: Request, resp: Response) => {
    const productId: string = req.body.productId;
    
    const productApiUrl = productId;
   
        const productResponse = await axios.get(productApiUrl, { timeout: 4000 });

        let product = productResponse.data.item;
        // console.log('ddddddddddd', product.categories);
        
        const catShopee: string = product.categories[2].catid;
        console.log(catShopee);
        
        // const catChozoi: any = await  CategoriesMapModel.findById({_id: catShopee})
        // console.log('------------------',catChozoi);
        
        const imageProduct = product.images;
        const variants = {
            price: Number(product.price_before_discount)/10000,
            sale_price: Number(product.price)/10000,
            inventory: {
                in_quantity: product.stock
            }
        }
        console.log('varians',variants);
        
        const category = {
            id: catShopee
        }
        let productChozoi = {
            _id : product.itemid,
            platform: `SHOPEE`,
            name: product.name,
            images: imageProduct,
            category: category,
            variants: variants,
        }
        console.log('0-0-00-0-0-0-0-',productChozoi);

        resp.send(productChozoi)

    }
)


export default router;
