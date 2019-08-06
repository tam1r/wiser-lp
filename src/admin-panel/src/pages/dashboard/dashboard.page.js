import React, { useState, useEffect, useRef } from 'react';
import {
  Pane,
  Menu,
  Position,
  Popover,
  Avatar,
  Tablist,
  Strong,
  SidebarTab,
  Text,
} from 'evergreen-ui';

import { capitalize } from '../../utils';

import Home from './home/home.content';
import Configuration from './configuration/configuration.content';
import Conversations from './conversations/conversations.content';

const Dashboard = (props) => {
  const [user] = useState(JSON.parse(localStorage.getItem('user')) || null);
  const [currentPage, setCurrentPage] = useState(localStorage.getItem('currentPage') || 'home');
  const configRef = useRef();
  const conversationsRef = useRef();

  const pages = [
    { page: 'home', content: <Home user={user} /> },
    { page: 'configuration', content: <Configuration user={user} ref={configRef} /> },
    { page: 'conversations', content: <Conversations user={user} ref={conversationsRef} /> },
  ];

  useEffect(() => {
    const { history } = props;

    if (!user) {
      history.push('/login');
    }

    return () => {
      localStorage.setItem('currentPage', '');
    };
  }, [props, user]);

  if (!user) {
    return null;
  }

  const logout = () => {
    localStorage.setItem('user', null);
    localStorage.setItem('currentPage', '');
    props.history.push('/login');
  };

  const goToPage = (page) => {
    setCurrentPage(page);
    localStorage.setItem('currentPage', page);
    document.title = `WiserLP | ${capitalize(page)}`;

    if (page === 'configuration') {
      configRef.current.loadInfo();
    }

    if (page === 'conversations') {
      conversationsRef.current.loadInfo();
    }

    props.history.push(`/${page}`);
  };

  return (
    <Pane
      width="100%"
      height="100%"
      display="flex"
      flexDirection="column"
      background="tint1"
    >
      <Pane
        height={55}
        paddingY={8}
        paddingX={16}
        display="flex"
        background="white"
        alignItems="center"
        flexDirection="row"
        justifyContent="space-between"
      >
        <Strong textTransform="capitalize">
          {`WiserLP ${currentPage && `| ${currentPage}`}`}
        </Strong>

        <Pane display="flex" alignItems="center">
          <Text size={500} marginRight={8}>
            { user.username }
          </Text>

          <Popover
            position={Position.BOTTOM_LEFT}
            content={(
              <Menu>
                <Menu.Group title={`Account Id ${user.accountId}`}>
                  <Menu.Item intent="warning" icon="log-out" onSelect={logout}>
                    Log Out
                  </Menu.Item>
                </Menu.Group>
              </Menu>
            )}
          >
            <Avatar
              size={40}
              name={user.username}
              className="clickable"
            />
          </Popover>
        </Pane>
      </Pane>

      <Pane
        display="flex"
        height="100%"
        justifyContent="center"
        marginLeft={16}
      >
        <Tablist
          marginY={16}
          flexBasis={240}
          marginRight={24}
        >
          {pages.map(({ page }, index) => (
            <SidebarTab
              key={page}
              id={page}
              marginY={8}
              onSelect={() => goToPage(page)}
              isSelected={page === currentPage}
              aria-controls={`panel-${index}`}
              textTransform="capitalize"
            >
              {page}
            </SidebarTab>
          ))}
        </Tablist>

        <Pane
          flex="1"
          padding={16}
          background="white"
          marginY={24}
          marginRight={16}
          elevation={2}
        >
          {pages.map(({ page, content }) => (
            <Pane
              key={page}
              id={`panel-${page}`}
              role="tabpanel"
              aria-labelledby={page}
              aria-hidden={page !== currentPage}
              display={page === currentPage ? 'block' : 'none'}
            >
              {content}
            </Pane>
          ))}
        </Pane>
      </Pane>
    </Pane>
  );
};

export { Dashboard };
