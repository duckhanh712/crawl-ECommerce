import express, { Request, Response, Router } from 'express';
import WholesaleProductModel from '../../models/wholeesaleProduct';
import approveProductById from '../../tasks/wholesale/apporveProductById';
const router: Router = express.Router();

// product list
router.get('/shops/:shopId/products', async (req: Request, resp: Response) => {
    const shopId: string = req.params.shopId;
    const state: any = req.query.state;
    let filters: any = {};

    if (state) filters.state = state;
    filters.shop_id = shopId;

    let page: number = req.query.page ? parseInt(req.query.page as string) : 1;
    let limit: number = req.query.limit ? parseInt(req.query.limit as string) : 10;
    let paginateOpts = {
        sort: { updated_at: -1 },
        page,
        limit

    };

    try {
        try {
            WholesaleProductModel.paginate(filters, paginateOpts)
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
        }
        catch (error) {
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
        }


    } catch (error) {
        resp.status(500).send(error)
    }
});
//TODO
// product detail
router.get('/shops/:shopId/products/:productId', async (req: Request, resp: Response) => {
    const shopId: string = req.params.shopId;
    const productId: string = req.params.productId;

    try {
        const product = await WholesaleProductModel.findOne({ _id: productId, shop_id: shopId })
        resp.send(product);
    }
    catch (e) {
        resp.status(500).send({
            error_message: e
        });
    }
});
// update
router.put('/shops/:shopId/products/:productId', async (req: Request, resp: Response) => {
    const productId = req.params.productId;
    const shopId = req.params.shopId
    const data = req.body
    let filters = {
        _id: productId,
        shop_id: shopId
    }
    console.log(filters);

    try {
        const product = await WholesaleProductModel.findOneAndUpdate(filters, data);

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

// approve product

router.post('/shops/:shopId/products-approved', async (req: Request, resp: Response) => {
    const shopId: string = req.params.shopId;
    const product_ids: string[] = req.body.product_ids;
    try {

        resp.send('approving...')
        await approveProductById(shopId, product_ids);

    } catch (error) {
        console.log(error);

    }



});

router.post('/shops/:shopId/product-approve-all', async (req: Request, resp: Response) => {

    const shopId: string = req.params.shopId;

    resp.send('Approving...');
    try {
        const shops: any = await WholesaleProductModel.find({ shop_id: shopId, state: "DRAFT" }).select('_id');
        const productIds = [];
        shops.forEach(item => {
            productIds.push(item._id);
        });
        await approveProductById(shopId, productIds);
    } catch (error) {
        console.log(error);

    }




});
// search

// total product
router.get('/products', async (_req: Request, resp: Response) => {

    try {

        const productDraft = await WholesaleProductModel.countDocuments({ state: "DRAFT" });
        const productApprove = await WholesaleProductModel.countDocuments({ state: "APPROVED" });
        const totalProducts = await WholesaleProductModel.countDocuments({});

        resp.send({

            products_draft: productDraft,
            products_approved: productApprove,
            products_total: totalProducts,

        })
    } catch (error) {
        console.log(error);

    }

});


export default router;