import React from "react";
import { hot } from "react-hot-loader";
import "./../assets/scss/App.scss";
import GameUI from "./GameUI";
import GameUI3d from "./GameUI3d";
import GraphEditor, { Button } from "./GraphEditor";
import GymUI from "./GymUI";
import MapEditor from "./MapEditor";


class App extends React.Component<Record<string, unknown>, undefined> {
  public render() {
    const { pathname } = window.location

    let currentComponent = <GameUI />

    switch (pathname) {
      case "/":
        currentComponent = <GameUI />
        break
      case "/editor":
        currentComponent = <GraphEditor />
        break
      case "/gym":
        currentComponent = <GymUI />
        break
    }

    return <Navbar>
      {currentComponent}
    </Navbar>
  }
}


const Navbar: React.FC = ({ children }) => {
  const { pathname } = window.location
  return <div className="flex flex-col gap-1">
    <div className="flex flex-row gap-2 justify-center items-center pt-3">
      <Button color={`${pathname === "/editor" ? "yellow" : "green"}`} onClick={() => {
        window.location.pathname = "/editor"
      }}>Editor</Button>
      <Button color={`${pathname === "/" ? "yellow" : "green"}`} onClick={() => {
        window.location.pathname = "/"
      }}>Game</Button>
      <Button color={`${pathname === "gym" ? "yellow" : "green"}`} onClick={() => {
        window.location.pathname = "/gym"
      }}>Gym</Button>
    </div>
    {children}
  </div>
}

declare let module: Record<string, unknown>;

export default hot(module)(App);
