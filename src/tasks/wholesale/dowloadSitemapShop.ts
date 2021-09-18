import path from 'path';
import axios from 'axios';
import { createGunzip } from 'zlib';
import { createWriteStream } from 'fs';
import fs from 'fs';
import { promisify } from 'util';
import { pipeline } from 'stream';
import { ReadStream, createReadStream } from 'fs';
import { Stats } from 'fs';
import shopCrawl from '../wholesale/index';
import RetryFileModel from '../../models/retryFile';

export const rootPath: string = process.cwd();
export const sitemapPath = path.join(rootPath, 'sitemaps')
const pipe = promisify(pipeline);
const getFileStat = promisify(fs.stat);

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


const readfileXML = (sitemapPath: string) => {

    return new Promise((resolve, _reject) => {
        try {

            let readStream: ReadStream = createReadStream(sitemapPath);
            readStream.setEncoding('utf-8');
            let searchLinks = [];

            readStream.on('data', searchLink => {
                searchLinks.push(searchLink);
            });
            readStream.on('error', err => {

                console.log(err);

            });
            readStream.on('close', async () => {
                readStream.close();
                if (searchLinks.length > 0) {
                    const shops = searchLinks[0].split('\n');
                    let shop = shops.shift();
                    while (shop) {
                        try {
                            await shopCrawl(shop);

                        } catch (error) {

                            console.log(error);

                        }

                        shop = shops.shift();

                    }
                    resolve(1);
                }

            });

        } catch (error) {
            console.log(error);

        }
    });

}

export const sitemapShopWholeSale = async () => {

    try {
        await RetryFileModel.updateOne({ _id: 2 },{ name: "https://s3.thitruongsi.com/sitemaps/shop_search_0.xml.gz" });
    } catch (error) {
        console.log(error);

    }

    for (let index = 0; index <= 1; index++) {
        const url = `https://s3.thitruongsi.com/sitemaps/shop_search_${index}.xml.gz`;
        await RetryFileModel.updateOne({ _id: 2 }, { name: url });
        const sitemapUrl = new URL(url)
        const sitemap = sitemapUrl.pathname.slice(10, -3)
        const currentSitemapPath = path.join(sitemapPath, sitemap);
        try {

            await downloadSitemap(url, currentSitemapPath);
        }
        catch (e) {

            break;
        }
        try {

            const fileStat: Stats = await getFileStat(currentSitemapPath);
            if (fileStat.isFile) {
                try {
                    await readfileXML(currentSitemapPath);
                    await fs.unlink(currentSitemapPath, () => { console.log('delete', currentSitemapPath); });

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
