import path from 'path';
import { sitemapPath } from '../index1';
import axios from 'axios';
import { createGunzip } from 'zlib';
import { createWriteStream } from 'fs';
import fs from 'fs';
import { promisify } from 'util';
import { pipeline } from 'stream';
import { ReadStream, createReadStream } from 'fs';
import xmlFlow from 'xml-flow';
import { ProductId } from '../../interfaces/shopee';
import ShopeeProductIdModel from '../../models/shopeeProductId';
import { Stats } from 'fs';
import { getFileStat } from '../../utils/common';


const pipe = promisify(pipeline);
export const downloadSitemap = async (url: string, filePath: string) => {
    const gunzip = createGunzip();
    const fileWriteStream = createWriteStream(filePath);
    try {
        const response = await axios({
            url,
            method: 'GET',
            responseType: 'stream',
            timeout: 25000
        });

        await pipe(response.data, gunzip, fileWriteStream);
    }
    catch (e) {
        fileWriteStream.close();
    }
}

export const saveProductIdList = (productSitemapPath: string) => {
    return new Promise((resolve, _reject) => {
        try {
          


            let readStream: ReadStream = createReadStream(productSitemapPath);
            readStream.setEncoding('utf8');

            const productQueue: ProductId[] = [];
            let xmlStream = xmlFlow(readStream);


            xmlStream.on('tag:loc', shopTag => {
                const link: string = shopTag.$cdata;
                const urlParts = shopTag.$cdata.split('.');
                const partLength = urlParts.length;
                const product_id: string = urlParts[partLength - 1];
                const shop_id: string = urlParts[partLength - 2];
                const product: ProductId = {
                    _id: `${shop_id}.${product_id}`,
                    product_id,
                    shop_id,
                    state: "INIT",
                    link

                }
                productQueue.push(product);
            });

            xmlStream.on('end', async () => {
                readStream.close();

                let product: ProductId = productQueue.shift();
                while (product) {
                    try {
                        
                        await ShopeeProductIdModel.create(product);

                    }
                    catch (e) {
                        // console.log('existing product:', product._id);
                        console.log(e);
                        
                    }
                    product = productQueue.shift();
                }

                resolve(1);
            });

        }
        catch (e) {
            console.log(e);
            resolve(0);
        }
    })
}


export const downloadSitemapProduct = async () => {
      
        
    for (let i = 1; i <= 900; i++) {

        const url = `https://sitemap.shopee.vn/sitemap.items-${i}.xml.gz`;

        const sitemapUrl = new URL(url)
        const sitemap = sitemapUrl.pathname.slice(1, -3)
        const currentSitemapPath = path.join(sitemapPath, sitemap)

        try {

            await downloadSitemap(url, currentSitemapPath)

        }
        catch (e) {
           
            break;
        }
        try {

            const fileStat: Stats = await getFileStat(currentSitemapPath);
            if (fileStat.isFile) {
                try {
                    await saveProductIdList(currentSitemapPath);
                    await fs.unlink(currentSitemapPath, (e) => { console.log('can not deleteeeeeeeeeeeee:', currentSitemapPath, ' because:', e); });

                }
                catch (e) {
                    console.log(e);
                }
            }


        }
        catch (e) {

            console.log(e);

        }


    }

}

