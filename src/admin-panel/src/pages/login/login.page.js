import React, { useState } from 'react';
import axios from 'axios';
import {
  Pane,
  Card,
  Link,
  Button,
  Heading,
  TextInputField,
} from 'evergreen-ui';

const LogIn = (props) => {
  const [accountId, setAccountId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const login = async () => {
    setError(false);
    setIsLoggingIn(true);

    try {
      const { data } = await axios.post('/login', { accountId, password });
      const user = JSON.stringify({
        accountId,
        ...data.user,
      });

      localStorage.setItem('user', user);

      setIsLoggingIn(false);
      props.history.push('/');
    } catch (e) {
      setIsLoggingIn(false);
      setError(true);
    }
  };

  return (
    <Pane
      width="100%"
      height="100%"
      display="flex"
      alignItems="center"
      flexDirection="column"
      background="tint1"
    >
      <Heading
        size={900}
        marginTop={250}
      >
        WiserLP
      </Heading>

      <Card
        padding={16}
        width={300}
        elevation={2}
        marginTop={32}
        display="flex"
        marginX="auto"
        border="default"
        background="white"
        flexDirection="column"
        justifyContent="space-between"
      >
        {/* SignUp Page: Account Id Field */}
        <TextInputField
          required
          isInvalid={error}
          type="number"
          label="Account ID"
          value={accountId}
          disabled={isLoggingIn}
          onChange={({ target: { value } }) => { setError(false); setAccountId(value); }}
        />

        {/* SignUp Page: Password Field */}
        <TextInputField
          required
          isInvalid={error}
          type="password"
          label="Password"
          value={password}
          marginBottom={12}
          disabled={isLoggingIn}
          onChange={({ target: { value } }) => { setError(false); setPassword(value); }}
          onKeyUp={({ keyCode, which }) => {
            const key = keyCode || which;

            if (key === 13) {
              login();
              return false;
            }

            return true;
          }}
        />

        {/* TODO: validate sign up errors
        <Text color="red" className={!error && 'hide'}>
          Invalid Account ID or Password
        </Text>
        */}

        <Button
          onClick={login}
          appearance="primary"
          justifyContent="center"
          isLoading={isLoggingIn}
          marginTop={8}
        >
          { !isLoggingIn && 'Log In' }
        </Button>
      </Card>

      <Link href="/signup" marginTop={16}>
        Sign up
      </Link>
    </Pane>
  );
};

export { LogIn };
