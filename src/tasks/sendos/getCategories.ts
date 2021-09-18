import puppeteer from 'puppeteer';
// import { SENDO_HTTP } from '../../constants/api';
// import { sleep } from '../../utils/common';
import CateSenDoModel from '../../models/cateSendos';
import { sleep } from '../../utils/common';
const SENDO_HTTP = `https://www.sendo.vn`;
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


export const getCategories = async (browser) => {
    const url = `${SENDO_HTTP}/sitemap`;
    try {


        const page = await browser.newPage();
        await page.setViewport({ width: 1280, height: 800 })
        await page.goto(url);
        await autoScroll(page);
        // const data = await page.evaluate(() => {
        //     const cat2 = document.querySelectorAll(".cat_2URx");
        //     const data = {
        //         itemCount: cat2.length
        //     }
        //     return data;

        // });

        let categories = [];
        for (let index = 323; index >= 0; index--) {
            const items = await page.$$('.cat_2URx');
            await items[index].click();
            await sleep(2000);
            const data = await page.evaluate(() => {
                let cates = [];
                const categoriesQuery = document.querySelectorAll(".mounted_YTF6 > a");
                categoriesQuery.forEach(item => {
                    cates.push(item.textContent);
                });
                return cates;

            });

            categories = categories.concat(data);
            await page.reload();
        }

        let cate = categories.shift();
        while (cate) {
            const cat = cate.replace('"','');
            await CateSenDoModel.create({ name: cat});

            cate = categories.shift();
        }



    } catch (error) {
        console.log(error);

    }
}


export const startBrowser = async () => {
    const browser = await puppeteer.launch({
        // headless: false,
        args: ['--start-maximized',
            '--no-sandbox',
            '--disable-setuid-sandbox'
        ]
    });
    await getCategories(browser);
}