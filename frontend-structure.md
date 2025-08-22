# React Frontend Structure

## Overview
The frontend is a React-based single page application (SPA) built with Vite, TypeScript, and Tailwind CSS. It provides a modern chat interface with internationalization, component library, and comprehensive state management.

## Folder Structure

```
frontend/
├── public/
│   └── images/
├── src/
│   ├── @types/
│   ├── assets/
│   ├── components/
│   ├── constants/
│   ├── features/
│   │   ├── agent/
│   │   │   ├── components/
│   │   │   ├── constants/
│   │   │   ├── functions/
│   │   │   ├── hooks/
│   │   │   ├── types/
│   │   │   ├── utils/
│   │   │   └── xstates/
│   │   ├── discover/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── pages/
│   │   │   └── types/
│   │   ├── helper/
│   │   │   └── components/
│   │   ├── knowledgeBase/
│   │   │   ├── constants/
│   │   │   ├── pages/
│   │   │   └── types/
│   │   └── reasoning/
│   │       ├── components/
│   │       └── xstates/
│   ├── hooks/
│   ├── i18n/
│   │   ├── de/
│   │   ├── en/
│   │   ├── es/
│   │   ├── fr/
│   │   ├── id/
│   │   ├── it/
│   │   ├── ja/
│   │   ├── ko/
│   │   ├── ms/
│   │   ├── nb/
│   │   ├── pl/
│   │   ├── pt-br/
│   │   ├── th/
│   │   ├── vi/
│   │   ├── zh-hans/
│   │   └── zh-hant/
│   ├── layouts/
│   ├── pages/
│   ├── providers/
│   └── utils/
│       └── __tests__/
└── dev-dist/
```

## Script to Generate Frontend Folder Structure

```bash
#!/bin/bash

# Create frontend folder structure
mkdir -p frontend/{public/images,src/{@types,assets,components,constants,features/{agent/{components,constants,functions,hooks,types,utils,xstates},discover/{components,hooks,pages,types},helper/components,knowledgeBase/{constants,pages,types},reasoning/{components,xstates}},hooks,i18n/{de,en,es,fr,id,it,ja,ko,ms,nb,pl,pt-br,th,vi,zh-hans,zh-hant},layouts,pages,providers,utils/__tests__},dev-dist}

echo "Frontend folder structure created successfully!"
```

## Key Components

### Core Application (`/src/`)
- **App.tsx**: Main application component
- **main.tsx**: Application entry point
- **routes.tsx**: Route configuration
- **index.css**: Global styles

### Component System (`/components/`)
- Reusable UI components with Storybook integration
- Form elements, dialogs, buttons, layout components
- Chat-specific components (ChatMessage, InputChatContent, etc.)

### Feature-Based Architecture (`/features/`)
- **Agent**: AI agent functionality with tools and reasoning
- **Discover**: Bot discovery and store features
- **Helper**: Help and assistance components
- **KnowledgeBase**: Knowledge base management
- **Reasoning**: AI reasoning display and interaction

### State Management (`/hooks/`)
- Custom React hooks for API integration
- State management for chat, bots, users, conversations
- HTTP client and error handling hooks

### Internationalization (`/i18n/`)
- Support for 15+ languages
- Structured translation files per language

### Layout System (`/layouts/`)
- Page layout components
- Responsive design utilities

### Pages (`/pages/`)
- Route-level page components
- Admin, chat, bot management pages

### Type Definitions (`/@types/`)
- TypeScript type definitions
- API response types and interfaces

### Utilities (`/utils/`)
- Helper functions and utilities
- Date formatting, string manipulation, etc.
- Comprehensive test coverage

## Key Dependencies

### Core Framework
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing

### UI & Styling
- **Tailwind CSS** - Utility-first CSS framework
- **Headless UI** - Unstyled accessible components
- **React Icons** - Icon library

### State Management
- **Zustand** - Lightweight state management
- **XState** - State machines
- **SWR** - Data fetching and caching
- **Immer** - Immutable state updates

### AWS Integration
- **AWS Amplify** - Authentication and AWS services
- **Amplify UI React** - Pre-built auth components

### Features
- **React Markdown** - Markdown rendering
- **React Syntax Highlighter** - Code highlighting
- **i18next** - Internationalization
- **Day.js** - Date manipulation
- **Axios** - HTTP client

### Development Tools
- **Ladle** - Component development
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Vitest** - Unit testing

## Architecture Patterns
- **Feature-Based Organization** - Domain-driven folder structure
- **Component-Driven Development** - Reusable UI components
- **Hook-Based State Management** - Custom hooks for data and state
- **Type-Safe Development** - Full TypeScript integration
- **Internationalization-First** - Multi-language support
- **Responsive Design** - Mobile-first approach
- **Progressive Web App** - PWA capabilities with service worker