# Frontend - Component and Test-Driven Development

## Implementation Plan

### 1. Set Up TDD Component Structure
- Use feature-based folder structure (/components & /features)
- Each component has co-located .tsx, .stories.tsx, .test.tsx files
- Define Zod schemas first, derive TypeScript types from schemas
- Comprehensive BaseComponentProps system with options objects pattern
- Storybook integration for docs
- TDD for both components AND features (Red-Green-Refactor)

### 2. TDD Core UI Components
- Write failing tests first using React Testing Library
- Form components with built-in validation (schema-driven)
- Secure input components with XSS prevention (behavior tested)
- Loading states and error boundaries (user interaction tests)
- Toast notifications for user feedback (observable behavior tests)
- Test user-visible behavior only, never implementation details

### 3. TDD API Layer Implementation
- Write API behavior tests first
- Create API client with axios interceptors (centralized calls)
- Add request/response encryption for sensitive data
- Implement token refresh logic
- Add request retry with exponential backoff
- Mock with MSW, validate with Zod schemas at runtime boundaries

### 4. TDD State Management Setup
- Configure TanStack Query for server state (behavior-driven tests)
- Add Zustand for client state (test through component behavior)
- Implement optimistic updates
- Add cache invalidation strategies
- Test state changes through user interactions, not store internals

## TDD Principles Applied
- No production code without failing test
- TypeScript strict mode
- Pure functions, immutable data
- 100% coverage through behavior testing

## Key Development Guidelines

### Schema-First Development
1. Always define Zod schemas before implementing features
2. Derive TypeScript types from schemas using `z.infer<typeof Schema>`
3. Export all schemas from a shared schema package/module
4. Use schemas for runtime validation at boundaries
5. Never redefine types separately from schemas

### Testing Strategy
1. **Red**: Write failing behavior tests using React Testing Library
2. **Green**: Write minimal code to make tests pass
3. **Refactor**: Improve code structure while keeping tests green
4. Test user-visible behavior, never implementation details
5. Use MSW (Mock Service Worker) for API mocking
6. Create test factories with real schemas for mock data

### Component Development
- Use options objects pattern for component props
- Implement immutable state updates only
- Create pure, testable components without side effects
- Co-locate all component files (.tsx, .test.tsx, .stories.tsx)
- Test error boundaries through user interaction scenarios

### State Management
- Use Zustand for client state management
- Configure TanStack Query for server state
- Test state changes through component behavior, not store internals
- Implement optimistic updates with rollback testing
- Test cache invalidation through observable effects

### API Integration
- Centralize API calls using axios interceptors
- Test API behavior first, then implement
- Use Zod schemas to validate API responses at runtime
- Test request retry logic and error handling scenarios
- Mock API responses using MSW for consistent testing