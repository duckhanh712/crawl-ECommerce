
const baseDir = process.cwd() + '/uploads/';
export const upfileEmail = (req) =>{
    let file = req.files.file;
    const fileName = file.name
    file.mv(baseDir + fileName);
    return fileName;
}
export default (req) => {
    const start = Date.now()
    let file = req.files.file;
    const fileName = `${start}_${file.name}`
    file.mv(baseDir + fileName);
    return fileName;
}

