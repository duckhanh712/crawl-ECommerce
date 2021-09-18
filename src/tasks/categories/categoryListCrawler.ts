import xmlFlow from 'xml-flow';
import crawlCat from './categoryCrawler';
import { ReadStream, createReadStream } from 'fs';
import { sleep } from '../../utils/common';


const catQueue: string[] = [];
const crawlCatPromise = (catSitemapPath: string) => {
    return new Promise((resolve, reject) => {
        try {
            let readStream: ReadStream = createReadStream(catSitemapPath);
            readStream.setEncoding('utf8');

            let xmlStream = xmlFlow(readStream);
            xmlStream.on('tag:loc',catTag => {
                const catName = new URL(catTag.$cdata).pathname.substring(1);
                catQueue.push(catName);
            });

            xmlStream.on('end', async () => {
                // console.log('shopQueue', shopQueue);
                readStream.close();
                let catName: string = catQueue.shift();
                while (catName) {
                    await crawlCat(catName);
                    await sleep(0);
                    catName = catQueue.shift();
                }

                resolve(1);
            });
        }
        catch (e) {
            reject(e);
        }
    })
}

export default async (catSiteMapQueue: string[]) => {
    let catSitemapPath: string = catSiteMapQueue.shift();
    console.log('get cat list:', catSiteMapQueue);
    while (catSitemapPath) {
        console.log(catSitemapPath);
        await crawlCatPromise(catSitemapPath);
        console.log('next shop path...')
        catSitemapPath = catSiteMapQueue.shift();
    };
}