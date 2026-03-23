# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Development Commands

### Running the Application
```bash
npm start
```
Starts the development server on http://localhost:3000. Note: Uses `--openssl-legacy-provider` flag for compatibility with older OpenSSL versions.

### Building for Production
```bash
npm run build
```
Creates an optimized production build in the `build/` directory.

### Running Tests
```bash
npm test
```
Launches Jest test runner in interactive watch mode.

### Running a Single Test
```bash
npm test -- --testNamePattern="test name pattern"
```
Or specify a file:
```bash
npm test path/to/test/file.js
```

## Project Architecture

### Tech Stack
- **Framework**: React 18 with Create React App
- **Routing**: React Router DOM v6
- **Styling**: Bootstrap 5, Material-UI (MUI), Emotion
- **HTTP Client**: Axios
- **Icons**: FontAwesome, React Icons, MUI Icons

### Directory Structure

**`src/App.js`**: Main application entry point that configures routing and renders the primary component (currently renders `<Product />` component).

**`src/index.js`**: React root setup with BrowserRouter wrapper.

**`src/Navigation.js`**: Bootstrap-based navigation bar component with routing to Home, Services, About, and Contact pages.

**`src/components/`**: Reusable UI components including:
- `product-card/`: E-commerce product display system with filtering and cart functionality
- `Note.js`, `CreateNotes.js`: Note-taking components with delete functionality
- `Button.js`: Reusable button wrapper component
- `Dashboard.js`: User dashboard with react-router navigation hooks
- `Search.js`, `SearchImage.js`: Search functionality components
- `Header.js`, `Footer.js`: Layout components
- `Context.js`: useEffect hook demonstration component
- `Error.js`: Error handling component

**`src/webComponents/`**: Page-level components for main application routes:
- `Home.jsx`: Landing page using Common component
- `About.js`, `Services.js`, `Contact.js`: Info pages
- `Err404.js`: 404 error page
- `Common.js`: Shared layout component for page templates
- `CardsDetails.jsx`, `Scards.jsx`: Card display components

**`src/Api.js`**: Example component demonstrating external API integration (Pokemon API).

### Key Architectural Patterns

**Component Routing**: Uses React Router v6 with declarative route configuration. Routes are currently commented out in App.js, with Product component being the active view.

**State Management**: Uses React hooks (useState, useEffect) for local component state. No global state management library is configured.

**API Integration**: Components use axios for HTTP requests with async/await pattern. See `src/components/product-card/index.js` for examples of:
- Fetching from multiple endpoints
- Category-based filtering
- Error handling with try/catch

**Cart System**: Shopping cart logic in `product-card/index.js` demonstrates:
- Array-based state management
- Quantity tracking
- Preventing duplicate entries with item.id comparison

**Component Composition**: `Common.js` component acts as a template for page layouts, accepting props for header, image, text, and button configuration.

## Important Configuration Notes

**OpenSSL Legacy Provider**: The start script uses `--openssl-legacy-provider` flag. This is required for compatibility with older Node.js versions and certain webpack configurations. If you encounter SSL-related errors, this flag is likely necessary.

**Environment Variables**: `.env` file contains `SKIP_PREFLIGHT_CHECK=true` to bypass Create React App dependency checks.

**Testing**: No test files currently exist in the codebase. When adding tests, follow Jest/React Testing Library conventions expected by Create React App.

## Code Patterns to Follow

**File Extensions**: Mix of `.js` and `.jsx` extensions. New React components should use `.jsx` for clarity.

**Optional Chaining**: Code extensively uses optional chaining (`?.`) for safe property access, especially with API responses.

**Inline Styles**: Some components use inline style objects (e.g., `Note.js`). Consider moving repeated styles to CSS files.

**API Response Handling**: Always use optional chaining and default values when accessing API response data:
```javascript
const products = response?.data?.products || [];
```

**Cart State Validation**: When working with cart state, always validate it's an array before operations:
```javascript
if (!Array.isArray(prevCart)) {
  return [{ ...product, quantity: 1 }];
}
```
