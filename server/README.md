# Quirrel 2

A TypeScript application with development setup using esbuild, nodemon, and concurrently.

## Development Setup

This project uses:

- **esbuild** for fast TypeScript compilation
- **nodemon** for automatic application restarting
- **concurrently** to run both build and dev processes simultaneously

## Available Scripts

- `npm run build` - Build the application once
- `npm run build:watch` - Build the application and watch for changes
- `npm run dev` - Start development mode (build + watch + nodemon)
- `npm start` - Run the built application

## Development Workflow

1. Start development mode:

   ```bash
   npm run dev
   ```

2. Make changes to your TypeScript files in the `src/` directory

3. The application will automatically:
   - Rebuild when you save changes
   - Restart the server when the build completes

## Project Structure

```
quirrel-2/
├── src/
│   └── index.ts          # Main application entry point
├── dist/                 # Built JavaScript files
├── esbuild.config.js     # esbuild configuration
├── nodemon.json          # nodemon configuration
├── package.json          # Dependencies and scripts
└── tsconfig.json         # TypeScript configuration
```

## Database

The project includes a PostgreSQL database configured via Docker Compose:

```bash
docker-compose up -d db
```

Database connection:

- Host: localhost
- Port: 5432
- User: postgres
- Password: postgres
