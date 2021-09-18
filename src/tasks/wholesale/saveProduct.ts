
import WholesaleProductModel from '../../models/wholeesaleProduct';
import { Platforms } from '../../constants/common';
import { getCategory } from '../../utils/zasi';
import WholesaleShopModel from '../../models/wholesaleShop';

const TTS_API = `https://thitruongsi.com`;

const saveProduct = (page, data, shopId) => {
    return new Promise(async (resolve, _reject) => {
        try {

            for (let i = 0; i < data.length; i++) {
                try {

                    const url: string = `${TTS_API}${data[i]}`;
                    await page.goto(url);
                    const productDetail = await page.evaluate(() => {
                        let productPrices, productNumbers;
                        let prices = [];
                        const productName = document.querySelector("h1").textContent;
                        const productMinimum = document.querySelector(".css-4bsvdr > div > strong").textContent;
                        let productImages = document.querySelectorAll(".jsx-929251746.css-whm7bm > div > div > div > img");
                        const productDescriptions = document.querySelectorAll(".tab-pane.active >.css-52n5xd > p");
                        const productDescriptionTmp = document.querySelector(".tab-pane.active >.css-52n5xd ").textContent;
                        const cateQuyery = document.querySelectorAll(".breadcrumb-item");
                        const categoryName = cateQuyery[2].textContent;
                        let images = [];
                        productImages.forEach(item => {
                            images.push(item.getAttribute("src"));
                        });
                        let productDescription = "";
                        productDescriptions.forEach(item => {
                            productDescription = (`${productDescription}${item.textContent}\n`)
                        });
                        if (productDescription == "") {
                            productDescription = productDescriptionTmp;
                        }
                        try {
                            productPrices = document.querySelectorAll(".jsx-1704392005.multiple-price");
                            productNumbers = document.querySelectorAll(" .jsx-1704392005.font-90");
                            for (let index = 0; index < productPrices.length; index++) {
                                let price, temptNumbers, temptPrices;
                                try {
                                    let temptNumbers = productNumbers[index].textContent.split(' ')[0];
                                    if (isNaN(temptNumbers) == true) {
                                        temptNumbers = productNumbers[index].textContent.split(' ')[1];
                                    }
                                    temptPrices = productPrices[index].textContent.split(',');
                                    let priceTmp = Number(temptPrices[0]) * 1000;
                                    if (temptPrices.length > 2) {
                                        priceTmp = Number(`${temptPrices[0]}${temptPrices[1]}`) * 1000;
                                    } else if (temptPrices.length == 1) {
                                        continue;
                                        priceTmp = Number(temptPrices[0].split('đ')[0]);

                                    }
                                    price = {
                                        number: Number(temptNumbers) >= 2 ? Number(temptNumbers) : 2,
                                        price: priceTmp
                                    }
                                } catch (error) {
                                    price = {
                                        number: Number(temptNumbers),
                                        price: 0
                                    }
                                }

                                prices.push(price);

                            }
                        } catch (error) {

                            console.log(error);

                        }
                        if (prices.length < 1) {
                            const productPrice = document.querySelector(".jsx-1922897821.single-price").textContent;
                            const priceArr = productPrice.split(',');
                            let priceTmp: number;
                            if (priceArr.length <= 1) {
                              
                                priceTmp = Number(priceArr[0].split('đ')[0]);
                            }
                            else if (priceArr.length == 2) {
                                priceTmp = Number(priceArr[0]) * 1000
                            } else if (priceArr.length >= 3) {
                                priceTmp = Number(`${priceArr[0]}${priceArr[1]}`) * 1000;
                            }
                            const price = {
                                number: Number(productMinimum.split(' ')[0]) >= 2 ? Number(productMinimum.split(' ')[0]) : 2,
                                price: priceTmp
                            }
                            prices.push(price);
                        }
                        if (!prices[0].price) {
                            prices = [];
                            productPrices = document.querySelectorAll(".jsx-1704392005.multiple-price--discount");
                            productNumbers = document.querySelectorAll(" .jsx-1704392005.font-90");
                            for (let index = 0; index < productPrices.length; index++) {
                                let price, temptNumbers, temptPrices;
                                try {
                                    let temptNumbers = productNumbers[index].textContent.split(' ')[0];
                                    if (isNaN(temptNumbers) == true) {


                                        temptNumbers = productNumbers[index].textContent.split(' ')[1];
                                    }
                                    temptPrices = productPrices[index].textContent.split(',');
                                    let priceTmp = Number(temptPrices[0]) * 1000;
                                    if (temptPrices.length > 2) {
                                        priceTmp = Number(`${temptPrices[0]}${temptPrices[1]}`) * 1000;
                                    } else if (temptPrices.length == 1) {
                                        priceTmp = Number(temptPrices[0].split('đ')[0]);
                                        continue;

                                    }
                                    price = {
                                        number: Number(temptNumbers) >= 2 ? Number(temptNumbers) : 2,
                                        price: priceTmp
                                    }
                                } catch (error) {
                                    price = {
                                        number: Number(temptNumbers),
                                        price: 0
                                    }
                                }

                                prices.push(price);

                            }

                        }

                        if (images.length < 1) {
                            productImages = document.querySelectorAll(".col-2 > div > div > img");
                            productImages.forEach(item => {
                                images.push(item.getAttribute("src"));
                            });
                        }

                        const product = {
                            productName,
                            prices,
                            productMinimum,
                            images,
                            productDescription,
                            categoryName,

                        }
                        return product;
                    });

                    const minimum: number = Number(productDetail.productMinimum.split(' ')[0]);
                    const unit: string = productDetail.productMinimum.split(' ')[1]
                    const category = await getCategory(productDetail.categoryName);
                    const product = {
                        name: productDetail.productName,
                        prices: productDetail.prices,
                        minimum: minimum,
                        category: category,
                        shop_id: shopId,
                        unit: unit,
                        description: productDetail.productDescription,
                        images: productDetail.images,
                        link: url
                    }
                    const checkProduct = await WholesaleProductModel.find({ name: product.name, shop_id: shopId });
                    if (checkProduct.length == 0) {
                        await WholesaleProductModel.create(product);
                    }

                } catch (error) {
                    console.log(error);

                }

            }
            const products: any = await WholesaleProductModel.find({ shop_id: shopId });
            await WholesaleShopModel.updateOne({ _id: shopId }, { product_crawled: products.length });
            resolve(1);

        } catch (error) {
            console.log(error);

        }
    });
}

export const getUrlProduct = async (page, productUrl, shop) => {


    try {
        const shopId = `${Platforms.tts}.${shop[0]}`;
     


        let nextPage: string = productUrl;

        while (nextPage) {
            await page.goto(nextPage);
            await page.waitForSelector('.item', { visible: true });
            const data = await page.evaluate(() => {
                let pageAfter;
                const productSelector = document.querySelectorAll(".item > a");
                let productlinks = [];
                productSelector.forEach(item => {
                    productlinks.push(item.getAttribute('href'));
                });
                try {
                    pageAfter = document.querySelector(".page-item.active + li > a").getAttribute("href");
                } catch (error) {
                    console.log(error);

                }
                const data = {
                    productlinks,
                    pageAfter
                }
                return data;
            });
            nextPage = data.pageAfter ? `${TTS_API}${data.pageAfter}` : null;
            await saveProduct(page, data.productlinks, shopId);
        }



    } catch (error) {
        console.log(error);

    }

}