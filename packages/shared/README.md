# Shared Library

This package contains shared utilities, types, and functions that can be used across the monorepo.

## Installation

This package is part of the monorepo workspace and is automatically available to other packages in the workspace.

## Usage

```typescript
import { formatDate, isValidEmail, User, ApiResponse } from "shared";

// Use utility functions
const formattedDate = formatDate(new Date());
const isValid = isValidEmail("user@example.com");

// Use shared types
const user: User = {
  id: "1",
  email: "user@example.com",
  name: "John Doe",
  createdAt: new Date(),
  updatedAt: new Date(),
};
```

## Available Exports

### Utility Functions

- `formatDate(date: Date): string` - Format a date to locale string
- `isValidEmail(email: string): boolean` - Validate email format
- `debounce(func, wait)` - Debounce function calls
- `sleep(ms: number): Promise<void>` - Sleep for specified milliseconds
- `generateId(): string` - Generate a unique ID
- `capitalize(str: string): string` - Capitalize first letter
- `truncate(str: string, length: number): string` - Truncate string with ellipsis
- `formatBytes(bytes: number): string` - Format bytes to human readable size
- `isObject(value: any): boolean` - Check if value is an object
- `deepClone<T>(obj: T): T` - Deep clone an object

### Types

- `ApiResponse<T>` - Generic API response type
- `PaginatedResponse<T>` - Paginated API response type
- `User` - User entity type
- `BaseEntity` - Base entity with common fields
- `Status` - Status type for async operations
- `AsyncState<T>` - Async state management type

## Development

```bash
# Build the library
npm run build

# Watch for changes
npm run dev

# Type checking
npm run check-types

# Clean build artifacts
npm run clean
```

## Building

The library uses [tsup](https://github.com/egoist/tsup) for building and generates:

- CommonJS bundle (`dist/index.js`)
- ES Module bundle (`dist/index.mjs`)
- TypeScript declarations (`dist/index.d.ts`)
- Source maps for debugging
