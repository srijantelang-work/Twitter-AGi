# Twitter Voice-AI Survey System

A modern web application for creating and managing Twitter surveys with voice AI integration. Built with Next.js, TypeScript, Tailwind CSS, and Supabase.

## Features

- 🔐 **Google OAuth Authentication** - Secure login with Google accounts
- 📊 **Protected Dashboard** - Secure admin dashboard for authenticated users
- 🎯 **Survey Management** - Create and manage Twitter surveys
- 🎤 **Voice AI Integration** - Collect and process voice responses
- 📱 **Responsive Design** - Modern, mobile-first UI built with Tailwind CSS
- 🚀 **Next.js 14** - Built with the latest Next.js App Router
- 🔒 **Route Protection** - Middleware-based authentication for secure routes

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Authentication**: Supabase Auth with Google OAuth
- **Database**: Supabase (PostgreSQL)
- **Styling**: Tailwind CSS
- **State Management**: React Context API

## Prerequisites

Before you begin, ensure you have the following:

- Node.js 18+ installed
- npm or yarn package manager
- Google Cloud Console account (for OAuth)
- Supabase account and project

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
# Navigate to the project directory
cd twitter

# Install dependencies
npm install
```

### 2. Environment Configuration

1. Copy the environment template:
```bash
cp .env.local.example .env.local
```

2. Fill in your environment variables in `.env.local`:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Google OAuth Configuration
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Twitter API Configuration
TWITTER_API_KEY=your_twitter_api_key
TWITTER_API_SECRET=your_twitter_api_secret
TWITTER_ACCESS_TOKEN=your_twitter_access_token
TWITTER_ACCESS_TOKEN_SECRET=your_twitter_access_token_secret
```

### 3. Supabase Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Enable Authentication in your Supabase dashboard
3. Configure Google OAuth provider:
   - Go to Authentication > Providers
   - Enable Google provider
   - Add your Google OAuth credentials
4. Copy your project URL and anon key to `.env.local`

### 4. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Create OAuth 2.0 credentials:
   - Go to APIs & Services > Credentials
   - Click "Create Credentials" > "OAuth 2.0 Client IDs"
   - Set application type to "Web application"
   - Add authorized redirect URIs:
     - `http://localhost:3000/auth/callback` (development)
     - `https://yourdomain.com/auth/callback` (production)
5. Copy Client ID and Client Secret to `.env.local`

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── dashboard/         # Protected dashboard page
│   ├── login/            # Authentication page
│   ├── globals.css       # Global styles
│   ├── layout.tsx        # Root layout with AuthProvider
│   └── page.tsx          # Landing page
├── contexts/              # React contexts
│   └── AuthContext.tsx   # Authentication context
├── lib/                   # Utility libraries
│   └── supabase/         # Supabase client configurations
│       ├── client.ts     # Browser client
│       └── server.ts     # Server-side client
└── middleware.ts          # Authentication middleware
```

## Authentication Flow

1. **Landing Page**: Users see the main landing page
2. **Login**: Click "Sign In" to access Google OAuth
3. **OAuth Redirect**: Google handles authentication
4. **Callback**: Supabase processes the OAuth response
5. **Dashboard**: Authenticated users are redirected to the protected dashboard
6. **Route Protection**: Middleware ensures only authenticated users access protected routes

## Protected Routes

The following routes require authentication:
- `/dashboard` - Main user dashboard
- `/admin` - Admin panel (future)
- `/surveys` - Survey management (future)

## Development

### Available Scripts

```bash
# Development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint

# Type checking
npm run type-check
```

### Code Style

- Follow TypeScript best practices
- Use functional components with hooks
- Keep components small and focused
- Follow Tailwind CSS conventions
- Implement proper error handling

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy automatically on push

### Other Platforms

The app can be deployed to any platform that supports Next.js:
- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key | Yes |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Google OAuth client ID | Yes |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | Yes |
| `TWITTER_API_KEY` | Twitter API key | No (future) |
| `TWITTER_API_SECRET` | Twitter API secret | No (future) |
| `TWITTER_ACCESS_TOKEN` | Twitter access token | No (future) |
| `TWITTER_ACCESS_TOKEN_SECRET` | Twitter access token secret | No (future) |

## Troubleshooting

### Common Issues

1. **Authentication not working**: Check your Supabase and Google OAuth configuration
2. **Build errors**: Ensure all environment variables are set
3. **TypeScript errors**: Run `npm run type-check` to identify issues
4. **Styling issues**: Verify Tailwind CSS is properly configured

### Getting Help

- Check the [Next.js documentation](https://nextjs.org/docs)
- Review [Supabase documentation](https://supabase.com/docs)
- Check [Tailwind CSS documentation](https://tailwindcss.com/docs)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Roadmap

See [roadmap.md](./roadmap.md) for detailed development plans and milestones.
