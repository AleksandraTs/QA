const { defineConfig } = require("cypress");
const fs = require('fs');
const path = require('path');

// Path to the base folder (S1000D)
const folderPath = 'C:/mitim/http-root/S1000D';
// Path to the folder with legacy XML files (XML_files)
const xmlFilesFolder = path.join(folderPath, 'XML_files');

/**
 * Retrieves the advanced file list from error folders.
 */
function getAdvancedFileList() {
  const advancedFileList = [];
  const subdirs = fs.readdirSync(folderPath, { withFileTypes: true })
                    .filter(dirent => dirent.isDirectory() && dirent.name !== "XML_files");
  
  subdirs.forEach(dirent => {
    const match = dirent.name.match(/^(\d+)\s+error(s)?$/i);
    if (match) {
      const expectedErrors = parseInt(match[1], 10);
      const subfolder = path.join(folderPath, dirent.name);
      const xmlFiles = fs.readdirSync(subfolder)
                         .filter(file => file.toLowerCase().endsWith('.xml'));
      xmlFiles.forEach(file => {
        const normalizedPath = path.join(dirent.name, file).replace(/\\/g, '/'); //Normalization
        advancedFileList.push({
          file: normalizedPath,
          expectedErrors: expectedErrors
        });
      });
    }
  });
  return advancedFileList;
}

module.exports = defineConfig({
  e2e: {
    projectId: "rtqkk8",
    baseUrl: 'https://editor.mitim-s.com',
    supportFile: false,
    specPattern: "cypress/e2e/**/*.{cy,js,jsx,ts,tsx,feature}",
    setupNodeEvents(on, config) {
      try {
        const allFiles = fs.readdirSync(xmlFilesFolder);
        const legacyFiles = allFiles.filter(file => file.toLowerCase().endsWith('.xml'));
        config.env.fileList = legacyFiles.map(file => file.replace(/\\/g, '/')); // Path Normalization

        config.env.advancedFileList = getAdvancedFileList(); // List with normalized paths
      } catch (error) {
        console.error("Error reading XML files:", error);
        config.env.fileList = [];
        config.env.advancedFileList = [];
      }
      return config;
    }
  },
});