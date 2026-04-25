# Jigao
Jigao is a collaborative, AI-enhanced examination platform designed for modern educators and learners who demand both flexibility and integrity. Unlike traditional rigid quiz tools, Jigao bridges the gap between honest, peer-to-peer learning and secure, proctored assessments.

Built for adaptability, Jigao allows educators to create dynamic question sets, collaborate with co-teachers, manage access permissions, and conduct exams in three distinct modes : Friendly, Protected, and Public—each tailored for different trust levels and monitoring requirements.

With integrated AI assistance for question generation, auto-grading of objective items, and assisted grading for short answers, Jigao reduces administrative overhead while maintaining academic excellence. Whether you need a no-stakes practice test for an individual student or a live-monitored exam with screen and webcam oversight, Jigao provides a unified, real-time environment that respects both honesty and accountability.


# Tech
Backend : Golang, Chi Router, pgx (PostgreSQL), Gorilla WS, Zerolog
Frontend : React 19, Vite, React Router v7, React Query, Tailwind, Shadcn 
Landing Page : Nextjs


## Feature List 

# Questions Making & Organization

#### Making question sets and managing them

1. Creating Empty Question Set
2. Deleting Question Set
3. Updating Question Set Properties
4. Filtering sets 
    - Created By
    - Visibility
5. Searching Sets
    - use @ to get sets created by persons
    - search title text
6. Sorting Sets
    - Last Modified
    - Visibility

#### Question Set Access

1. Share Access of a Question Set with other User 
    - it gives **Access** to managing exams under this question set also.
    - Send Invite by User’s email
    
    **Use Case** : Two or more teacher can collaboratively build a question set, be controller of exams, monitor students exam etc. 
    

#### Questions Management

1. Add new question to a set . Currently 4 types that covers most. 
    - Multiple Choice Questions ( Single Correct Answer)  **Auto Gradable**
    - Fill In the Blanks ( Multiple Correct answer acceptance) **Auto Gradable**
    - True False **Auto Gradable**
    - Short Question Answer **Not Auto Gradable**
2. Remove a question
3. Edit Question Properties (Question Text, Difficulty, Choices, Answer Explanation, Reordering)

# Real Time Exam

#### Friendly Exam

group of honest learners (ideally 2-5 people) who all have access to a particular question set. Now they want to conduct an exam among themselves. As they all have question set access they can view the questions if they want (that’s not fair though) but it creates a same page understanding between them. 

- Only Users having set access can attend
- No monitoring system, so everyone is participant

#### Protected Exam

- Two types of user role :
    - **Controller** : Monitors Exam (Users who have set access)
    - **Participant** : Attend Exam ( Users invited or join request accepted by any controller to attend exam)
- Participants are invited by monitors via mentioning user(email)
- Participants can send **Exam Join Request** from exam page and Request can be accepted by any controller.

#### Public Exam

(almost same as Protected Exams, Roles are same)

- any one can join (no request system or invite system)

#### Exam Monitoring System

1. Participant leaving Exam Tab Count
2. Participant Using operating system (get the idea of participant using desktop or not)
3. participant’s window size
4. participant’s screen share view (no persistent recording)
5. participant’s web cam view (no persistent recording)

# Practice Tests (Self Tests)

1. Practice Test for individuals who has access to a set or created one
2. not shared between multiple users

# AI Assistance

1. Question set generation from pdf or prompts
2. In a question set AI assistant can add or edit questions by following prompt instructions (no access to remove)
3. Grading Non deterministic questions like short question based on estimated answer or general knowledge

# Users

- Google Login Flow (OAuth Flow)
    
    (currently connected with clerk auth


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
