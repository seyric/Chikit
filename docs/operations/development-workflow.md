# Our Development Workflow for Chikit

We built Chikit with a focus on maintainability, scalability, and clear separation of concerns. Our development workflow reflects these principles through standardized processes for feature development, bug fixing, testing, and code review. This document outlines how we work on the Chikit codebase day-to-day.

## Our Development Principles

Before diving into the workflow, let's establish the principles that guide our development:

1. **Incremental Delivery**: We build features in small, verifiable increments
2. **Test-Driven Development**: We write tests before or alongside implementation when practical
3. **Code Review Excellence**: Every change undergoes peer review before merging
4. **Documentation as We Go**: We update documentation alongside code changes
5. **Maintain Backward Compatibility**: We avoid breaking changes when possible
6. **Security-First Mindset**: We consider security implications in every feature

## Repository Organization

We organized our code as a monorepo using pnpm workspaces, which gives us several benefits:

- **Shared Dependencies**: Common packages like `@workspace/db` and `@workspace/api-client-react` are version-consistent across the project
- **Atomic Changes**: We can make cross-package changes in a single commit
- **Independent Versioning**: Each package can have its own version when needed
- **Efficient Installs**: pnpm's symlink-based approach saves disk space and install time

Our workspace structure:
```
/ (root)
├── packages/
│   ├── api-server/          # Backend Express server
│   ├── chikit/              # Frontend React application
│   ├── db/                  # Database schemas and Drizzle configuration
│   ├── api-client-react/    # Generated React Query hooks
│   ├── api-zod/             # Shared Zod validation schemas
│   └── scripts/             # Utility scripts
```

## Starting a New Feature

When we begin work on a new feature or bug fix, we follow this process:

### 1. Issue Creation and Planning
We start by creating a clear issue in our tracking system (GitHub Issues, Jira, etc.) that includes:
- **Clear Description**: What problem are we solving or what feature are we building?
- **User Impact**: How does this affect our users (patients, doctors, admins)?
- **Acceptance Criteria**: Specific, testable conditions for completion
- **Technical Notes**: Any known complexities or areas requiring research
- **Design References**: Links to UI mockups, API specs, or architectural decisions

For larger features, we create a brief technical design document outlining:
- Proposed API changes
- Database schema modifications
- UI component requirements
- State management considerations
- Security and privacy implications

### 2. Branch Creation
We create a descriptive branch from our main development branch (usually `main` or `develop`):
```bash
# Update main branch first
git checkout main
git pull origin main

# Create feature branch
git checkout -b feature/abha-mobile-verification-enhancement
# or
git checkout -b fix/patient-search-performance-issue
# or
git checkout -b refactor/medgemma-service-abstraction
```

Our branch naming convention:
- `feature/` for new functionality
- `fix/` for bug fixes
- `refactor/` for code improvements without behavior changes
- `docs/` for documentation-only changes
- `test/` for test additions or improvements

### 3. Development Environment Setup
Before coding, we ensure our environment is ready:
```bash
# Install/update dependencies if needed
pnpm install

# Ensure database is migrated to latest
# (We use manual migrations or schema sync on startup)

# Seed any necessary test data
pnpm --filter @workspace/api-server run seed-drugs
```

### 4. Implementation Approach

We typically follow this implementation pattern:

#### Backend-First Approach (for API-centric features)
1. **Database Schema**: Modify Drizzle schema in `@workspace/db` if needed
2. **API Contract**: Define request/response types (often using Zod in `@workspace/api-zod`)
3. **Service Layer**: Implement business logic in appropriate service (ABDM, MedGemma, custom services)
4. **Route Controllers**: Create/update API endpoints in `artifacts/api-server/src/routes/`
5. **Authentication/Authorization**: Add middleware as needed (`requireAuth`, `requireRole`)
6. **Audit Logging**: Add `createAuditLog` calls for significant operations
7. **Error Handling**: Implement proper error responses and logging
8. **Testing**: Write unit tests for services and integration tests for routes

