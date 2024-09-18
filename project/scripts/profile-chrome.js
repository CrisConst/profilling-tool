import puppeteer from 'puppeteer';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectDir = path.join(__dirname, '../../project');

const runProfiling = async (url) => {
  console.log('Starting profiling in Chrome...');

  try {
    const browser = await puppeteer.launch({ headless: true });
    console.log('Browser launched.');

    const page = await browser.newPage();
    console.log('New page opened.');

    const client = await page.target().createCDPSession();
    console.log('CDP session created.');

    console.log('Enabling JavaScript profiler and runtime instrumentation...');
    await client.send('Profiler.enable');
    await client.send('Runtime.enable');
    await client.send('Debugger.enable');

    console.log('Starting CPU profiling...');
    await client.send('Profiler.start');
    await client.send('Debugger.setAsyncCallStackDepth', { maxDepth: 32 });

    console.log('Navigating to URL:', url);
    await page.goto(url);

    console.log('Waiting for 20 seconds to simulate real usage...');
    await new Promise(resolve => setTimeout(resolve, 20000));

    console.log('Capturing performance entries...');
    const performanceEntries = await page.evaluate(() => {
      const marks = performance.getEntriesByType('mark');
      const measures = performance.getEntriesByType('measure');

      return marks.concat(measures).map(entry => ({
        name: entry.name,
        entryType: entry.entryType,
        startTime: entry.startTime,
        duration: entry.duration,
      }));
    });

    console.log('Stopping profiler...');
    const profile = await client.send('Profiler.stop');

    const entriesPath = path.join(projectDir, 'performance-entries.json');
    console.log('Saving performance entries to:', entriesPath);
    await fs.writeFile(entriesPath, JSON.stringify(performanceEntries, null, 2));
    console.log('Performance entries saved.');

    const profilePath = path.join(projectDir, 'chrome-profile.json');
    console.log('Saving JS profiler data to:', profilePath);
    await fs.writeFile(profilePath, JSON.stringify(profile, null, 2));
    console.log('JS profiler data saved.');

    const nodes = profile.profile?.nodes || [];
    const timeDeltas = profile.profile?.timeDeltas || [];

    const allTasks = nodes.map(node => {
      const selfTimeInMilliseconds = (timeDeltas[node.id] || 0) / 1000;

      return {
        id: node.id,
        parentId: node.parentId || null,
        functionName: node.callFrame.functionName || '(anonymous)',
        url: node.callFrame.url || 'N/A',
        lineNumber: node.callFrame.lineNumber || 'N/A',
        columnNumber: node.callFrame.columnNumber || 'N/A',
        hitCount: node.hitCount,
        startTime: 0,
        endTime: 0,
        duration: selfTimeInMilliseconds,
        taskType: node.callFrame.url.includes('webpack') ? 'Script' : 'Function',
        resources: [],
        children: [],
        source: `${node.callFrame.url}:${node.callFrame.lineNumber}:${node.callFrame.columnNumber}` // Capture source info
      };
    });

    const allTasksPath = path.join(projectDir, 'all-tasks-detailed.json');
    console.log('Saving detailed tasks to:', allTasksPath);
    await fs.writeFile(allTasksPath, JSON.stringify(allTasks, null, 2));
    console.log('Detailed tasks saved.');

    await browser.close();
    console.log('Browser closed.');

  } catch (error) {
    console.error('Error during profiling:', error);
  }
};

const url = 'https://localhost.adobe.com:8080/new?width=2560&height=2560&unit=px&aspectRatioLock=false&tasksGroup=document&taskID=custom-size&category=text&learn=for-you';

runProfiling(url).then(() => {
  console.log('Profiling completed.');
}).catch(err => {
  console.error('Error running profiling:', err);
});
