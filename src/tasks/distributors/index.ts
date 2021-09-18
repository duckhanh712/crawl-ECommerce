import puppeteer from 'puppeteer';
import saveDitributor from './convert';
const TIMNHAPHANPHOI_API = `https://timnhaphanphoi.vn`;
const getConent = (url: string, category: string) => {
    return new Promise(async (resolve, reject) => {
        const browser = await puppeteer.launch({
            ignoreDefaultArgs: ['--disable-extensions'],
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox'
            ]
          });
        const page = await browser.newPage();
        try {
            console.log(`link: ${TIMNHAPHANPHOI_API}${url}`);

            await page.goto(`${TIMNHAPHANPHOI_API}${url}`);
            const distributor = await page.evaluate(() => {

                const title: string = document.querySelector(".h1").textContent;
                const content = document.querySelector(".text-justify").textContent;
                const phone = document.querySelector("#profile-phone").getAttribute('phone');
                const image = document.querySelectorAll('.lSGallery > li > a > img');
                const note: any = document.querySelectorAll(".info > li > strong, .info > li > .green");
                const detail = document.querySelectorAll(" #detailAddress > div > table > tbody > tr > td");
                let support = [];
                let info = [];
                let images = [];
                image.forEach(item => {
                    images.push(item.getAttribute('src'));
                });
                for (let i = 0; i <= 4; i++) {
                    info.push(detail[i].textContent);
                }
                note.forEach(item => {
                    support.push(item.textContent);
                });
                const data = {
                    title,
                    content,
                    support,
                    images,
                    info,
                    phone
                }
                return data;

            });
            await browser.close();
            await saveDitributor(distributor, category);
            // console.log('distributor', distributor);
            resolve(1);
        }
        catch (e) {
            console.log(e);

            reject(e)
        }

    });
}

export const getUrlDistributors = async (url) => {

    let nextPage = '';
    let pageNumber = 1;
    let distributors = ['1'];

    while (distributors.length > 0)
        try {
            const browser = await puppeteer.launch({
                ignoreDefaultArgs: ['--disable-extensions'],
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox'
                ]
              });
            const page = await browser.newPage();
            await page.goto(`${TIMNHAPHANPHOI_API}${url}${nextPage}`);
            console.log('goto:', `${TIMNHAPHANPHOI_API}${url}${nextPage}`);

            distributors = await page.evaluate(() => {
                // const pageUrl = document.querySelector('.pagination > li.active + li > a').getAttribute("href");
                let items: any = document.querySelectorAll(".rnvip5 , .rnvip4, .rnvip3, .rnvip2, .rnvip1, .rnvip0 ");
                let links = [];
                items.forEach(item => {
                    let url = item.getAttribute("href")
                    links.push(url);
                });
                return links;
            });
            await browser.close();
            console.log('distributor', distributors);
            console.log('nextPage', nextPage);
            pageNumber++;
            nextPage = `?page=${pageNumber}`
            for (let i = 0; i < distributors.length; i++) {

                await getConent(distributors[i], url);
            }

        } catch (e) {
            console.log(e);

        }

}

export const getUrlCategories = async () => {
    return new Promise(async (resolve, reject) => {
        try {
            const browser = await puppeteer.launch({
                ignoreDefaultArgs: ['--disable-extensions'],
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox'
                ]
              });
            const page = await browser.newPage();
            await page.goto(TIMNHAPHANPHOI_API);
            const urls = await page.evaluate(() => {
                let items: any = document.querySelectorAll(".menuSub > li > a");
                let links = [];
                for (let i = 0; i < 13; i++) {
                    let url = items[i].getAttribute("href")
                    links.push(url);
                }
                return links;

            });
            await browser.close();
            console.log(urls);
            for (let i = 0; i < urls.length; i++) {
                console.log(urls[i]);
                await getUrlDistributors(urls[i]);
            }

            resolve(1)
        } catch (e) {
            reject(e);

        }
    });

}






