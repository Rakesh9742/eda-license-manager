# EDA License Insight Frontend

React-based frontend for the EDA License Manager UI, built with TypeScript, Vite, and shadcn/ui components.

## Features

- Real-time license monitoring dashboard
- Multi-vendor support (Cadence, Synopsys, Mentor Graphics/Siemens)
- Interactive license cards with usage statistics
- Detailed vendor-specific views
- Search and filter functionality
- Responsive design with modern UI
- Auto-refresh capabilities

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   Create a `.env` file in the frontend directory:
   ```env
   VITE_API_URL=http://localhost:3001/api
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Build for production:**
   ```bash
   npm run build
   ```

## Project Structure

```
src/
├── components/          # shadcn/ui components
├── frontend/
│   └── components/     # Custom components
│       ├── Dashboard.tsx
│       ├── LicenseCard.tsx
│       ├── LicenseTable.tsx
│       └── VendorDetails.tsx
├── hooks/              # Custom React hooks
│   └── useLicenses.ts
├── services/           # API services
│   └── api.ts
├── pages/              # Page components
└── App.tsx            # Main app component
```

## Components

### Dashboard
Main dashboard component that displays:
- Overview cards for each vendor
- System statistics
- Health status indicators
- Tabbed interface for detailed views

### LicenseCard
Individual license card showing:
- Vendor name and icon
- License usage statistics
- Progress indicators
- Status badges

### LicenseTable
Comprehensive table showing:
- All license features across vendors
- Usage percentages and status
- Search and filter capabilities
- Real-time data updates

### VendorDetails
Detailed vendor-specific view with:
- Server status information
- Vendor daemon status
- Feature-by-feature breakdown
- Active user sessions

## API Integration

The frontend communicates with the backend through:
- RESTful API endpoints
- Real-time data fetching with React Query
- Automatic refresh intervals
- Error handling and loading states

## Styling

Built with:
- Tailwind CSS for styling
- shadcn/ui for component library
- Custom gradients and animations
- Responsive design patterns

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Key Technologies

- React 18 with TypeScript
- Vite for build tooling
- React Query for data fetching
- React Router for navigation
- Lucide React for icons
- Tailwind CSS for styling

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Performance

- Optimized bundle size
- Lazy loading for components
- Efficient re-rendering with React Query
- Responsive images and assets
