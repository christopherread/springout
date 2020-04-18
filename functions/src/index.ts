import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import { PubSub } from '@google-cloud/pubsub';
import * as bus from './bus';
import * as users from './users';
import * as slackApi from './slack/api';
import * as slackAuth from './slack/auth';
import * as slackService from './slack/service';
import { SlackEventCallbackChallenge, SlackEventCallbackBody, ServiceName, SpringOutMessage, SpringOutMessageType, Handler, logHandler, HandleSlackEventCallback } from './types';

admin.initializeApp(functions.config().firebase);

// init modules as required
bus.init(new PubSub());
users.init(admin.auth());
slackApi.init(functions.config().slack);
slackAuth.init(admin.firestore());
slackService.init(admin.firestore());

// register handlers for our microservices
const handlers: Handler[] = [
    logHandler,
    slackService.handle,
]

// cast the message to the correct type and call handlers
const handleMessage = async (message: functions.pubsub.Message) => {
    const msg = message.json as SpringOutMessage;
    const t = message.attributes?.type as SpringOutMessageType;
    await callHandlers(msg, t);
}

// call each handler in-turn, catching any errors
const callHandlers = async (msg: SpringOutMessage, t: SpringOutMessageType) => {
    // tslint:disable-next-line: prefer-for-of
    for (let i = 0; i < handlers.length; i++) {
        try {
            await handlers[i](msg, t);
        } catch (err) {
            console.error(err);
        }
    }
}

// subscribe to messages for each microservice's topic
const slackTopic: ServiceName = 'slack';
export const onSlackMessage = functions.pubsub.topic(slackTopic).onPublish(handleMessage);

// // Start writing Firebase Functions
// // https://firebase.google.com/docs/functions/typescript
export const helloWorld = functions.https.onRequest((request, response) => {
    response.send("Hello from Spring Out!");
});

// called when someone installs Slack app from App Store
export const slackDirectInstall = functions.https.onRequest(async (req, res) => {
    console.log("slack direct install", req.query);
    const url = slackApi.getAuthorizeUrl();
    res.redirect(url);
});

// called when someone installing the Spring Out app into 
// their Slack workspace approves the requested Slack permission scopes
export const slackAuthCallback = functions.https.onRequest(async (req, res) => {
    console.log("slack auth callback", req.query);

    const code = req.query.code as string;
    // const state = req.query.state || null;
    const error = req.query.error;

    if (error) {
        console.error(error);
        res.redirect("https://springout.org");
        return;
    }

    // get the access tokens and save in our db
    await slackAuth.exchangeCodeForToken(code);

    // redirect them back to our site, with a nice message
    res.redirect("https://springout.org/slack/linked");
});

// called for specific events which we register for at https://api.slack.com/apps/
export const slackEvent = functions.https.onRequest(async (req, res) => {
    // check if it's a challenge
    const challenge = req.body as SlackEventCallbackChallenge;
    if (challenge.type === 'url_verification') {
        console.log('slack event challenge', challenge);
        res.status(200).json({
            challenge: challenge.challenge
        }).send();
        return;
    }
    
    // stick it on bus and handle it asynchronously,
    // so we don't get timeouts and slack trying to 
    // re-send us the same event multiple times
    console.log('slack event', req.body);
    const callback = req.body as SlackEventCallbackBody;
    const handleCallback: HandleSlackEventCallback = { callback };
    await bus.publish('slack', handleCallback, 'HandleSlackEventCallback');

    res.sendStatus(200);
});
