import request from "superagent";
import {useEffect, useRef, useState} from "react";
import MultiDirectedGraph from "graphology";

import './App.css';
import Sigma from "sigma";
import ForceSupervisor from "graphology-layout-force/worker";

const exampleDois = [
  'https://doi.org/10.5591/978-1-57735-516-8/IJCAI11-491',
  'https://doi.org/10.1109/SMC.2017.8122756',
  'https://doi.org/10.1109/IROS.2013.6696437',
  'https://doi.org/10.3390/jsan6040022'
  // 'https://doi.org/10.18653/v1/2020.coling-main.448'
];

const getPartialDoi = (doi) => {
  return doi.replace('https://doi.org/', '');
}

const mkGraph = (edges) => {
  const nodes = new Set(edges.map(e => e.s).concat(edges.map(e => e.o)));
  const check = new Set();

  const graph = new MultiDirectedGraph();

  nodes.forEach(n => {
    graph.addNode(n, { size: 15, label: n, color: "#FA4F40" });
  });

  edges.forEach((e, i) => {
    if (!check.has(`${e.s}-${e.o}`) && !check.has(`${e.o}-${e.s}`)) {
      graph.addEdgeWithKey(`${e.p}-${i}`, e.s, e.o, { type: "arrow", label: e.p });
      check.add(`${e.s}-${e.o}`)
    }
  });

  graph.nodes().forEach((node, i) => {
    const angle = (i * 2 * Math.PI) / graph.order;
    graph.setNodeAttribute(node, "x", 100 * Math.cos(angle));
    graph.setNodeAttribute(node, "y", 100 * Math.sin(angle));
  });

  return graph;
};

const mkSigma = (graph, container) => {
  const renderer = new Sigma(graph, container, {
    // We don't have to declare edgeProgramClasses here, because we only use the default ones ("line" and "arrow")
    // nodeProgramClasses: {
    //   image: getNodeProgramImage(),
    //   border: NodeProgramBorder,
    // },
    renderEdgeLabels: true,
    allowInvalidContainer: true
  });

  const layout = new ForceSupervisor(graph);

  let draggedNode = null;
  let isDragging = false;

  renderer.on("downNode", (e) => {
    isDragging = true;
    draggedNode = e.node;
    graph.setNodeAttribute(draggedNode, "highlighted", true);
  });

  // On mouse move, if the drag mode is enabled, we change the position of the draggedNode
  renderer.getMouseCaptor().on("mousemovebody", (e) => {
    if (!isDragging || !draggedNode) return;

    // Get new position of node
    const pos = renderer.viewportToGraph(e);

    graph.setNodeAttribute(draggedNode, "x", pos.x);
    graph.setNodeAttribute(draggedNode, "y", pos.y);

    // Prevent sigma to move camera:
    e.preventSigmaDefault();
    e.original.preventDefault();
    e.original.stopPropagation();
  });

  // On mouse up, we reset the autoscale and the dragging mode
  renderer.getMouseCaptor().on("mouseup", () => {
    if (draggedNode) {
      graph.removeNodeAttribute(draggedNode, "highlighted");
    }
    isDragging = false;
    draggedNode = null;
  });

  // Disable the autoscale at the first down interaction
  renderer.getMouseCaptor().on("mousedown", () => {
    layout.stop();
    if (!renderer.getCustomBBox()) renderer.setCustomBBox(renderer.getBBox());
  });

  layout.start();

  return renderer;
}

const App = () => {
  const [doi, setDoi] = useState('');
  const [sigma, setSigma] = useState(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (doi) {
      const partialDoi = getPartialDoi(doi);
      request.get(`/api/statements/by-doi/${partialDoi}`)
        .then((res) => {
          if (sigma) {
            sigma.kill();
          }

          const graph = mkGraph(res.body.data);
          const renderer = mkSigma(graph, containerRef.current);

          setSigma(renderer);
        });
    }
  }, [doi]);

  const fetchRandomDoi = () => {
    request.get(`/api/dois/random`)
      .then((res) => {
        const doi = res.body.data;
        setDoi(doi);
      });
  }

  return (
    <div className="App">
      <div className="App-header">
        <div className="search-bar">
          DOI:
          <input className="doi-input" type="text" value={doi} onChange={(e) => setDoi(e.target.value)} />
          <input type="button" value="Show" />
          or
          <input type="button" value="Random" onClick={() => fetchRandomDoi()} />
        </div>
        <div>
          <p>Examples:</p>
          <ul className="example-dois">
            {
              exampleDois.map((doi, i) =>
                <li key={`example-doi-${i}`} onClick={() => setDoi(doi)}>{doi}</li>
              )
            }
          </ul>
        </div>
      </div>
      <div className="App-content" ref={containerRef} />
    </div>
  );
}

export default App;
