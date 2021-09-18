import axios from 'axios';
import { CHOZOI_API } from '../constants/api';
import CategoriesSendoMapModel from '../models/Sendocategories';
import ChozoiProductModel from '../models/chozoiProduct';
import ChozoiShopModel from '../models/chozoiShop';
// import { Platforms } from '../constants/common';
const LOGIN_URL = `${CHOZOI_API}/v1/auth/login`;
export const loginCZ = async (username: string, password: string) => {
    let token;
    const data = {
        username: username,
        password: password
    }
    try {
        const response = await axios.post(LOGIN_URL, data);
        token = response.data.access_token;
    }
    catch (e) {
        console.log(e);
        token = '';
    }
    return token;
}

export const getCategoryCZ = async (cateString) => {
    let category
    try {

        const categorydata: any = await CategoriesSendoMapModel.find({ $text: { $search: cateString } },{ score: { $meta: 'textScore' } })
            .select({ "score": { "$meta": "textScore" }})
            .sort({ score: { $meta: 'textScore' } })
            .limit(1);
            
        if (categorydata[0]._doc.score < 2) {
            category = {
                id: null,
                name: "NONE"
            }
        } else {
            category = {
                id: Number(categorydata[0].cz_category_id),
                name:  categorydata[0].name,
            }
        }



    } catch (error) {
        console.log(error);

    }


    return category;
}

export const categorySportCZ = async () => {
    const categoryShop = {
        name: "Thể thao & Du lịch",
        id: 328
    }
    const API_CATEGORY = `https://api.chozoi.vn/v1/categories/`;
    // let products: any;
    try {
        const categories: any = await axios.get(API_CATEGORY);
        // console.log(categories);
        // const isLargeNumber = (element) => element.id = 328;
        const cateLevel2 = categories.data.categories.filter(element => element.parentId == 328)
        let cate2Id = [], cate3Id = [];
        cateLevel2.forEach(item => {
            cate2Id.push(item.id)
        });
        for (let index = 0; index < cate2Id.length; index++) {
            const cate3tmp = categories.data.categories.filter(element => element.parentId == cate2Id[index]);
            cate3tmp.forEach(item => {
                cate3Id.push(item.id)
            });
        }
        let products: any = await ChozoiProductModel.find({ "category.id": { $in: cate3Id }, state: "DRAFT" }).select("_id , shop_id");
        while (products.length > 0) {
            const shopId = products[0].shop_id;
            await ChozoiShopModel.updateOne({ _id: shopId }, { category_shop: categoryShop });
            const newProductsArr = products.filter(item => item.shop_id != shopId);
            products = newProductsArr;
        }
    } catch (e) {
        console.log(e);

    }

}