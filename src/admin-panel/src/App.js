import React from 'react';
import { BrowserRouter, Route, Switch } from 'react-router-dom';

import {
  LogIn,
  Error404,
  Dashboard,
} from './pages';

function App() {
  return (
    <BrowserRouter>
      <Switch>
        <Route exact path="/" component={Dashboard} />
        <Route exact path="/home" component={Dashboard} />
        <Route exact path="/configuration" component={Dashboard} />
        <Route exact path="/conversations" component={Dashboard} />
        <Route exact path="/login" component={LogIn} />
        <Route component={Error404} />
      </Switch>
    </BrowserRouter>
  );
}

export default App;
