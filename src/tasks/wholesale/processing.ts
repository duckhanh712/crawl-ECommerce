import wholeesaleProduct from "../../models/wholeesaleProduct";
import WholesaleShopModel from "../../models/wholesaleShop";
import ApproveShopsById from '../../tasks/wholesale/approveShop';
import { sleep } from '../../utils/common';
import puppeteer from 'puppeteer';
import { getCategory } from "../../utils/zasi";
export const approveAuto = async () => {

    let limit: number = 10, skip: number = 0;

    try {
        let item = 10
        while (item >= 10) {

            const shops: any = await WholesaleShopModel.find({ approve_state: "INIT", product_crawled: { $exists: true } }).select('_id').limit(limit).skip(skip);

            for (let i = 0; i < shops.length; i++) {
                try {
                    await ApproveShopsById(shops[i]._id, 2);
                }
                catch (e) {
                    console.log(e);

                }
                await sleep(3000);
            }
            skip = skip + 10;
            item = shops.length;
        }
    }
    catch (e) {
        console.log(e);

    }
}

export const fixCategoryProduct = async () => {
    let limit: number = 10, skip: number = 0;

    try {
        const browser = await puppeteer.launch({
            // headless: false,
            args: ['--start-maximized',
                '--no-sandbox',
                '--disable-setuid-sandbox'
            ]
        });
        const page = await browser.newPage();
        let item = 10
        while (item >= 10) {

            const products: any = await wholeesaleProduct.find({ created_at: { $lte: new Date("2021-05-14")}, updated_at: { $lte: new Date("2021-05-16")}}).limit(limit).skip(skip);

            for (let i = 0; i < products.length; i++) {
                try {
                    const product = products[i];
                    const productId = product._id;
                    await page.goto(product.link);
                    const data = await page.evaluate(() => {
                        const cateQuyery = document.querySelectorAll(".breadcrumb-item");
                        const categoryName = cateQuyery[2].textContent;

                        return categoryName;
                    });

                    const category = await getCategory(data);
                    console.log(product.shop_id,category);
                    
                    await wholeesaleProduct.updateOne({ _id: productId }, { category, state:"DRAFT" });
                }
                catch (e) {
                    console.log(e);

                }

            }
            skip = skip + 10;
            item = products.length;
        }
        await browser.close();
    }
    catch (e) {
      
        console.log(e);

    }
}
