import request from "superagent";

import './App.css';

request.get("http://localhost:7000/api").then((res) => console.log(res));

function App() {
  return (
    <div className="App">
      <div className="App-header">
        <div>
          DOI:
          <input type="text"/>
          <input type="button" value="Show" />
          or
          <input type="button" value="Random" />
        </div>
        <div>
          <p>Examples:</p>
          <ul>
            <li><span>123</span></li>
            <li><span>123</span></li>
            <li><span>123</span></li>
          </ul>
        </div>
      </div>
      <div className="App-content">

      </div>
    </div>
  );
}

export default App;