#### Frontend-First Approach (for UI/UX centric features)
1. **Component Design**: Break down UI into reusable components
2. **State Management**: Determine what data needs to be fetched and managed
3. **API Hooks**: Use or create React Query hooks in `@workspace/api-client-react`
4. **Form Implementation**: Use React Hook Form with Zod validation
5. **Loading/Error States**: Implement proper UX for async operations
6. **Accessibility**: Ensure keyboard navigation and screen reader support
7. **Testing**: Write unit tests for components and integration tests for user flows

#### Full-Stack Features
For features spanning both frontend and backend, we often:
1. Define the API contract first (backend)
2. Implement the backend endpoint
3. Generate/update the frontend API client
4. Build the frontend components to consume the API
5. Test the end-to-end flow

## Daily Development Routine

Our typical development cycle includes:

### Code Writing
We write code following our established patterns:
- **TypeScript Strict Mode**: We leverage TypeScript's full power for catch-all errors
- **Component Composition**: We build complex UIs from small, reusable components
- **Service Abstraction**: We keep business logic in services, not in route controllers or UI components
- **Custom Hooks**: We extract reusable logic into custom React hooks
- **Utility Functions**: We place shared logic in utility files

### Regular Committing
We commit frequently with meaningful messages:
```bash
# Stage changes
git add .

# Commit with conventional format
git commit -m "feat(patients): add ABHA verification status to patient list"
# or
git commit -m "fix(api): resolve race condition in appointment creation"
# or
git commit -m "docs(operations): update getting started guide with new prerequisites"
```

Our commit message format:
```
<type>(<scope>): <short description>

[optional body]

[optional footer]
```

Types we use:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Formatting, missing semi-colons, etc.
- `refactor`: Code refactor without functionality change
- `perf`: Performance improvements
- `test`: Adding or modifying tests
- `chore`: Build process or tooling changes

### Testing as We Go
We don't wait until the end to test:
- **Backend**: We test API endpoints using curl, Postman, or automated tests
- **Frontend**: We verify UI states and interactions in the browser
- **Integration**: We test complete user flows regularly
- **Edge Cases**: We consider error states, empty states, and large data sets

### Code Review Preparation
Before submitting for review, we:
1. **Self-Review**: We diff our changes and look for obvious issues
2. **Run Tests**: We ensure our changes don't break existing functionality
3. **Check Linting**: We run ESLint/Prettier if configured
4. **Verify Builds**: We confirm the application still builds successfully
5. **Update Documentation**: We ensure API reference, operations docs, etc. are current
6. **Squash if Necessary**: We clean up commit history for clarity

## Collaborative Development Practices

### Pair Programming
For complex or critical features, we often pair program:
- **Knowledge Sharing**: We spread understanding of complex systems
- **Immediate Review**: We catch issues as we write them
- **Better Design**: We discuss alternatives and choose better solutions
- **Team Cohesion**: We strengthen our team's shared understanding

### Code Reviews
Our code review process emphasizes:
- **Constructive Feedback**: We focus on improving the code, not criticizing the author
- **Checklist Approach**: We verify functionality, testing, security, and performance
- **Context Awareness**: We consider how changes fit into the larger system
- **Timeliness**: We aim to review within 24 hours for active development
- **Learning Opportunity**: We use reviews to share knowledge and best practices

Reviewers look for:
- ✅ Does it solve the stated problem?
- ✅ Are tests adequate and passing?
- ✅ Is the code readable and maintainable?
- ✅ Are there any security concerns?
- ✅ Does it follow our established patterns?
- ✅ Is documentation updated?
- ✅ Are there any performance implications?
- ✅ Is error handling appropriate?

### Dependency Management
We carefully manage our dependencies:
- **Regular Updates**: We schedule time for dependency updates
- **Security Scanning**: We use tools like npm audit or GitHub Dependabot
- **Compatibility Checking**: We verify updates don't break our application
- **Documentation**: We note why we chose specific versions when non-obvious

## Testing Strategy

We employ a layered testing approach:

