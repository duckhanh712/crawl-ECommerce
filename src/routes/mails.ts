import express, { Request, Response, Router } from 'express';
import ChozoiShopModel from '../models/chozoiShop';
import MailManagementModel from '../models/mailManagement';
import { upfileEmail } from '../utils/uploadFile';
import { readFileMail } from '../utils/readFile';
import LogCalling from '../models/logCalling';
import { verifyToken } from '../utils/gentokenJwt';
import StateSentMailSModel from '../models/stateSentMail';
import { CHOZOI_API } from '../constants/api';
import axios from 'axios';
import schedule from 'node-schedule';

const router: Router = express.Router();

//get manager mail
router.get('/manage', (req: Request, resp: Response) => {
    let filters: any = {};

    try {
        let page: number = req.query.page ? parseInt(req.query.page as string) : 1;
        let limit: number = req.query.limit ? parseInt(req.query.limit as string) : 10;
        let paginateOpts = {
            sort: { updated_at: -1 },
            page,
            limit
        };

        MailManagementModel.paginate(filters, paginateOpts)
            .then(result => [
                resp.send({
                    data: result.docs,
                    filters,
                    pagination: {
                        page: result.page,
                        page_size: result.limit,
                        total_pages: result.totalPages,
                        total_elements: result.totalDocs
                    }
                })
            ])
            .catch(_e => {
                resp.send({
                    data: [],
                    filters,
                    pagination: {
                        page: 0,
                        page_size: 0,
                        total_pages: 0,
                        total_elements: 0
                    }
                });
            });
    }
    catch (e) {
        resp.send({
            data: [],
            filters,
            pagination: {
                page: 0,
                page_size: 0,
                total_pages: 0,
                total_elements: 0
            }
        });
    }
})

router.get('/shops', (req: Request, resp: Response) => {
    let filters: any = {};
    const firstLogin: boolean = req.body.first_login;
    if(firstLogin){
        filters.first_login = firstLogin
    }
    try {
        let page: number = req.query.page ? parseInt(req.query.page as string) : 1;
        let limit: number = req.query.limit ? parseInt(req.query.limit as string) : 10;
        let paginateOpts = {
            sort: { updated_at: -1 },
            page,
            limit
        };

        StateSentMailSModel.paginate(filters, paginateOpts)
            .then(result => [
                resp.send({
                    data: result.docs,
                    filters,
                    pagination: {
                        page: result.page,
                        page_size: result.limit,
                        total_pages: result.totalPages,
                        total_elements: result.totalDocs
                    }
                })
            ])
            .catch(_e => {
                resp.send({
                    data: [],
                    filters,
                    pagination: {
                        page: 0,
                        page_size: 0,
                        total_pages: 0,
                        total_elements: 0
                    }
                });
            });
    }
    catch (e) {
        resp.send({
            data: [],
            filters,
            pagination: {
                page: 0,
                page_size: 0,
                total_pages: 0,
                total_elements: 0
            }
        });
    }
})
// dowloads shops sent email
// router.get('/downloads/:file_id', ( req: Request, resp: Response) => {
//     const 
// })

// uploads file
router.post('/uploads', async (req: any, resp: Response) => {
    try {
        if (!req.files) {
            resp.send({
                status: false,
                message: 'No file uploaded'
            });
        }
        else {
            const fileName = await upfileEmail(req)
            const shops = await readFileMail(fileName);
            console.log('File name: ', fileName);
            let notEmail: number = 0;
            let totalShop;
            const data = [];
            for (let i = 1; i < shops.length; i++) {
                // console.log('shops[i]', shops[i]);

                const shopId = shops[i].shopId;
                const email = shops[i].email ? shops[i].email : null
                if (shopId == undefined && email == null) {
                    break;
                }
                if (email == null) {
                    notEmail += 1;
                }
                console.log(shops[i]);
                totalShop = i;
                const shop = await ChozoiShopModel.findByIdAndUpdate({ _id: shopId }, { email: email }, { new: true });
                if (!shop) {
                    resp.status(400).send({
                        message: 'Invalid shop by ID:' + shopId,
                    });
                    return;
                }

                const shopCurrent = await StateSentMailSModel.findById(shopId);

                if (!shopCurrent) {
                    await StateSentMailSModel.create({
                        _id: shop._id,
                        username: shop.username,
                        email: shop.email,
                        file_name: fileName,
                        password: shop.password


                    });

                }


                const responseShop = {
                    _id: shop._id,
                    username: shop.username,
                    email: shop.email
                }
                data.push(responseShop);
            }
            resp.send({
                file_name: fileName,
                no_email: notEmail,
                total_shop: totalShop,
                message: "The loop stops when the row in the .xlsx file hasn't data",
                shop: data
            })
        }
    }
    catch (error) {
        console.log('catch--------', error);

        resp.status(500).send(error);
    }
})

