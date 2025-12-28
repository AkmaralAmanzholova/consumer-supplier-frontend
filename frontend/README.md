# Frontend Application

A React application built with Vite, Material-UI, and React Router for managing a business dashboard with authentication, orders, complaints, users, and more.

## Prerequisites

Before you begin, ensure you have the following installed on your system:

- **Node.js** (version 18.x or higher recommended)
- **npm** (comes with Node.js) or **yarn**

You can check if you have these installed by running:
```bash
node --version
npm --version
```

If you don't have Node.js installed, download it from [nodejs.org](https://nodejs.org/).

## Installation

1. **Navigate to the frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

   This will install all the required packages listed in `package.json`, including:
   - React and React DOM
   - Material-UI components
   - React Router for navigation
   - Vite for build tooling
   - ESLint for code linting

## Configuration

### Environment Variables (Optional)

The application uses an environment variable for the API URL. By default, it connects to `http://localhost:8000`.

If you need to change the API URL, create a `.env` file in the `frontend` directory:

```bash
VITE_API_URL=http://localhost:8000
```

Replace `http://localhost:8000` with your backend API URL if it's running on a different port or host.

**Note:** Environment variables in Vite must be prefixed with `VITE_` to be accessible in the application.

## Running the Application

### Development Mode

To start the development server with hot module replacement (HMR):

```bash
npm run dev
```

The application will be available at `http://localhost:5173` (or another port if 5173 is occupied). The terminal will display the exact URL.

The development server will automatically reload when you make changes to the code.

### Production Build

To create a production build:

```bash
npm run build
```

This will create an optimized production build in the `dist` directory.

### Preview Production Build

To preview the production build locally:

```bash
npm run preview
```

This serves the production build locally so you can test it before deployment.

## Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build the application for production
- `npm run preview` - Preview the production build locally
- `npm run lint` - Run ESLint to check for code issues

## Project Structure

```
frontend/
├── src/
│   ├── auth/          # Authentication context and protected routes
│   ├── components/    # Reusable React components
│   ├── pages/         # Page components (Dashboard, Orders, etc.)
│   ├── utils/         # Utility functions (API helpers, etc.)
│   └── main.jsx       # Application entry point
├── public/            # Static assets
├── dist/              # Production build output (generated)
├── package.json       # Dependencies and scripts
└── vite.config.js     # Vite configuration
```

## Troubleshooting

### Port Already in Use

If port 5173 is already in use, Vite will automatically try the next available port. You can also specify a different port:

```bash
npm run dev -- --port 3000
```

### Dependencies Issues

If you encounter issues with dependencies:

1. Delete `node_modules` folder and `package-lock.json`:
   ```bash
   rm -rf node_modules package-lock.json
   ```

2. Clear npm cache (optional):
   ```bash
   npm cache clean --force
   ```

3. Reinstall dependencies:
   ```bash
   npm install
   ```

### Backend Connection Issues

Make sure your backend server is running on the configured port (default: `http://localhost:8000`). Check the backend README for instructions on how to start the backend server.

## Technologies Used

- **React 19** - UI library
- **Vite** - Build tool and dev server
- **Material-UI (MUI)** - Component library
- **React Router** - Client-side routing
- **ESLint** - Code linting

## Development Notes

- The application uses localStorage for token-based authentication
- API requests are handled through the `apiRequest` utility function in `src/utils/api.js`
- Protected routes are managed through the `ProtectedRoute` component
- The app supports role-based access control (detected via `useRoleDetection` hook)