### Unit Tests
We write unit tests for:
- **Utility Functions**: Pure functions with clear inputs/outputs
- **Service Methods**: Business logic in isolation (mocking dependencies)
- **React Components**: Individual components with various props and states
- **Validation Schemas**: Ensuring our Zod schemas work correctly

We typically use:
- **Jest** or **Vitest** for JavaScript/TypeScript testing
- **React Testing Library** for frontend component tests
- **Supertest** or similar for backend API tests

### Integration Tests
We test:
- **API Endpoints**: Full request/response cycles with test database
- **Service Interactions**: How services work together
- **Database Operations**: Complex queries and transactions
- **Authentication Flows**: Login, token validation, role-based access

### End-to-End (E2E) Tests
For critical user journeys, we write E2E tests using:
- **Cypress** or **Playwright**
- Tests that simulate real user interactions
- Coverage of common workflows like patient registration, appointment booking, etc.
- Testing across different user roles (doctor, nurse, admin, etc.)

### Test Data Management
We handle test data carefully:
- **Fixtures**: Consistent data sets for predictable tests
- **Factories**: Libraries like Factory Boy for generating test data
- **Database Transactions**: Rolling back changes after each test
- **Seeding**: Using our seed scripts for reference data
- **Mocking**: External services (ABDM, MedGemma) in tests

## Continuous Integration

We have CI pipelines that run on every pull request:

### CI Checks
Our CI typically includes:
1. **Dependency Installation**: `pnpm install`
2. **Type Checking**: `pnpm run typecheck` (across all packages)
3. **Linting**: ESLint/Prettier checks (if configured)
4. **Unit Tests**: Running test suites for frontend and backend
5. **Build Verification**: Ensuring both applications build successfully
6. **Security Scanning**: Dependency vulnerability checks
7. **Preview Deployment**: Deploying to a staging environment for manual testing

### Branch Protection Rules
We enforce:
- **Required Reviews**: Minimum number of approving reviews
- **Status Checks**: All CI checks must pass
- **Linear History**: Requiring rebasing or squash merging
- **Administrator Bypass**: Allowing admins to bypass in emergencies (rarely used)
- **Include Administrators**: Even admins must follow the same rules

## Release Process

When we're ready to release, we follow this process:

### Pre-Release Checklist
Before cutting a release, we verify:
1. **Feature Completeness**: All planned features are implemented and tested
2. **Bug Fixes**: Known critical issues are resolved
3. **Documentation**: API reference, operations guides, and user docs are updated
4. **Performance**: We've done basic performance testing
5. **Security**: We've reviewed for obvious security issues
6. **Backward Compatibility**: We've documented any breaking changes
7. **Upgrade Path**: We have clear instructions for updating from previous versions

### Release Candidate
We often create a release candidate:
1. **Tag**: We create a Git tag like `v1.2.0-rc.1`
2. **Deployment**: We deploy to a staging environment
3. **Testing**: We perform final verification testing
4. **Feedback**: We gather feedback from stakeholders
5. **Iteration**: We fix any issues found during RC testing

### Final Release
For the actual release:
1. **Final Tag**: We create the final tag (e.g., `v1.2.0`)
2. **Changelog**: We generate a detailed changelog from commit messages
3. **Documentation**: We ensure all user-facing documentation is published
4. **Deployment**: We deploy to production following our deployment procedures
5. **Announcement**: We notify stakeholders and users
6. **Monitoring**: We closely monitor production after release

### Post-Release Activities
After release, we:
1. **Monitor Metrics**: We watch error rates, performance, and usage
2. **Gather Feedback**: We collect user feedback and bug reports
3. **Plan Next Steps**: We begin planning for the next release cycle
4. **Document Lessons Learned**: We note what went well and what could improve

## Working with External Systems

Chikit integrates with several external systems, and we have specific workflows for these:

### ABDM (Ayushman Bharat Digital Mission) Integration
When working on ABDM features:
1. **Environment Separation**: We use sandbox vs. production endpoints
2. **Credential Management**: We never commit real API keys to the repository
3. **Mocking in Tests**: We mock ABDM API calls in our test suite
4. **Compliance Checking**: We verify we're following ABDM API specifications
5. **Error Handling**: We gracefully handle network issues and service downtime
6. **Audit Trails**: We log all ABDM interactions for compliance

