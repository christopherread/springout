import React from 'react';
import './SlackLandingPage.css';
import { Route } from 'react-router-dom';
import SlackTeamLinked from './SlackTeamLinked';
import AddToSlackButton from './AddToSlackButton';

const SlackLandingPage = () => {
    return (
        <div className="slack-landing-page">
            <Route path={'/slack/linked'}>
                <SlackTeamLinked />
            </Route>
            <AddToSlackButton />
            <p>Click to add our Slack bot to your workspace.</p>
        </div>
    );
}

export default SlackLandingPage;