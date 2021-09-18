import express, { Request, Response, Router } from 'express';
import SendoProducts from '../../models/sendoProducts';
import ProductSendoModel from '../../models/sendoProducts';
import sendoShops from '../../models/sendoShops';
import { approveProducts } from '../../tasks/sendos/approveshop';
const router: Router = express.Router();
// get product
router.get('/shops/:shop_id/products', async (req: Request, resp: Response) => {
    const shopId: string = req.params.shop_id;
    const state: any = req.query.state;
    let filters: any = {};
    if (state) {
        filters.state = state;
    } if (shopId) {
        filters.shop_id = shopId;
    } else {
        resp.status(400).send("Không tìm thấy shop Id ");
        return;
    }
    let page: number = req.query.page ? parseInt(req.query.page as string) : 1;
    let limit: number = req.query.limit ? parseInt(req.query.limit as string) : 10;
    let paginateOpts = {
        sort: { updated_at: -1 },
        page,
        limit
    };
    try {
        ProductSendoModel.paginate(filters, paginateOpts)
            .then(shopResult => [
                resp.send({
                    data: shopResult.docs,
                    filters,
                    pagination: {
                        page: shopResult.page,
                        page_size: shopResult.limit,
                        total_pages: shopResult.totalPages,
                        total_elements: shopResult.totalDocs
                    }
                })
            ])
            .catch(_e => {
                resp.send({
                    data: [],
                    filters,
                    pagination: {
                        page: 0,
                        page_size: 0,
                        total_pages: 0,
                        total_elements: 0
                    }
                });
            });

    } catch (error) {
        resp.status(500).send('error');
    }
});
// Search shop by name, phone , _id
router.get('/products-search', async (req: Request, resp: Response) => {
    try {
        const key: string = req.query.key.toString();
        const regex = new RegExp(key);
        const query = {
            name: {
                $regex: regex,
                $options: "i"
            }
        }
        const products = await SendoProducts.find(query).limit(10);
        resp.send({
            data: products
        })
    } catch (error) {
        resp.status(500).send(error);
    }
});
router.put("/category-products/:shopId", async (req: Request, resp: Response) => {
    try {
        const shopId: string = req.params.shopId;
        const category = req.body.category;
        console.log(category);
        await SendoProducts.updateMany({ shop_id: shopId , state: "FAIL"}, { $set: { category: category ,state: "DRAFT" }});
        resp.send({
            message: "Successfully !",
            status: "success"
        });
    } catch (error) {
        console.log(error);
        resp.send({
            message: "Error !",
            status: "error"
        });
    }
});
router.put('/shops/:shopId/products/:productId', async (req: Request, resp: Response) => {
    const productId = req.params.productId;
    const shopId = req.params.shopId
    const data = req.body
    let filters = {
        _id: productId,
        shop_id: shopId
    }
    try {
        const product = await SendoProducts.findOneAndUpdate(filters, data);

        if (product) {
            resp.send({
                status: true,
                message: "Update Successfully!"
            })
        }
        else {
            resp.status(400).send({
                error_message: "Update failed"
            });
        }
    }
    catch (e) {
        resp.send({
            status: false,
            err: e
        })
    }
});
// total product
router.get('/products', async (_req: Request, resp: Response) => {
    try {
        const productDraft = await SendoProducts.countDocuments({ state: "DRAFT" });
        const productApprove = await SendoProducts.countDocuments({ state: "APPROVED" });
        const totalProducts = await SendoProducts.countDocuments({});
        resp.send({
            products_draft: productDraft,
            products_approved: productApprove,
            products_total: totalProducts,
        })
    } catch (error) {
        console.log(error);
    }
});
// get product detail
router.get('/shops/:shopId/products/:productId', async (req: Request, resp: Response) => {
    const shopId: string = req.params.shopId;
    const productId: string = req.params.productId;
    try {
        const product = await SendoProducts.findOne({ _id: productId, shop_id: shopId })
        resp.send(product);
    }
    catch (e) {
        resp.status(500).send({
            error_message: e
        });
    }
})
// approve product by productid 
router.post('/shops/:shopId/products-approve', async (req: Request, resp: Response) => {
    const productIds: string[] = req.body.product_ids;
    const shopId: string = req.params.shopId;
    resp.send({
        status: true,
        message: "Approving products..."
    })
    await approveProducts(shopId, productIds);
    const product_approve: number = await SendoProducts.countDocuments({ shop_id: shopId, state: 'APPROVED' });
    if (product_approve) {
        await sendoShops.updateOne({ _id: shopId }, { product_approve: product_approve });
    }

});

export default router;