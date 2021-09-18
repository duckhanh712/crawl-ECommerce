
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
import { Stats } from 'fs';
import { convertShop } from '../shops/shopCrawler';
import { sleep } from '../../utils/common';
import { getFileStat } from '../../utils/common';
import RetryFileModel from '../../models/retryFile';

const crawlShopsPromise = (shopSitemapPath: string) => {
    return new Promise((resolve, reject) => {
        console.log('crawling:', shopSitemapPath);
        const shopQueue: string[] = [];
        try {
            let readStream: ReadStream = createReadStream(shopSitemapPath);
            readStream.setEncoding('utf8');

            let xmlStream = xmlFlow(readStream);
            xmlStream.on('tag:loc', shopTag => {
                const shopName = new URL(shopTag.$cdata).pathname.substring(1);
                shopQueue.push(shopName);
            });

            xmlStream.on('end', async () => {
                // console.log('shopQueue', shopQueue);
                readStream.close();
                let shopName: string = shopQueue.shift();
                while (shopName) {
                    await convertShop(shopName);
                    await sleep(2500);
                    shopName = shopQueue.shift();
                }

                resolve(1);
            });
        }
        catch (e) {
            reject(e);
        }
    })
}


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
        // fs.unlink(filePath, (e) => { console.log('can not delete:', filePath, ' because:', e); });
    }
}

export const downloadSitemapShop = async () => {
    // const item = await RetryFileModel.findById(1);
    // const index = item.name.split('-')[1].split('.')[0];

    for (let i = 23; i <= 40; i++) {

        const url = `https://sitemap.shopee.vn/sitemap.shops-${i}.xml.gz`;
        console.log('url', url);
        await RetryFileModel.updateOne({ _id: 1 }, { name: url });
        const sitemapUrl = new URL(url);
        const sitemap = sitemapUrl.pathname.slice(1, -3);
        const currentSitemapPath = path.join(sitemapPath, sitemap);
        try {
            await downloadSitemap(url, currentSitemapPath)
        }
        catch (e) {
            break;
        }
        try {

            console.log('currentSitemapPath', currentSitemapPath);
            const fileStat: Stats = await getFileStat(currentSitemapPath);
            if (fileStat.isFile) {
                try {
                    await crawlShopsPromise(currentSitemapPath);
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

export const downloadSitemapShopSchedule = async (index) => {




    const url = `https://sitemap.shopee.vn/sitemap.shops-${index}.xml.gz`;

    const sitemapUrl = new URL(url);
    const sitemap = sitemapUrl.pathname.slice(1, -3);
    const currentSitemapPath = path.join(sitemapPath, sitemap);
    try {
        await downloadSitemap(url, currentSitemapPath)
    }
    catch (e) {
     console.log(e);
     
    }
    try {

        console.log('currentSitemapPath', currentSitemapPath);
        const fileStat: Stats = await getFileStat(currentSitemapPath);
        if (fileStat.isFile) {
            try {
                await crawlShopsPromise(currentSitemapPath);
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

