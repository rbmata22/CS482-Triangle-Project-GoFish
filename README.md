# Bui's Bayside Inn (Go Fish)

## Overview
A web-based multiplayer Go Fish card game with social features, virtual currency, and admin capabilities. Built as part of CS482 course project across three sprints.

## Features

### User Authentication & Account Management
- Create new accounts with secure login/logout functionality
- Guest access for single sessions
- Profile customization with purchasable icons
- Virtual currency system earned through gameplay

### Social Features
- Friend system with request/accept/decline functionality
- Private messaging between friends
- Public lobby chat
- Send virtual currency to friends

### Gameplay
- Multiple game modes:
  - Private lobbies with invite codes
  - Public lobbies for open matches
- Tutorial bot for learning gameplay
- Betting system using hotel credits
- Real-time card gameplay
- Win/loss tracking

### Administrative Features
- Player management system
- Chat monitoring for profanity/harassment
- Ability to ban disruptive players
- Documentation maintenance

## Technical Architecture

### Class Structure
- **Account (Base Class)**
  - Attributes: ID, username
  - Subclasses: User, Guest, Admin

### Key Components
1. **User Class**
   - Manages friends, games played/won, virtual currency
   - Handles currency transfers, conversations, lobby management

2. **Lobby System**
   - Game mode selection
   - Player management
   - Betting calculations
   - AI integration

3. **Card Management**
   - Deck and Card classes
   - Hand tracking
   - Game state management

4. **Communication System**
   - Friend requests
   - Private messaging
   - Lobby chat

## Test Coverage Summary

### Overall Statistics
- Total Files Coverage: 72.38%
- Statement Coverage: 72.38%
- Branch Coverage: 70.90%
- Function Coverage: 69.34%
- Line Coverage: 72.97%

### Component Coverage
- **High Coverage Components**
  - JoinPrivate.jsx: 94.73%
  - JoinPublic.jsx: 86.11%
  - Support.jsx: 88.88%

- **Areas Needing Improvement**
  - App.jsx: 40.00%
  - Login.jsx: 73.86%
  - Lobby.jsx: 64.28%

## Development Team
- **Silas**: Main Game Functionality, Create/Join components
- **Marley**: Stylization, Documentation, User Customization
- **Ryland**: User/Admin features, friend system
- **Chase**: Testing

## Sprint Performance

### Sprint Statistics
- **Sprint 1**: 37 points, 36 hours (Pts/Hr: 0.97)
- **Sprint 2**: 36 points, 40 hours (Pts/Hr: 1.11)
- **Sprint 3**: 40 points, 38 hours (Pts/Hr: 0.95)

### Final Sprint Status
- Total Stories: 30
- Completed Stories: 30
- Backlog: 0
- Stories Remaining: 0

## Getting Started

### Prerequisites
    1. React
    2. Firebase (Firestore for database)

### Installation
    1. Clone the repository
    2. Install dependencies: `npm install`
    3. Configure Firebase credentials
    4. Run development server: `npm start`

### Testing
Run tests with: `npm test`

Current test suite status:
- Test Suites: 13 failed, 1 passed (14 total)
- Tests: 33 failed, 45 passed (78 total)
- Coverage time: 6.12s

## Known Issues & Future Improvements
1. Test coverage needs improvement, particularly in core components
2. Real-time synchronization challenges in multiplayer gameplay
3. Betting system integration requires optimization
4. Some user interface elements need refinement

## Contributing
Please see our documentation for contribution guidelines. Contact the admin team for access and requirements.