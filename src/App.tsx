import React from 'react';
import { BrowserRouter as Router, Route } from 'react-router-dom';
import './App.css';
import logo from './images/logo.png'
import AddToSlackButton from './slack/AddToSlackButton';
import SlackTeamLinked from './slack/SlackTeamLinked';

function App() {
  return (
    <Router>
      <div className="app">
        <header>
          <img src={logo} />
        </header>
        <div className="app-body">
          <Route path={'/slack/linked'}>
            <SlackTeamLinked />
          </Route>
          <AddToSlackButton />
        </div>
        <footer>
          <a href="mailto:info@springout.org">Contact</a>
          <a href="https://togethervsvirus.ca/">Together vs Virus Hackathon</a>
        </footer>
      </div>
    </Router>
  );
}

export default App;
