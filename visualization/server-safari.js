import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3002;

const projectDir = path.resolve(__dirname, '../project');
const publicDir = path.join(projectDir, 'public');

app.use(express.static(publicDir));

app.get('/visualize-safari', (req, res) => {
  res.sendFile(path.join(publicDir, 'visualize-safari.html'));
});

app.get('/visualize-safari-table', (req, res) => {
  res.sendFile(path.join(publicDir, 'visualize-safari-table.html'));
});

app.get('/safari-tasks', async (req, res) => {
  try {
    const safariTasksFile = path.join(projectDir, 'safari-performance.json');
    await fs.access(safariTasksFile);
    res.sendFile(safariTasksFile);
  } catch (error) {
    console.error('Error: Safari tasks file not found:', error);
    res.status(404).send('Safari tasks file not found');
  }
});

app.get('/filtered-safari-tasks', async (req, res) => {
  const tasksPath = path.join(projectDir, 'safari-performance.json');
  try {
    const data = await fs.readFile(tasksPath, 'utf-8');
    const entries = JSON.parse(data);

    const filteredEntries = entries.filter(entry => 
      entry.name.includes('EditorLoad-connectedCallback')
    );

    res.json(filteredEntries);
  } catch (error) {
    console.error('Error: Safari tasks file not found:', error);
    res.status(404).send('Safari tasks file not found');
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
