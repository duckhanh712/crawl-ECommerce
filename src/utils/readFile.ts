import ExcelJS from 'exceljs';
// import ExcelJS, { Row, Worksheet } from 'exceljs';
const baseDir = process.cwd() + '/uploads/';

export const readFileMail = async (fileName) => {
    const shops = [];
    var workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(baseDir + fileName)
        .then(function () {
            var worksheet = workbook.getWorksheet('Sheet1');
            worksheet.eachRow({ includeEmpty: true }, function (row) {
                const shop = {
                    shopId: row.values[1] as string,
                    email: row.values[2] as string,
                }
                shops.push(shop);
            });
        });

    return shops;
}
export default async (fileName) => {
    console.log('---------------------....', baseDir + fileName);
    const shopids = [];
    var workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(baseDir + fileName)
        .then(function () {
            var worksheet = workbook.getWorksheet('Sheet1');
            worksheet.eachRow({ includeEmpty: true }, function (row) {
                shopids.push(row.values[1])
    
            });
        });
    console.log(shopids);

    return shopids;
}
export const readFileSendoShop = async () => {
    const dir = `${process.env.PWD}/references/sendoShop.xlsx`;
    console.log(dir);
    const shops = [];
    var workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(dir)
        .then(function () {
            var worksheet = workbook.getWorksheet('shop thường');
            worksheet.eachRow({ includeEmpty: true }, function (row) {
                shops.push(row.values[1])
    
            });
        });
    return shops;
}

