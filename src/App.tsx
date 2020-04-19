import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Route, Switch, Link } from 'react-router-dom';
import './App.css';
import logo from './images/logo.png';
import svg1 from './images/1.svg';
import svg4 from './images/4.svg';
import svg5 from './images/5.svg';

const AboutPage = lazy(() => import(/* webpackChunkName: 'AboutPage' */ './AboutPage'));
const SlackLandingPage = lazy(() => import(/* webpackChunkName: 'SlackLandingPage' */ './slack/SlackLandingPage'));
const FacadePage = lazy(() => import(/* webpackChunkName: 'FacadePage' */ './FacadePage'));

function App() {
  return (
    <Router>
      <div className="app">
        <a className="escape" href="https://google.com">X</a>
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
              <Route path={'/about'} component={AboutPage} />
              <Route path={'/into/:categoryId'} component={FacadePage} />
            </Switch>
          </Suspense>
        </div>
        <footer>
          <a href="mailto:info@springout.org">Contact</a>
          <Link to="/about">About</Link>
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
      <h1>Canada's domestic violence problem was already critical. Covid-19 is making it worse.</h1>
      <h4>We're here to help</h4>
      <div>SpringOut puts new domestic-abuse victims in touch with Employee Assistance Programs (EAP) through their everyday remote-working tool - Slack.</div>
      <div>
        <img alt="people helping each other" style={{ width: '30vw', maxWidth: '250px', margin: '20px' }} src={svg1} />
      </div>
      <a className="get-button" href="mailto:info@springout.org?subject=Get">Get Spring Out</a>
      <h2>Employers</h2>
      <div>Check out our Slack bot <Link to={'/slack'}>here</Link>.</div>
      <h2>How it works</h2>
      <div>
        <img alt="shaking hands" src={svg4} />
        <img alt="clock" src={svg5} />
      </div>
      <div>
        1. Company installs Slack bot as a discrete resource for employees.<br /><br />
        2. Employees interact with Slack bot.<br /><br />
        3. EAP or other help org receives triaged info and contact details by email.<br /><br />
      </div>
      <h2>Features</h2>
      <div>
        - Interactive conversational Slack bot.<br /><br />
        - Automatic email with basic info.<br /><br />
        - Facade sites disguised as common activity pages for DV victim to browse safely.<br /><br />
        - Dynamic generated facade sites based on interests.<br /><br />
        - Floating escape button that takes you to google.com.<br /><br />
      </div>
    </div>
  )
}

export default App;
