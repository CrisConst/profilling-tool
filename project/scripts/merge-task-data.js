import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const allTasksDetailedPath = path.join(__dirname, '../all-tasks-detailed.json');
const chromeProfilePath = path.join(__dirname, '../chrome-profile.json');
const outputPath = path.join(__dirname, '../merged-tasks.json');

async function loadJson(filePath) {
    try {
        console.log(`Loading JSON data from ${filePath}`);
        const data = await fs.readFile(filePath, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        console.error(`Failed to load JSON data from ${filePath}:`, error);
        throw error;
    }
}

async function mergeTaskData() {
    try {
        const allTasksDetailed = await loadJson(allTasksDetailedPath);
        const chromeProfile = await loadJson(chromeProfilePath);

        let taskMap = new Map();
        allTasksDetailed.forEach(task => {
            taskMap.set(task.id, task);
        });

        function mergeDetails(node) {
            console.log(`Processing node ID: ${node.id}`);

            let taskDetail = taskMap.get(node.id);

            if (!taskDetail) {
                console.log(`Warning: No matching task found for node ID ${node.id}`);
                return null;
            }

            node.startTime = taskDetail.startTime;
            node.endTime = taskDetail.endTime;
            node.duration = taskDetail.duration;
            node.taskType = taskDetail.taskType;
            node.resources = taskDetail.resources;

            if (node.children) {
                node.children = node.children.map(childId => {
                    let childNode = chromeProfile.profile.nodes.find(n => n.id === childId);
                    if (childNode) {
                        return mergeDetails(childNode);
                    } else {
                        console.log(`Warning: Child node with ID ${childId} not found for parent node ID ${node.id}.`);
                        return null;
                    }
                }).filter(n => n !== null);
            }

            return node;
        }

        let rootNode = chromeProfile.profile.nodes.find(n => n.id === 1);

        if (rootNode) {
            let mergedRoot = mergeDetails(rootNode);
            await fs.writeFile(outputPath, JSON.stringify(mergedRoot, null, 2));
            console.log(`Merged tasks saved to ${outputPath}`);
        } else {
            console.error('Error: Root node not found.');
        }
    } catch (error) {
        console.error('Merging task data failed!', error);
    }
}

mergeTaskData();
