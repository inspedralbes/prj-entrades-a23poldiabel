<!--
  SYNC IMPACT REPORT v1.0.0 → v1.1.0
  
  Version change: 1.0.0 → 1.1.0 (MINOR - New principles + technology stack update)
  
  Modified principles:
  - Technology Stack: Updated to reflect Nuxt 3, Node.js + Express, Socket.io
  
  Added sections:
  - VI. Server-Side Concurrency Management (new principle for seat locking)
  - VII. Catalan Language Standardization
  
  Templates requiring updates:
  - ⚠ plan-template.md - Language/Version fields should reflect Nuxt 3 + Node.js
  - ⚠ spec-template.md - no changes needed
  
  Deferred items:
  - None - all placeholders filled
-->

# Entrades Project Constitution

## Core Principles

### I. Component-First Architecture
Every feature MUST be implemented as reusable Vue components. Components MUST be self-contained, independently testable, and documented with prop definitions. Composables MUST extract reusable logic and follow the Composition API pattern.

### II. Responsive Design
All user interfaces MUST support mobile (320px+), tablet (768px+), and desktop (1024px+). Layouts MUST use flexible units (rem, %, viewport) and pass accessibility standards (WCAG 2.1 AA minimum).

### III. State Management
Global state MUST use Pinia stores with clear separation of concerns. State MUST be serializable for debugging. Mutations MUST follow synchronous patterns; async operations MUST use actions.

### IV. API-First Development
All backend contracts MUST be defined before implementation. API responses MUST follow consistent schema patterns. Error responses MUST include standardized error codes and user-friendly messages.

### V. Test-Driven Development
Tests MUST be written before implementation. Unit tests MUST achieve 80% coverage on core logic. Integration tests MUST verify user journeys end-to-end.

### VI. Server-Side Concurrency Management
Seat lock operations MUST be managed exclusively by the server. The server MUST handle race conditions for seat selection using atomic operations or optimistic locking. Client-side applications MUST NOT independently lock seats; they MUST request locks from the server and handle lock expiration gracefully.

### VII. Catalan Language Standardization
All code, comments, user interface text, and documentation MUST use Catalan. Variable names, function names, and commit messages MUST be in Catalan. User-facing messages MUST be clear, natural Catalan appropriate for the target audience.

## Technology Stack

The following technologies form the mandatory stack:

- **Backend**: Node.js amb Express
- **Frontend**: Nuxt 3 amb Vue 3 (Composition API `<script setup>`), TypeScript
- **Temps Real**: Socket.io per a comunicació en temps real
- **State Management**: Pinia
- **Routing**: Vue Router
- **Build Tool**: Vite
- **HTTP Client**: Axios o Fetch API amb gestió d'errors
- **Testing**: Vitest (unit), Playwright (e2e)
- **Styling**: CSS amb scoped styles o Tailwind CSS

All dependencies MUST be production-ready and actively maintained.

## Development Workflow

All changes MUST follow this workflow:

1. **Specification**: Create/update spec.md before coding
2. **Branch**: Create feature branch from main
3. **Implementation**: Write code following component-first pattern
4. **Testing**: Write tests first, ensure they fail, then implement
5. **Review**: Request code review before merging
6. **Deploy**: Deploy to staging for verification

Code review MUST verify compliance with constitution principles.

## Governance

This constitution supersedes all other practices. Amendments require:

- Documentation of the change
- Approval from project maintainer
- Migration plan if breaking changes needed
- Version bump following semantic versioning

All PRs and reviews MUST verify compliance with these principles.

**Version**: 1.1.0 | **Ratified**: 2026-03-24 | **Last Amended**: 2026-03-24
