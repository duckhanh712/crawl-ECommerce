import SendoProductsModel from '../../models/sendoProducts';
import { Platforms } from '../../constants/common';
// import { getCategoryCZ } from '../../utils/chozoi';
import { SENDO_HTTP } from '../../constants/api';
import SendoShopsModel from '../../models/sendoShops';
import { getProductByAPI } from './productsV2';
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
export const getProductDetail = async (productUrls: string[], phoneShop) => {
    try {
        const products = productUrls;
        let productUrl = products.shift();
        while (productUrl) {
            await getProductByAPI(productUrl, phoneShop)
            productUrl = products.shift();
        }
    } catch (error) {
        console.log(error);

    }
}
const replacer = /endo/g;
const descriptionProduct = 'Hàng đẹp, giá tốt \n Đảm bảo hoàn trả \n Sản phẩm đúng với mô tả';
const saveProduct = async (product, productId, phoneShop) => {

    try {
        // const category = await getCategoryCZ(product.category);
      
        const variants = [
            {
                attributes: [],
                price: product.price,
                sale_price: product.price,
                sku: '',
                inventory: {
                    in_quantity: 20
                }
            }
        ]
        const productSendo = {
            _id: `${Platforms.sendo}.${productId}`,
            product_id: productId,
            shop_id: `${Platforms.sendo}.${phoneShop}`,
            name: product.productName,
            description_pickingout: product.des.replace(replacer, " ").replace(/\n/g, "<br>"),
            description: descriptionProduct,
            images: product.images,
            // category: category,
            variants,
            state:  "FAIL",
            platform: Platforms.sendo,
            link: product.link
        }
        await SendoProductsModel.create(productSendo).catch(_e => {
            console.log(_e);
        });
        const countProduct: number = await SendoProductsModel.countDocuments({ shop_id: `${Platforms.sendo}.${phoneShop}`});
        await SendoShopsModel.updateOne({ _id: `${Platforms.sendo}.${phoneShop}`}, { product_crawled: countProduct })
    } catch (error) {
        console.log(error);

    }
}
export const getproduct = async (browser, productUrl, phoneShop) => {
    const url = productUrl;
    const page = await browser.newPage();
    try {
        await page.goto(url);
    
        // await autoScroll(page);
        const currentUrl = await page.url();
        
        const productIdTmp = new URL(currentUrl);
        const productId = productIdTmp.pathname.split("-")[productIdTmp.pathname.split("-").length - 1].split(".")[0];
      
        const data = await page.evaluate(() => {
            // const productCateQuery = document.querySelectorAll("")
            const productName = document.querySelector("h1").textContent;
            // const price = document.querySelector("span.d7e-87b451.d7e-fb1c84.d7e-a4f628").textContent.split('đ')[0].replace('.', '').replace('.', '');
            // const imageProductsQuery = document.querySelectorAll("div.d7e-9582e2 > img");
            // let images = [];
            // imageProductsQuery.forEach(item => {
                
            //     images.push( {
            //         image_url: `https://${item.getAttribute("src").replace("50x50", "500x500").slice(2)}`
            //     });
            // });
            // let productDes = document.querySelectorAll("span._96e-7edee3.undefined.d7e-d87aa1.d7e-fb1c84");
            // if (productDes.length == 0) {
            //     productDes = document.querySelectorAll(".details-block > div > p");
            // }
            // // let cate = [];
            // // productCateQuery.forEach(item => {
            // //     cate.push(item.textContent);
            // // });
            // let des = "";
            // productDes.forEach(item => {
            //     des = `${des}\n${item.textContent}`;
            // });
            const data = {
                productName,
                // price: Number(price),
                // des,
                // images,
                // category: cate.slice(-1)[0],
             
            }
            return data;
        });
        data.link = currentUrl
        await saveProduct(data,productId ,phoneShop)
        await page.close();
    } catch (error) {
        await page.close()
        console.log(error);

    }

}

export const getProductsItem = async (browser, shopUsername, phoneShop) => {
    try {
       
        const url: string = `${SENDO_HTTP}/shop/${shopUsername}/san-pham`;
        const page = await browser.newPage();
        await page.goto(url);   
        await autoScroll(page);
        await page.click(".aa34b._1b946._665b8.f99ea.dc4b7");
        await page.waitForSelector('.item_3x07', { visible: true });
        await autoScroll(page);
        const currentUrl = await page.url();
        const shopId = currentUrl.split('=')[2];

        const data = await page.evaluate(() => {
            let pageItem;
            try {
                pageItem = document.querySelector(".paginationForm_c7Tb > input ").getAttribute("max");
            } catch (error) {
                pageItem = 1
            }
            const getProductsItem = document.querySelectorAll(".item_3x07");
            let productUrls = [];
            getProductsItem.forEach(item => {
                productUrls.push(item.getAttribute("href"));
            });
            const data = {
                productUrls,
                pageItem
            }
            return data
        });
        console.log("product", data);
        await getProductDetail(data.productUrls, phoneShop);
        if (data.pageItem >= 2) {
            for (let i = 2; i <= data.pageItem; i++) {
                const urlProducts: string = `${SENDO_HTTP}/tim-kiem?page=${i}&platform=2&seller_admin_id=${shopId}`
                await page.goto(urlProducts);
                await page.waitForSelector('.item_3x07', { visible: true });
                await autoScroll(page);
                const data = await page.evaluate(() => {
                    const getProductsItem = document.querySelectorAll(".item_3x07");
                    let productUrls = [];
                    getProductsItem.forEach(item => {
                        productUrls.push(item.getAttribute("href"));
                    });
                    const data = {
                        productUrls,

                    }
                    return data;
                });
                await getProductDetail( data.productUrls, phoneShop);
            }
        }
        await page.close();
    } catch (error) {
        console.log(error);

    }

}
