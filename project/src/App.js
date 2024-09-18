import React, { useEffect } from 'react';
import './App.css';

const simulateLongTask = (duration) => {
  const start = Date.now();
  while (Date.now() - start < duration) {
    Math.sqrt(Math.random() * Math.random());
  }
  console.log(`Simulated long task for ${duration}ms`);
};

const simulateTasks = () => {
  simulateLongTask(4000);  // Long task of 4000ms
  for (let i = 0; i < 5; i++) {
    simulateLongTask(200);  // Long tasks of 200ms
  }
  simulateLongTask(5000);  // Another long task of 5000ms
  console.log('Simulated all tasks');
};

function App() {
  useEffect(() => {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach(entry => {
        console.log(`Entry: ${JSON.stringify(entry)}`);
      });
    });
    observer.observe({ type: 'longtask', buffered: true });

    // Run the tasks after the observer is set up
    setTimeout(simulateTasks, 1000);

    // Capture all performance entries after tasks are simulated
    setTimeout(() => {
      const entries = performance.getEntries();
      console.log('All performance entries:', JSON.stringify(entries, null, 2));
    }, 15000);  // Delay to ensure tasks are completed
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
      </header>
    </div>
  );
}

export default App;
