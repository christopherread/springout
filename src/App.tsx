import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Route, Switch, Link } from 'react-router-dom';
import './App.css';
import logo from './images/logo.png'

const SlackLandingPage = lazy(() => import(/* webpackChunkName: 'SlackLandingPage' */ './slack/SlackLandingPage'));
const FacadePage = lazy(() => import(/* webpackChunkName: 'FacadePage' */ './FacadePage'));

function App() {
  return (
    <Router>
      <div className="app">
        <header>
          <Link to={'/'}>
            <img alt="logo" src={logo} />
          </Link>
          <div className="menu">
            <Link to="/into/cooking">Cooking</Link>
            <Link to="/into/cleaning">Cleaning</Link>
            <Link to="/into/gardening">Gardening</Link>
          </div>
        </header>
        <div className="app-body">
          <Suspense fallback={<div>Loading...</div>}>
            <Switch>
              <Route path={'/'} exact={true} component={Welcome} />
              <Route path={'/slack'} component={SlackLandingPage} />
              <Route path={'/into/:categoryId'} component={FacadePage} />
            </Switch>
          </Suspense>
        </div>
        <footer>
          <a href="mailto:info@springout.org">Contact</a>
          <Link to="/slack">Slack</Link>
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
