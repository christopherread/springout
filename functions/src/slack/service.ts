import * as admin from 'firebase-admin';
import * as _ from 'lodash';
import * as users from '../users';
import * as api from './api';
import * as slackAuth from './auth';
import { SpringOutMessage, SpringOutMessageType, Handler, HandleSlackEventCallback, SlackEventAppHomeOpened, SlackInteractionPayload, RunSlackInteraction } from '../types';
import { ActionsBlock, SectionBlock, Button } from '@slack/web-api';

let store: admin.firestore.Firestore;

export const init = (fs: admin.firestore.Firestore) => {
    store = fs;
};

const botMessagesRef = (id: string) => store.collection('botMessages').doc(id);
const slackUserRef = (userId: string) => store.collection('slackUsers').doc(userId);
const slackUserMessagesRef = (userId: string) => slackUserRef(userId).collection('messages').doc('home');
const slackUserTeamsRef = (userId: string) => slackUserRef(userId).collection('teams');
const slackUserTeamRef = (userId: string, teamId: string) => slackUserTeamsRef(userId).doc(teamId);
const slackUserChannelRef = (userId: string, teamId: string, channelId: string) => slackUserTeamRef(userId, teamId).collection('channels').doc(channelId);

interface BotMessageDoc {
    id: string;
    text: string;
    actions: string[];
    expected: string;
    next: {
        [action: string]: string;
    }
    ts: string;
}

interface UserMessagesDoc {
    responses: UserResponse[];
}

interface UserResponse extends BotMessageDoc {
    responseText: string;
    responseButton: string;
}

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
            return onHandleSlackEventCallback(msg as HandleSlackEventCallback);
        case "RunSlackInteraction":
            return onRunSlackInteraction(msg as RunSlackInteraction);
        default:
            return Promise.resolve();
    }
}

const onRunSlackInteraction = async (msg: RunSlackInteraction) => {
    const { user, team, action } = msg;

    if (!user || !user.id) {
        console.warn('slack service', 'invalid slack user', user);
        return;
    }

    const fbUser = await getUser({
        team_id: team.id,
        team_domain: team.domain,
        user_id: user.id
    });

    if (!fbUser) {
        return;
    }

    console.log('slack service', 'interaction received', msg);

    const token = await slackAuth.getBotToken(team.id);

    const start = (await botMessagesRef('start').get()).data() as BotMessageDoc;
        
    let responses: UserResponse[] = [];
    let lastResponse: UserResponse | null = null;

    const userMessagesRef = await slackUserMessagesRef(fbUser.uid).get();

    if (userMessagesRef.exists) {
        responses = (userMessagesRef.data() as UserMessagesDoc).responses;
        const last = responses?.pop();
        if (last) {
            lastResponse = last;
        }
    }

    if (!lastResponse) {
        const header: SectionBlock = {
            type: "section",
            text: {
                type: "mrkdwn",
                text: start.text
            }
        };

        const buttons: ActionsBlock = {
            type: "actions",
            elements: start.actions.map(toButton)
        };

        await api.directMessage({
            token,
            channel: user.id,
            text: start.text,
            blocks: [header, buttons]
        });

        responses.push({
            ...start,
            responseText: '',
            responseButton: ''
        });
    } else {

        lastResponse.responseButton = action;
        responses.push(lastResponse);

        const nextAction = lastResponse.next[action];
        if (!nextAction) {
            console.warn(`user responded ${action}, but dont know what to do next`, fbUser.uid);
            return;
        }

        const nextBotMsgRef = await botMessagesRef(nextAction).get();

        if (!nextBotMsgRef.exists) {
            throw new Error(`unknown botMessage: ${nextAction}`);
        }

        const nextBotMessage = nextBotMsgRef.data() as BotMessageDoc;

        const header: SectionBlock = {
            type: "section",
            text: {
                type: "mrkdwn",
                text: nextBotMessage.text
            }
        };

        const buttons: ActionsBlock = {
            type: "actions",
            elements: nextBotMessage.actions.map(toButton)
        };

        await api.directMessage({
            token,
            channel: user.id,
            text: nextBotMessage.text,
            blocks: [header, buttons]
        });

        responses.push({
            ...nextBotMessage,
            responseText: '',
            responseButton: ''
        });
    }

    // if cancelling, delete all the previous responses
    if (action === 'cancel') {
        responses = responses.slice(-1);
    }

    await slackUserMessagesRef(fbUser.uid).set({ responses });
}

const toButton = (a: string): Button => {
    return {
        type: "button",
        value: a,
        text: {
            type: "plain_text",
            text: a.replace('url_', ''),
            emoji: true,
        },
        style: a === 'ok' || a === 'restart' ? "primary" : undefined,
        url: a.startsWith('url_') ? `https://springout.org/into/${a.replace('url_', '')}` : undefined
    };
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

        const user = await getUser({
            user_id: callback.event.user,
            team_id: callback.team_id,
        });

        if (!user) {
            console.warn('slack service', 'no user found', callback.event.user);
            return;
        }

        const start = (await botMessagesRef('start').get()).data() as BotMessageDoc;

        const userMessagesRef = await slackUserMessagesRef(user.uid).get();
        let responses: UserResponse[] = [];

        let lastResponse: UserResponse | null = null;

        if (userMessagesRef.exists) {
            responses = (userMessagesRef.data() as UserMessagesDoc).responses;
            const last = responses?.pop();
            if (last) {
                lastResponse = last;
            }
        }

        if (!lastResponse) {
            const header: SectionBlock = {
                type: "section",
                text: {
                    type: "mrkdwn",
                    text: start.text
                }
            };

            const buttons: ActionsBlock = {
                type: "actions",
                elements: start.actions.map(toButton)
            };

            await api.directMessage({
                token,
                channel: callback.event.user,
                text: start.text,
                blocks: [header, buttons]
            });

            responses.push({
                ...start,
                responseText: '',
                responseButton: ''
            });
        } else {

            lastResponse.responseText = callback.event.text;
            responses.push(lastResponse);

            const nextAction = lastResponse.next['answer'];
            if (!nextAction) {
                console.warn(`user gave a text answer, but dont know what to do next`, user.uid);
                return;
            }

            await api.directMessage({
                token,
                channel: callback.event.user,
                text: `Answer: ${callback.event.text}`
            });

            const nextBotMsgRef = await botMessagesRef(nextAction).get();

            if (!nextBotMsgRef.exists) {
                throw new Error(`unknown botMessage: ${nextAction}`);
            }

            const nextBotMessage = nextBotMsgRef.data() as BotMessageDoc;

            const header: SectionBlock = {
                type: "section",
                text: {
                    type: "mrkdwn",
                    text: nextBotMessage.text
                }
            };

            const buttons: ActionsBlock = {
                type: "actions",
                elements: nextBotMessage.actions.map(toButton)
            };

            await api.directMessage({
                token,
                channel: callback.event.user,
                text: nextBotMessage.text,
                blocks: [header, buttons]
            });

            responses.push({
                ...nextBotMessage,
                responseText: '',
                responseButton: ''
            });
        }

        await slackUserMessagesRef(user.uid).set({ responses });
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

export const parseInteraction = (interaction: SlackInteractionPayload): RunSlackInteraction | undefined => {
    const action = _.first(interaction.actions);

    if (!action) {
        console.warn(`action undefined`)
        return undefined;
    }

    return {
        action: action.value,
        team: interaction.team,
        user: interaction.user,
    };
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
