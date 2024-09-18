import React, { useEffect, useState } from 'react';
import './App.css';

function App() {
  const [result, setResult] = useState(null);

  useEffect(() => {
    const performHeavyComputation = () => {
      console.log('Starting heavy computation...');
      let total = 0;
      for (let i = 0; i < 1e9; i++) { // Adjust the loop count for desired delay
        total += Math.sqrt(i);
      }
      return total;
    };

    // Simulate a heavy computation that blocks the main thread
    const computationResult = performHeavyComputation();
    setResult(computationResult);
    console.log('Heavy computation finished.');
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <h1>Heavy Computation React App</h1>
        <p>Performing heavy computation...</p>
        {result !== null ? (
          <p>Computation Result: {result.toFixed(2)}</p>
        ) : (
          <p>Loading...</p>
        )}
      </header>
    </div>
  );
}

export default App;
