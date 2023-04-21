import request from "superagent";
import {useEffect, useState} from "react";
import MultiDirectedGraph from "graphology";
import {SigmaContainer, useLoadGraph, useRegisterEvents, useSigma} from "@react-sigma/core";
import {useWorkerLayoutForceAtlas2} from "@react-sigma/layout-forceatlas2";
import {useLayoutCircular} from "@react-sigma/layout-circular";
import "@react-sigma/core/lib/react-sigma.min.css";

import './App.css';
import {useLayoutForce} from "@react-sigma/layout-force";

const exampleDois = [
  'https://doi.org/10.5591/978-1-57735-516-8/IJCAI11-491',
  'https://doi.org/10.18653/v1/2020.coling-main.448'
];

const getPartialDoi = (doi) => {
  return doi.replace('https://doi.org/', '');
}

const ForceAtlas2Layout = () => {
  const { start, kill, isRunning } = useWorkerLayoutForceAtlas2({ settings: { slowDown: 10 } });

  useEffect(() => {
    // start FA2
    start();
    return () => {
      // Kill FA2 on unmount
      kill();
    };
  }, [start, kill]);

  return null;
};

const GraphEvents = () => {
  const registerEvents = useRegisterEvents();
  const sigma = useSigma();
  const [draggedNode, setDraggedNode] = useState(null);

  useEffect(() => {
    // Register the events
    registerEvents({
      downNode: (e) => {
        setDraggedNode(e.node);
        sigma.getGraph().setNodeAttribute(e.node, "highlighted", true);
      },
      mouseup: (e) => {
        if (draggedNode) {
          setDraggedNode(null);
          sigma.getGraph().removeNodeAttribute(draggedNode, "highlighted");
        }
      },
      mousedown: (e) => {
        // Disable the autoscale at the first down interaction
        if (!sigma.getCustomBBox()) sigma.setCustomBBox(sigma.getBBox());
      },
      mousemove: (e) => {
        if (draggedNode) {
          // Get new position of node
          const pos = sigma.viewportToGraph(e);
          sigma.getGraph().setNodeAttribute(draggedNode, "x", pos.x);
          sigma.getGraph().setNodeAttribute(draggedNode, "y", pos.y);

          // Prevent sigma to move camera:
          e.preventSigmaDefault();
          e.original.preventDefault();
          e.original.stopPropagation();
        }
      },
      touchup: (e) => {
        if (draggedNode) {
          setDraggedNode(null);
          sigma.getGraph().removeNodeAttribute(draggedNode, "highlighted");
        }
      },
      touchdown: (e) => {
        // Disable the autoscale at the first down interaction
        if (!sigma.getCustomBBox()) sigma.setCustomBBox(sigma.getBBox());
      },
      touchmove: (e) => {
        if (draggedNode) {
          // Get new position of node
          const pos = sigma.viewportToGraph(e);
          sigma.getGraph().setNodeAttribute(draggedNode, "x", pos.x);
          sigma.getGraph().setNodeAttribute(draggedNode, "y", pos.y);

          // Prevent sigma to move camera:
          e.preventSigmaDefault();
          e.original.preventDefault();
          e.original.stopPropagation();
        }
      },
    });
  }, [registerEvents, sigma, draggedNode]);

  return null;
};

const StatementsGraph = ({ graph }) => {
  const { positions, assign } = useLayoutCircular();
  // const { positions, assign } = useLayoutForce();
  const loadGraph = useLoadGraph();

  useEffect(() => {
    loadGraph(graph);
    assign();
  }, [loadGraph, assign, positions, graph]);

  return null;
};

const App = () => {
  const [doi, setDoi] = useState('');
  const [graph, setGraph] = useState(new MultiDirectedGraph());

  useEffect(() => {
    if (doi) {
      const partialDoi = getPartialDoi(doi);
      request.get(`/api/statements/by-doi/${partialDoi}`)
        .then((res) => {
          console.log(res.body.data);

          const edges = res.body.data;
          const nodes = new Set(edges.map(e => e.s).concat(edges.map(e => e.o)));

          const graph = new MultiDirectedGraph();

          nodes.forEach(n => {
            graph.addNode(n, { x: 0, y: 0, size: 15, label: n, color: "#FA4F40" });
          });

          edges.forEach((e, i) => {
            graph.addEdgeWithKey(`${e.p}-${i}`, e.s, e.o, { label: e.p });
          });

          setGraph(graph);
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
        <div>
          DOI:
          <input type="text" value={doi} onChange={(e) => setDoi(e.target.value)} />
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
      <div className="App-content">
        <SigmaContainer style={{ flex: 1, height: "auto", width: "auto" }} graph={MultiDirectedGraph}>
          <StatementsGraph graph={graph} />
          {/*<ForceAtlas2Layout />*/}
          <GraphEvents />
        </SigmaContainer>
      </div>
    </div>
  );
}

export default App;
