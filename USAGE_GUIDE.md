# Innovatehub API Generator Usage Guide

This guide provides detailed instructions on how to use the Innovatehub API Generator to record your browser interactions and generate automation scripts and APIs.

## Table of Contents

- [Recording Interactions](#recording-interactions)
- [Viewing and Managing Recordings](#viewing-and-managing-recordings)
- [Generating Automation Scripts](#generating-automation-scripts)
- [Exporting APIs](#exporting-apis)
- [Deploying Your Automation](#deploying-your-automation)

## Recording Interactions

1.  **Start Recording**: Click the "Start Recording" button in the "Browser Recorder" panel. The recorder will enter the "Recording" state.

2.  **Perform Actions**: In a new browser tab or window, perform the actions you want to automate. The recorder will capture the following interactions:
    -   Navigating to a URL
    -   Clicking on elements
    -   Typing into input fields
    -   Scrolling the page

3.  **Stop Recording**: Once you have completed the desired actions, return to the Innovatehub API Generator and click the "Stop Recording" button. The recorder will then process the captured interactions.

## Viewing and Managing Recordings

-   **Recordings List**: The "Recorded Automations" panel displays a list of all your recordings. Each recording shows its status (e.g., "Completed", "Processing"), the date and time of recording, and the number of captured actions.

-   **Selecting a Recording**: Click on a recording in the list to view its details, including the generated automation scripts and API export options.

## Generating Automation Scripts

Once a recording is processed, the "Generated Scripts" panel will display the automation scripts in various formats:

-   **Playwright (Enhanced)**: An AI-optimized Playwright script with added error handling and best practices.
-   **Playwright (Basic)**: A basic Playwright script generated directly from the recorded interactions.
-   **Puppeteer**: A script for the Puppeteer automation framework.
-   **Cypress**: A script for the Cypress testing framework.

You can switch between the different script formats using the tabs. You can also copy the script to your clipboard or download it as a file.

## Exporting APIs

In addition to scripts, you can export your automation as a ready-to-use REST API.

1.  **API Export Tab**: Click on the "API Export" tab to view the API generation options.

2.  **API Formats**: The application can generate APIs for the following frameworks:
    -   Express.js (Node.js)
    -   FastAPI (Python)
    -   Flask (Python)

3.  **OpenAPI Specification**: An OpenAPI (Swagger) specification is also generated for your API, which you can use to generate client libraries or for API documentation.

4.  **Usage Examples**: The "Usage Examples" section provides code snippets in cURL, JavaScript, and Python to help you get started with your new API.

## Deploying Your Automation

The "Deployment Options" section provides configurations to deploy your automation API to various platforms:

-   **Docker**: A `Dockerfile` to containerize your API.
-   **Kubernetes**: A Kubernetes deployment and service configuration.
-   **Vercel**: A `vercel.json` file for deploying to Vercel.
-   **Railway**: A `railway.json` file for deploying to Railway.

Simply copy the configuration and follow the platform-specific instructions to deploy your automation API.

