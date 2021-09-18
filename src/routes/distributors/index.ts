import express , { Request, Response, Router } from 'express';
import DistributorModel from '../../models/distributors';

const router: Router = express.Router();

// index 

router.get('/index', (req: Request, resp: Response) => {

    const cate_slug = req.query.category;
    let filters: any = {};

    if(cate_slug){

        filters["category.cate_slug"] = cate_slug;
    }
    try{
        console.log('filters',filters);
        
        let page: number = req.query.page ? parseInt(req.query.page as string) : 1;
        let limit: number = req.query.limit ? parseInt(req.query.limit as string) : 10;
        let paginateOpts = {
            sort: { created_at: 1 },
            page,
            limit,
        
        };

        DistributorModel.paginate(filters,paginateOpts)
            .then(result =>[
                resp.send({
                    pagination: {
                        page: result.page,
                        page_size: result.limit,
                        total_pages: result.totalPages,
                        total_elements: result.totalDocs
                    },
                    filters,
                    data: result.docs
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


// distributor detail
router.get('/profile/:distributor_id', async (req: Request, resp: Response) => {
    const distributorId = req.params.distributor_id;
        console.log(distributorId);
        
    try{
        const result = await DistributorModel.findById(distributorId);
        resp.send(result);
        
    }
    catch(e){
        resp.status(500).send({
            error_message: e
        })
    }

});


// search by industry
router.get('/search', async (req: Request, resp: Response) => {
    const key: string = req.query.key.toString();

    const regex = new RegExp(key);
    const query = {
        industry: {
            $regex: regex,
            $options: "i",
        }
    };

    const shops = await DistributorModel.find(query);
    resp.send({
        data: shops
    })



})
export default router;
