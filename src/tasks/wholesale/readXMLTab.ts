import puppeteer from 'puppeteer';
import { Platforms } from '../../constants/common';
import WholesaleModel from '../../models/wholesaleShop';
import { getUrlProduct } from '../../tasks/wholesale/saveProduct';
import { createShop } from '../wholesale/saveShop';
import { loginTTS } from './index';
import RetryFileModel from '../../models/retryFile'

const TTS_API = `https://thitruongsi.com`;

export const getShop = async (browser, shopUrls) => {

    try {
        const page = await browser.newPage();
        await page.goto(TTS_API);
        await loginTTS(page);
        await page.waitForNavigation({
            waitUntil: 'networkidle0',
        });

        for (let i = 0; i < shopUrls.length; i++) {
            try {
                const shopUrl = shopUrls[i];
                await page.goto(shopUrl);
                const data = await page.evaluate(() => {

                    const shopName = document.querySelector(".shop-intro__name").textContent;
                    const shopAvatar = document.querySelector(".shop-intro__avatar").getAttribute('src');
                    const shopDescription = document.querySelectorAll(".jsx-898174646 > div  > p ");
                    const shopStatistic = document.querySelectorAll(".jsx-2057245010.mr-4 > .jsx-2057245010");
                    const shopMetaNames = document.querySelectorAll(".shop-meta__name");
                    const shopMetaValues = document.querySelectorAll(".shop-meta__value");
                    const operationTimes = document.querySelectorAll(".css-1t42tx8 > div > span");
                    const shopImages = document.querySelectorAll(".image-lightbox > img");
                    const addressString = document.querySelector(".text-truntcate.text-muted").textContent;
                    const productsShow = document.querySelector(".border-bottom.border-dark").getAttribute("href");
                    let shopDescriptions: string, businessType: string, imageCoverUrl: string;
                    try {

                        shopDescriptions = document.querySelector(".shop-description").textContent;

                    } catch (e) {

                        shopDescriptions = null;
                    }
                    try {

                        imageCoverUrl = document.querySelector(".css-7b2ct2 > img").getAttribute("src");

                    } catch (e) {

                        imageCoverUrl = null;
                    }
                    try {

                        businessType = document.querySelector(".jsx-2057245010.shop-intro .p-2 .jsx-2057245010 > img").getAttribute('src');

                    } catch (e) {

                        businessType = null;
                    }
                    let operationTime: number = Number(operationTimes[1].textContent);
                    if (operationTimes.length >= 3) {
                        operationTime = Number(operationTimes[2].textContent);
                    }
                    let images = [];
                    shopImages.forEach(item => {
                        images.push(item.getAttribute("src"));
                    });
                    let companyName: string, businessModel: string, taxCode: string;
                    let contactName: string, area: string, industry: string, addressDetail: string;

                    for (let i = 0; i < shopMetaNames.length; i++) {

                        if (shopMetaNames[i].textContent == `Tên doanh nghiệp:`) {
                            companyName = shopMetaValues[i].textContent
                        }
                        if (shopMetaNames[i].textContent == `Mô hình kinh doanh`) {
                            businessModel = shopMetaValues[i].textContent;
                        }
                        if (shopMetaNames[i].textContent == `Mã số thuế`) {
                            taxCode = shopMetaValues[i].textContent;
                        }
                        if (shopMetaNames[i].textContent == `Đại diện`) {
                            contactName = shopMetaValues[i].textContent;
                        }
                        if (shopMetaNames[i].textContent == `Thị trường`) {
                            area = shopMetaValues[i].textContent;
                        }
                        if (shopMetaNames[i].textContent == `Ngành hàng`) {
                            industry = shopMetaValues[i].textContent;
                        }
                        if (shopMetaNames[i].textContent == `Địa chỉ`) {
                            addressDetail = shopMetaValues[i].textContent;
                        }

                    }


                    const shopViews = Number(shopStatistic[0].textContent);
                    const shopfollowers = Number(shopStatistic[2].textContent);
                    const products = Number(shopStatistic[4].textContent);
                    let description = '';
                    shopDescription.forEach(item => {
                        description = `${description}${item.textContent}\n`;
                    });

                    const shop = {

                        imageCoverUrl,
                        shopName,
                        shopAvatar,
                        description,
                        shopViews,
                        shopfollowers,
                        products,
                        operationTime,
                        companyName,
                        businessModel,
                        businessType,
                        taxCode,
                        contactName,
                        area,
                        industry,
                        addressDetail,
                        images,
                        shopDescriptions,
                        addressString,
                        productsShow

                    }
                    return shop;

                });
                await page.$$eval('.btn-outline-link', elements => elements[2].click());
                await page.waitForSelector('textarea', { visible: true });
                const getPhoneNumber = await page.evaluate(() => {

                    const phoneNumber = document.querySelectorAll('textarea');
                    let phones = [];
                    phoneNumber.forEach(item => {
                        phones.push(item.textContent);
                    });
                    return phones;
                });
                const shop = await WholesaleModel.findById(`${Platforms.tts}.${getPhoneNumber[0]}`);
                if (!shop && data.products > 0) {
                    await createShop(data, getPhoneNumber, shopUrl);
                    const productUrl = `${TTS_API}${data.productsShow}`;

                    await getUrlProduct(page, productUrl, getPhoneNumber)

                } else {
                    continue;
                }

            } catch (error) {
                console.log(error);

            }


        }
        page.close();
    } catch (e) {
        console.log(e);
        await browser.close();
    }
}
const readXMLTab = (url) => {


    return new Promise(async (resolve, reject) => {
        const browser = await puppeteer.launch({
            //  headless: false,
            args: ['--start-maximized',
                '--no-sandbox',
                '--disable-setuid-sandbox'
            ]
        });
        try {
            const page = await browser.newPage();
            await page.goto(url);

            const data = await page.evaluate(() => {
                const urlQuyerySelector = document.querySelectorAll("loc");
                let urlsArray = [];
                urlQuyerySelector.forEach(item => {
                    urlsArray.push(item.textContent);
                })
                return urlsArray;
            });
           
            await page.close();
            await getShop(browser, data);
            await browser.close();
            resolve(1)
        } catch (e) {
            await browser.close();
            console.log(e);
            reject(e)
        }


    });
}

// referent https://thitruongsi.com/sitemap_tts/sitemap.xml
// limit = 100 , page = 1411
export default async () => {

    try {
        await RetryFileModel.updateOne({ _id: 3 }, { name: 'https://thitruongsi.com/sitemap_tts/shop.xml?limit=100&page=789' });
    } catch (error) {
        console.log(error);

    }
    const item = await RetryFileModel.findById(3);
    const index = item.name.split('=')[2];
   
    for (let i = index; i <= 1141; i++) {
        const url = `https://thitruongsi.com/sitemap_tts/shop.xml?limit=100&page=${i}`
        await RetryFileModel.updateOne({ _id: 3 }, { name: url });
        await readXMLTab(url);
    }
}