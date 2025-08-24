# GitHub Calendar Next

A professional GitHub projects calendar view built with Next.js and FullCalendar. This application displays GitHub project issues in a beautiful, interactive calendar interface with modern glass-morphism design.

## Features

- 📅 **FullCalendar Integration** - Professional calendar library with event spanning
- 🎨 **Modern Design** - Glass-morphism effects with gradients and backdrop blur
- 🔍 **GitHub API Integration** - Fetches issues from GitHub projects with filtering
- 📱 **Responsive Design** - Works on desktop and mobile devices
- ⚡ **Performance Optimized** - Efficient data fetching and rendering
- 🎯 **Date Filtering** - Shows only issues from August 2025 onwards
- 🏷️ **Label Filtering** - Filters by "area: devrel-opensource" label

## Tech Stack

- **Framework**: Next.js 15 with React 19
- **Calendar**: FullCalendar v6
- **Styling**: Tailwind CSS v4 with custom CSS
- **API**: GitHub REST API via Octokit
- **TypeScript**: Full type safety
- **Date Handling**: date-fns

## Getting Started

1. **Clone the repository**
   ```bash
   git clone https://github.com/blackgirlbytes/github-calendar-next.git
   cd github-calendar-next
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file with your GitHub token:
   ```
   GITHUB_TOKEN=your_github_token_here
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Configuration

The calendar is currently configured to display issues from:
- **GitHub Project**: https://github.com/orgs/squareup/projects/333/views/3
- **Label Filter**: "area: devrel-opensource"
- **Date Range**: August 2025 onwards

You can modify these settings in the component files to match your project needs.

## Project Structure

```
src/
├── app/
│   ├── globals.css          # Global styles and FullCalendar customization
│   ├── layout.tsx           # Root layout component
│   └── page.tsx             # Main page with calendar
├── components/
│   └── FullCalendarComponent.tsx  # FullCalendar wrapper component
└── types/
    └── github.ts            # TypeScript type definitions
```

## Design Features

- **Glass-morphism Effects**: Backdrop blur and transparency
- **Gradient Backgrounds**: Modern color schemes with blue/indigo gradients
- **Interactive Elements**: Hover effects and smooth transitions
- **Professional Typography**: Clean fonts with proper hierarchy
- **Responsive Layout**: Adapts to different screen sizes

## API Integration

The application uses the GitHub REST API to fetch:
- Project issues with date ranges
- Issue labels and metadata
- Repository information
- Assignee details

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is open source and available under the [MIT License](LICENSE).

## Acknowledgments

- Built with [FullCalendar](https://fullcalendar.io/) for the calendar functionality
- Styled with [Tailwind CSS](https://tailwindcss.com/) for modern design
- Powered by [Next.js](https://nextjs.org/) for the React framework
