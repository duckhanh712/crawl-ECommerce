const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi;

export const filterMorePhoneEmails = (description: string, emailSet) => {
    let emailMatches = description.match(emailRegex);
    if (emailMatches) {
        emailMatches.forEach(email => {
            emailSet.add(email);
        })
    }
}

export default (description: string) => {
    let emailSet = new Set();
    let emailMatches = [];

    try {
        emailMatches = description.match(emailRegex);
    }
    catch (e) {
        return [];
    }

    if (emailMatches) {
        emailMatches.forEach(email => {
            emailSet.add(email);
        })
    }
    return [...emailSet];
}