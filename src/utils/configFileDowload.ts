import FileState from '../models/stateWriteFile';
import ChozoiShopModel from '../models/chozoiShop';
import schedule from 'node-schedule';
import path from 'path';
import fs from 'fs';
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

const rootPath: string = process.cwd();
const filePath = path.join(rootPath, 'downloads')




const convertedShop = [
    { id: '_id', title: 'ID' },
    { id: 'username', title: 'username' },
    { id: 'name', title: 'name' },
    { id: 'approve_state', title: 'approve_state' },
    { id: 'product_approve', title: 'product_approve' },
    { id: 'product_crawled', title: 'product_crawled' },
    { id: 'total_products', title: 'total_products' },
    { id: 'email', title: 'email' },
    { id: 'phone_numbers', title: 'phone_numbers' },
]

const writeFileShopConverted = async (shopType) => {
    let limit: number = 10, skip: number = 0;
    console.log('..........', shopType);

    try {
        let appendStatus = true;
        const fileStatus = await FileState.findOne({ type: shopType });
        if (fileStatus.skip == 0) {
            appendStatus = false;
        }
        skip = fileStatus.skip;
        const csvWriter = createCsvWriter({
            path: `${rootPath}/downloads/${shopType}-shops.csv`,
            header: convertedShop,
            append: appendStatus,
        });

        console.log('====================================================');

        if (shopType == 'converted') {
            let item = 9;
            console.log('sdadada', shopType);

            while (item == 9) {

                const shops: any = await ChozoiShopModel.find({}).limit(limit).skip(skip);
                item = shops.length;
                console.log('shoplength', shops.length);
                console.log('limit', limit, skip);
                for (let i = 0; i < shops.length; i++) {



                    console.log('shop name:', shops[i].name, 'type', shopType);

                    const data = [
                        {
                            _id: shops[i]._id,
                            username: shops[i].username,
                            approve_state: shops[i].approve_state,
                            product_approve: shops[i].product_approve,
                            product_crawled: shops[i].product_crawled,
                            total_products: shops[i].total_products,
                            name: shops[i].name,
                            email: shops[i].email ? shops[i].email : shops[i].emails[0],
                            phone_numbers: shops[i].phone_numbers ? shops[i].phone_number : shops[i].phone_numbers[0]

                        }
                    ];

                    try {
                        await csvWriter.writeRecords(data)
                            .then(() => {
                                console.log('...Done');
                            });
                    }
                    catch (e) {
                        console.log(e);

                    }
                }

                skip = skip + item;
            }
            await FileState.updateOne({ type: shopType }, { skip: skip })

        }
    }
    catch (e) {
        console.log(e);

    }
}


export default async () => {
    try {
        if (!fs.existsSync(filePath)) {
            fs.mkdirSync(filePath);
        }
    }
    catch (e) {
        console.log(e);
        return;
    }
    const data = [
        {
            _id: 2,
            skip: 0,
            limit: 10,
            type: 'converted'
        }
    ]
    const status = await FileState.find({ type: { $in: ['raw', 'converted'] } })
    // console.log(status);


    if (status.length == 0) {
        await FileState.create(data).catch(_e => { console.log(_e); });
    }
    
    // 0 0 */3 * * *
    // 0 0 */2 * * *
    // 42 * * * *
    const cronExpress = '0 0 */2 * * *';
    schedule.scheduleJob(cronExpress, function () {
        writeFileShopConverted('converted');
    });

}




