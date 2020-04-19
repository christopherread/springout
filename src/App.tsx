import React, { lazy, Suspense, useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import './App.css';
import logo from './images/logo.png'
import { firebaseStore } from './firebase';
import * as _ from 'lodash';
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
              <Route path={'/into/:categoryId'} component={FacadePage} />

              <Route path={'/test'} component={Test}/>
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

interface FacadePageProps {
  match: {
      params: {
          categoryId: string;
      }
  };
}
interface categoryImages{
  [key:string]:string

}
const imagesDoc = (id: string) => firebaseStore.collection('images').doc(id);

const FacadePage = (props:FacadePageProps)=>{
  const [images,setImages]=useState(null as categoryImages|null);
  const [error,setError]=useState(null as Error|null);
    
  const category = props.match.params.categoryId;
  useEffect(()=>imagesDoc(category).onSnapshot(s=>setImages(s.data() as categoryImages), setError), [category]);
  if(error){
    return (
    <div>{error.message}</div>
    )
  }
  if(!images){
    return (
    <div>loading</div>
    )
  }
  


return(
<div>{_.map(images, url=><img key = {url} src = {url} alt = "thingy"/>) }</div>
)
}

const Welcome = () => {
  return (
    <div className="welcome">
      <h1>Welcome to Spring Out</h1>
      <div>An entry for the Together vs Virus 2020 Hackathon.</div>
    </div>
  )
}





const Test = () =>{
  return (
    <div>
      hello
    </div>
  )
}
export default App;
