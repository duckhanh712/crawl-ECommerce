import { verifyToken } from '../utils/gentokenJwt';
import UsersModel from '../models/users';
export default async (req, resp, next) => {
    const token = req.headers["x-chozoi-token"];
    // if (req.path === '/v1/crawlers/shopee/dowload-file/raw') {
    //     console.log('req.path',req.path);
        
    //     next();
    // }
    console.log(req.path);
    
    const path = req.path.split('/');
    if (path[5] === 'preview' || req.path == `/v1/crawlers/shopee/download-file-log` || req.path == `/v1/crawlers/mail/update/first-login` || req.path == `/v1/crawlers/mail/update/open-mail`) {
        next();
    }
    else if (token) {
        try {
            const decoded: any = await verifyToken(token, resp);
            const user = await UsersModel.findOne({ email: decoded.email });
            if (user) {
                req.decoded = decoded;
                next();
            }
        } catch (error) {
            return resp.status(401).json({
                message: 'Unauthorized.',
            });
        }
    }
    else {
        return resp.status(403).send({
            message: 'No token provided.',
        });
    }
}


export const checkRoot = async (req, resp, next) => {
    const token = req.headers["x-chozoi-token"];

    if (token) {
        try {
            const decoded: any = await verifyToken(token, resp);
            const user = await UsersModel.findOne({ email: decoded.email });
            if (user.role !== 'ROOT') {
                return resp.status(405).json({
                    message: 'Do not authorization.',
                });
            }
            req.decode = decoded;
            next();
        } catch (error) {
            return resp.status(401).json({
                message: 'Do not authorization.',
            });
        }
    }
    else {
        return resp.status(401).send({
            message: 'Do not authorization.',
        });
    }
}