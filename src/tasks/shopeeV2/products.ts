
import puppeteer from 'puppeteer';
import { Platforms } from '../../constants/common';
import chozoiProduct from '../../models/chozoiProduct';
import chozoiShop from '../../models/chozoiShop';
// import { getCategoryCZ } from '../../utils/chozoi';

const SHOPEE_HTTPS = `https://shopee.vn`;
export const getProductLinks = (shopId: string) => {

    return new Promise(async (resolve, reject) => {
        const browser = await puppeteer.launch({
            // executablePath: '/usr/bin/chromium-browser',
            // headless: false,s
            args: ['--start-maximized',
                '--no-sandbox',
                '--disable-setuid-sandbox'
            ]
        });
        try {
            let pageNumber: number = 0;
            let pageTotal: number = 21;
            while (pageNumber <= pageTotal) {
                const url: string = `${SHOPEE_HTTPS}/shop/${shopId}/search?page=${pageNumber}&sortBy=pop`;
                console.log(url);
                const page = await browser.newPage();
                await page.goto(url);
                await page.waitForSelector('.shop-search-result-view__item.col-xs-2-4');
                const data = await page.evaluate(() => {
                    const productLinks = document.querySelectorAll(".shop-search-result-view__item > a");
                    const data: string[] = [];
                    productLinks.forEach(item => {
                        const productLink = item.getAttribute("href");
                        data.push(productLink);
                    });
                    return data
                });
                await getProducts(browser, data);
                await page.close();
                pageNumber++;
            }
            await browser.close();
            resolve(1)
        } catch (e) {
            await browser.close();
            reject(e)
        }


    });
}
const replacer = /hopee/g;
const replaceSpace = /\n/g;
const descriptionProduct = 'Hàng đẹp, giá tốt \n Đảm bảo hoàn trả \n Sản phẩm đúng với mô tả';
const productSave = (product, url) => {
    return new Promise(async (resolve, _reject) => {
        try {
            const category = {
                id: null,
                name: "NONE"
            }
            const idTmp = url.split('.');
            const shopId = idTmp.slice(-2)[0];
            const productId = idTmp.slice(-1)[0].split('?')[0];
            const variants = [
                {
                    attributes: [],
                    price: product.price,
                    sale_price: product.salePrice,
                    sku: '',
                    inventory: {
                        in_quantity: 50
                    }
                }
            ]
            const productShopee = {
                _id: `${Platforms.shopee}.${productId}`,
                product_id: productId,
                shop_id: `${Platforms.shopee}.${shopId}`,
                name: product.name,
                description_pickingout: product.description.replace(replacer, "").replace(replaceSpace, "<br>"),
                description: descriptionProduct,
                images: product.images,
                category: category,
                variants,
                state:  "FAIL",
                platform: Platforms.shopee,
                link: url
            }
            await chozoiProduct.create(productShopee).catch(_e => {
                console.log(_e);
            });
            const countProduct: number = await chozoiProduct.countDocuments({ shop_id: `${Platforms.shopee}.${shopId}` });
            await chozoiShop.updateOne({ _id: `${Platforms.shopee}.${shopId}` }, { product_crawled: countProduct })
            resolve(1);
        } catch (error) {
            console.log(error);

        }
    });

};

export const getProducts = async (browser, productLinks: string[]) => {
    let productLink = productLinks.shift();
    const page = await browser.newPage();
    while (productLink) {
        try {
            const url = `${SHOPEE_HTTPS}${productLink}`;
            await page.goto(url);
            await page.waitForSelector('.attM6y');
            await page.waitForSelector('._12uy03._2GchKS');
            const data = await page.evaluate(() => {
                const productName = document.querySelector(".attM6y > span").textContent;
                const productImages = document.querySelectorAll("._12uy03._2GchKS");
                const description = document.querySelector("._3yZnxJ > span").textContent;
                const productCategoryString = document.querySelectorAll("._3QRNmL");
                let productPrice: string = '0';
                let productPriceSale: string = '0';
                let images: object[] = [];
                productPriceSale = document.querySelector("._3e_UQT").textContent.split('₫')[1].split('.').join('');
                try {
                    productPrice = document.querySelector("._28heec").textContent.split('₫')[1].split('.').join('');
                } catch (error) {
                    console.log(error);

                }
                productImages.forEach(item => {
                    images.push({
                        image_url: item.getAttribute("style").split('"')[1].replace('_tn', '')
                    })
                });
                let cate: string[] = [];
                productCategoryString.forEach(item => {
                    cate.push(item.textContent)
                });
                const data = {
                    name: productName,
                    category: cate.slice(-1)[0],
                    images: images,
                    price: Number(productPrice),
                    salePrice: Number(productPriceSale),
                    description: description,
                }
                return data;
            });
            await productSave(data, url)

        } catch (error) {
            console.log('can not get product', productLink);
            await page.close();
            return;

        }
        productLink = productLinks.shift();
    }
    await page.close();
}

export const getProduct = async (browser, productLink, resp) => {

    const page = await browser.newPage();
    try {
        const url = `${SHOPEE_HTTPS}${productLink}`;
        console.log(url);
        await page.goto(url);
        // await page.waitForSelector('.attM6y');
        // await page.waitForSelector('._12uy03._2GchKS');
        const data = await page.evaluate(() => {
            const productName = document.querySelector(".attM6y > span").textContent;
            const productImages = document.querySelectorAll("._12uy03._2GchKS");
            const description = document.querySelector("._3yZnxJ > span").textContent;
            const productCategoryString = document.querySelectorAll("._3QRNmL");
            let productPrice: string = '0';
            let productPriceSale: string = '0';
            let images: object[] = [];
            productPriceSale = document.querySelector("._3e_UQT").textContent.split('₫')[1].replace(".", '').replace(".", '').split(' ')[0];
            try {
                productPrice = document.querySelector("._28heec").textContent.split('₫')[1].replace(".", '').replace(".", '').split(' ')[0];
            } catch (error) {
                console.log(error);

            }
            productImages.forEach(item => {
                images.push({
                    image_url: item.getAttribute("style").split('"')[1].replace('_tn', '')
                })
            });
            let cate: string[] = [];
            productCategoryString.forEach(item => {
                cate.push(item.textContent)
            });
            const data = {
                name: productName,
                category: cate.slice(-1)[0],
                images: images,
                price: Number(productPrice),
                salePrice: Number(productPriceSale),
                description: description,
            }
            return data;

        });
        await productSave(data, url)

    } catch (error) {
        resp.send({
            message: "Sản phẩm không tồn tại",
            status: "warning"
        })
        console.log('can not get product', productLink);
        await browser.close();
        return;

    }

    await page.close();
}