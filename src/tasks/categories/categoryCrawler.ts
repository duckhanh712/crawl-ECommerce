import ShopeeCategoryModel from '../../models/categoryShopee'

const crawlCategory =  async (categoryLink: string) => {
    
    try {
        const linkParts = categoryLink.split('.');
        let catName: string = decodeURI(linkParts[0]).slice(0, -4).replace(/-/g, ' ', );
        // TODO: Get pretty category name
        const category1 = linkParts[1];
        let
        catLevel: number = 1,
        category2: string,
        category3: string,
        _id: string = category1;

        if(linkParts.length == 4){
            category2 = linkParts[2];
            category3 = linkParts[3];
            _id = `${_id}.${category2}.${category3}`;
            catLevel = 3;
        }
        else if(linkParts.length == 3) {
            category2 = linkParts[2];
            _id = `${_id}.${category2}`;
            catLevel = 2;
        }
        
        // let category = {
        //     _id: nameCat,
        //     linkcat: linkCate,
        //     level1_id: level1,
        //     level2_id: level2,
        //     level3_id : level3
        // }
        // console.log(category);
        let category: any = await ShopeeCategoryModel.findById(_id);
        if(!category) {
            category = {
                _id,
                category_1: category1,
                category_2: category2,
                category_3: category3,
                name: catName,
                link: `https://shopee.vn/${categoryLink}`,
                level: catLevel
            }
            console.log(category);

            ShopeeCategoryModel.create(category).catch((_e) =>{}); 
        }
    }
    catch(e){
        console.log(e);
        
    }
}

export default crawlCategory;