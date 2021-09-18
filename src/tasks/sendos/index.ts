
import path from 'path';
import puppeteer from 'puppeteer';
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
import SendoShopModel from '../../models/sendoShops';
import { SENDO_HTTP } from '../../constants/api';
// import { sleep } from '../../utils/common';
import { getFileStat } from '../../utils/common';
import RetryFileModel from '../../models/retryFile';
import { Platforms } from '../../constants/common';
// import getLocationTTS from '../../utils/getLocationTTS';
import { getProductsItem } from './products';
import { getLocationTTS } from '../../utils/zasi';
import { readFileSendoShop } from '../../utils/readFile';
import sendoProducts from '../../models/sendoProducts';

export const GetShopsfromXLSX = async () => {
    const shopLinks = await readFileSendoShop();
    let shopLink = shopLinks.shift();
    while (shopLink) {
        const shopUsername = shopLink.split('/').slice(-1);
        try {
            await crawlShop(shopUsername);
        } catch (error) {
            console.log(error);

        }

        shopLink = shopLinks.shift();
    }
}
const crawlShopsPromise = (shopSitemapPath: string) => {
    return new Promise((resolve, reject) => {
        console.log('crawling:', shopSitemapPath);
        const shopQueue: string[] = [];
        try {
            let readStream: ReadStream = createReadStream(shopSitemapPath);
            readStream.setEncoding('utf8');
            let xmlStream = xmlFlow(readStream);
            xmlStream.on('tag:loc', shopTag => {
                const shopName = new URL(shopTag.$text).pathname.substring(6);
                shopQueue.push(shopName);
            });

            xmlStream.on('end', async () => {
                readStream.close();
                let shopName: string = shopQueue.shift();
                while (shopName) {
                    console.log("shopName", shopName);
                    try {
                        await crawlShop(shopName);
                    } catch (error) {

                    }

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
const crawlShop = async (shopUsername) => {
    return new Promise(async (resolve, reject) => {
        const browser = await puppeteer.launch({
            // executablePath: '/usr/bin/chromium-browser',
            // headless: false,
            args: ['--start-maximized',
                '--no-sandbox',
                '--disable-setuid-sandbox'
            ]
        });
        try {

            const url = `${SENDO_HTTP}/shop/${shopUsername}/thong-tin-shop`
            const page = await browser.newPage();
            await page.goto(url);
            // await page.waitForNavigation({
            //     waitUntil: 'networkidle0',
            // });
            const data = await page.evaluate(() => {

                const shopNameQuery = document.querySelector(".shop-summary-info__shop-name_20VH > div > span ").textContent;

                const shopDetailQuerys = document.querySelectorAll(".textDesc_1ut7");
                let shopAvatar = "";
                try {
                    shopAvatar = document.querySelector(".shop-summary-info__left_2eyn > img").getAttribute("src");
                } catch (error) {
                    // console.log(error);

                }
                let shopCover = "";
                try {
                    shopCover = document.querySelector(".shop-cover_3xVE > img ").getAttribute("src");
                } catch (error) {
                    // console.log(error);

                }
                const shopDescription = document.querySelector(".slogan_3Zay > p").textContent;
                let shopPhone, shopAddress, shopEmail;
                const regexIdNumber = /^[0-9]+$/;
                if (shopDetailQuerys[2].textContent.match(regexIdNumber)) {

                    shopAddress = shopDetailQuerys[1].textContent;
                    shopPhone = shopDetailQuerys[2].textContent;
                    shopEmail = shopDetailQuerys[3].textContent;
                } else {
                    shopAddress = shopDetailQuerys[2].textContent;
                    shopPhone = shopDetailQuerys[3].textContent;
                    shopEmail = shopDetailQuerys[4].textContent;
                }

                const data = {
                    shopNameQuery,
                    shopAddress,
                    shopPhone,
                    shopEmail,
                    shopDescription,
                    shopAvatar,
                    shopCover,
                }
                return data
            });
            await page.close();
            await convertShop(shopUsername, data, browser);
            await browser.close();
            resolve(1)

        } catch (e) {

            console.log("does not exist ", shopUsername);
            await browser.close();
            reject(e)
        }


    });
}
const convertShop = async (shopUsername, shopDetail, browser) => {
    try {
        const add = shopDetail.shopAddress.split(',').slice(-2);
        const addString = `${add[0]},${add[1]}`
        const address = await getLocationTTS(addString);
        const shop = {
            _id: `${Platforms.sendo}.${shopDetail.shopPhone}`,
            username: shopDetail.shopPhone,
            name: shopDetail.shopNameQuery,
            phone_number: shopDetail.shopPhone,
            email: shopDetail.shopEmail,
            description: shopDetail.shopDescription.replace(/['"]+/g, ''),
            img_avatar_url: shopDetail.shopAvatar,
            img_cover_url: shopDetail.shopCover,
            link: `${SENDO_HTTP}/shop/${shopUsername}`,
            platforms: `${Platforms.sendo}`,
            address: address
        }
        console.log("create shop", shop);
        await SendoShopModel.create(shop);
        try {
            await getProductsItem(browser, shopUsername, shopDetail.shopPhone);
        } catch (error) {
            console.log(error);
            
        }
        const countProduct = await sendoProducts.countDocuments({ shop_id: shop._id });
        if (countProduct <= 1) {
            try {
                await getProductsItem(browser, shopUsername, shopDetail.shopPhone);
            } catch (error) {
                console.log(error);
                
            }
        }
        await browser.close();

    } catch (error) {
        console.log('can not creat shop by', error);
        await browser.close();
    }
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
export const downloadSitemapShopSendo = async () => {
    try {
        await RetryFileModel.create({ _id: `sendo`, name: "https://www.sendo.vn/sitemaps/shop1.xml.gz" });

    } catch (error) {
        // console.log(error);

    }
    const item: any = await RetryFileModel.findById(`sendo`);
    const index = item.name.slice(-8).slice(0, -7);

    for (let i = index; i <= 7; i++) {
        const url = `${SENDO_HTTP}/sitemaps/shop${index}.xml.gz`
        await RetryFileModel.updateOne({ _id: `sendo` }, { name: url });
        const sitemapUrl = new URL(url);
        const sitemap = sitemapUrl.pathname.slice(10, -3);
        const currentSitemapPath = path.join(sitemapPath, sitemap);
        try {
            await downloadSitemap(url, currentSitemapPath)
        }
        catch (e) {
            continue;
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


