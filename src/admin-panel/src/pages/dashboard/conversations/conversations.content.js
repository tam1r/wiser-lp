import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Pane,
  Table,
  Heading,
} from 'evergreen-ui';

const Conversations = (props) => {
  const { user } = props;
  const [conversations, setConversations] = useState({});

  useEffect(() => {
    const getConversations = async () => {
      const { data } = await axios.get(`/active-conversations?accountId=${user.accountId}`);
      setConversations(data);
    };

    getConversations();
  }, []);

  const content = Object.keys(conversations).map(key => (
    <Table.Row key={key} isSelectable onSelect={() => alert(conversations[key])}>
      <Table.TextCell>
        {conversations[key].conversationDetails.timestamp}
      </Table.TextCell>

      <Table.TextCell>
        {conversations[key].conversationDetails.phoneNumber.firstname}
      </Table.TextCell>
      <Table.TextCell isNumber>
        1
      </Table.TextCell>
    </Table.Row>
  ));

  return (
    <Pane>
      <Heading size={700}>
        Conversations
      </Heading>

      <Table marginTop={16}>
        <Table.Head>
          <Table.SearchHeaderCell />
          <Table.TextHeaderCell>
            Last Activity
          </Table.TextHeaderCell>
          <Table.TextHeaderCell>
            ltv
          </Table.TextHeaderCell>
        </Table.Head>
        <Table.Body height={240}>
          { content }
        </Table.Body>
      </Table>
    </Pane>
  );
};

export default Conversations;
