import express, { Request, Response, Router } from 'express';
import SendoShopModel from '../../models/sendoShops';
import approveShops from '../../tasks/sendos/approveshop';
const router: Router = express.Router();

// get shops
router.get("/shops", async (req: Request, resp: Response) => {
    let filters: any = {};
    const state = req.query.state;
    const approveState = req.query.approve_state;
    
    if (req.query.start && req.query.end) {
        const start: string = req.query.start.toString();
        const end: string = req.query.end.toString();
        filters.approve_date = {
            $gte: new Date(start),
            $lte: new Date(end)
        }
    }
    if (req.query.product == '1') {
        filters.product_crawled = { $gt: 0 }
    } else if (req.query.product == '0') {
        filters.product_crawled = 0 
    }
    if (req.query.phone_numbers === '1') {
        filters.$or = [ {['phone_numbers.0'] : { $exists: true } }, { phone_number:  { $ne: null }  }];
       
    }
    else if (req.query.phone_numbers === '0') {
        filters.$and = [ {['phone_numbers.0'] : { $exists: false } }, { phone_number: null }] 
    }
    if (req.query.emails === '1') {
        filters['emails.0'] = { $exists: true }
    }
    else if (req.query.emails === '0') {
        filters['emails.0'] = { $exists: false }
    }
    if (state) {
        filters.state = state;
    }
    if (approveState) {
        filters.approve_state = approveState;
    }
    if (req.query.category === "328") {
        filters["category_shop.id"] = 328
    }
    let page: number = req.query.page ? parseInt(req.query.page as string) : 1;
    let limit: number = req.query.limit ? parseInt(req.query.limit as string) : 10;
    let paginateOpts = {
        sort: { updated_at: -1 },
        page,
        limit,
        select: '-password'
    };
    try {
        SendoShopModel.paginate(filters, paginateOpts)
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
    catch (e) {
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
});
// shop detail
router.get("/shops/:shop_id", async (req: Request, resp: Response)=> {
    const shopId = req.params.shop_id;
    try {
        const shop = await SendoShopModel.findById(shopId);
        if (!shop) {
            resp.send('không tìm thấy '+shopId);
            return;
        }
        resp.send(shop);
    } catch (error) {
        resp.status(400).send(error);
    
    }
});
//
router.put('/shops/:shopId', async (req: Request, resp: Response) => {
    const shopId = req.params.shopId;
    const data = req.body;
    console.log(data);

    let filter = {
        _id: shopId
    }
    try {
        const count = await SendoShopModel.countDocuments({ _id: shopId});
        if(count <= 0 ){
            resp.send({
                status: false,
                message: "không tìm thấy shop Id "+shopId 
            })
            return;
        }
        await SendoShopModel.updateOne(filter, data);
        resp.send({
            status: true,
            message: "Update Successfully!"
        })
    }
    catch (e) {
        resp.send({
            status: false,
            err: e
        })
    }

});
// Search shop by name, phone , _id
router.get('/shops-search', async (req: Request, resp: Response) => {
    try {
        const regexIdSearch = /sd.\d+/g;
        const regexIdNumber = /^[0-9]+$/;
        const key: string = req.query.key.toString();
        console.log(key);

        let shops = [];

        if (regexIdSearch.test(key)) {
            const shop = await SendoShopModel.findById(key);
            if (!shop) {
                resp.send('Can not result!');
                return;
            } else {
                shops.push(shop)
            };
        } else if (key.match(regexIdNumber)) {
            const shop = await SendoShopModel.findOne({ phone_number: key });
            if (!shop) {
                resp.send('Can not result!');
                return;
            } else {
                shops.push(shop)
            }
        } else {
            const regex = new RegExp(key);
            const query = {
                name: {
                    $regex: regex,
                    $options: "i"
                }
            }
            shops = await SendoShopModel.find(query).limit(10);
        }
        resp.send({
            data: shops
        })
    } catch (error) {
        resp.status(500).send(error);
    }
});
router.post('/approved-shops', async (req: Request, resp: Response) => {

    const shopIds: string[] = req.body.shop_ids;
    let type: number = req.body.type ? parseInt(req.body.type as string) : 1;

    resp.send({
        status: true,
        message: 'Approving shops...'
    });

    approveShops(shopIds,type)

});
export default router;