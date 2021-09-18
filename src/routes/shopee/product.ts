import express, { Request, Response, Router } from 'express';
import chozoiProduct from '../../models/chozoiProduct';
import ChozoiProduct from '../../models/chozoiProduct';
import chozoiShop from '../../models/chozoiShop';
import approveProductsByIds from '../../tasks/products/approveProductsByIds';
// import { categorySportCZ } from '../../utils/chozoi';
import puppeteer from 'puppeteer';
import { getProduct } from '../../tasks/shopeeV2/products';
// import validUrl from 'valid-url';
const router: Router = express.Router();
// product list
router.get('/converted-shops/:shopId/products', (req: Request, resp: Response) => {
    const shopId: string = req.params.shopId;
    const state: any = req.query.state;

    let filters: any = {}


    if (state) {
        filters.state = state
    }
    if (shopId) {

        filters.shop_id = shopId
    }


    let page: number = req.query.page ? parseInt(req.query.page as string) : 1;
    let limit: number = req.query.limit ? parseInt(req.query.limit as string) : 10;
    let paginateOpts = {
        sort: { updated_at: -1 },
        page,
        limit

    };

    try {
        ChozoiProduct.paginate(filters, paginateOpts)
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

})
// API template preview
router.get('/converted-shops/preview/:shopId/products', (req: Request, resp: Response) => {
    const shopId: string = req.params.shopId;
    let filters: any = {}

    if (shopId) {
        filters.shop_id = shopId
    }


    let page: number = req.query.page ? parseInt(req.query.page as string) : 1;
    let limit: number = req.query.limit ? parseInt(req.query.limit as string) : 10;
    let paginateOpts = {
        page,
        limit
    };

    try {
        ChozoiProduct.paginate(filters, paginateOpts)
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

})
// get product detail
router.get('/converted-shops/:shopId/products/:productId', async (req: Request, resp: Response) => {
    const shopId: string = req.params.shopId;
    const productId: string = req.params.productId;

    try {
        const product = await ChozoiProduct.findOne({ _id: productId, shop_id: shopId })
        resp.send(product);
    }
    catch (e) {
        resp.status(500).send({
            error_message: e
        });
    }
})
// update product
router.put('/converted-shops/:shopId/products/:productId', async (req: Request, resp: Response) => {
    const productId = req.params.productId;
    const shopId = req.params.shopId
    const data = req.body
    let filters = {
        _id: productId,
        shop_id: shopId
    }
    console.log(filters);

    try {
        const product = await ChozoiProduct.findOneAndUpdate(filters, data);

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
// approve product by productid 
router.post('/approved-shops/:shopId/approved-products', async (req: Request, resp: Response) => {
    const productIds: string[] = req.body.product_ids;
    const shopId: string = req.params.shopId;

    resp.send({
        status: true,
        message: "Approving products..."
    })

    await approveProductsByIds(shopId, productIds);

    const products: any[] = await chozoiProduct.find({ shop_id: shopId, state: 'APPROVED' });
    const product_approve = products.length;
    if (product_approve) {
        await chozoiShop.updateOne({ _id: shopId }, { product_approve: product_approve });
    }

});
// search product
router.get('/shop/:shopId/products/search', async (req: Request, resp: Response) => {
    try {
        const regexIdSearch = /sp.\d+/g;
        const regexIdNumber = /^[0-9]+$/;
        const key: string = req.query.key.toString();
        let products = [];
        if (regexIdSearch.test(key)) {

            const product = await ChozoiProduct.findById(key);
            if (!product) {
                resp.send(null);
            } else products.push(product);

        } else if (key.match(regexIdNumber)) {

            const product = await ChozoiProduct.findById(`sp.${key}`);
            if (!product) {
                resp.send(null);
            } else products.push(product);

        } else {
            const shopId = req.params.shopId;
            const regex = new RegExp(key);
            const query = {
                name: {
                    $regex: regex,
                    $options: "i",
                },
            };

            products = await ChozoiProduct.find(query).where('shop_id').equals(shopId).limit(10);

        }

        resp.status(200).send({
            data: products

        });
    } catch (error) {
        resp.status(500).send({
            error
        })
    }
})
// total product
router.get('/products', async (_req: Request, resp: Response) => {
    try {
        const productDraft = await ChozoiProduct.countDocuments({ state: "DRAFT" });
        const productApprove = await ChozoiProduct.countDocuments({ state: "APPROVED" });
        const totalProducts = await ChozoiProduct.countDocuments({});
        resp.send({
            products_draft: productDraft,
            products_approved: productApprove,
            products_total: totalProducts,
        })
    } catch (error) {
        console.log(error);
    }
});
//
router.put("/category-products/:shopId", async (req: Request, resp: Response) => {
    try {
        const shopId: string = req.params.shopId;
        const category = req.body.category;
        console.log(category);
        if (!category.id || !category.name) {
            resp.send({
                message: "Danh mục không được để trống !",
                status: "error"
            });
            return
        }
        await ChozoiProduct.updateMany({ shop_id: shopId, state: "FAIL" }, { $set: { category: category, state: "DRAFT" } });
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
// check product
// router.get('/check-product', async (_req: Request, resp: Response) => {
//     try {
//         const count = await categorySportCZ();
//         resp.send({
//             count: count
//         });
//     } catch (error) {
//
//     }
// })

// crawl by link product
router.post("/shop/:shopId/product-crawler", async (req: Request, resp: Response) => {
    // const shopId: string = req.params.shopId;
    const productLink: string = req.body.product;
    // if (!validUrl.isUri(productLink)) {
    //     resp.status(200).send({
    //         message: 'URL Không đúng định dạng',
    //         status: "warning"
    //     });
    //     return;
    // }
    try {
        const productHref: string[] = [new URL(productLink).pathname];
        // const shopIdByproduct = productLink.split('.')[2];
        // if (shopId.split('.')[1] != shopIdByproduct) {
        //     resp.send({
        //         message: "Sản phẩm không phải của shop " + shopId,
        //         status: "warning"
        //     });
        //     return
        // }
        const check = await ChozoiProduct.findById(`sp.${productHref[0].split('.').slice(-1)[0]}`);
        if (check) {
            resp.send({
                message: "Sản phẩm đã tồn tại",
                status: "warning"
            });
            return
        }
        const browser = await puppeteer.launch({
            // executablePath: '/usr/bin/chromium-browser',
            // headless: false,
            args: ['--start-maximized',
                '--no-sandbox',
                '--disable-setuid-sandbox'
            ]
        });
        try {
            await getProduct(browser, productHref, resp);
            resp.send({
                message: "Crawl thành công",
                status: "success"
            })
        } catch (error) {
            resp.status(500).send({
                message: "Crawl thất bại",
                status: "warning"
            })
        }
        await browser.close();
        return;

    } catch (error) {
        resp.status(500).send({
            message: "Lỗi chưa xác định",
            status: "warning"
        })
    }
})

router.post("/shop/:shopId/product-update", async (req: Request, resp: Response) => {

    const product_id: any = req.body._id;
    console.log(product_id);

    try {
        const product = await ChozoiProduct.findByIdAndDelete({ _id: product_id });
        console.log(product);
        
        const productHref: string[] = [new URL(product.link).pathname];
        const browser = await puppeteer.launch({
            // executablePath: '/usr/bin/chromium-browser',
            // headless: false,
            args: ['--start-maximized',
                '--no-sandbox',
                '--disable-setuid-sandbox'
            ]
        });
        try {
            await getProduct(browser, productHref, resp);
            resp.send({
                message: "Crawl thành công",
                status: "success"
            })
        } catch (error) {
            resp.status(500).send({
                message: "Crawl thất bại",
                status: "warning"
            })
        }
        await browser.close();
        return;

    } catch (error) {
        resp.status(500).send({
            message: "Lỗi chưa xác định",
            status: "warning"
        })
    }
})
export default router;