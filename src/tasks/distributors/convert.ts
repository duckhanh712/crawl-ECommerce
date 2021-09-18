import DistributorModel from '../../models/distributors';
import filterUrl from '../../utils/urlFilter'
import filterEmail from '../../utils/emailFilter';

import { Platforms } from '../../constants/common';

const TIMNHAPHANPHOI_API = `https://timnhaphanphoi.vn`;


export default async (distributor, cat: string) => {
    try {
        const links = await filterUrl(distributor.content);
        const emails = await filterEmail(distributor.content);
        let category, contact_name;

        switch (cat) {
            case '/tim-nha-phan-phoi-thuc-pham': category = {
                category_name: 'Thực phẩm',
                cate_slug: cat
            }
                break;
            case '/tim-nha-phan-phoi-dien-may-cong-nghe': category = {
                category_name: 'Điện máy - công nghệ',
                cate_slug: cat
            }
                break;
            case '/tim-nha-phan-phoi-thoi-trang': category = {
                category_name: 'Thời trang',
                cate_slug: cat
            }
                break;
            case '/tim-nha-phan-phoi-suc-khoe-va-sac-dep': category = {
                category_name: 'Sức khỏe và sắc đẹp',
                cate_slug: cat
            }
                break;
            case '/tim-nha-phan-phoi-me-va-be': category = {
                category_name: 'Mẹ và bé',
                cate_slug: cat
            }
                break;
            case '/tim-nha-phan-phoi-nha-cua-va-doi-song': category = {
                category_name: 'Nhà cửa và đời sống',
                cate_slug: cat
            }
                break;
            case '/tim-nha-phan-phoi-sach-van-phong-pham': category = {
                category_name: 'Sách - văn phòng phẩm',
                cate_slug: cat
            }
                break;
            case '/tim-nha-phan-phoi-may-moc-thiet-bi-cong-nghiep': category = {
                category_name: 'Máy móc, Thiết bị công nghiệp',
                cate_slug: cat
            }
                break;
            case '/tim-nha-phan-phoi-o-to-xe-may': category = {
                category_name: 'Ô tô - xe máy',
                cate_slug: cat
            }
                break;
            case '/tim-nha-phan-phoi-xay-dung': category = {
                category_name: 'Xây dựng',
                cate_slug: cat
            }
                break;
            case '/tim-nha-phan-phoi-nong-nghiep': category = {
                category_name: 'Nông nghiệp',
                cate_slug: cat
            }
                break;
            case '/tim-nha-phan-phoi-y-duoc': category = {
                category_name: 'Y - Dược',
                cate_slug: cat
            }
                break;
            case '/tim-nha-phan-phoi-dich-vu': category = {
                category_name: 'Dịch vụ',
                cate_slug: cat
            }
                break;
            
        }

        const date: string = distributor.info[3];
        const check = date.search("-");
        if (check > 1) {
            contact_name = distributor.info[4];
        } else {
            contact_name = distributor.info[3];
        }

        const postId = distributor.info[0];
        let images = [];
        distributor.images.map((item, index) => {
            images.push({
                image_url: `${TIMNHAPHANPHOI_API}${item}`,
                sort: index
            });
        })
        const data = {
            _id: `${Platforms.npp}.${postId}`,
            title: distributor.title,
            industry: distributor.info[1],
            priority_area: distributor.info[2],
            phone: distributor.phone,
            images: images,
            links: links,
            emails: emails,
            content: distributor.content,
            category: category,
            contact_name

        }
        await DistributorModel.create(data).catch(_e => {
            console.log(_e);
        });
        // console.log(data);

    } catch (e) {
        console.log(e);
    }


}