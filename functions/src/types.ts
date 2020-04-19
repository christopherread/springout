
// a handler is just a function which takes a message and returns a Promise
export type Handler = (msg: SpringOutMessage, type: SpringOutMessageType) => Promise<any>;

// special handler which just logs the message
export const logHandler: Handler = (msg, t) => { console.log(t, msg); return Promise.resolve(); }

// each microservice has a name
export type ServiceName = 
    | 'slack';

export interface HandleSlackEventCallback {
    callback: SlackEventCallbackBody;
}

export interface RunSlackInteraction {
    action: string;
    user: {
        id: string;
        username: string;
        name: string;
        team_id: string;
    };
    team: {
        id: string;
        domain: string;
    };
}

// and some message types
export type SlackMessage =
    | HandleSlackEventCallback
    | RunSlackInteraction;

export type SlackMessageType =
    | 'RunSlackInteraction'
    | 'HandleSlackEventCallback';

// create type will message types in it
export type SpringOutMessage =
    | SlackMessage;

export type SpringOutMessageType =
    | SlackMessageType

// https://api.slack.com/events-api
export interface SlackEventCallback {
    token: string;
    type: 'url_verification' | 'event_callback';
}

export interface SlackEventCallbackChallenge extends SlackEventCallback {
    challenge: string;
}

export interface SlackEventCallbackBody extends SlackEventCallback {
    event_id: string;
    event_time: number;
    team_id: string;
    api_app_id: string;
    authed_users: string[];
    event?: SlackEventCallbackBodyEvent
}

// https://api.slack.com/events
export interface SlackEventCallbackBodyEvent {
    type: 'app_home_opened' | 'message'
    event_ts: string;
    user: string;
    text: string;
    bot_id?: string;
}

// https://api.slack.com/events/app_home_opened
export interface SlackEventAppHomeOpened extends SlackEventCallbackBodyEvent {
    type: 'app_home_opened';
    user: string;
    channel: string;
    tab: string; // e.g. home
    view?: {
        id: string;
        team_id: string;
        type: string; // e.g. home
        blocks: any[];
        callback_id: string;
        state: object;
        hash: string;
        title: string;
        clear_on_close: boolean;
        notify_on_close: boolean;
        root_view_id: string;
        app_id: string;
        external_id: string;
        app_installed_team_id: string;
        bot_id: string;
    }
}

// https://api.slack.com/interactivity/slash-commands
export interface SlackInteractionPayload {
    type: string;
    response_url: string;
    user: {
        id: string;
        username: string;
        name: string;
        team_id: string;
    };
    team: {
        id: string;
        domain: string;
    };
    channel: {
        id: string;
        name: string;
    };
    actions: {
        action_id: string,
        block_id: string;
        text: {
            type: string;
            text: string;
            emoji: boolean;
        }
        style: string;
        value: string;
        type: string;
        action_ts: string;
    }[]
}