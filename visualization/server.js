import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

const projectDir = path.resolve(__dirname, '../project');
const publicDir = path.join(projectDir, 'public');

app.use(express.static(publicDir));

app.get('/visualize', (req, res) => {
  res.sendFile(path.join(publicDir, 'visualize.html'));
});

app.get('/visualize-chrome-table', (req, res) => {
  res.sendFile(path.join(publicDir, 'visualize-chrome-table.html'));
});

// Serve the merged-tasks.json file
app.get('/merged-tasks', async (req, res) => {
  const mergedTasksFile = path.join(projectDir, 'merged-tasks.json');
  try {
    await fs.access(mergedTasksFile);
    res.sendFile(mergedTasksFile);
  } catch (error) {
    console.error(`Error: Merged tasks file not found:`, error);
    res.status(404).send('Merged tasks file not found');
  }
});

app.get('/all-tasks', async (req, res) => {
  const allTasksFile = path.join(projectDir, 'all-tasks-detailed.json');
  try {
    await fs.access(allTasksFile);
    res.sendFile(allTasksFile);
  } catch (error) {
    console.error(`Error: All tasks file not found:`, error);
    res.status(404).send('All tasks file not found');
  }
});

app.get('/trace', (req, res) => {
  res.sendFile(path.join(projectDir, 'trace.json'));
});

app.get('/performance-timing', (req, res) => {
  res.sendFile(path.join(projectDir, 'performance-timing.json'));
});

app.get('/performance-entries', (req, res) => {
  res.sendFile(path.join(projectDir, 'performance-entries.json'));
});

app.get('/cpu-throttling', (req, res) => {
  res.sendFile(path.join(projectDir, 'cpu-throttling.json'));
});

app.get('/filtered-performance-entries', async (req, res) => {
  const entriesPath = path.join(projectDir, 'performance-entries.json');
  try {
    const data = await fs.readFile(entriesPath, 'utf-8');
    const entries = JSON.parse(data);

    // Filter entries to include only those related to `EditorLoad-connectedCallback`
    const filteredEntries = entries.filter(entry => 
      entry.name.includes('EditorLoad-connectedCallback')
    );

    res.json(filteredEntries);
  } catch (error) {
    console.error(`Error: Performance entries file not found:`, error);
    res.status(404).send('Performance entries file not found');
  }
});


app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
