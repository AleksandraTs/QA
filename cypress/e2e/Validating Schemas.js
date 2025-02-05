/// <reference types="cypress" />

// Retrieve the list of legacy XML files from the Cypress environment.
// If fileList is not defined, use an empty array.
const fileList = Cypress.env('fileList') || [];

// Log the file list for debugging purposes.
console.log("Legacy file list from config:", fileList);

describe('Validate XML files in MITIM Editor', () => {
  // If no files are found, create a test that fails immediately.
  if (fileList.length === 0) {
    it("No XML files found in XML_files folder", () => {
      // Expect fileList to have at least one element.
      expect(fileList, "Expected at least one XML file").to.have.length.greaterThan(0);
    });
  } else {
    // For each file in the fileList, create an individual test.
    fileList.forEach((file) => {
      it(`Validates file: ${file}`, () => {
        // Construct the URL for the XML file located in the XML_files folder.
        const fileUrl = `http://127.0.0.1:8080/XML_files/${file}`;
        // Construct the editor URL by passing the file URL and document root as parameters.
        const editorUrl = `https://editor.mitim-s.com/?url=${fileUrl}&docRoot=http://127.0.0.1:8080/`;

        // Log the validation process for the current file.
        cy.log(`Validating file: ${file}`);
        // Visit the constructed editor URL.
        cy.visit(editorUrl);

        // Get the container that holds the "Validate XML" button,
        // with a timeout of 10 seconds to allow for dynamic loading.
        cy.get('div.toggle-button-div', { timeout: 10000 })
          // Within that container, find the <svg> element with data-testid="CheckCircleIcon".
          .find('svg[data-testid="CheckCircleIcon"]')
          .then(($button) => {
            // If the button is not found, simply end the test.
            if ($button.length === 0) {
              return;
            }
            // Log that the Validate XML button was found for this file.
            cy.log(`Validate XML button found for file: ${file}`);
            // Click the button.
            cy.wrap($button).click();
            // Wait for the dialog indicating that the document is valid (no validation errors),
            // with a timeout of 10 seconds.
            cy.contains("The document is valid. There are no validation errors.", { timeout: 10000 })
              .then(() => {
                // Log that the validation passed for the file.
                cy.log(`✔ Validation passed for ${file}: Dialog with valid message appeared`);
              });
          });
      });
    });
  }
});