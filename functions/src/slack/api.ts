import * as functions from 'firebase-functions';
import * as crypto from 'crypto';
import * as qs from 'qs'; // used for signature verification
import * as querystring from 'querystring'; // default
import {
    WebClient,
    UsersInfoArguments,
    ChatPostMessageArguments,
    ConversationsOpenArguments,
    WebAPICallResult,
    ConversationsJoinArguments,
    ViewsOpenArguments,
    ViewsUpdateArguments,
    ViewsPublishArguments,
    ChatUpdateArguments,
    ChatDeleteArguments,
} from '@slack/web-api';
import axios from 'axios';

let clientId = '';
let clientSecret = '';
let signingSecret = '';

const scope = [
    'im:write',
    'im:history',
    'users:read',
    'users:read.email',    
];

const web = new WebClient();

export const init = (config: any) => {
    // https://firebase.google.com/docs/functions/config-env
    clientId = config.client_id;
    clientSecret = config.client_secret;
    signingSecret = config.signing_secret;
}

// https://api.slack.com/types/user
export interface SlackUser extends WebAPICallResult {
    user?: {
        id: string,
        team_id: string,
        name: string,
        deleted: boolean,
        color: string,
        real_name: string,
        tz: string,
        tz_label: string,
        tz_offset: number,
        profile: {
            real_name: string,
            email: string,
            display_name: string,
            team: string,
        },
        is_admin: boolean,
        is_owner: boolean,
        is_bot: boolean,
        is_restricted: boolean,
    }
}

export interface SlackConversation extends WebAPICallResult {
    no_op: boolean;
    already_open: boolean;
    warning: string;
    channel: {
        id: string;
        name: string;
        created: number;
        is_im: boolean;
        is_channel: boolean,
        is_group: boolean,
        is_org_shared: boolean;
        user: string;
        last_read: string;
        latest: string;
        unread_count: number;
        unread_count_display: number;
        is_open: boolean;
        priority: number
    }
}

export interface SlackPostMessageResult extends WebAPICallResult {
    channel: string;
    ts: string;
    message: {
        text: string;
        username: string;
        bot_id: string;
        attachments: [
            {
                text: string;
                id: number;
                fallback: string;
            }
        ];
        type: string;
        subtype: string;
        ts: string;
    }
}

export interface SlackViewReponse extends WebAPICallResult {
    view: {
        id: string,
        team_id: string,
    }
}

export interface SlackOAuthAccessResponse extends WebAPICallResult {
    access_token: string;
    token_type: string; // e.g. bot
    scope: string;
    bot_user_id: string;
    app_id: string;
    team: {
        name: string;
        id: string;
    };
    enterprise: {
        name: string;
        id: string;
    };
    authed_user: {
        id: string;
        scope: string;
        access_token: string;
        token_type: string; // e.g. user
    };
}

// https://api.slack.com/authentication/verifying-requests-from-slack
// https://medium.com/@rajat_sriv/verifying-requests-from-slack-using-node-js-69a8b771b704
export const verify = (req: functions.https.Request) => {
    const body = qs.stringify(req.body, { format:'RFC1738' });
    const tsHeaderKey = 'x-slack-request-timestamp';
    const sigHeaderKey = 'x-slack-signature';
    const tsHeaderVal = req.header(tsHeaderKey);
    const sigHeaderVal = req.header(sigHeaderKey);

    if (!tsHeaderVal) {
        console.error('slackApi verify', `error: missing header ${tsHeaderKey}`);
        return false;
    }

    if (!sigHeaderVal) {
        console.error('slackApi verify', `error: missing header ${sigHeaderKey}`);
        return false;
    }

    const timestamp = parseInt(tsHeaderVal);

    if (timestamp <= 0) {
        console.error('slackApi verify', `error: invalid header ${tsHeaderKey}: ${tsHeaderVal}`);
        return false;
    }

    const time = Math.floor(new Date().getTime() / 1000);
    if (Math.abs(time - timestamp) > 60 * 5) {
        console.error('slackApi verify', `error: old timstamp ${tsHeaderKey}: ${tsHeaderVal}`);
        return false;
    }

    const sigBasestring = `v0:${timestamp}:${body}`;
    const digest = crypto.createHmac('sha256', signingSecret)
        .update(sigBasestring, 'utf8')
        .digest('hex');

    const signature = `v0=${digest}`;

    if (crypto.timingSafeEqual(
        Buffer.from(signature, 'utf8'),
        Buffer.from(sigHeaderVal, 'utf8'))) {
        console.log('slackApi verify', 'success');
        return true;
    }

    console.error('slackApi verify', `error: signatures aren't equal`, body);
    return false;
}

// https://api.slack.com/authentication/oauth-v2
export const getAuthorizeUrl = () => {
    return 'https://slack.com/oauth/v2/authorize?' +
        querystring.stringify({
            client_id: clientId,
            scope: scope.join(','),
        });
}

// https://api.slack.com/methods/oauth.v2.access
export const oauthAccess = async (args: { code: string, redirect_uri?: string }) => {
    const response = await web.oauth.v2.access({
        ...args,
        client_id: clientId,
        client_secret: clientSecret,
    });

    return response as SlackOAuthAccessResponse;
}

// https://api.slack.com/interactivity/slash-commands#responding_to_commands
export const respond = async (url: string, data: Partial<ChatPostMessageArguments>) => {
    console.log('slackApi respond', url, data);

    const response = await axios({
        method: 'POST',
        url: url,
        data: data,
        headers: {
            'Context-type': 'application/json'
        }
    });

    console.log('slackApi response', response.data);

    return response.data;
}

// https://api.slack.com/methods/users.info
export const getUser = async (args: UsersInfoArguments) =>
    (await (new WebClient(args.token)).users.info(args)) as SlackUser;

// https://api.slack.com/methods/chat.postMessage
export const postMessage = async (args: ChatPostMessageArguments) =>
    (await (new WebClient(args.token)).chat.postMessage(args)) as SlackPostMessageResult;

export const updateMessage = async (args: ChatUpdateArguments) =>
    (await (new WebClient(args.token)).chat.update(args));

export const deleteMessage = async (args: ChatDeleteArguments) =>
    (await (new WebClient(args.token)).chat.delete(args));

export const directMessage = async (args: ChatPostMessageArguments) => {
    const client = new WebClient(args.token);

    // open a conversation with user, assuming args.channel is their user_id
    const conversation = await client.conversations.open({ users: args.channel });

    // send a private message to this conversation
    const result = await client.chat.postMessage({
        ...args,
        channel: (conversation as SlackConversation).channel.id
    });
    result as SlackPostMessageResult;
}

// https://api.slack.com/methods/conversations.open
export const openConversation = async (args: ConversationsOpenArguments) =>
    (await (new WebClient(args.token)).conversations.open(args)) as SlackConversation;

// https://api.slack.com/methods/conversations.join
export const joinConversation = async (args: ConversationsJoinArguments) =>
    (await (new WebClient(args.token)).conversations.join(args)) as SlackConversation;

// https://api.slack.com/surfaces/tabs/using
export const publishView = async (args: ViewsPublishArguments) => {
    (await (new WebClient(args.token)).views.publish(args)) as SlackViewReponse;
}

export const updateView = async (args: ViewsUpdateArguments) => {
    (await (new WebClient(args.token)).views.update(args)) as SlackViewReponse;
}

export const openView = async (args: ViewsOpenArguments) => {
    (await (new WebClient(args.token)).views.open(args)) as SlackViewReponse;
}

