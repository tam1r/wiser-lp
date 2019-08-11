import React from 'react';
import {
  Pane,
  Heading,
} from 'evergreen-ui';

const Error404 = () => {
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
        404
      </Heading>
    </Pane>
  );
};

export { Error404 };
