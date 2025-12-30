# babysitter-app
CS 260A/160 Group P - Babysitter/Parent Communication App

## Getting Started

### Prerequisites
- Node.js (v14 or higher recommended)
- npm (comes with Node.js)

### Installation

1. Navigate to the web directory:
```bash
cd web
```

2. Install dependencies:
```bash
npm install
```

### Running the Development Server

To start the development server, run:

```bash
npm run dev
```

The app will be available at `http://localhost:5173` (or the port shown in the terminal output).

### Building for Production

To create a production build:

```bash
npm run build
```

The built files will be in the `dist/` directory.

### Preview Production Build

To preview the production build locally:

```bash
npm run preview
```

## Features

- Child profile management with CSV-based storage
- Activity logging (nap, diaper, meal) with time tracking
- Roll call feature to track present children
- Bulk activity logging for all present children
- Parent phone number management
- Multi-language parent reports with AI translation
- Alert system for emergency notifications
