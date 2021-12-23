import React from "react";
import { hot } from "react-hot-loader";
import "./../assets/scss/App.scss";
import GameUI from "./GameUI";
import GraphEditor from "./GraphEditor";
import GymUI from "./GymUI";
import MapEditor from "./MapEditor";


class App extends React.Component<Record<string, unknown>, undefined> {
  public render() {
    return <GymUI />
  }
}



declare let module: Record<string, unknown>;

export default hot(module)(App);
