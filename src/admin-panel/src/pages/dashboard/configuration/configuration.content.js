import React, { useState } from 'react';
import {
  toaster,
  Icon,
  Pane,
  Button,
  Heading,
  Tooltip,
  TextInputField,
} from 'evergreen-ui';

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

const Configuration = (props) => {
  const { user } = props;
  const {
    accountId,
    username,
  } = user;

  const [isUpdating, setIsUpdating] = useState(false);
  const metadata = [
    { name: 'coordinates_webhook', label: 'Coordinates shared', description: 'Triggered whenever a user shares their geolocation' },
    { name: 'new_conversation_webhook', label: 'New conversation', description: 'Triggered whenever there is a new conversation' },
    { name: 'new_file_in_conversation_webhook', label: 'File shared', description: 'Triggered whenever a user shares a media file' },
    { name: 'new_message_arrived_webhook', label: 'New message', description: 'Triggered whenever there is a new message' },
  ];

  const saveChanges = async () => {
    setIsUpdating(true);

    await sleep(2000);

    toaster.success('Saved changes!', {
      description: 'They may take a couple of minutes to take effect',
    });

    setIsUpdating(false);
  };

  return (
    <Pane>
      <Pane
        display="flex"
        flexDirection="row"
        justifyContent="space-between"
        width={650}
      >
        <Pane width={300}>
          <Heading size={700} marginBottom={16}>
            Account Details
          </Heading>

          <TextInputField
            disabled
            label="Username"
            value={username}
          />
          <TextInputField
            disabled
            label="Account Id"
            value={accountId}
          />
        </Pane>

        <Pane width={300}>
          <Heading size={700} marginBottom={16}>
            Webhooks
          </Heading>
          {metadata.map(data => (
            <Pane
              key={data.label}
              display="flex"
              flexDirection="row"
              alignItems="center"
            >
              <TextInputField
                width="90%"
                label={data.label}
                defaultValue={user[data.name]}
                disabled={isUpdating}
                // onChange={({ target: { value } }) => {}}
              />
              <Tooltip content={data.description}>
                <Icon icon="info-sign" color="lightgray" marginLeft={8} />
              </Tooltip>
            </Pane>
          ))}
        </Pane>
      </Pane>

      <Button
        appearance="primary"
        justifyContent="center"
        alignItems="center"
        isLoading={isUpdating}
        onClick={saveChanges}
        width={100}
      >
        { !isUpdating && 'Save' }
      </Button>
    </Pane>
  );
};

export default Configuration;
