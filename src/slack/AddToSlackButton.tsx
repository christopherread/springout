import React from 'react';
import './AddToSlackButton.css';

const slackScopes = [
    'im:write',
    'im:history',
    'users:read',
    'users:read.email',    
];

const slackClientId = '1034765018966.1094864824384';

const AddToSlackButton = () => {
  return (
    <a
        className="add-to-slack"
        href={`https://slack.com/oauth/v2/authorize?client_id=${slackClientId}&scope=${slackScopes.join(',')}`}
    >
      <img
        alt="Add to Slack"
        height="40"
        width="139"
        src="https://platform.slack-edge.com/img/add_to_slack.png"
        srcSet="https://platform.slack-edge.com/img/add_to_slack.png 1x, https://platform.slack-edge.com/img/add_to_slack@2x.png 2x"
      />
    </a>
  );
}

export default AddToSlackButton;