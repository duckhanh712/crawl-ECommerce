export const convertDate = (timestamp: number) =>  {
    var months_arr = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
    var date = new Date(timestamp);
    var year = date.getFullYear();
    var month = months_arr[date.getMonth()];
    var day = date.getDate();
    var convdataTime = `${year}-${month}-${day}`;
    return convdataTime;
}