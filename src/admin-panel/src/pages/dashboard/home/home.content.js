import React, { Fragment } from 'react';
import {
  // Pane,
  Heading,
} from 'evergreen-ui';

const Home = (props) => { // eslint-disable-line
  // const { user } = props;

  const today = new Date();
  const curHr = today.getHours();
  let greeting = 'Good evening!';

  if (curHr < 12) {
    greeting = 'Good morning!';
  } else if (curHr < 18) {
    greeting = 'Good afternoon!';
  }

  return (
    <Fragment>
      <Heading size={700}>
        {greeting}
      </Heading>
    </Fragment>
  );
};

export default Home;
