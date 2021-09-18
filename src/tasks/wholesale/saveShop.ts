import WholesaleModel from '../../models/wholesaleShop';
import { getLocationTTS } from '../../utils/zasi';
import filterEmails from '../../utils/emailFilter';
import { Platforms } from '../../constants/common';

const replacer = /hitruongsi/g;
export const createShop = async (data,phones,shopUrl) => {

    try {
        const address = await getLocationTTS(data.addressString);
        const emails = await filterEmails(data.shopDescription);
        const description = !data.shopDescriptions ? '' : data.shopDescriptions.replace(replacer, 'zasi');
        const sort_description = !data.description ? '' : data.description.replace(replacer, 'zasi');
        const shop = {
            _id: `${Platforms.tts}.${phones[0]}`,
            name: data.shopName,
            emails: emails,
            address_detail: !data.addressDetail ? null : data.addressDetail,
            phone_number: phones[0],
            phone_numbers: phones,
            contact_name: data.contactName,
            avatar_url: data.shopAvatar,
            sort_description: sort_description,
            views: data.shopViews,
            followers: data.shopfollowers,
            product_crawler: 0,
            product_total: data.products,
            operation_time: data.operationTime,
            businessType: !data.businessType ? null : data.businessType,
            businessModel: !data.businessModel ? null : data.businessModel,
            tax_code: !data.taxCode ? null : data.taxCode ,
            area: !data.area ?  null : data.area ,
            industry: data.industry ? data.industry : null,
            images: (!data.images) ? null : data.images ,
            description: description,
            address: address,
            link: shopUrl
        }

        await WholesaleModel.create(shop);
    } catch (e) {
        console.log(e);

    }

}