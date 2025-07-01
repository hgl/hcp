import * as d3 from "d3";
import json from "./assets/sfhh@4.json";
import { useEffect, useState } from "react";

for (const d of [...json.nodes, ...json.links]) {
  d.start = d3.isoParse(d.start);
  d.end = d3.isoParse(d.end);
}
export const times = d3
  .scaleTime()
  .domain([
    d3.min(json.nodes, (d) => d.start),
    d3.max(json.nodes, (d) => d.end),
  ])
  .ticks(1000)
  .filter((time) => json.nodes.some((d) => contains(d, time)));

function contains({ start, end }, time) {
  return start <= time && time < end;
}

const simulation = d3
  .forceSimulation()
  .force("charge", d3.forceManyBody())
  .force(
    "link",
    d3.forceLink().id((d) => d.id)
  )
  .force("x", d3.forceX())
  .force("y", d3.forceY());

export function Graph({ time }) {
  const width = 928;
  const height = 680;
  const nodes = json.nodes.filter((d) => contains(d, time));
  const links = json.links.filter((d) => contains(d, time));
  const [nodePositions, setNodePositions] = useState([]);
  const [linkPositions, setLinkPositions] = useState([]);
  useEffect(() => {
    simulation.nodes(nodes);
    simulation.force("link").links(links);
    const ticked = () => {
      setNodePositions(
        simulation.nodes().map(({ x, y, id }) => ({ x, y, id }))
      );
      setLinkPositions(
        simulation
          .force("link")
          .links()
          .map(({ source, target }) => ({
            id: `${source.id}-${target.id}`,
            source: { x: source.x, y: source.y },
            target: { x: target.x, y: target.y },
          }))
      );
    };
    simulation.on("tick", ticked);
    simulation.restart().tick();
    ticked();
    return () => {
      simulation.on("tick", null);
      simulation.stop();
    };
  }, []);

  return (
    <svg
      width={width}
      height={height}
      viewBox={`${-width / 2} ${-height / 2} ${width} ${height}`}
    >
      <g stroke="#fff" strokeWidth="1.5">
        {nodePositions.map(({ x, y, id }) => (
          <circle key={id} cx={x} cy={y} r="5" />
        ))}
      </g>
      <g stroke="#999" strokeOpacity="0.6">
        {linkPositions.map(({ source, target, id }) => (
          <line
            key={id}
            x1={source.x}
            y1={source.y}
            x2={target.x}
            y2={target.y}
          />
        ))}
      </g>
    </svg>
  );
}
