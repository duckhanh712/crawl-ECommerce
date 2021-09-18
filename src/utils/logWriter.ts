import fs from 'fs';
import path from 'path';

const rootPath: string = process.cwd();
const logFile: string = path.join(rootPath, 'logs', 'crawler.log');

export default (productId: string, shopId: string, e: Error, productCreationUrl: string) => {
    const log = {
        time: new Date().toISOString(),
        productId,
        shopId,
        error: e.stack,
        productCreationUrl: productCreationUrl
    }
    const content = JSON.stringify(log) + '\n';
    fs.appendFile(logFile, content, _e => {})
}
