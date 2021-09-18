import axios from 'axios';
import CategoryLeve3Model from '../../models/chozoicategorylevel3'

export default async () => {
    try {
        const url = `https://api.chozoi.com/v1/categories?level=3`;
        console.log(url);
        
        const categoriesReponse: any = await axios.get(url);
        
        const categories = categoriesReponse.data.categories
        
        let cate = categories.shift();
        while(cate) {
            const category = {
                _id: cate.id,
                parent_id: cate.parentId,
                level: cate.level,
                sort: cate.sort,
                name: cate.name,
                avatar_url: cate.avatarUrl,
                description: cate.description
            }
            try{
                await CategoryLeve3Model.create(category);
            }
            catch(e){
                console.log(e);
                
            }
            cate = categories.shift();
        }

    }
    catch (e) {
        console.log(e);

    }
}
