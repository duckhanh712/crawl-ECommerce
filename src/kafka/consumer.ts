// import { Kafka } from 'kafkajs';
// import { SchemaRegistry, AvroKafka } from '@ovotech/avro-kafkajs';
// import { ProductMessage } from '../interfaces/kafka';
// import { Schema } from 'avsc';
// import shopeeProductIdSchema from '../models/shopeeProduct';

// // select itemid, shopid

// //const itemId = shopeeProductIdSchema.find().where('shopee_product_ids');
//     //query with mongoose
//     var query = shopeeProductIdSchema.find({}).select('*');

//     query.exec(function (err, someValue) {
//         if (err) console.log(err);
//         console.log(someValue);
//     });


// const ProductShema: Schema = {
//     type: 'record',
//     name: 'ProductMessage',
//     fields: [{
//         name: 'field1',
//         type: 'string'
//     }]
// }
// console.log('------------------------------------------------------------------')
// const main = async () => {
//     const schemaRegistry = new SchemaRegistry({ uri: 'http://localhost:8081' });
//     const kafka = new Kafka({ brokers: ['localhost:9092'] });
//     const avroKafka = new AvroKafka(schemaRegistry, kafka);

//     // producer

//     const producer = avroKafka.producer();
//     let connected = false;
//     while (!connected) {
//         try {
//             await producer.connect();
//             await producer.send<ProductMessage>({
//                 topic: 'product_Shopee',
//                 schema: ProductShema,
//                 messages: [{ value: { field1: 'khuat duc khanh' } }],
//             });
//             connected = true;
//         }
//         catch (e) {
//             console.log(e);
//         }
//     }

// };
// export default main;

