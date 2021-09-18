import ExcelJS, { Row, Worksheet } from 'exceljs';
import CategoriesSendoMapModel from '../../models/Sendocategories';


const dir = `${process.env.PWD}/references/chozoi_cate_1.xlsx`
export const readEXCEL = async () => {
    let workBook = new ExcelJS.Workbook();
    workBook.xlsx.readFile(dir)
        .then(workBook => {
            let ws: Worksheet = workBook.getWorksheet('Query result');
            saveCategoryMapping(ws);
        })
        .catch(e => {
            console.log(e);
        })



}

const saveCategoryMapping = async (ws: Worksheet) => {
    let x: number;
    for (x = 2; x < 705; x++) {
        let row: Row = ws.getRow(x);
        let cz_category_id: string = row.getCell(1).value as string;
        let name: string = row.getCell(2).value as string;
        let level: number = Number(row.getCell(5).value)
        let y: number = 8;
        while (true) {
            if (row.getCell(y).value) {
                let _id: string = row.getCell(y).value as string;
                console.log(_id);
                try {
                    await CategoriesSendoMapModel.create({
                        _id,
                        cz_category_id,
                        level,
                        name
                    });
                }
                catch (e) {
                    console.log('duplicate key: ', _id);
                }
                y++;
            }
            else
                break;
        }

    }
}