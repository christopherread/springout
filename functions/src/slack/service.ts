import * as admin from 'firebase-admin';
import * as users from '../users';
import * as api from './api';
import * as slackAuth from './auth';
import { SpringOutMessage, SpringOutMessageType, Handler, HandleSlackEventCallback, SlackEventAppHomeOpened } from '../types';

let store: admin.firestore.Firestore;

export const init = (fs: admin.firestore.Firestore) => {
    store = fs;
};

const slackUserRef = (userId: string) => store.collection('slackUsers').doc(userId);
const slackUserTeamsRef = (userId: string) => slackUserRef(userId).collection('teams');
const slackUserTeamRef = (userId: string, teamId: string) => slackUserTeamsRef(userId).doc(teamId);
const slackUserChannelRef = (userId: string, teamId: string, channelId: string) => slackUserTeamRef(userId, teamId).collection('channels').doc(channelId);

interface SlackUserDoc {
    userId: string;
    email: string;
}

interface SlackUserTeamDoc {
    teamId: string;
    teamDomain: string | null;
    slackUserId: string;
    displayName: string;
    realName: string;
    userName: string;
}

interface SlackUserChannelDoc extends SlackUserTeamDoc {
    responseUrl: string;
    channelId: string;
    channelName: string;
}

export const deleteUser = async (userId: string) => {
    console.log('slack service', 'deleting user', userId);
    await slackUserRef(userId).delete();
}

export const handle: Handler = (msg: SpringOutMessage, type: SpringOutMessageType) => {
    switch (type) {
        case "HandleSlackEventCallback":
            return onHandleSlackEventCallback(msg);
        default:
            return Promise.resolve();
    }
}

const onHandleSlackEventCallback = async (msg: HandleSlackEventCallback) => {
    const { callback } = msg;

    if (!callback.event) {
        throw new Error(`invalid event callback`);
    }

    if (callback.event.type === 'app_home_opened') {
        const appHomeOpened = callback.event as SlackEventAppHomeOpened;
        console.log('slack service', 'user opened app home', appHomeOpened.user);

        const user = await getUser({
            user_id: appHomeOpened.user,
            team_id: callback.team_id,
        });

        if (!user) {
            console.warn('slack service', 'no user found', appHomeOpened.user);
            return;
        }

        const token = await slackAuth.getBotToken(callback.team_id);

        await publishHomeView(appHomeOpened.user, user.uid, token);
        
    } else if (callback.event.type === 'message') {
        if (callback.event?.bot_id) {
            // ignore messages from bots, including ourselves
            return;
        }

        console.log('slack service', 'direct message received', callback.event);

        const token = await slackAuth.getBotToken(callback.team_id);

        await api.directMessage({
            token,
            channel: callback.event.user,
            text: `Hey <@${callback.event.user}>, how can I help?`
        });
    } else {
        console.warn('slack service', 'unknown event type', callback.event.type);
    }

}

const getUser = async (cmd: {
    user_id: string;
    team_id: string;
    team_domain?: string;
    channel_id?: string;
    channel_name?: string;
    response_url?: string;
}) => {
    const { user_id, channel_id, channel_name, response_url, team_domain, team_id } = cmd;

    const userToken = await slackAuth.getBotToken(team_id);
    const slackUser = await api.getUser({ user: user_id, token: userToken });

    if (!slackUser || !slackUser.user || !slackUser.user.id ||
        !slackUser.user.profile || !slackUser.user.profile.email ||
        !slackUser.user.profile.real_name) {
        console.warn('slack service', 'invalid slack user', user_id);
        return undefined;
    }

    const result = await users.getOrCreateUser(slackUser.user.profile.email, slackUser.user.profile.real_name);
    const userId = result.user.uid;

    if (result.isNew) {
        const botToken = await slackAuth.getBotToken(team_id);
        await api.directMessage({
            token: botToken,
            channel: user_id,
            text: `Welcome! I have created a new Spring Out account for you.`
        });
    }

    const userDoc: SlackUserDoc = {
        userId,
        email: slackUser.user.profile.email,
    };

    await slackUserRef(userId).set(userDoc);

    if (!team_id) {
        console.warn(`missing team_id for user`, user_id, userId);
        return result.user;
    }

    const teamDoc: SlackUserTeamDoc = {
        teamId: team_id,
        teamDomain: team_domain || '',
        slackUserId: user_id,
        displayName: slackUser.user.profile.display_name || '',
        userName: slackUser.user.name || '',
        realName: slackUser.user.profile.real_name,
    };

    await slackUserTeamRef(userId, team_id).set(teamDoc);

    if (!channel_id || !channel_name) {
        return result.user;
    }

    const channelDoc: SlackUserChannelDoc = {
        ...teamDoc,
        responseUrl: response_url || '',
        channelId: channel_id,
        channelName: channel_name,
    };
    await slackUserChannelRef(userId, team_id, channel_id).set(channelDoc);

    return result.user;
}

const publishHomeView = async (slackUserId: string, userId: string, botToken: string) => {
    console.log('slack service', `publishing home view`, userId);

    await api.publishView({
        token: botToken,
        user_id: slackUserId,
        view: {
            type: "home",
            blocks: [
                {
                    type: "section",
                    text: {
                        type: "mrkdwn",
                        text: "App home for Spring Out."
                    }
                },
                {
                    type: "divider",
                },
            ]
        }
    });
}
