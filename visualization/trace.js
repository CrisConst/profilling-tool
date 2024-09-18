import fs from 'fs/promises';

// Load the trace file
const traceFile = 'trace.json'; // Update the path to your trace.json file
let traceData;

try {
  const fileContent = await fs.readFile(traceFile, 'utf-8');
  traceData = JSON.parse(fileContent);
  console.log('Trace file loaded successfully.');
} catch (error) {
  console.error('Error reading or parsing the trace file:', error);
  process.exit(1);
}

// Function to extract startup tasks and their durations
const extractStartupTasks = (traceEvents) => {
  const tasks = {};
  const taskStack = [];

  traceEvents.forEach(event => {
    if (event.ph === 'B' || event.name.endsWith(':begin')) {
      if (event.name.startsWith('startup:')) {
        const taskName = event.name.replace(':begin', '');
        tasks[taskName] = tasks[taskName] || { startTime: null, endTime: null, duration: null, subTasks: [] };
        tasks[taskName].startTime = event.ts / 1000; // Convert microseconds to milliseconds
        taskStack.push(taskName);
      }
    } else if (event.ph === 'E' || event.name.endsWith(':end')) {
      const taskName = taskStack.pop();
      if (taskName && tasks[taskName]) {
        tasks[taskName].endTime = event.ts / 1000; // Convert microseconds to milliseconds
        tasks[taskName].duration = tasks[taskName].endTime - tasks[taskName].startTime;
      }
    }
    // Capture nested or related sub-tasks
    if (taskStack.length > 0 && event.ph === 'X') {
      const parentTaskName = taskStack[taskStack.length - 1];
      if (event.dur / 1000 > 1) { // Filter out tasks with duration less than 1 ms
        tasks[parentTaskName].subTasks.push({
          name: event.name,
          startTime: event.ts / 1000, // Convert microseconds to milliseconds
          duration: event.dur / 1000 // Convert microseconds to milliseconds
        });
      }
    }
  });

  return tasks;
};

// Verify the structure of traceData
if (!traceData || !Array.isArray(traceData.traceEvents)) {
  console.error('Invalid trace data structure.');
  process.exit(1);
}

console.log('Trace data structure is valid.');

// Extract startup tasks from trace data
const startupTasks = extractStartupTasks(traceData.traceEvents);

if (Object.keys(startupTasks).length === 0) {
  console.log('No startup tasks found.');
} else {
  console.log('Startup tasks extracted successfully.');
}

// Display startup tasks and their durations along with significant sub-tasks
const displayTasks = (tasks) => {
  Object.keys(tasks).forEach(taskName => {
    const task = tasks[taskName];
    console.log(`- ${taskName} (Start: ${task.startTime} ms, End: ${task.endTime} ms, Duration: ${task.duration} ms)`);
    if (task.subTasks.length > 0) {
      console.log(`  Significant sub-tasks:`);
      task.subTasks.forEach(subTask => {
        console.log(`    - ${subTask.name} (Start: ${subTask.startTime} ms, Duration: ${subTask.duration} ms)`);
      });
    }
  });
};

displayTasks(startupTasks);
