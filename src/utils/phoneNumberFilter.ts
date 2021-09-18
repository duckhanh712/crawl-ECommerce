const phoneNumberRegex = /(?:\+?(\d{1,4}))?[-. (]*(\d{2,4})[-. )]*(\d{2,4})[-. ]?(\d{2,4})[-. ]?(\d{2,4})(?: *x(\d+))?/g;
const phoneNumberFilter = /\D/g;

export const filterMorePhoneNumbers = (description: string, phoneNumSet) => {
    let phoneMatches = description.match(phoneNumberRegex);
    if (phoneMatches) {
        phoneMatches.forEach(phone => {
            phoneNumSet.add(phone.replace(phoneNumberFilter, ''));
        });
    }
}

export default (description: string) => {
    let phoneNumSet = new Set();
    let phoneMatches;
    try {
        phoneMatches = description.match(phoneNumberRegex);
    }
    catch (_e) {
        return [];
    }

    if (phoneMatches) {
        phoneMatches.forEach(phone => {
            phoneNumSet.add(phone.replace(phoneNumberFilter, ''));
        });
    }

    return [...phoneNumSet];
};