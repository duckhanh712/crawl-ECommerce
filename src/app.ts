import express from 'express';
import http from 'http';
import monogoose from 'mongoose';
import morgan from 'morgan';
import bodyParser from 'body-parser';
import cors from 'cors';
import fileUpload from 'express-fileupload';
import path from 'path';

// configs
const port = process.env.PORT || 3003
const app = express();
const server = http.createServer(app);


// db
const mongoSettings = {
    autoIndex: process.env.AUTO_INDEX === 'true' ? true : false,
    useNewUrlParser: true,
    useUnifiedTopology: true
};
monogoose.connect(process.env.MONGODB_URI, mongoSettings);
monogoose.Promise = global.Promise;
monogoose.connection.once('open', () => {
    // console.log('Connected to mongoDB!');
    // monogoose.connection.db.dropCollection('', function () {
    //     console.log('drop collection ! ');

    // });
    // monogoose.connection.db.dropCollection('', function () {
    //     console.log('drop collection sendo_shops! ');

    // });

});


// enable files upload
app.use(fileUpload({
    createParentPath: true
}));

// middlewares
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(morgan('dev'));

// routes
import authMiddleware from './middleware/auth';
import shopeeShopRoute from './routes/shopee/shop';
import shopeeProductRoute from './routes/shopee/product';
import authRoute from './routes/auth';
import sendMailRoute from './routes/mails';
import distributorRoute from './routes/distributors/index';
import wholesaleShopRoute from './routes/wholesales/shops';
import wholesaleProductRoute from './routes/wholesales/products';
import sendoRoute from './routes/sendo/shops';
import sendoProductsRoute from './routes/sendo/products';

app.use('/v1/crawlers/auth', authRoute);

// middleware routers
app.use(authMiddleware);
app.use('/v1/crawlers/distributor', distributorRoute);
app.use('/v1/crawlers/shopee', shopeeShopRoute);
app.use('/v1/crawlers/shopee', shopeeProductRoute);
app.use('/v1/crawlers/shopee/downloads', express.static(path.join(__dirname, '../downloads')))
app.use('/v1/crawlers/mail', sendMailRoute);
app.use('/v1/crawlers/wholesale', wholesaleShopRoute);
app.use('/v1/crawlers/wholesale', wholesaleProductRoute);
app.use('/v1/crawlers/sendo', sendoRoute);
app.use('/v1/crawlers/sendo', sendoProductsRoute);
// app.use('/v1/crawlers/products', productRoute);
// app.use('/v1/crawlers/shops', shopRoute);
// TODO: Schedule crawling tasks
// import crawl from './tasks/index1';
// crawl();

server.listen(port, () => {
    console.log('Server listening at port %d', port);
});

// handle uncaught exceptions
process.on('uncaughtException', err => {
    console.error('There was an uncaught error', err);
    // process.exit(1) //mandatory (as per the Node.js docs)
}) 