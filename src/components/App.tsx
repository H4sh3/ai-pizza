import React from "react";
import { hot } from "react-hot-loader";
import "./../assets/scss/App.scss";
import GameUI from "./GameUI";
import MapEditor from "./MapEditor";


class App extends React.Component<Record<string, unknown>, undefined> {
  public render() {
    return <GameUI />
  }
}



declare let module: Record<string, unknown>;

export default hot(module)(App);
