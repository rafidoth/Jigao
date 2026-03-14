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


## Migrations
Migration files are inside migrations/ in root. Using Goose for migration. Need to set environment variables before running Goose.
```
# Envs for migrations
GOOSE_DRIVER=postgres
GOOSE_DBSTRING=<DBSTRING>
GOOSE_MIGRATION_DIR=./migrations
```

```bash
# Create a new migration
goose create migration_name sql

# Run migrations up
goose up

# Rollback migrations
goose down
``` 
