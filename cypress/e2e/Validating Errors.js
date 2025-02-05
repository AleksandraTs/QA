/// <reference types="cypress" />

// Retrieve the advanced file list from Cypress environment.
// Each item is an object with properties:
//   - file: relative path to the XML file (e.g. "45 errors/filename.xml")
//   - expectedErrors: number of errors (parsed from the folder name)
const advancedFileList = Cypress.env('advancedFileList') || [];

// Log the advanced file list for debugging purposes.
console.log("Advanced file list from config:", advancedFileList);

// Group files by their parent folder (the first segment of the file path)
const groupedFiles = advancedFileList.reduce((acc, item) => {
  const folderName = item.file.split('/')[0];
  if (!acc[folderName]) {
    acc[folderName] = [];
  }
  acc[folderName].push(item);
  return acc;
}, {});

describe('Errors after Validation', () => {
  if (advancedFileList.length === 0) {
    it("No XML files found in error folders", () => {
      expect(advancedFileList, "Expected at least one XML file").to.have.length.greaterThan(0);
    });
  } else {
    // For each folder (group) create a separate describe block.
    Object.keys(groupedFiles).forEach(folderName => {
      describe(`Folder: ${folderName}`, () => {
        groupedFiles[folderName].forEach((item) => {
          const { file, expectedErrors } = item;
          it(`Validates file: ${file} (expected errors: ${expectedErrors})`, () => {
            // Construct the URL for the XML file.
            const fileUrl = `http://127.0.0.1:8080/${file}`;
            // Construct the editor URL with the file URL as a parameter.
            const editorUrl = `https://editor.mitim-s.com/?url=${fileUrl}&docRoot=http://127.0.0.1:8080/`;

            cy.log(`Validating file: ${file} with expected errors: ${expectedErrors}`);
            cy.visit(editorUrl);

            // Find the container that holds the "Validate XML" button.
            cy.get('div.toggle-button-div', { timeout: 30000 })
              .find('svg[data-testid="CheckCircleIcon"]')
              .then(($button) => {
                if ($button.length === 0) {
                  // If no validation button is found:
                  if (expectedErrors === 0) {
                    // For files with 0 errors, check directly for the dialog.
                    cy.contains("The document is valid. There are no validation errors.", { timeout: 10000 })
                      .then(() => {
                        cy.log(`✔ Validation passed for ${file}: Dialog with valid message appeared`);
                      });
                  } else {
                    // If errors are expected but button not found – fail the test.
                    throw new Error(`Validation button not found for file: ${file} with expected errors: ${expectedErrors}`);
                  }
                } else {
                  cy.log(`Validate XML button found for file: ${file}`);
                  // Force the click to ensure it registers.
                  cy.wrap($button).click({ force: true });

                  // Check the result based on expected error count.
                  if (expectedErrors === 0) {
                    cy.contains("The document is valid. There are no validation errors.", { timeout: 10000 })
                      .then(() => {
                        cy.log(`✔ Validation passed for ${file}: Dialog with valid message appeared`);
                      });
                  } else {
                    cy.get('span.MuiBadge-badge', { timeout: 10000 })
                      .should('be.visible')
                      .invoke('text')
                      .then((errorText) => {
                        cy.log(`Error text for ${file}: ${errorText}`);
                        const errorCount = parseInt(errorText.trim(), 10);
                        expect(errorCount).to.eq(expectedErrors);
                        cy.log(`✔ Validation passed for ${file}: Expected error count ${expectedErrors} matched actual ${errorCount}`);
                      });
                  }
                }
              });
          });
        });
      });
    });
  }
});
