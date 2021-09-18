import { existsSync } from 'fs';
import path from 'path';
import { sitemapPath } from './index1';
import { downloadSitemap } from '../utils/common';


export default async (shopSitemapLink: string) => {
    // console.log(shopSitemapLink);
    const shopSitemapUrl = new URL(shopSitemapLink);
    const shopSitemap = shopSitemapUrl.pathname.slice(1, -3);
    const shopSitemapPath = path.join(sitemapPath, shopSitemap);

    if (!existsSync(shopSitemapPath)) {
        try {
            await downloadSitemap(shopSitemapLink, shopSitemapPath);
        }
        catch (e) {
            console.log('gunzip error:', e);
        }
    }
    // else {
    //     console.log(shopSitemap, 'exists');
    // }

    return shopSitemapPath;
}