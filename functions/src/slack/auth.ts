import * as admin from 'firebase-admin';
import * as api from './api';

let store: admin.firestore.Firestore;

const storeRef = () => {
    if (!store) {
        throw new Error('slackAuth store not initialized')
    }
    return store
}

const slackAuthRef = (teamId: string) => storeRef().collection('slackAuth').doc(teamId);
const slackAuthUserRef = (teamId: string, userId: string) => slackAuthRef(teamId).collection('users').doc(userId);

export const init = (fs: admin.firestore.Firestore) => {
    store = fs;
};

export const exchangeCodeForToken = async (code: string) => {
    console.log('slackAuth', 'received auth code');

    const auth = await api.oauthAccess({ code });

    if (!auth.ok) {
        throw new Error(`oauth acesss error: ${auth.error}`);
    }

    if (!auth.authed_user) {
        throw new Error(`missing team`);
    }

    console.log('slackAuth', 'team authorized', auth);

    await slackAuthRef(auth.team.id).set(auth);

    if (auth.authed_user) {
        await slackAuthUserRef(auth.team.id, auth.authed_user.id).set(auth.authed_user);
    }
}

export const getBotToken = async (teamId: string) => {
    const doc = await slackAuthRef(teamId).get();

    if (!doc.exists) {
        throw new Error(`missing auth for ${teamId}`);
    }

    const auth = doc.data() as api.SlackOAuthAccessResponse;

    return auth.access_token;
}
