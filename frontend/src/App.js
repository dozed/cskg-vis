import request from "superagent";
import {useEffect, useState} from "react";

import './App.css';

const exampleDois = [
  'https://doi.org/10.5591/978-1-57735-516-8/IJCAI11-491',
  'https://doi.org/10.18653/v1/2020.coling-main.448'
];

function getPartialDoi(doi) {
  return doi.replace('https://doi.org/', '');
}

function App() {
  const [doi, setDoi] = useState(null);

  useEffect(() => {
    if (doi) {
      const partialDoi = getPartialDoi(doi);
      request.get(`/api/statements/by-doi/${partialDoi}`)
        .then((res) => {
          console.log(res);
        });
    }
  }, [doi]);

  function fetchRandomDoi() {
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
          <input type="text" value={doi} />
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

      </div>
    </div>
  );
}

export default App;
