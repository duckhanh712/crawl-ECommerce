import { SHOPEE_API } from '../constants/api';
import axios from 'axios';
import { HTTPResponse } from 'puppeteer';
import { productCrawl } from '../tasks/products/productCrawler';

async function autoScroll(page) {
    try {
        await page.evaluate(async () => {
            await new Promise((resolve, _reject) => {
                var totalHeight = 0;
                var distance = 100;
                var timer = setInterval(() => {
                    var scrollHeight = document.body.scrollHeight;
                    window.scrollBy(0, distance);
                    totalHeight += distance;
                    if (totalHeight >= scrollHeight) {
                        clearInterval(timer);
                        resolve(1);
                    }
                }, 100);
            });
        });
    } catch (error) {

        console.log(error);

    }
}


export const getShopDetail = async (shopName: string) => {
    const shopDetailUrl = `${SHOPEE_API}/v4/shop/get_shop_detail?username=${shopName}`;
    const response = await axios.get(shopDetailUrl);
    return response.data.data;
}

export const getProducts = async (browser, link: string) => {
    return new Promise(async (resolve, reject) => {
        const page = await browser.newPage();
        let responseBody;
        try {
            page.on('response', async (resp: HTTPResponse) => {
                const url: string = resp.url();
                if (url.includes("item/get")) {
                    try {
                        responseBody = await resp.json();
                        if (responseBody.item) {
                            await productCrawl(responseBody,link);
                        }
                        resolve(1);
                    }
                    catch (e) {
                        // reject(e)
                        console.log('err', e, link);
                    }
                }
            }); 
            await page.goto(link);
            await autoScroll(page);
        }
        catch (e) {
            await browser.close();
            reject(e)
            console.log('err...', e);
        }
    });
}