### MedGemma Integration
For MedGemma AI features:
1. **Fallback First**: We ensure rule-based fallbacks work before implementing AI
2. **Configuration Separation**: We keep MedGemma URL configurable via environment variables
3. **Graceful Degradation**: The system functions fully without MedGemma
4. **Performance Monitoring**: We track AI response times and cache when beneficial
5. **Privacy Considerations**: We ensure no PHI leaves our infrastructure unnecessarily
6. **Validation**: We validate AI outputs where possible (though medical AI validation is complex)

### Database Migrations
When we need to change the database schema:
1. **Backward Compatible Changes**: We prefer additive changes (new columns, tables)
2. **Migration Scripts**: We write explicit migration scripts when needed
3. **Testing**: We test migrations against a copy of production data
4. **Rollback Plans**: We consider how to roll back if needed
5. **Deployment Timing**: We schedule migrations during low-usage periods
6. **Monitoring**: We watch for errors during and after migration

## Documentation Practices

We believe documentation is part of the development process:

### API Documentation
We keep our API reference up-to-date by:
1. **Updating Alongside Code**: When we change an endpoint, we update the docs immediately
2. **Using Consistent Templates**: We follow the same format for all endpoint documentation
3. **Including Examples**: We add request/response examples where helpful
4. **Noting Authentication Requirements**: We clearly mark which endpoints require auth
5. **Version Notes**: We note when endpoints were added, changed, or deprecated

### Operations Documentation
We maintain our operations guides by:
1. **Updating When Processes Change**: If our setup process changes, we update getting-started.md
2. **Adding New Procedures**: When we introduce new scripts or tools, we document them
3. **Clarifying Based on Feedback**: If team members find something confusing, we improve it
4. **Removing Obsolete Information**: We delete documentation for removed features

### Code Comments
We use comments judiciously:
- **Why, Not What**: We explain the reasoning behind complex code, not what the code does
- **TODO Comments**: We use TODO comments for future work, with clear markers
- **Warning Comments**: We highlight potential pitfalls or areas needing caution
- **Reference Comments**: We link to related documentation or issues when relevant

## Performance Considerations

We're mindful of performance in our development:

### Frontend Performance
We watch for:
- **Bundle Size**: We monitor our JavaScript bundle sizes
- **Render Performance**: We avoid unnecessary re-renders with useMemo/useCallback
- **Image Optimization**: We use appropriate image formats and sizes
- **Lazy Loading**: We lazy-load components and routes when beneficial
- **Caching**: We leverage React Query's caching effectively

### Backend Performance
We monitor:
- **Query Efficiency**: We use database indexes and avoid N+1 queries
- **Response Times**: We track API response times under load
- **Memory Usage**: We watch for memory leaks in long-running processes
- **Concurrency**: We handle concurrent requests appropriately
- **Caching**: We cache expensive operations when safe (e.g., reference data)

### Database Performance
We consider:
- **Indexing**: We add indexes on frequently queried columns
- **Query Optimization**: We use EXPLAIN to understand query plans
- **Connection Pooling**: We configure appropriate pool sizes
- **Archiving**: We consider archiving old data when tables grow very large
- **Partitioning**: We evaluate partitioning for very large tables

## Security Practices

Security is integral to our development process:

### Authentication and Authorization
We ensure:
- **Token Security**: We use secure JWT handling (short expiration, secure storage)
- **Password Handling**: We never store or log passwords in plaintext
- **Role-Based Access**: We enforce permissions at the API level
- **Session Management**: We handle logout and token invalidation properly
- **Multi-Factor Authentication**: We consider where appropriate (though not currently implemented)

### Data Protection
We protect data by:
- **Input Validation**: We validate and sanitize all inputs
- **Output Encoding**: We prevent XSS through proper escaping
- **Database Security**: We use parameterized queries to prevent SQL injection
- **Environment Secrets**: We never commit secrets to the repository
- **Transport Security**: We assume HTTPS in production (handled by reverse proxy)

