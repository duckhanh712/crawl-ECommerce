import ZasiCategoriesmodel from '../models/zasiCategoires';
import axios from 'axios';
import AddressModel from '../models/address';
import DistrictModel from '../models/district';
import { CHOZOI_API, ZASI_API } from '../constants/api';

export const getCategory = async (catName) => {
    let category
    try {

        const categorydata: any = await ZasiCategoriesmodel.find({ $text: { $search: catName } }, { score: { $meta: 'textScore' } })
            .sort({ score: { $meta: 'textScore' } })
            .limit(1);
        category = {
            category_name: categorydata[0].name,
            category_id: categorydata[0]._id
        }


    } catch (error) {
        console.log(error);

    }


    return category;
}
export const getLocationTTS = async (place) => {
    let address;
    try {
        console.log(place);
        let province_id: number;
        let district_id: number;
        let ward_id: Number;
        let address_detail: string;

        const district_name = place.split(',')[0];
        const province_name = place.split(',')[1];
        const proAdrs: any = await AddressModel.findOne({ $text: { $search: province_name } }, { score: { $meta: 'textScore' } }).sort({ score: { $meta: 'textScore' } }).limit(1);
        province_id = Number(proAdrs.cz_id);
        const disAdrs: any = await DistrictModel.find({ $text: { $search: district_name } }, { score: { $meta: 'textScore' } }).sort({ score: { $meta: 'textScore' } }).limit(2);
        const result = disAdrs.find(item => item.province_id === province_id);
        district_id = result._id;
        const apiUrl = `${CHOZOI_API}/v1/wards?districtId=${district_id}`;
        const wardResponse: any = await axios.get(apiUrl, { timeout: 10000 });
        const ward = wardResponse.data.wards[0];
        ward_id = ward.id;
        address_detail = `${ward.wardName}, ${district_name}, ${province_name}`;
        console.log(province_id, district_id, ward_id, address_detail);
        address = {
            province: {
                province_id: province_id,
                province_name: province_name
            },
            district: {
                district_id: district_id,
                district_name: district_name
            },
            ward: {
                ward_id: ward_id,
                ward_name: ward.wardName
            },
            address_detail: address_detail
        }
        // console.log(address);

        return address;

    } catch (e) {
        let province_id: number;
        let district_id: number;
        let ward_id: Number;
        let address_detail: string;
        province_id = 24; //thành phố Hà Nội
        district_id = 9; //quận Thanh Xuân
        ward_id = 123;  // phường Phương Liệt
        address_detail = 'Số 272 Phố Nguyễn Lân, Phường Phương Liệt, Quận Thanh Xuân, Thành phố Hà Nội';
        console.log(province_id, district_id, ward_id, address_detail);
        address = {
            province: {
                province_id: province_id,
                province_name: 'Thành phố Hà Nội'
            },
            district: {
                district_id: district_id,
                district_name: 'Quận Thanh Xuân'
            },
            ward: {
                ward_id: ward_id,
                ward_name: 'Phường Phương Liệt'
            },
            address_detail: address_detail
        }
        console.log(e)
        return address
    }
}
export const loginZS = async (username: string, passsword: string) => {

    let token;
    try {
        const LOGIN_URL = `${ZASI_API}/v1/auth/login`;
        const data = {
            username: username,
            password: passsword,
            type: "normal"
        }

        const response = await axios.post(LOGIN_URL, data);
        token = token = response.data.data.accessToken;

    } catch (error) {
        console.log(error);
        token = '';
    }

    return token;
}
export default async () => {
    try {
        const catApi = `https://dev.api.zasi.vn/v1/product/category`;
        const responseCat = await axios.get(catApi);
        const categorires = responseCat.data.categories;
        let cate = categorires.shift();
        while (cate) {
            if (cate.level == 2) {
                const category = {
                    _id: Number(cate.id),
                    parent_id: Number(cate.parentId),
                    level: Number(cate.level),
                    sort: Number(cate.sort),
                    name: cate.name,
                }
                console.log(cate.name);
                await ZasiCategoriesmodel.create(category);
            }
            cate = categorires.shift();
        }

    } catch (error) {
        console.log(error);

    }

}