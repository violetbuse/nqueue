# Server Package

This is the server package for the Quirrel-2 project.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Build the package:

```bash
npm run build
```

## Development

Start the development server with hot reload:

```bash
npm run dev
```

This will:

- Watch for changes in the `src` directory
- Automatically rebuild when files change
- Restart the server with the new build

## Production

Build for production:

```bash
npm run build
```

Start the production server:

```bash
npm start
```

## Available Scripts

- `npm run build` - Build the package
- `npm run dev` - Start development server with nodemon
- `npm run start` - Start production server
- `npm run check-types` - Run TypeScript type checking
- `npm run clean` - Clean build artifacts
- `npm run build:watch` - Watch mode for building

## Endpoints

- `GET /` - Root endpoint
- `GET /health` - Health check endpoint

## Environment Variables

- `PORT` - Server port (default: 3001)
- `NODE_ENV` - Environment (development/production)
