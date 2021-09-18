import express, { Request, Response, Router } from 'express';
import UsersModel from '../models/users';
import validator from 'validator';
import bcrypt from 'bcryptjs';
import genToken, { verifyToken } from '../utils/gentokenJwt';
import { checkRoot } from '../middleware/auth';
const router: Router = express.Router();


// register
router.post('/register', checkRoot, async (req: Request, resp: Response) => {
    const email: string = req.body.email;
    const name: string = req.body.name;
    const password: string = req.body.password;
    const role: string = req.body.role;
    if (!validator.isEmail(email)) {
        resp.status(400).send({
            error: 'Invalid Email address'
        })
        return;
    }
    const hashedPassword = bcrypt.hashSync(password, 12);
    const user = {
        name,
        email,
        role,
        password: hashedPassword,
    }
    try {
        await UsersModel.create(user).catch(_e => {
            resp.status(400).send(_e);
            return;
        });
        resp.status(201).send({
            message: 'successfully',
            name,
            email,
        })
    }
    catch (e) {
        resp.status(500).send(e);
    }
});
// login
router.post('/login', async (req: Request, resp: Response) => {
    const email: string = req.body.email;
    const password: string = req.body.password;
    try {
        const user = await UsersModel.findOne({ email: email });
        if (!user) {
            resp.status(400).send('account not found.');
            return;
        }
        console.log(user.status);
        if (user.status == 'INACTIVE') {
            const name = user.name
            resp.status(200).send({
                auth: false,
                message: "Account " + name + " is not allowed to operate!"
            })
            return;
        }

        const passwordIsValid = bcrypt.compareSync(password, user.password);
        if (!passwordIsValid) {
            resp.status(403).send({
                auth: false,
                message: "Invalid password",
                token: null
            })
            return;
        }

        const token = await genToken({ email: email });


        resp.status(200).send({

            auth: true,
            name: user.name,
            role: user.role,
            token,
            // refreshToken
        })
    } catch (error) {
        resp.status(500).send(error)
    }
})
// change  status ACTIVE
router.put('/user/block', checkRoot, async (req: Request, resp: Response) => {
    let status;
    const userId: string = req.body.user;
    const type: number = Number(req.body.type);
    console.log();
    
    try {

        if (type == 1) {
            status = 'ACTIVE';
        } else {
            status = 'INACTIVE';
        }

        await UsersModel.updateOne({ _id: userId }, { status });
        resp.status(200).send({
            message: status + ' successfully',
          
        })

    } catch (e) {
        resp.status(500).send(e);
    }



})

// me
router.get('/me', async (req: Request, resp: Response) => {
    const token = req.headers["x-chozoi-token"];
    if (!token) {
        resp.status(401).send({
            auth: false,
            message: "Unauthorized."
        })
    }
    const decoded: any = await verifyToken(token, resp);
    console.log(token);

    const user = await UsersModel.findOne({ email: decoded.email }, { password: 0 });
    resp.send({
        auth: true,
        user
    });


})

// list user
router.get('/users', checkRoot, async (req: Request, resp: Response) => {

    let filters: any = {}
    let page: number = req.query.page ? parseInt(req.query.page as string) : 1;
    let limit: number = req.query.limit ? parseInt(req.query.limit as string) : 10;
    let paginateOpts = {
        page,
        limit,
        select: "name email role _id status"
    };

    try {
        UsersModel.paginate(filters, paginateOpts)
            .then(shopResult => [
                resp.send({
                    data: shopResult.docs,
                    filters,
                    pagination: {
                        page: shopResult.page,
                        page_size: shopResult.limit,
                        total_pages: shopResult.totalPages,
                        total_elements: shopResult.totalDocs
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
    catch (error) {
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

// change password
router.put('/user/password', async (req: Request, resp: Response) => {
    const token = req.headers["x-chozoi-token"];
    const passwordOld: string = req.body.password_old;
    const passwordNew: string = req.body.password_new;
    const passwordConfirm: string = req.body.confirm_password;
    console.log(passwordOld, passwordNew);
    if( passwordNew != passwordConfirm ){
        resp.status(403).send({
            status: false,
            message: 'Confirmation password does not match'
        })
        return;
    }

    try {
        const decoded: any = await verifyToken(token, resp);
        const user = await UsersModel.findOne({ email: decoded.email });
        console.log(user);

        if (!user) {
            resp.status(403).send({
                status: false,
                message: 'Account not available.'
            })
            return;
        }
        const passwordIsValid = bcrypt.compareSync(passwordOld, user.password);

        if (!passwordIsValid) {
            resp.status(403).send({
                status: false,
                message: 'Invalid password.'
            })
            return;
        }

        const hashedPassword = bcrypt.hashSync(passwordNew, 12);
        await UsersModel.updateOne({ email: decoded.email }, { password: hashedPassword });
        resp.send({
            status: true,
            messgae: 'Successfully.',
        });

    }
    catch (err) {
        resp.status(500).send(err);

    }

})


// password reset

router.post('/user/reset-password', checkRoot, async (req: Request, resp: Response) => {
    const email: string = req.body.email;
    const password: string = req.body.password_new;
    try {
        const user = await UsersModel.findOne({ email: email });
        console.log('user', user);
        if (!user) {
            resp.status(403).send({
                status: false,
                message: `${email} is not an account.`
            })
            return;
        }

        const hashedPassword = bcrypt.hashSync(password, 12);
        await UsersModel.updateOne({ email: email }, { password: hashedPassword });
        resp.send({
            messgae: 'Successfully.',
            password: password,
        });

    }
    catch (error) {
        resp.status(500).send(error)
    }

})


export default router;