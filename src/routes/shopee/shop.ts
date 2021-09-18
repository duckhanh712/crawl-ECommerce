import express, { Request, Response, Router } from 'express';
import markAndCrawlShops, { creatShop } from '../../tasks/shops/shopMarker';
import ChozoiShopModel from '../../models/chozoiShop';
import approveShops from '../../tasks/shops/approveShops';
import validUrl from 'valid-url';
import WholesaleShopModel from '../../models/wholesaleShop';
import { approveAuto } from '../../tasks/shops/processingShopCrawler';
import retryFile from '../../models/retryFile';
import { getProductLinks } from '../../tasks/shopeeV2/products';
import chozoiProduct from '../../models/chozoiProduct';


const router: Router = express.Router();

//get convertations shop
router.get('/converted-shops', (req: Request, resp: Response) => {
    const state = req.query.state;
    const approveState = req.query.approve_state;
    const status = req.query.calling;

    let filters: any = {};

    if (req.query.start && req.query.end) {

        const start: string = req.query.start.toString();
        const end: string = req.query.end.toString();
        console.log(end);

        filters.approve_date = {
            $gte: new Date(start),
            $lte: new Date(end)
        }
        // filters.approve_date = new Date(start)
    }
    if (req.query.product == '1') {
        filters.product_crawled = { $gt: 0 }
    } else if (req.query.product == '0') {
        filters.product_crawled = 0
    }
    if (req.query.phone_numbers === '1') {
        filters.$or = [{ ['phone_numbers.0']: { $exists: true } }, { phone_number: { $ne: null } }];

    }
    else if (req.query.phone_numbers === '0') {
        filters.$and = [{ ['phone_numbers.0']: { $exists: false } }, { phone_number: null }]
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
    if (status && status == 'Called') {
        filters["calling.status"] = { $ne: null };
    } else if (status && status !== 'Called') {
        filters["calling.status"] = status;
    }
    if (req.query.category === "328") {
        filters["category_shop.id"] = 328
    }

    try {
        let page: number = req.query.page ? parseInt(req.query.page as string) : 1;
        let limit: number = req.query.limit ? parseInt(req.query.limit as string) : 10;
        let paginateOpts = {
            sort: { updated_at: -1 },
            page,
            limit,
            select: '-password'
        };
        ChozoiShopModel.paginate(filters, paginateOpts)
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
// get conerttion shop tts 
router.get('/tts-shops', (req: Request, resp: Response) => {
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

// crawl and convert shops by ids 
router.post('/converted-shops', async (req: Request, resp: Response) => {
    
    const shopLinks: string[] = req.body.shop_links;
    let rawShop = [];
    let convertedShop = [];
    console.log(shopLinks);

    for (let i = 0; i < shopLinks.length; i++) {

        if (!validUrl.isUri(shopLinks[i])) {
            resp.status(400).send({
                message: 'Bad URL'
            });
            return;
        }
        const shopUrl = new URL(shopLinks[i]);
        const shopName = shopUrl.pathname.substring(1);
        const shop = await ChozoiShopModel.findOne({ username: shopName })

        if (shop === null || shop === undefined || shop.length === 0) {
            await rawShop.push(shopLinks[i]);
        }
        else {
            convertedShop.push(shop);
        }
    }
    resp.send({
        message: "crawling shops...",
        rawShop: rawShop,
        convertedShop: convertedShop
    })
    await markAndCrawlShops(rawShop);
   
})
// TODO: test
router.put('/converted-shops/:shopId', async (req: Request, resp: Response) => {
    const shopId = req.params.shopId;
    const data = req.body;
    console.log(data);

    let filter = {
        _id: shopId
    }
    try {
        await ChozoiShopModel.findOneAndUpdate(filter, data);
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

// get shop detail
router.get('/converted-shops/:shopId', async (req: Request, resp: Response) => {
    const shopId = req.params.shopId;

    try {

        const shop = await ChozoiShopModel.findById(shopId);
        resp.send(shop)
    }
    catch (e) {
        resp.status(500).send({
            error_message: e
        });
    }
});
// approve shops  to chozoi
router.post('/approved-shops', async (req: Request, resp: Response) => {

    const shopIds: string[] = req.body.shop_ids;
    let type: number = req.body.type ? parseInt(req.body.type as string) : 1;
    resp.send({
        status: true,
        message: 'Approving shops...'
    });
    approveShops(shopIds, type)
});
// dowload file csv

router.get('/download-file/:type', async (req: Request, resp: Response) => {
    const type: string = req.params.type;
    const fileName = `${process.cwd()}/downloads/${type}-shops.csv`;

    try {
        resp.download(fileName);
    }
    catch (error) {
        console.log(error);
        resp.status(400).send({
            message: 'No data available'
        })
    }


})
// download log
router.get('/download-file-log', async (_req: Request, resp: Response) => {
 
    const fileName = `${process.cwd()}/logs/crawler.log`;

    try {

        resp.download(fileName);
    }
    catch (error) {
        console.log(error);
        resp.status(400).send({
            message: 'No data available'
        })
    }


});
// search by name 
router.get('/search', async (req: Request, resp: Response) => {
    const key: string = req.query.key.toString();

    const regex = new RegExp(key);
    const query = {
        name: {
            $regex: regex,
            $options: "i",
        },
        username: {
            $regex: regex,
            $options: "i",
        }

    };

    const shops = await ChozoiShopModel.find(query).limit(10);
    resp.send({
        data: shops
    })



})
router.get('/search/:type', async (req: Request, resp: Response) => {
    const shopId: string = req.query.shop_id.toString();
    const type: string = req.params.type.toString();
    const shops = [];
    try {
        if (type == 'converted') {
            const shop = await ChozoiShopModel.findById(shopId);
            if (!shop) {
                resp.send('Invalid _id ' + shopId);
                return;
            }
            shops.push(shop);
            resp.send({
                data: shops
            });
        }
        else {

            const shopIdCZ = shopId.split(".")[1];
            const shop = await ChozoiShopModel.findOne({ cz_shop_id: shopIdCZ });
            if (!shop) {
                resp.send('Invalid _id ' + shopId);
                return;
            }
            shops.push(shop);
            resp.send({
                data: shops
            });
        }

    }
    catch (e) {

    }
})
// update first login
// API preview
router.get('/converted-shops/preview/:shopId', async (req: Request, resp: Response) => {
    const shopId = req.params.shopId;

    try {
        const shop = await ChozoiShopModel.findById(shopId).select('name img_avatar_url img_cover_url description -_id',);
        resp.send({
            status: true,
            data: shop
        })
    }
    catch (e) {
        resp.send({
            status: false,
            err: e
        })
    }

})
// processing
router.post('/converted-shops/processing', async (req: Request, resp: Response) => {
    const shopId: string = req.body.shop_id;
    console.log(shopId);
    try {
        const shopIdShopee: string = shopId.split('.')[1];
        resp.send({
            new_product: "Crawling..."
        });
        await getProductLinks(shopIdShopee);
    } catch (error) {
        resp.status(500).send(error)
    }
    
})

router.post('/shop-reset', async (req: Request, resp: Response) => {
    const shopLink: string[] = req.body.shop;
    const shopUrl = new URL(shopLink[0]);
    const shopName: string = shopUrl.pathname.substring(1);
    console.log(shopLink);

    try {
        const shop = await ChozoiShopModel.findOne({ username: shopName });

        if (shop.approve_state == "INIT") {

            await ChozoiShopModel.deleteOne({ username: shopName });
            creatShop(shopLink[0]);
            resp.send('successfully');


        } else {
            resp.send('Không thể refresh shop đã APPROVED');
        }

    }
    catch (e) {
        resp.status(400).send(e)
    }



});
//2239
router.post('/approve-shop-all', async (_req: Request, resp: Response) => {
    try {

        resp.send({
            data: "approving..."
        });

        await approveAuto();

    } catch (error) {
        console.log(error);

    }
})
router.get('/check-file', async (_req: Request, resp: Response) => {
    try {
        const data = await retryFile.find({});
        resp.send(data);
    } catch (error) {
        console.log(error);

    }
});

// destroy product by shop

router.get('/delete/:shopId', async(req: Request, resp: Response) => {
    const shopId = req.params.shopId;
    try {
        await chozoiProduct.deleteMany({ shop_id: shopId});
        resp.send('ok')
    } catch (error) {
        console.log(error);
        
    }
   
    
});

export default router;