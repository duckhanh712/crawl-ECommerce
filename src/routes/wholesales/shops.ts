import express, { Request, Response } from 'express';
import WholesaleShopModel from '../../models/wholesaleShop';
import approveShops from '../../tasks/wholesale/approveShop';
import { approveAuto } from '../../tasks/wholesale/processing';
const router = express.Router();

// get shops

router.get('/shops', (req: Request, resp: Response) => {
    const state = req.query.state;
    const approveState = req.query.approve_state;

    let filters: any = {};
    let sorts: any = { updated_at: -1 };
    if (req.query.start && req.query.end) {

        const start: string = req.query.start.toString();
        const end: string = req.query.end.toString();
     

        filters.approve_date = {
            $gte: new Date(start),
            $lte: new Date(end)
        }

    }
    if (req.query.product === '1') {
        sorts = { product_crawled: -1 };
    } else if (req.query.product === '0') {
        sorts = { product_crawled: 1 };
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


    try {

        console.log('filters', filters);

        let page: number = req.query.page ? parseInt(req.query.page as string) : 1;
        let limit: number = req.query.limit ? parseInt(req.query.limit as string) : 10;
        let paginateOpts = {
            sort: sorts,
            page,
            limit,
            select: '-password'
        };
       
        WholesaleShopModel.paginate(filters, paginateOpts)
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
// TODO
// Detai shop

router.get('/shops/:shopId', async (req: Request, resp: Response) => {
    const shopId: string = req.params.shopId;
    try {
        const shopDetail = await WholesaleShopModel.findById(shopId).select('-password');
        resp.send(shopDetail);
    } catch (error) {
        resp.status(500).send({
            error
        })
    }
});
// Search shop by name, phone , _id
router.get('/shops-search', async (req: Request, resp: Response) => {
    
    try {
        const regexIdSearch = /tts.\d+/g;
        const regexIdNumber = /^[0-9]+$/;
        const key: string = req.query.key.toString();
        console.log(key);

        let shops = [];

        if (regexIdSearch.test(key)) {
            const shop = await WholesaleShopModel.findById(key);
            if (!shop) {
                resp.send('Can not result!');
                return;
            } else {
                shops.push(shop)
            };
        } else if (key.match(regexIdNumber)) {
            const shop = await WholesaleShopModel.findOne({ phone_number: key });
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
            shops = await WholesaleShopModel.find(query).limit(10);
        }
        resp.send({
            data: shops
        })
    } catch (error) {
        resp.status(500).send(error);
    }
});

// Update shop
router.put('/shops/:shopId', async (req: Request, resp: Response) => {
    const shopId: string = req.params.shopId;
    const data = req.body;
    console.log(data);
  
    
    
    try {
        const shop = await WholesaleShopModel.findOneAndUpdate({ _id: shopId }, data);
        if (!shop) {
            resp.status(400).send('can not shop ' + shopId);
            return;
        }
        resp.send({
            status: true,
            message: "Update Successfully!"
        });
        return;
    }
    catch (e) {
        resp.send({
            status: false,
            err: e
        });
    }
});

// approve shop
// approve shops  to zasi
router.post('/approved-shops', async (req: Request, resp: Response) => {


    const shopIds: string[] = req.body.shop_ids;
    let type: number = req.body.type ? parseInt(req.body.type as string) : 1;

    resp.send({
        status: true,
        message: 'Approving shops...'
    });

    approveShops(shopIds,type)

});

router.post('/approve-auto', async (_req: Request, resp: Response) => {
        try {
            resp.send('approving....')
            await approveAuto();
        } catch (error) {
            console.log(error);
            
        }
});
export default router;