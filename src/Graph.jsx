import * as d3 from "d3";
import { maxId, researchers } from "./assets/max.json";
import { useEffect, useState } from "react";

export { maxId, researchers };

const simulation = d3
  .forceSimulation()
  .force("charge", d3.forceManyBody())
  .force(
    "link",
    d3
      .forceLink()
      .id((d) => d.id)
      .distance(700)
  )
  .force("x", d3.forceX())
  .force("y", d3.forceY())
  .force("collide", d3.forceCollide().radius(30));

export function Graph({ id: entrypointId, researchers }) {
  const width = 1200;
  const height = 1200;
  const nodes = Object.keys(researchers).map((id) => ({ id }));
  const links = [];
  const visited = new Set();
  function addLink(id, researchers) {
    if (visited.has(id)) {
      return;
    }
    visited.add(id);
    const researcher = researchers[id];
    for (const co of researcher.coauthors) {
      links.push({
        source: id,
        target: co.id,
        numCopub: co.numCopub,
      });
      addLink(co.id, researchers);
    }
  }
  addLink(entrypointId, researchers);

  const [nodePositions, setNodePositions] = useState([]);
  const [linkPositions, setLinkPositions] = useState([]);
  const [activeId, setActiveId] = useState(entrypointId);
  useEffect(() => {
    simulation.nodes(nodes);

    // Fix the entrypoint node at the center
    const entryNode = nodes.find((n) => n.id === entrypointId);
    if (entryNode) {
      entryNode.fx = 0;
      entryNode.fy = 0;
    }

    simulation.force("link").links(links);
    const ticked = () => {
      setNodePositions(
        simulation.nodes().map(({ x, y, id }) => ({ x, y, id }))
      );
      setLinkPositions(
        simulation
          .force("link")
          .links()
          .map(({ source, target, numCopub }) => ({
            id: `${source.id}-${target.id}`,
            source: { x: source.x, y: source.y, id: source.id },
            target: { x: target.x, y: target.y },
            numCopub,
          }))
      );
    };
    simulation.on("tick", ticked);
    simulation.restart().tick();
    ticked();
    return () => {
      // Unfix the entrypoint node when unmounting
      if (entryNode) {
        entryNode.fx = null;
        entryNode.fy = null;
      }
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
          <circle
            key={id}
            cx={x}
            cy={y}
            r="25"
            fill={
              entrypointId === id
                ? "red"
                : id === activeId ||
                  researchers[activeId].coauthors.some((co) => co.id === id)
                ? "#000"
                : "#aaa"
            }
            onMouseOver={() => setActiveId(id)}
          >
            <title>{id}</title>
          </circle>
        ))}
      </g>
      <g>
        {linkPositions.map(({ source, target, id, numCopub }) => (
          <>
            <line
              key={id}
              stroke="#999"
              x1={source.x}
              y1={source.y}
              x2={target.x}
              y2={target.y}
              strokeOpacity={source.id === activeId ? 0.6 : 0}
            />
            <text
              key={id}
              x={(source.x + target.x) / 2}
              y={(source.y + target.y) / 2}
              textAnchor="middle"
              alignmentBaseline="middle"
              fontSize={24}
              fill={source.id === activeId ? "#000000" : "#00000000"}
              pointerEvents="none"
            >
              {numCopub} {numCopub === 1 ? "co-pub" : "co-pubs"}
            </text>
          </>
        ))}
      </g>
    </svg>
  );
}
