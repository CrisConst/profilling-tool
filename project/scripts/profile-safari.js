import { Builder } from 'selenium-webdriver';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectDir = path.join(__dirname, '../../project');

async function runProfiling(url) {
  console.log('Starting profiling in Safari...');

  let driver = await new Builder().forBrowser('safari').build();

  try {
    console.log('Navigating to URL:', url);
    await driver.get(url);

    console.log('Starting JavaScript profiling...');
    await driver.executeScript(`
      window.profileData = [];

      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach(entry => {
          // Capture stack traces for long tasks
          if (entry.entryType === 'longtask' && entry.attribution) {
            entry.attribution.forEach(attribution => {
              window.profileData.push({
                entryType: entry.entryType,
                name: attribution.name,
                startTime: entry.startTime,
                duration: entry.duration,
                stack: attribution.containerName || 'unknown',
                source: attribution.containerName || 'unknown'
              });
            });
          } else {
            window.profileData.push({
              entryType: entry.entryType,
              name: entry.name,
              startTime: entry.startTime,
              duration: entry.duration,
              source: 'N/A'  // Placeholder for source info
            });
          }
        });
      });

      observer.observe({ 
        entryTypes: [
          'mark', 'measure', 'resource', 'navigation', 'paint', 
          'longtask', 'frame', 'event'
        ] 
      });

      console.log('Performance observer started.');
    `);

    console.log('Waiting for 20 seconds to simulate real usage...');
    await driver.sleep(20000);

    console.log('Stopping JavaScript profiling and retrieving data...');
    const profileData = await driver.executeScript(`
      return window.profileData;
    `);

    const profilePath = path.join(projectDir, 'safari-performance.json');

    if (profileData && profileData.length > 0) {
      console.log('Saving Safari performance data to:', profilePath);
      await fs.writeFile(profilePath, JSON.stringify(profileData, null, 2));
      console.log('Saved safari-performance.json');
    } else {
      console.log('No performance data to save.');
    }

  } catch (error) {
    console.error('Error during profiling:', error);
  } finally {
    console.log('Closing Safari...');
    await driver.quit();
    console.log('Safari closed.');
  }
}

const url = 'https://localhost.adobe.com:8080/new?width=2560&height=2560&unit=px&aspectRatioLock=false&tasksGroup=document&taskID=custom-size&category=text&learn=for-you';

runProfiling(url).then(() => {
  console.log('Profiling completed.');
}).catch(err => {
  console.error('Error running profiling:', err);
});
