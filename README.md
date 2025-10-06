# Innovatehub API Generator

**Developed by BossM**

Innovatehub API Generator is a powerful web application that records your browser interactions and automatically generates automation scripts and APIs. This tool is designed to eliminate repetitive manual browsing tasks by converting them into executable automations, saving you time and effort.

## Features

- **Real-time Interaction Recording**: Captures your actions in the browser, including clicks, typing, navigation, and scrolling.
- **AI-Powered Script Generation**: Uses advanced AI to analyze your recorded interactions and generate clean, reliable automation scripts.
- **Multiple Framework Support**: Generates scripts for popular automation frameworks like Playwright, Puppeteer, Selenium, and Cypress.
- **API Export**: Converts your automations into ready-to-use REST APIs with support for Express.js, FastAPI, and Flask.
- **Deployment Options**: Provides deployment configurations for Docker, Kubernetes, Vercel, and Railway to get your automation APIs up and running quickly.
- **Intuitive User Interface**: A modern and easy-to-use interface for recording, managing, and viewing your automations.

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- npm

### Installation and Setup

1.  **Clone the repository:**

    ```bash
    git clone <repository-url>
    cd browser-automation-webapp
    ```

2.  **Install backend dependencies:**

    ```bash
    cd backend
    npm install
    ```

3.  **Install frontend dependencies:**

    ```bash
    cd ../frontend
    npm install
    ```

### Running the Application

1.  **Start the backend server:**

    ```bash
    cd backend
    npm run dev
    ```

    The backend server will start on `http://localhost:3001`.

2.  **Start the frontend development server:**

    ```bash
    cd ../frontend
    npm run dev
    ```

    The frontend application will be accessible at `http://localhost:5173`.

## Usage Guide

For a detailed guide on how to use the Innovatehub API Generator, please refer to the [USAGE_GUIDE.md](USAGE_GUIDE.md) file.

## Project Structure

```
/browser-automation-webapp
├── /backend
│   ├── /services
│   │   ├── aiService.js
│   │   ├── scriptGenerator.js
│   │   └── apiExportService.js
│   ├── /routes
│   │   └── apiExport.js
│   ├── server.js
│   └── package.json
├── /frontend
│   ├── /src
│   │   ├── /components
│   │   ├── /services
│   │   ├── App.jsx
│   │   └── ...
│   └── ...
└── README.md
```

-   **backend**: The Node.js server that handles recording processing, AI-powered script generation, and API exporting.
-   **frontend**: The React application that provides the user interface for recording and managing automations.

## Contributing

Contributions are welcome! Please feel free to submit a pull request or open an issue to discuss any changes.

## License

This project is licensed under the MIT License.

