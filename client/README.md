# Events POS - Frontend

React-based Progressive Web App (PWA) for the Events POS system.

## Features

- ✅ React 18 with Vite
- ✅ React Router for navigation
- ✅ PWA support with offline capabilities
- ✅ Socket.io for real-time updates
- ✅ Responsive design
- ✅ Authentication & role-based access
- ✅ All core pages implemented

## Setup

### Install Dependencies

```bash
cd client
npm install
```

### Development

```bash
npm run dev
```

Frontend will run on `http://localhost:5173`

### Build for Production

```bash
npm run build
```

Output will be in `client/dist/` directory.

## Configuration

The frontend connects to the backend API. Make sure:

1. Backend is running on `http://localhost:3000`
2. Or set `VITE_API_URL` environment variable

Create `.env` file:

```env
VITE_API_URL=http://localhost:3000/api
```

## Pages

- **Login** - User authentication
- **Dashboard** - Overview with stats
- **POS** - Point of sale interface
- **Orders** - View and manage orders
- **Reports** - Sales reports (item & staff)
- **Users** - User management (admin only)
- **Inventory** - Item management (admin only)
- **Transfers** - Transfer items (admin only)

## Project Structure

```
client/
├── src/
│   ├── components/      # Reusable components
│   ├── contexts/        # React contexts (Auth, Socket)
│   ├── pages/          # Page components
│   ├── services/       # API client
│   ├── App.jsx         # Main app component
│   └── main.jsx        # Entry point
├── public/             # Static assets
└── vite.config.js      # Vite configuration
```

## Offline Support

The app includes:
- Service Worker (via Vite PWA plugin)
- Offline request queueing
- IndexedDB support (ready for implementation)

## Next Steps

1. ✅ Basic frontend structure complete
2. ⏳ Enhanced offline sync with IndexedDB
3. ⏳ Print integration
4. ⏳ Enhanced error handling
5. ⏳ Loading states and animations

