import request from "superagent";
import {useEffect, useState} from "react";
import Graph from "graphology";
import {SigmaContainer, useLoadGraph} from "@react-sigma/core";
import {useWorkerLayoutForceAtlas2} from "@react-sigma/layout-forceatlas2";
import {useLayoutCircular} from "@react-sigma/layout-circular";
import "@react-sigma/core/lib/react-sigma.min.css";

import './App.css';

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

const App = () => {
  const [doi, setDoi] = useState('');
  const [graph, setGraph] = useState(new Graph());

  const StatementsGraph = ({ graph }) => {
    const { positions, assign } = useLayoutCircular();
    const loadGraph = useLoadGraph();

    useEffect(() => {
      loadGraph(graph);
      assign();
    }, [loadGraph, graph]);

    return null;
  };

  useEffect(() => {
    if (doi) {
      const partialDoi = getPartialDoi(doi);
      request.get(`/api/statements/by-doi/${partialDoi}`)
        .then((res) => {
          console.log(res.body.data);

          const edges = res.body.data;
          const nodes = new Set(edges.map(e => e.s).concat(edges.map(e => e.o)));

          const graph = new Graph();

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
        <SigmaContainer style={{ flex: 1, height: "auto", width: "auto" }}>
          <StatementsGraph graph={graph} />
          <ForceAtlas2Layout />
        </SigmaContainer>
      </div>
    </div>
  );
}

export default App;
