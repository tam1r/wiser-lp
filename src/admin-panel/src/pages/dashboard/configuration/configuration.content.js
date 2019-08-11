import React, {
  useState,
  useEffect,
  useCallback,
} from 'react';
import axios from 'axios';
import {
  toaster,
  Icon,
  Pane,
  Button,
  Heading,
  Tooltip,
  TextInputField,
} from 'evergreen-ui';

const Configuration = (props) => {
  const { user } = props;
  const {
    accountId,
    username,
  } = user;

  const [isUpdating, setIsUpdating] = useState(false);
  const [metadata, setMetadata] = useState([
    { name: 'coordinates_webhook', label: 'Coordinates shared', description: 'Triggered whenever a user shares their geolocation', value: user.coordinates_webhook }, // eslint-disable-line
    { name: 'new_conversation_webhook', label: 'New conversation', description: 'Triggered whenever there is a new conversation', value: user.new_conversation_webhook }, // eslint-disable-line
    { name: 'new_file_in_conversation_webhook', label: 'File shared', description: 'Triggered whenever a user shares a media file', value: user.new_file_in_conversation }, // eslint-disable-line
    { name: 'new_message_arrived_webhook', label: 'New message', description: 'Triggered whenever there is a new message', value: user.new_message_arrived_webhook }, // eslint-disable-line
  ]);

  const loadInfo = useCallback(
    async () => {
      const { data } = await axios.get(`/account-metadata?accountId=${accountId}`);
      const { webhooks } = data;

      if (webhooks.length > 0) {
        const updatedMetadata = metadata.map(_metadata => ({
          ..._metadata,
          value: webhooks[_metadata.name],
        }));

        setMetadata(updatedMetadata);
      }
    },
    [accountId], // eslint-disable-line
  );

  useEffect(() => {
    loadInfo();
  }, [loadInfo]);

  const saveChanges = async () => {
    setIsUpdating(true);

    const updatedUser = {
      accountId,
      webhooks: {},
    };

    metadata.forEach((val) => {
      if (val.value !== '') {
        updatedUser.webhooks[val.name] = val.value;
      }
    });

    const { status } = await axios.put('/update-metadata', updatedUser);

    if (status === 200) {
      toaster.success('Saved changes!', {
        description: 'They may take a couple of minutes to take effect',
      });
    } else {
      toaster.success('Failed uploading changes!', {
        description: 'Retry again in a couple of minutes, or contact an administrator',
      });
    }

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
                onChange={({ target: { value } }) => {
                  const updatedMetadata = [...metadata];
                  const index = updatedMetadata.indexOf(data);
                  updatedMetadata[index].value = value;

                  setMetadata(updatedMetadata);
                }}
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
