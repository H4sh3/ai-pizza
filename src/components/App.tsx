import React, { useRef, useEffect } from "react";
import { hot } from "react-hot-loader";
import { LoadData } from "../modules/models";
import { segmentsMock, segmentsMock2, segmentsMock3 } from "../modules/data";
import "./../assets/scss/App.scss";


const Test: React.FC = () => {
  const props = {
    width: 4000,
    height: 4000
  }
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')
    //Our first draw
    context.fillStyle = '#BBBBBB'
    context.fillRect(0, 0, context.canvas.width, context.canvas.height)

    const segments = LoadData(segmentsMock)

    segments.forEach((s, i) => {
      context.strokeStyle = `#000000`
      context.lineWidth = "1"
      context.beginPath();

      const smallOffset = 9

      if (s.id == 25) {
        console.log(s)
      }

      if (s.backward.length > 1) {
        // horizontal
        if (s.start.y === s.end.y) {
          // left to right
          if (s.start.x < s.end.x) {
            context.moveTo(s.start.x, s.start.y);
            context.moveTo(s.start.x + 10, s.start.y - smallOffset);
          } else {
            context.moveTo(s.start.x - 10, s.start.y - smallOffset);
          }
        } else {
          // down to up
          if (s.start.y < s.end.y) {
            context.moveTo(s.start.x - smallOffset, s.start.y + 10);
          } else {
            context.moveTo(s.start.x - smallOffset, s.start.y - 10);
          }
        }
      } else {
        if (s.start.y === s.end.y) {
          context.moveTo(s.start.x, s.start.y - smallOffset);
        } else {
          context.moveTo(s.start.x - smallOffset, s.start.y);
        }
      }

      context.fillStyle = "#AAAAAA"
      context.fillRect(s.end.x - 10, s.end.y - 10, 20, 20)
      if (s.forward.length > 1) {

        // horizontal
        if (s.start.y === s.end.y) {
          // left to right
          if (s.start.x < s.end.x) {
            context.lineTo(s.end.x - 10, s.end.y - smallOffset);
          } else {
            context.lineTo(s.end.x + 10, s.end.y - smallOffset);
          }
        } else {
          // down to up
          if (s.start.y < s.end.y) {
            context.lineTo(s.end.x - smallOffset, s.end.y - 10);
          } else {
            context.lineTo(s.end.x - smallOffset, s.end.y + 10);
          }
        }
      } else { // full length

        if (s.start.y === s.end.y) {
          context.lineTo(s.end.x, s.end.y - smallOffset);
        } else {
          context.lineTo(s.end.x - smallOffset, s.end.y);
        }
      }
      context.stroke();


      // other side

      context.beginPath();
      if (s.backward.length > 1) {
        // horizontal
        if (s.start.y === s.end.y) {
          // left to right
          if (s.start.x < s.end.x) {
            context.moveTo(s.start.x, s.start.y);
            context.moveTo(s.start.x + 10, s.start.y + smallOffset);
          } else {
            context.moveTo(s.start.x - 10, s.start.y + smallOffset);
          }
        } else {
          // down to up
          if (s.start.y < s.end.y) {
            context.moveTo(s.start.x + smallOffset, s.start.y + 10);
          } else {
            context.moveTo(s.start.x + smallOffset, s.start.y - 10);
          }
        }
      } else {
        if (s.start.y === s.end.y) {
          context.moveTo(s.start.x, s.start.y + smallOffset);
        } else {
          context.moveTo(s.start.x + smallOffset, s.start.y);
        }
      }

      if (s.forward.length > 1) {
        context.fillStyle = "#AAAAAA"
        context.fillRect(s.end.x - 10, s.end.y - 10, 20, 20)

        // horizontal
        if (s.start.y === s.end.y) {
          // left to right
          if (s.start.x < s.end.x) {
            context.lineTo(s.end.x - 10, s.end.y + smallOffset);
          } else {
            context.lineTo(s.end.x + 10, s.end.y + smallOffset);
          }
        } else {
          // down to up
          if (s.start.y < s.end.y) {
            context.lineTo(s.end.x + smallOffset, s.end.y - 10);
          } else {
            context.lineTo(s.end.x + smallOffset, s.end.y + 10);
          }
        }
      } else { // full length

        if (s.start.y === s.end.y) {
          context.lineTo(s.end.x, s.end.y + smallOffset);
        } else {
          context.lineTo(s.end.x + smallOffset, s.end.y);
        }
      }
      context.stroke();

      context.fillStyle = "#FFFFFF"
      context.font = "30px Arial";
      context.fillText(i, (s.start.x + s.end.x) / 2, (s.start.y + s.end.y) / 2);
    })
  }, [])

  return <canvas ref={canvasRef} {...props} />
}

class App extends React.Component<Record<string, unknown>, undefined> {
  public render() {
    return <Test />
  }
}



declare let module: Record<string, unknown>;

export default hot(module)(App);
