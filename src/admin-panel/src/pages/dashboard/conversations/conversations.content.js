import React, {
  useEffect,
  useState,
  useCallback,
} from 'react';
import axios from 'axios';
import {
  Pane,
  Card,
  Table,
  Button,
  Heading,
  SideSheet,
  Paragraph,
} from 'evergreen-ui';

const Conversations = (props) => {
  const { user } = props;
  const [conversations, setConversations] = useState({});
  const [details, setDetails] = useState(false);

  const loadInfo = useCallback(
    async () => {
      const { data } = await axios.get(`/active-conversations?accountId=${user.accountId}`);
      setConversations(data);
    },
    [user.accountId],
  );

  useEffect(() => {
    loadInfo();
  }, [loadInfo]);

  const content = Object.keys(conversations).map((key) => {
    const { conversationDetails } = conversations[key];
    let fullName = 'N/A';
    let phoneNumber = 'N/A';

    if (conversationDetails.phoneNumber) {
      fullName = `${conversationDetails.phoneNumber.firstname} ${conversationDetails.phoneNumber.lastname}`;

      if (conversationDetails.phoneNumber.phonenumber && conversationDetails.phoneNumber.phonenumber[0]) { // eslint-disable-line
        phoneNumber = conversationDetails.phoneNumber.phonenumber[0]; // eslint-disable-line
      }
    }

    return (
      <Table.Row key={key} isSelectable onSelect={() => { setDetails(conversations[key]); }}>
        <Table.TextCell>
          {conversations[key].conversationDetails.timestamp}
        </Table.TextCell>
        <Table.TextCell>
          {fullName}
        </Table.TextCell>
        <Table.TextCell isNumber>
          {phoneNumber}
        </Table.TextCell>
      </Table.Row>
    );
  });

  return (
    <Pane>
      <Pane
        display="flex"
        flexDirection="row"
        justifyContent="space-between"
      >
        <Heading size={700}>
          Conversations
        </Heading>

        <Button
          appearance="primary"
          onClick={loadInfo}
        >
          Refresh
        </Button>
      </Pane>

      <Table marginTop={16} display="flex" flexDirection="column">
        <Table.Head>
          <Table.TextHeaderCell>
            Last Activity
          </Table.TextHeaderCell>
          <Table.TextHeaderCell>
            Full Name
          </Table.TextHeaderCell>
          <Table.TextHeaderCell>
            Phone Number
          </Table.TextHeaderCell>
        </Table.Head>
        <Table.Body height={240}>
          { content }
        </Table.Body>
      </Table>

      <SideSheet
        preventBodyScrolling
        isShown={details}
        onCloseComplete={() => setDetails(false)}
        containerProps={{
          display: 'flex',
          flex: '1',
          flexDirection: 'column',
        }}
      >
        <Pane zIndex={1} flexShrink={0} elevation={0} backgroundColor="white">
          <Pane padding={16}>
            <Heading size={600}>
              Conversation Details
            </Heading>
            <Paragraph size={400}>
              {`Conversation ID: ${details.conversationDetails && details.conversationDetails.conversationId}`}
            </Paragraph>
          </Pane>
        </Pane>
        <Pane flex="1" overflowY="scroll" background="tint1" padding={16}>
          <Card
            backgroundColor="white"
            elevation={0}
            height={240}
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <Heading>
              To Define content...
            </Heading>
          </Card>
        </Pane>
      </SideSheet>
    </Pane>
  );
};

export default Conversations;