// send mail 

router.post('/send-mail', async (req: Request, resp: Response) => {
    const title: string = req.body.title;
    const template: string = req.body.template;
    const dateSent = req.body.date_sent;
    const fileName: string = req.body.file_name;
    const token = req.headers["x-chozoi-token"];
    const decoded: any = await verifyToken(token, resp);
    const sendMialUrl = `${CHOZOI_API}/v1/config/internal/email/send`;
    const date = new Date(dateSent)
    console.log(date);

    const now = Date.now()
    const file_id = `${now}${fileName}`;
    try {
        const shops: any = await StateSentMailSModel.find({ file_name: fileName });
        const total: number = shops.length;
        const date = new Date(dateSent);
        console.log('total', total);


        let sent: number = 0;
        const fileEmail = {
            _id: file_id,
            file_name: fileName,
            title,
            template,
            user: decoded.email,
            shop_quantity: total,
            date_sent: date
        }

        await MailManagementModel.create(fileEmail);
        console.log('fileEmail', fileEmail);
        
        resp.send({
            message: 'Sending...',
            file_name: fileName,
            title,
            template,
            total,
            date_sent: date

        });

        
        console.log('date',date);
        
        schedule.scheduleJob(date, async function () {
          
            for (let i = 0; i < shops.length; i++) {
                if (!shops[i].email) {
                    continue;
                }
                const sent_count = shops[i].sent_count
                const content = {
                    to: shops[i].email,
                    type: "OTP",
                    format: template,
                    data: {
                        email: shops[i].email,
                        username: shops[i].username,
                        password: shops[i].password,
                        welcome_link: "https://chozoi.vn/seller/welcome"
                    }
                }
    
    
                try {
                    const response = await axios.post(sendMialUrl, content)
                    if (response.status == 200) {
                        console.log('response', response.status);
                        sent += 1;
                        const progress = {
                            sent: sent,
                            total: total
                        }
                        await StateSentMailSModel.updateOne({ _id: shops[i]._id }, { sent_count: sent_count })
                        await MailManagementModel.updateOne({ _id: file_id }, { progress: progress });
                    }
    
                }
                catch (e) {
                    console.log(e);
    
                }
    
            }

        });

        



    }
    catch (e) {
        console.log(e);

    }
});

// status phone manage ---------------------------------
router.put('/phone-status', async (req: Request, resp: Response) => {
    const calling = req.body.calling;
    const shopId = calling.shop_id;
    if (!calling.shop_id) {
        resp.status(400).send({
            message: 'shop_id is required'
        });
        return;
    }

    try {

        const token = req.headers["x-chozoi-token"];
        const decoded: any = await verifyToken(token, resp);
        calling.user = decoded.email
        const shop = await ChozoiShopModel.updateOne({ _id: shopId }, { calling: calling }, { new: true });
        if (!shop) {
            resp.send({
                message: 'not shop_id: ' + calling.shop_id
            });
            return;
        }
        await LogCalling.create(calling);
        resp.send({
            message: 'Successfully'
        })
    }
    catch (e) {
        console.log(e);

    }

});

router.get('/phone-log/:shopId', async (req: Request, resp: Response) => {

    const shopId = req.params.shopId;

    try {


        const list = await LogCalling.find({ shop_id: shopId })

        resp.send({
            data: list
        });
    }
    catch (e) {
        resp.status(500).send(e)
    }

})

// update first login

router.put('/update/first-login', async (req: Request, resp: Response) => {
    const username = req.body.username;
    try {

        await StateSentMailSModel.updateOne({ username: username }, { first_login: true })
        resp.send('successfully.')
    }
    catch (e) {
        console.log(e);

    }

})

router.put('/update/open-mail', async (req: Request, resp: Response) => {
    const email = req.body.destination[0];
    const data =req.body
    console.log(data);
    
    try {

        await StateSentMailSModel.updateOne({ email: email },{ opened_mail: true });

        resp.send(data);
    }
    catch (e) {
        console.log(e);
        resp.status(400).send('failed');
    }

})

//--------------------------------------------------------------
export default router;