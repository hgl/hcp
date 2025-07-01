import * as d3 from "d3";
import { useState } from "react";
import "./App.css";
// import { Graph, times } from "./GraphTest";
import { Graph, maxId, researchers } from "./Graph";

export default function App() {
  const [data, setData] = useState(() => d3.ticks(-2, 2, 200).map(Math.sin));

  function onMouseMove(event) {
    const [x, y] = d3.pointer(event);
    setData(data.slice(-200).concat(Math.atan2(x, y)));
  }

  return (
    <div onMouseMove={onMouseMove}>
      {/* <Graph time={times[40]} /> */}
      <Graph id={maxId} researchers={researchers} />
    </div>
  );
}
