import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import * as slackApi from './slack/api';
import * as slackAuth from './slack/auth';

admin.initializeApp(functions.config().firebase);

// init any modules as required
slackApi.init(functions.config().slack);
slackAuth.init(admin.firestore());

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

// called when someone installing the Spring Out all into 
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

    await slackAuth.exchangeCodeForToken(code);

    res.redirect("https://springout.org/slack/linked");
});
