import React from "react";
import { hot } from "react-hot-loader";
import "./../assets/scss/App.scss";
import Canvas2d from "./Canvas2d";



class App extends React.Component<Record<string, unknown>, undefined> {
  public render() {
    return <Canvas2d />
  }
}



declare let module: Record<string, unknown>;

export default hot(module)(App);