### Dependency Security
We manage dependency security through:
- **Regular Scanning**: We use tools like npm audit or Dependabot
- **Prompt Updates**: We update dependencies with known vulnerabilities
- **License Compliance**: We check for licensing issues in dependencies
- **Minimal Dependencies**: We only include dependencies we actually need

### Privacy Considerations
We respect patient privacy by:
- **Data Minimization**: We only collect and store what's necessary
- **Access Logging**: We audit who accesses sensitive data
- **Anonymization**: We consider anonymization techniques for data used in analytics
- **Consent Management**: We respect patient consent preferences where applicable
- **Compliance**: We strive to meet relevant healthcare privacy regulations (HIPAA, GDPR, etc.)

## Troubleshooting Our Own Work

When we encounter issues during development, we follow this troubleshooting process:

### 1. Reproduce Consistently
We first ensure we can reliably reproduce the issue:
- Clear steps to reproduce
- Expected vs. actual behavior
- Environment details (browser, OS, etc.)
- Any relevant data or API payloads

### 2. Isolate the Problem
We narrow down where the issue originates:
- Is it frontend-only, backend-only, or integration?
- Which specific component, service, or route is involved?
- Can we reproduce with minimal test case?
- Does it happen in isolation or only with certain data?

### 3. Check the Basics
We verify fundamental assumptions:
- Are we looking at the right branch/commit?
- Are dependencies installed correctly?
- Is the database in the expected state?
- Are environment variables set correctly?
- Are we hitting the right API endpoints (dev vs. prod)?

### 4. Use the Right Tools
We leverage appropriate debugging tools:
- **Backend**: Console logging, debuggers, API testing tools
- **Frontend**: Browser dev tools, React DevTools, network tab
- **Database**: Query analyzers, explain plans, data inspection
- **Network**: Packet inspectors, API proxies, service mesh tools (if applicable)

### 5. Apply the Scientific Method
We form hypotheses and test them:
- Hypothesis: "The issue is caused by X"
- Test: "If I change Y, does the problem go away?"
- Evidence: "What observations support or refute my hypothesis?"
- Iteration: "Based on results, what's my next hypothesis?"

### 6. Know When to Ask for Help
We recognize when to seek assistance:
- After reasonable time spent (usually 30-60 minutes on a tricky issue)
- When we've exhausted our own ideas and approaches
- When the issue is outside our domain expertise
- When we need a fresh pair of eyes
- When blocking other team members' work

## Continuous Improvement

We regularly reflect on and improve our development process:

### Retrospectives
We hold regular retrospectives to discuss:
- What went well in our last sprint/iteration
- What could be improved
- Obstacles we encountered and how we addressed them
- Action items for the next period
- Team dynamics and collaboration

### Process Experiments
We're not afraid to try new approaches:
- We trial new tools or techniques on small scales first
- We measure the impact of changes (qualitatively and quantitatively)
- We adopt what works and discard what doesn't
- We share learnings with the team

### Learning and Growth
We invest in our team's capabilities:
- We share interesting articles, talks, or discoveries
- We encourage participation in relevant conferences or meetups
- We allocate time for learning new technologies or techniques
- We mentor junior team members and learn from senior ones
- We stay current with healthcare technology trends

## Conclusion

Our development workflow for Chikit balances structure with flexibility. We have enough process to ensure quality, consistency, and collaboration, while remaining agile enough to respond to changing requirements and emergent discoveries.

By following these practices, we've been able to build a robust healthcare platform that serves our users well while maintaining a codebase that's enjoyable to work with. We continue to refine our approach as we learn what works best for our team, our project, and our users.

Remember: The goal of our workflow isn't to follow rituals for their own sake, but to enable us to deliver value to our users safely, efficiently, and sustainably. We regularly ask ourselves: "Is this helping us build better software for our patients and healthcare providers?" If the answer is no, we change our approach.