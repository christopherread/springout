This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

This project uses [Firebase](https://firebase.google.com/).

The live website is deployed [here](https://springout.org/).

## Pre-requisites

You need node, yarn, and npm installed on your machine.

### git clone https://github.com/christopherread/springout.git

### `npm install`

Installs all the necessary packages for the project, including react-scripts.

### `npm install -g firebase-tools`

Install the Firebase CLI tools globally.

### `firebase login`

Logs into Firebase. This project requires a Firebase project to run.

Update src/firebase/firebase.cfg with the API keys for your Firebase project.

To communicate with external APIs (e.g. Slack), your Firebase project will be to be Blaze / PAYG paid tier.

### `yarn start`

Runs the app in the development mode.<br />
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.<br />
You will also see any lint errors in the console.

### `yarn build`

Builds the app for production to the `build` folder.<br />
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.<br />
Your app is ready to be deployed!

### `firebase deploy --only hosting`

Deploys the web app to Firebase hosting. It will deploy the last production build from your 'yarn build' command.

### `firebase deploy --only functions`

Deploys the back-end to Firebase. These are server-less functions
