import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import './App.css';
import logo from './images/logo.png'

const SlackLandingPage = lazy(() => import(/* webpackChunkName: 'SlackLandingPage' */ './slack/SlackLandingPage'));

function App() {
  return (
    <Router>
      <div className="app">
        <header>
          <img alt="logo" src={logo} />
        </header>
        <div className="app-body">
          <Suspense fallback={<div>Loading...</div>}>
            <Switch>
              <Route path={'/'} exact={true} component={Welcome} />
              <Route path={'/slack'} component={SlackLandingPage} />
            </Switch>
          </Suspense>
        </div>
        <footer>
          <a href="mailto:info@springout.org">Contact</a>
          <a href="/slack">Slack</a>
          <a href="https://togethervsvirus.ca/">Together vs Virus Hackathon</a>
        </footer>
      </div>
    </Router>
  );
}

const Welcome = () => {
  return (
    <div className="welcome">
      <h1>Welcome to Spring Out</h1>
      <div>An entry for the Together vs Virus 2020 Hackathon.</div>
    </div>
  )
}

export default App;
