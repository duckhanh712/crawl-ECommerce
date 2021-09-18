import fs from 'fs';
import path from 'path';
import { sleep } from '../utils/common';
// import { downloadSitemapProduct } from '../tasks/crawlVer2/dowloadSitemapProducts';
// import readSitemap from '../tasks/wholesale/readXMLTab';
// import { downloadSitemapShop } from '../tasks/crawlVer2/dowloadSitemapShops';
// import { sitemapShopWholeSale } from '../tasks/wholesale/dowloadSitemapShop';
import { downloadSitemapShopSendo ,GetShopsfromXLSX } from '../tasks/sendos/index';
// import { readFileSendoShop } from '../utils/readFile';
// import getCatZS from '../utils/zasi';
// import { readEXCEL } from '../tasks/categories/cateMaperShopee';
// import { categorySportCZ } from '../utils/chozoi';
export const rootPath: string = process.cwd();
export const sitemapPath = path.join(rootPath, 'sitemaps')

export default async () => {

    try {
        if (!fs.existsSync(sitemapPath)) {
            fs.mkdirSync(sitemapPath);
        }
    }
    catch (e) {
        console.log(e);

        return;
    }
    await sleep(2000);
    try {
        // await categorySportCZ();
        // await downloadSitemapProduct();
        // await readEXCEL();
        await GetShopsfromXLSX();
        await downloadSitemapShopSendo();
        // await downloadSitemapShop();
        // await sitemapShopWholeSale();
        // await readSitemap();
    } catch (e) {
        console.log(e);

    }


}

