# Jigao

An AI-powered exam and question generation platform that helps users create, manage, and take practice exams based on their notes and study materials.

## Overview

Jigao streamlines the exam preparation process by leveraging AI to automatically generate practice questions from user-provided content. Whether you're a student preparing for exams or an educator creating assessments, Jigao transforms your study materials into interactive quizzes with immediate feedback and scoring.

## Features

### Question Generation
- **AI-Powered Generation** - Automatically generate questions from your notes, textbooks, or any text content
- **Multiple Question Types** - Support for MCQ, True/False, Fill in the Blanks, and Short Answer questions
- **Configurable Difficulty** - Choose between Easy, Medium, and Hard difficulty levels
- **Auto-Generated Explanations** - Each answer includes detailed explanations for better learning

### Question Sets Management
- Create, update, and organize question sets
- Visibility controls: Public, Private, or Restricted
- Share sets with other users via access control
- Store original context for future question generation

### Exams
- Create exams from existing question sets
- Schedule exams with specific start times and duration
- Real-time exam sessions via WebSocket
- Live exam status tracking (waiting, running, ended)
- Support for multiple participants

### Submissions & Grading
- Real-time answer submission during exams
- Automatic evaluation and scoring
- Detailed answer sheets with correct/incorrect indicators
- Comprehensive explanations for review

### User Management
- Secure authentication via Clerk
- User profiles with personalized settings

## Tech Stack

### Backend
| Component | Technology |
|-----------|------------|
| Language | Go 1.24 |
| HTTP Router | chi |
| Database | PostgreSQL (Neon) |
| WebSocket | gorilla/websocket |
| Authentication | Clerk |
| gRPC | google.golang.org/grpc |

### Frontend (React App)
| Component | Technology |
|-----------|------------|
| Framework | React 19 |
| Build Tool | Vite |
| Routing | React Router v7 |
| State Management | Zustand |
| Data Fetching | TanStack React Query |
| Styling | TailwindCSS |
| UI Components | Radix UI |
| Animation | Framer Motion |
| Authentication | Clerk React |

### AI Service
| Component | Technology |
|-----------|------------|
| Runtime | Node.js (TypeScript) |
| Framework | Express |
| AI/LLM | LangChain + Groq |
| Schema Validation | Zod |

### Landing Page
| Component | Technology |
|-----------|------------|
| Framework | Next.js |
| Styling | TailwindCSS |

## Project Structure

```
jigao/
├── main.go                 # Go backend entry point
├── server.go               # HTTP server and router setup
├── config/                 # Configuration management
├── db/                     # Database connection and migrations
├── internal/
│   ├── users/              # User module
│   ├── questions/          # Questions and sets module
│   ├── exams/              # Exams and WebSocket module
│   └── utils/              # Shared utilities
├── proto/                  # gRPC definitions
├── react-ts/               # React frontend (Vite)
├── jigao-ai/               # AI service (Express + LangChain)
├── ai/                     # Alternative gRPC AI service
└── web/                    # Landing page (Next.js)
```

## Getting Started

### Prerequisites

- Go 1.24+
- Node.js 18+
- PostgreSQL database
- API keys for:
  - [Clerk](https://clerk.com) - Authentication
  - [Groq](https://groq.com) - AI/LLM provider

### Environment Variables

#### Backend (.env in root)
```bash
DBSTRING=postgresql://user:password@host/database?sslmode=require
PORT=9999
CORS_ALLOWED_ORIGIN=http://localhost:5173
CLERK_SECRET_KEY=sk_test_your_clerk_secret_key
```

#### React Frontend (react-ts/.env)
```bash
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_publishable_key
```

#### AI Service (jigao-ai/.env)
```bash
PORT=3000
GROQ_API_KEY=gsk_your_groq_api_key
GO_BACKEND_URL=http://localhost:9999/api/v1
```

### Database Setup

Run the migrations against your PostgreSQL database:

```bash
# The migration files are located in db/migrations/
# up.sql - Creates all tables
# down.sql - Drops all tables
```

### Running Locally

#### Option 1: Using Zellij (Recommended)

This starts all services in a single terminal multiplexer session:

```bash
zellij -l jigao_zellij.kdl
```

#### Option 2: Manual Start

**1. Start the Go Backend**
```bash
# From project root
make server

# Or with hot-reload
air
```

**2. Start the React Frontend**
```bash
cd react-ts
npm install
npm run dev
```
The app will be available at `http://localhost:5173`

**3. Start the AI Service**
```bash
cd jigao-ai
npm install
npm run dev
```
The AI service will run at `http://localhost:3000`

**4. (Optional) Start the Landing Page**
```bash
cd web
npm install
npm run dev
```

### Docker

```bash
# Create Docker network
make net

# Build and run Go backend
make dev_build
make run

# Build and run AI service
make build_jigao_ai_image
make jrun
```

## API Endpoints

### Question Sets
- `GET /api/v1/sets/` - Get recent sets
- `POST /api/v1/sets/` - Create new set
- `GET /api/v1/sets/{set_id}` - Get a set
- `PUT /api/v1/sets/{set_id}` - Update a set
- `DELETE /api/v1/sets/{set_id}` - Delete a set
- `POST /api/v1/sets/gen` - Generate questions via AI

### Exams
- `GET /api/v1/exams/` - Get all exams
- `POST /api/v1/exams/` - Create exam from a set
- `GET /api/v1/exams/{exam_id}` - Get exam by ID
- `GET /api/v1/exams/join/{room_id}` - WebSocket join exam room

### Submissions
- `GET /api/v1/submissions/{exam_id}` - Get submission results

## License

MIT
