import * as admin from 'firebase-admin';

let auth: admin.auth.Auth;

export const init = (a: admin.auth.Auth) => {
    auth = a;
};

export const getUser = (userId: string) => {
    return admin.auth().getUser(userId);
}

export const getUserByEmail = (email: string) => {
    if (!email) {
        throw new Error(`email parameter is missing`);
    }

    return auth.getUserByEmail(email);
};

export const getOrCreateUser = async (email: string, name: string) => {
    if (!email) {
        throw new Error(`email parameter is missing`);
    }
    if (!name) {
        throw new Error(`name parameter is missing`);
    }

    try {
        const user = await auth.getUserByEmail(email);
        return {
            user,
            isNew: false
        }
    }
    catch (err) {
        console.log('creating new user', name, email);
        const newUser = await auth.createUser({
            email: email,
            displayName: name,
        });
        return {
            user: newUser,
            isNew: true
        }
    }
};