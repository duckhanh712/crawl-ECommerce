// import { existsSync } from 'fs';
// import path from 'path';
// import { sitemapPath } from '../index';
// import { downloadSitemap } from '../../utils/common';


// export default async (catSitemapLink: string) => {
//     // console.log(shopSitemapLink);
//     const catSitemapUrl = new URL(catSitemapLink);
//     const catSitemap = catSitemapUrl.pathname.slice(1, -3);
//     const catSitemapPath = path.join(sitemapPath, catSitemap);

//     if (!existsSync(catSitemapPath)) {
//         try {
//             await downloadSitemap(catSitemapLink, catSitemapPath);
//         }
//         catch (e) {
//             console.log('gunzip error:', e);
//         }
//     }
//     // else {
//     //     console.log(shopSitemap, 'exists');
//     // }

//     return catSitemapPath;
// }