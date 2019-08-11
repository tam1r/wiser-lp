import React, { useState } from 'react';
import axios from 'axios';
import {
  toaster,
  Pane,
  Card,
  Text,
  Link,
  Button,
  Heading,
  TextInputField,
} from 'evergreen-ui';

const SignUp = (props) => { // eslint-disable-line
  const { history } = props;
  const [username, setUsername] = useState('');
  const [accountId, setAccountId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [isSigningUp, setIsSigningIn] = useState(false);

  const signup = async () => {
    setError(false);
    setIsSigningIn(true);

    try {
      const { status } = await axios.post('/register-client', {
        username,
        liveperson_accountid: accountId,
        liveperson_password: password,
      });

      if (status === 200) {
        toaster.success('Sign up Success');

        setTimeout(() => {
          history.push('/login');
        }, 1333);
      } else {
        setError(true);
      }

      setIsSigningIn(false);
    } catch (e) {
      toaster.danger('Invalid credentials');
      setIsSigningIn(false);
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
        Sign Up
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
        {/* SignUp Page: Username Field */}
        <TextInputField
          required
          isInvalid={error}
          label="Username"
          value={username}
          disabled={isSigningUp}
          onChange={({ target: { value } }) => { setError(false); setUsername(value); }}
        />

        {/* SignUp Page: Account Id Field */}
        <TextInputField
          required
          isInvalid={error}
          type="number"
          label="Account ID"
          value={accountId}
          disabled={isSigningUp}
          onChange={({ target: { value } }) => { setError(false); setAccountId(value); }}
        />

        {/* SignUp Page: Passwrd Field */}
        <TextInputField
          required
          isInvalid={error}
          type="password"
          label="Password"
          value={password}
          marginBottom={12}
          disabled={isSigningUp}
          onChange={({ target: { value } }) => { setError(false); setPassword(value); }}
          onKeyUp={({ keyCode, which }) => {
            const key = keyCode || which;

            if (key === 13) {
              signup();
              return false;
            }

            return true;
          }}
        />

        <Text color="red" className={!error && 'hide'}>
          Invalid Account ID or Password
        </Text>

        <Button
          onClick={signup}
          appearance="primary"
          justifyContent="center"
          isLoading={isSigningUp}
          marginTop={8}
        >
          { !isSigningUp && 'Sign Up' }
        </Button>
      </Card>

      <Link href="/login" marginTop={16}>
        Log In
      </Link>
    </Pane>
  );
};

export { SignUp };
