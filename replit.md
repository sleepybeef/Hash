# DecenTube - Decentralized Video Platform

## Overview

DecenTube is a decentralized video sharing platform that combines traditional web technologies with blockchain-based verification and IPFS storage. The platform allows users to upload, share, and moderate video content while ensuring authenticity through World ID verification. Content is stored on IPFS for decentralized distribution, and the platform includes a comprehensive moderation system to maintain content quality.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **UI Library**: Radix UI primitives with shadcn/ui components for consistent design
- **Styling**: Tailwind CSS with custom design tokens and dark/light theme support
- **State Management**: TanStack Query for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation for type-safe form management

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Database ORM**: Drizzle ORM for type-safe database operations
- **API Design**: RESTful API with JSON responses and comprehensive error handling
- **File Uploads**: Multer middleware for handling video file uploads (up to 2GB)
- **Session Management**: Express sessions with PostgreSQL session store

### Database Design
- **Database**: PostgreSQL with Neon serverless hosting
- **Schema Management**: Drizzle migrations with schema-first approach
- **Core Tables**:
  - Users table with World ID verification status and moderation permissions
  - Videos table with metadata, IPFS hashes, and moderation status
  - Video likes/dislikes system with user relationship tracking
  - Subscriptions for creator-subscriber relationships
  - Video views tracking for analytics

### Authentication & Authorization
- **Primary Auth**: World ID verification system for human verification
- **User Roles**: Regular users and moderators with different permission levels
- **Session Management**: Server-side sessions stored in PostgreSQL
- **Identity Verification**: Integration with Worldcoin's World ID protocol

### Content Storage & Distribution
- **Video Storage**: IPFS (InterPlanetary File System) for decentralized content hosting
- **Metadata Storage**: PostgreSQL for searchable video metadata and relationships
- **File Processing**: Server-side video upload handling with IPFS integration
- **Content Delivery**: IPFS gateways for video streaming and thumbnail delivery

### Moderation System
- **Content Review**: Three-state moderation (pending, approved, rejected)
- **Moderator Dashboard**: Dedicated interface for content review and management
- **Rejection Tracking**: Detailed rejection reasons and moderator attribution
- **Statistics**: Comprehensive moderation analytics and reporting

## External Dependencies

### Blockchain & Verification
- **World ID SDK**: Worldcoin's verification system for human authenticity
- **Neon Database**: Serverless PostgreSQL hosting with connection pooling

### Storage & Content Delivery
- **IPFS Network**: Decentralized storage for video files and thumbnails
- **IPFS HTTP Client**: JavaScript client for IPFS operations (add, pin, retrieve)

### UI & Development Tools
- **Radix UI**: Accessible component primitives for complex UI interactions
- **shadcn/ui**: Pre-built component library built on Radix UI
- **TanStack Query**: Server state management with caching and synchronization
- **Vite**: Modern build tool with hot module replacement and TypeScript support
- **Tailwind CSS**: Utility-first CSS framework with custom design system

### Backend Services
- **Drizzle ORM**: Type-safe database toolkit with PostgreSQL adapter
- **Express.js**: Web application framework with middleware ecosystem
- **Multer**: Multipart form data handling for file uploads
- **React Hook Form**: Performant form library with minimal re-renders
- **Zod**: TypeScript-first schema validation for runtime type safety