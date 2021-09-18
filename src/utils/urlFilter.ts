const linkRegex = /(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})/gi;
export const filterUrl = (description: string, linkSet) => {
   
    let linkMatches = description.match(linkRegex);
    if (linkMatches) {
        linkMatches.forEach(email => {
            linkSet.push(email);
        })
    }
    console.log(linkSet);
    return 
}

export default (description: string) => {
    let linkSet = new Set();
    let linkMatches = [];
    try{
        linkMatches = description.match(linkRegex);
    }
    catch(e){
        return[];
    }

    if(linkMatches) {
        linkMatches.forEach(link => {
            linkSet.add(link);
        });
    }
    return[...linkSet];
}
 