# Jigao Product Overview

## What is Jigao?

Jigao is an end-to-end virtual examination platform that helps educators, institutions, and training teams run high-quality online exams with confidence. It combines AI-assisted question authoring, question set management, exam scheduling, real-time exam delivery, and proctoring workflows in one system.

The core idea is simple: create better assessments faster, deliver them reliably at scale, and preserve exam integrity in remote environments.

## The Problem Jigao Solves

Most online assessment setups are fragmented. Teams usually stitch together multiple tools for content creation, test delivery, monitoring, and grading. This creates several problems:

- Slow exam preparation due to manual question writing and formatting
- Inconsistent question quality and weak coverage across difficulty levels
- Operational overhead when scheduling and coordinating large concurrent exams
- Limited trust in remote exam integrity (tab switching, focus loss, suspicious browser behavior)
- Delayed feedback loops because grading and review are not unified
- Poor participant and invigilator experience due to disconnected systems

Jigao addresses these by consolidating the entire exam lifecycle into one workflow-driven platform.

## Who It Is For

- Schools, colleges, and universities running online or hybrid assessments
- EdTech platforms delivering practice tests or certification prep
- Corporate L&D teams conducting compliance or skill evaluation exams
- Coaching centers managing mock exams at scale
- Independent educators creating structured, repeatable online tests

## Product Vision

Jigao aims to become the operating system for trustworthy online assessments: intelligent in content creation, robust in delivery, and transparent in monitoring.

## Core Product Modules

## 1) AI-Assisted Question Creation

Jigao uses AI to transform source content (notes, study materials, context text) into exam-ready questions.

Key capabilities:

- Generate multiple question types (MCQ, True/False, Fill in the Blanks, Short Answer)
- Configure question difficulty (easy, medium, hard)
- Produce structured answers and explanations for learning reinforcement
- Speed up initial draft creation while allowing human review and refinement

## 2) Question Set Management

Question sets act as reusable assessment assets.

Key capabilities:

- Create and organize question sets by topic/course/module
- Store context used for question generation
- Control access and collaboration via visibility settings:
  - public
  - private
  - restricted
- Share sets with specific users for co-authoring or oversight

## 3) Exam Creation and Scheduling

Exams are created from approved question sets and configured with timing and access controls.

Key capabilities:

- Define exam title, description, start time, and duration
- Run one-to-many exam sessions with concurrent participants
- Support different exam start modes:
  - lobby start (proctor manually starts when ready)
  - timed start (auto-start at configured start time)

## 4) Real-Time Exam Session Delivery

Jigao delivers synchronized exam sessions so participants can take exams in parallel once started.

Key capabilities:

- Real-time room/session model for exam participation
- Participant join options:
  - by exam ID
  - by invite link/code
- Live session state transitions (waiting, live, finished)
- Resilient answer flow with real-time auto-save

## 5) Proctoring and Monitoring

Jigao includes built-in proctoring primitives designed for practical remote invigilation.

Key capabilities:

- Proctor/controller role for live oversight
- Browser behavior event monitoring (e.g., tab switching, focus loss)
- Violation logging with participant-level counters
- Real-time visibility of suspicious behavior to proctors
- Proctor-led intervention model (warn or terminate participant)

Camera monitoring direction (no recording storage in initial phase):

- Support planning for both modes:
  - periodic snapshots (lighter implementation)
  - live stream architecture (advanced path)
- Permission-aware camera checks and status reporting
- Camera status surfaced to proctors in real time

## 6) Submission, Evaluation, and Review

Jigao closes the loop from attempt to insight.

Key capabilities:

- Persist participant answers during exam runtime
- Final submission and automatic evaluation pipeline
- Score generation and answer-sheet-level correctness details
- Faster post-exam analysis for students and instructors

## Value Proposition

Jigao delivers value across speed, reliability, integrity, and learning outcomes.

- Faster exam creation: AI reduces manual authoring time dramatically
- Better content quality: structured generation + editor control
- Stronger integrity: real-time proctoring signals for remote exams
- Operational simplicity: one platform from question to result
- Better exam-day reliability: live sessions + auto-save answer flow
- Better learner feedback: quicker scoring and answer-level insight

## Why Jigao Is Different

- End-to-end scope rather than a single-point tool
- AI-native authoring integrated directly into exam operations
- Proctoring-aware architecture built into session lifecycle
- Configurable exam-start and access patterns for different institutions
- Designed for concurrent, real-time exam participation

## Key Product Principles

- Trust first: preserve exam integrity in distributed environments
- Human-in-control: proctors make critical enforcement decisions
- Assist, not replace: AI accelerates authoring while humans validate quality
- Reliability at runtime: prioritize stable sessions and data safety (auto-save)
- Privacy-aware rollout: no camera recording retention in initial release

## Current Platform Scope

Jigao currently covers:

- Authentication and user identity flows
- Set and question management
- Exam creation and retrieval
- Submission and evaluation foundations
- Ongoing proctoring-oriented schema and session architecture work

## Future Product Directions

Potential roadmap extensions:

- Advanced proctor analytics and risk scoring
- Institution-level dashboards and reporting
- Enhanced anti-cheat signals (device/network behavior correlations)
- Rubric-based grading for subjective answers
- Integrations with LMS and SIS platforms
- Multi-tenant org/admin controls and audit logs

## One-Line Positioning

Jigao is an AI-powered virtual exam platform that unifies question generation, exam delivery, real-time proctoring, and evaluation into a single trusted workflow.
