import { ReadStream, createReadStream } from 'fs';
import xmlFlow from 'xml-flow';
import { sleep } from "../../utils/common";
import { saveProduct } from './productCrawler';
import { ProductElement } from '../../interfaces/shopee';


export default (productSitemapPath: string) => {
    return new Promise((resolve, _reject) => {
        const productQueue: ProductElement[] = [];
        try {
            let readStream: ReadStream = createReadStream(productSitemapPath);
            readStream.setEncoding('utf8');

            let xmlStream = xmlFlow(readStream);
            xmlStream.on('tag:loc', shopTag => {
                const urlParts = shopTag.$cdata.split('.');
                const partLength = urlParts.length;
                const product: ProductElement = {
                    productId: urlParts[partLength - 1],
                    shopId: urlParts[partLength - 2]
                }
                productQueue.push(product);
            });

            xmlStream.on('end', async () => {
                readStream.close();
                let product: ProductElement = productQueue.shift();
                while (product) {
                    await saveProduct(product.productId, product.shopId);
                    await sleep(4000);
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