# GitHub Calendar Demo

## Quick Start

1. **Set up your GitHub token**:
   ```bash
   cp .env.example .env.local
   # Edit .env.local and add your GitHub token
   ```

2. **Install dependencies and run**:
   ```bash
   npm install
   npm run dev
   ```

3. **Open your browser**: http://localhost:3000

## What You'll See

The application will display:
- A monthly calendar view
- GitHub issues from the Square organization's project board
- Issues filtered by the "area: devrel-opensource" label
- Only issues created from August 2025 onwards
- Issues spanning multiple days will show as bars across the calendar
- Click on any issue to view details or open in GitHub

## Features Demonstrated

### Performance Optimizations
- **Date Filtering**: Only fetches issues from August 2025 onwards
- **Label Filtering**: Server-side filtering by "area: devrel-opensource" label
- **Pagination**: Handles large datasets efficiently
- **Lazy Loading**: Data is fetched on-demand

### Visual Spanning
- Issues with start and end dates span across multiple calendar days
- Uses `getBoundingClientRect` for precise positioning
- Responsive design that adapts to different screen sizes

### GitHub Integration
- Uses GitHub's GraphQL API for efficient data fetching
- Fetches project board data, field values, labels, and assignees
- Real-time data from the actual Square organization project board

## Test Data

Since this connects to the real Square organization project board, you'll see actual issues if they exist with the specified label and date criteria. If no issues are found, the calendar will be empty but functional.

## Error Handling

The application includes comprehensive error handling:
- Authentication errors with helpful messages
- Network errors with retry options
- Missing data gracefully handled
- Loading states for better UX

## API Endpoints

- `GET /api/events` - Fetches calendar events
- Query parameters:
  - `org` - GitHub organization (default: squareup)
  - `project` - Project number (default: 333)
  - `since` - ISO date string for filtering (default: 2025-08-01)

## Example API Call

```bash
curl "http://localhost:3000/api/events?org=squareup&project=333&since=2025-08-01T00:00:00Z"
```
