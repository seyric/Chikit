# Testing and Quality Gates for Chikit

We built Chikit with quality as a first-class concern. Our testing strategy and quality gates ensure that we deliver a reliable, secure, and performant healthcare platform. This document outlines our comprehensive approach to testing, code quality checks, and the gates we enforce before code can be merged or released.

## Our Testing Philosophy

Before detailing our specific practices, let's establish our testing philosophy:

1. **Test Early, Test Often**: We integrate testing throughout our development process, not as an afterthought
2. **Test at Multiple Levels**: We employ unit, integration, and end-to-end testing to catch issues at different scopes
3. **Test Like Real Users**: Our tests simulate real user interactions and workflows where possible
4. **Test for Failure**: We deliberately test error conditions, edge cases, and failure scenarios
5. **Automate What We Can**: We automate repetitive tests to ensure consistency and free up human testers for exploratory work
6. **Maintain Test Trust**: We keep our tests fast, reliable, and meaningful so the team trusts and relies on them
7. **Balance Coverage with Value**: We focus on testing what matters most rather than pursuing 100% coverage for its own sake

## Testing Pyramid Approach

We follow a testing pyramid approach, emphasizing different types of tests at different levels:

![Testing Pyramid Concept](https://miro.medium.com/v2/resize:fit:1400/1*qlB_T7uE2QkW1qDo7xqNcA.png)

### Unit Tests (Base of the Pyramid)
- **Purpose**: Test individual functions, methods, and components in isolation
- **Speed**: Very fast (milliseconds to seconds)
- **Frequency**: Run on every save/commit
- **Maintenance**: Low cost to maintain
- **Coverage Target**: High (70-90% of code logic)

### Integration Tests (Middle Layer)
- **Purpose**: Test how different parts of the system work together
- **Speed**: Moderate (seconds to minutes)
- **Frequency**: Run on every pull request and before merging
- **Maintenance**: Moderate cost
- **Coverage Target**: Medium (key integration points)

### End-to-End Tests (Top of the Pyramid)
- **Purpose**: Test complete user workflows from UI to database
- **Speed**: Slow (minutes to tens of minutes)
- **Frequency**: Run on pull requests for critical paths, nightly for full suite
- **Maintenance**: Higher cost (more brittle)
- **Coverage Target**: Low-Medium (focus on critical user journeys)

## Unit Testing Strategy

We write unit tests for:

### Backend Unit Tests
- **Utility Functions**: Date formatting, ID generation, validation helpers
- **Service Methods**: Business logic in ABDM, MedGemma, Casegraph services (mocking dependencies)
- **Authentication Logic**: Token generation, validation, password hashing
- **Middleware**: Auth middleware behavior, role checking
- **Validation Functions**: Input validation and sanitization

We typically use:
- **Vitest** or **Jest** for JavaScript/TypeScript testing
- **TypeScript** for type safety in tests
- **Mocking Libraries**: Jest mocks or manual mocks for external dependencies
- **Test Utilities**: Custom helpers for common test patterns

### Frontend Unit Tests
- **React Components**: Individual components with various props and states
- **Custom Hooks**: Logic encapsulated in custom React hooks
- **Utility Functions**: String manipulation, formatting, calculation helpers
- **State Management**: Redux/Zustand/Jotai slices and actions (if applicable)
- **Form Validation**: React Hook Form validation schemas and behavior

We use:
- **Vitest** or **Jest** with **React Testing Library** for component tests
- **Testing Library Principles**: Test components as users would interact with them
- **Mock Service Workers**: For mocking API calls in component tests
- **User Event Library**: For simulating user interactions

### Shared Package Tests
- **Database Schemas**: Ensuring Drizzle schemas are correctly defined
- **Zod Validation Schemas**: Testing that our validation works as expected
- **API Client**: Testing generated React Query hooks
- **Utility Packages**: Testing shared utility functions

## Integration Testing Strategy

We write integration tests for:

### API Integration Tests
- **Route Controllers**: Testing full request/response cycles with test database
- **Authentication Flows**: Login, token validation, protected route access
- **Service Integration**: How controllers interact with services (ABDM, MedGemma, etc.)
- **Database Interactions**: Complex queries, transactions, and relationships
- **Error Handling**: Ensuring proper error responses for various failure modes
- **Validation**: Testing that input validation works correctly at the API level

We use:
- **Supertest** or similar for HTTP API testing
- **Test Database**: Separate test database or transactions that rollback
- **Mocking**: Mocking external services (ABDM, MedGemma) when appropriate
- **Test Seeding**: Populating test database with known data sets

### Service Integration Tests
- **ABDM Service**: Testing ABDM API interactions (with mocks)
- **MedGemma Service**: Testing AI service interactions (with mocks)
- **Casegraph Service**: Testing case graph operations and relationships
- **Cross-Service Interactions**: How services work together (e.g., patient creation triggering case graph nodes)

### Database Integration Tests
- **Schema Validation**: Ensuring our database schema works as expected
- **Migration Testing**: Testing that migrations apply correctly
- **Query Performance**: Basic performance checks on critical queries
- **Constraint Testing**: Ensuring database constraints work properly

## End-to-End Testing Strategy

We write end-to-end tests for critical user journeys:

### Core Patient Workflows
- **Patient Registration**: Complete flow from registration to ABHA linking (if applicable)
- **Appointment Booking**: Finding available slots, booking, confirming, and managing appointments
- **Clinical Documentation**: Creating and viewing medical records, prescriptions, lab orders
- **Prescription Workflow**: Creating prescriptions, checking drug interactions, sending to pharmacy
- **Lab Results**: Ordering labs, viewing results, interpreting with AI assistance
- **Billing**: Generating invoices, processing payments, viewing payment history

### Provider Workflows
- **Provider Registration**: Doctor/nurse registration and verification
- **Schedule Management**: Setting availability, viewing appointments
- **Patient Lookup**: Searching for patients, viewing patient summaries
- **Order Management**: Creating lab/radiology orders, tracking fulfillment
- **Referral Workflow**: Creating and managing patient referrals

### Administrative Workflows
- **User Management**: Creating, modifying, and deactivating user accounts
- **Role Management**: Assigning roles and permissions
- **Hospital Configuration**: Setting up hospital information and departments
- **Report Generation**: Generating operational and clinical reports
- **System Monitoring**: Checking system health and performance metrics

### Specialized Workflows
- **Telemedicine**: Starting and conducting video consultations
- **Emergency Procedures**: Handling emergency patient intake
- **Public Health Reporting**: Generating reports for public health authorities
- **Research Consent**: Managing patient consent for research participation
- **Audit Trail Review**: Reviewing and exporting audit logs for compliance

We use:
- **Cypress** or **Playwright** for browser-based E2E testing
- **Test Data Management**: Seeding databases with test data before tests
- **API Mocking**: Optionally mocking backend for faster, more reliable tests
- **Visual Testing**: Optional visual regression testing for critical UI components
- **Accessibility Testing**: Automated accessibility checks (axe-core, etc.)
- **Performance Testing**: Basic performance assertions in E2E tests

## Test Data Management

Effective testing requires good test data management:

### Test Data Strategies
- **Fixtures**: Static JSON/CSV files representing consistent test data sets
- **Factories**: Libraries like Factory Boy or custom functions for generating test data
- **Seeding Scripts**: Scripts that populate test databases with known data
- **Data Builders**: Fluent interfaces for constructing complex test objects
- **Randomized Data**: For tests that need variety but with controlled randomness

### Database Handling
- **Test Database**: Separate database for testing (or schema in development DB)
- **Transactions**: Wrapping tests in transactions that rollback after each test
- **Truncate/Clean**: Cleaning tables between tests when transactions aren't suitable
- **Migrations**: Ensuring test database schema matches latest migrations
- **Seed Data**: Loading essential reference data (drugs, hospitals) for tests

### External Service Mocking
- **ABDM Mocking**: Simulating ABDM API responses for consistent testing
- **MedGemma Mocking**: Providing deterministic AI responses for testing
- **Email Services**: Mocking email sending for notification testing
- **File Storage**: Mocking file uploads/downloads for document handling
- **Third-Party APIs**: Mocking any other external service integrations

### Test Data Privacy
- **De-identification**: Ensuring test data doesn't contain real PHI
- **Synthetic Data**: Generating synthetic but realistic healthcare data
- **Data Masking**: Applying masking techniques to any real data used in tests
- **Consent Awareness**: Being mindful of privacy regulations even with test data

## Quality Gates

We enforce several quality gates that code must pass before it can be merged or released:

### Pre-Commit Gates (Local)
Before we even commit code, we run these checks locally:

1. **Type Checking**: `pnpm run typecheck` (across all packages)
   - Ensures no TypeScript compilation errors
   - Catches type mismatches early

2. **Linting**: `pnpm run lint` (if configured)
   - Enforces code style consistency
   - Catches potential bugs and code smells

3. **Unit Tests**: `pnpm run test:unit` (or equivalent)
   - Runs fast unit tests to catch logic errors
   - Ensures we didn't break existing functionality

4. **Build Verification**: `pnpm run build` (for relevant packages)
   - Ensures code still builds correctly
   - Catches missing imports or build configuration issues

### Pre-Push Gates (Before Creating PR)
Before pushing code and creating a pull request, we verify:

1. **Updated Documentation**: We've updated any affected documentation
   - API reference if we changed endpoints
   - Operations docs if we changed processes
   - Inline code comments where appropriate

2. **Clear Commit History**: We've cleaned up our commit history
   - Meaningful commit messages
   - Appropriate squashing of fixup commits
   - Logical grouping of related changes

3. **Self-Review**: We've reviewed our own code
   - Read through our diff looking for obvious issues
   - Verified we addressed all requirements
   - Checked for TODO comments or debug code left behind

### Pull Request Gates (CI/CD)
Our CI pipeline runs these checks on every pull request:

1. **Dependency Installation**: `pnpm install`
   - Verifies all dependencies can be installed
   - Lockfile consistency checked

2. **Type Checking**: `pnpm run typecheck`
   - Full type safety verification across workspace
   - Fails on any TypeScript errors

3. **Linting**: `pnpm run lint` (if applicable)
   - Code style enforcement
   - Potential bug detection

4. **Unit Tests**: `pnpm run test:unit`
   - Backend and frontend unit tests
   - Must pass with acceptable coverage thresholds

5. **Integration Tests**: `pnpm run test:integration`
   - API integration tests
   - Service integration tests
   - Database integration tests

6. **Build Verification**: `pnpm run build` (frontend and backend)
   - Ensures both applications build successfully
   - Production build verification

7. **Security Scanning**: `pnpm run audit` or equivalent
   - Dependency vulnerability scanning
   - Fails on high/critical severity vulnerabilities

8. **Preview Deployment** (optional but recommended)
   - Deploys to preview/staging environment
   - Allows for manual verification
   - Can include smoke tests

### Merge Gates
Before code can be merged into main/develop branches:

1. **Approval Requirements**: Minimum number of approving reviews
   - Typically 1-2 reviewers depending on change size
   - Required reviewers for certain areas (security, database, etc.)

2. **Status Checks**: All CI checks must pass
   - No failing tests or linting errors
   - All required checks green

3. **Branch Protections**:
   - No force pushes to protected branches
   - Require linear history (rebasing or squash merging)
   - Restrict who can delete branches

4. **Change Size Considerations**:
   - Very large changes may require additional review
   - Refactor-only changes may have different criteria
   - Emergency fixes may bypass some gates with proper documentation

### Release Gates
Before we create a release or deploy to production:

1. **Complete Test Suite**: All test types pass
   - Unit, integration, and end-to-end tests
   - Performance tests (if applicable)
   - Security tests (if applicable)

2. **Documentation Complete**: All user-facing documentation updated
   - API reference
   - User guides
   - Operations documentation
   - Release notes/changelog

3. **Performance Benchmarks**: Performance within acceptable bounds
   - API response times under load
   - Page load times
   - Database query performance

4. **Security Review**: Security-specific checks passed
   - Dependency scan clean
   - Manual security review for significant changes
   - Penetration testing results (if applicable)

5. **Staging Validation**: Successful deployment to staging
   - Smoke tests pass in staging environment
   - Stakeholder approval for release
   - Rollback plan verified

6. **Release Notes**: Comprehensive release notes prepared
   - New features highlighted
   - Bug fixes documented
   - Breaking changes clearly called out
   - Upgrade instructions provided

## Testing Tools and Infrastructure

We use various tools to support our testing efforts:

### Test Frameworks
- **Vitest/Jest**: Primary unit and integration test framework
- **React Testing Library**: For frontend component testing
- **Cypress/Playwright**: For end-to-end browser testing
- **Supertest**: For HTTP API testing
- **Testcontainers**: For database and service isolation in tests (if used)
- **Mock Service Workers**: For mocking network requests in tests

### Test Utilities and Helpers
- **Custom Test Utilities**: Shared helpers for common test patterns
- **Test Data Factories**: Functions for generating consistent test data
- **Mock Servers**: Simulated external services for testing
- **Database Helpers**: Utilities for test database setup/teardown
- **Assertion Libraries**: Custom matchers for domain-specific assertions

### Continuous Integration
- **GitHub Actions**: Our primary CI platform (or equivalent)
- **Parallel Execution**: Running tests in parallel to reduce CI time
- **Caching**: Dependency and build caching to speed up runs
- **Matrix Testing**: Testing against multiple Node.js versions if needed
- **Artifact Preservation**: Saving test reports, logs, and screenshots
- **Notifications**: Alerting on test failures via Slack/email

### Test Reporting and Metrics
- **Coverage Reports**: Generating code coverage reports (Istanbul/VCost)
- **Test Results**: Publishing test results in CI
- **Performance Trends**: Tracking test execution times over time
- **Flaky Test Detection**: Identifying and fixing unreliable tests
- **Test Maintenance Metrics**: Tracking test addition/modification rates

## Testing Specific Features

We have specialized testing approaches for certain Chikit features:

### ABDM Integration Testing
- **Mock ABDM Server**: Simulating ABDM API endpoints
- **Test Different Flows**: Aadhaar-based and mobile-based registration
- **Error Scenario Testing**: Network failures, invalid OTPs, service downtime
- **State Transition Testing**: Proper handling of ABDM transaction states
- **Fallback Testing**: Verifying behavior when ABDM is unavailable
- **Compliance Testing**: Ensuring we follow ABDM API specifications

### MedGemma AI Testing
- **Mock MedGemma Server**: Simulating AI inference responses
- **Deterministic Testing**: Ensuring consistent outputs for given inputs
- **Fallback Verification**: Testing rule-based fallback when AI unavailable
- **Performance Testing**: Measuring AI response times and caching effectiveness
- **Edge Case Testing**: Handling empty inputs, very long texts, special characters
- **Privacy Testing**: Ensuring no PHI leaves our infrastructure for AI processing

### Authentication and Authorization Testing
- **Positive Testing**: Valid credentials grant appropriate access
- **Negative Testing**: Invalid credentials are properly rejected
- **Boundary Testing**: Token expiration, refresh behavior
- **Role Testing**: Different roles get appropriate permissions
- **Hospital Scoping**: Users only see data from their assigned hospital
- **Privilege Escalation**: Testing for vertical/horizontal privilege escalation
- **Session Handling**: Proper logout and token invalidation

### Database Testing
- **Schema Validation**: Ensuring migrations produce expected schema
- **Constraint Testing**: Foreign keys, unique constraints, check constraints
- **Transaction Testing**: Atomicity and isolation level verification
- **Performance Testing**: Query execution plans and indexing effectiveness
- **Concurrency Testing**: Handling concurrent access to same data
- **Backup/Restore Testing**: Verifying backup and restore procedures

### Performance Testing
- **Load Testing**: Simulating multiple concurrent users
- **Stress Testing**: Testing beyond normal operational capacity
- **Soak Testing**: Long-running tests to detect memory leaks
- **Spike Testing**: Sudden increases in load
- **Bottleneck Identification**: Profiling to find performance constraints
- **Baseline Establishment**: Establishing performance baselines for regressions

### Security Testing
- **Dependency Scanning**: Using npm audit, Dependabot, or similar
- **Static Analysis**: Using tools like SonarQube, ESLint security plugins
- **Dynamic Analysis**: OWASP ZAP or similar for running scans
- **Penetration Testing**: Manual or automated pentesting for significant releases
- **Authentication Testing**: Testing for common auth vulnerabilities
- **Authorization Testing**: Testing for broken access control
- **Input Validation**: Testing for injection vulnerabilities (SQL, XSS, etc.)
- **Configuration Testing**: Checking for insecure defaults or misconfigurations
- **Secrets Scanning**: Ensuring no secrets are committed to repository

## Test Environment Considerations

We pay special attention to our test environments:

### Environment Parity
- **Similar to Production**: Using similar configurations where practical
- **Database Parity**: Similar schema, indexes, and constraints
- **Service Parity**: Similar external service mocks/stubs
- **Configuration Parity**: Similar environment variables and feature flags
- **Known Differences**: Documenting intentional differences (scaling, data volume)

### Test Isolation
- **Parallel Test Safety**: Ensuring tests don't interfere with each other
- **Resource Cleanup**: Properly cleaning up after tests (files, connections, etc.)
- **State Reset**: Resetting shared state between tests when needed
- **Test Order Independence**: Tests should pass regardless of order
- **External Service Mocking**: Ensuring mocks behave consistently

### Test Data Management
- **Known Data Sets**: Using predictable data for reproducible tests
- **Edge Case Data**: Including boundary values and edge cases
- **Realistic Distributions**: Using data that resembles production distributions
- **Data Refresh**: Periodically refreshing test data from production (anonymized)
- **Data Archiving**: Archiving test data sets for reuse when appropriate

### Resources and Scaling
- **Adequate Resources**: Ensuring test environment has sufficient CPU/memory
- **Database Connections**: Adequate connection pools for test parallelism
- **External Service Limits**: Respecting rate limits on mocked services
- **File System Space**: Ensuring adequate space for test artifacts
- **Network Bandwidth**: Sufficient bandwidth for test operations

## Test Maintenance and Improvement

We actively work to maintain and improve our testing practices:

### Test Review Process
- **Code Review Inclusion**: Tests are reviewed alongside production code
- **Test Quality Criteria**: We look for clear, maintainable, valuable tests
- **Redundancy Elimination**: Removing duplicate or overly similar tests
- **Flaky Test Identification**: Actively working to eliminate flaky tests
- **Test Documentation**: Documenting complex test setups when needed

### Continuous Learning
- **Test Pattern Sharing**: Sharing effective test patterns within the team
- **New Tool Evaluation**: Periodically evaluating new testing tools/frameworks
- **Learning from Incidents**: Adding tests to prevent recurrence of bugs
- **Industry Standards**: Keeping up with testing best practices in healthcare
- **Training**: Ensuring team members are competent in testing practices

### Metrics and Feedback
- **Test Execution Time**: Monitoring and working to reduce test suite time
- **Maintenance Burden**: Tracking time spent maintaining tests
- **Defect Escape Rate**: Measuring bugs found in production vs. caught in tests
- **Test Coverage Trends**: Monitoring coverage over time (not as primary goal)
- **Developer Satisfaction**: Gathering feedback on testing experience
- **Value Assessment**: Regularly assessing whether our testing effort provides value

### Automation Improvement
- **Test Parallelization**: Increasing parallel execution where possible
- **Smart Test Selection**: Running only relevant tests based on changes
- **Test Caching**: Caching expensive test setup when safe
- **Early Failure Detection**: Failing fast when possible
- **Selective Test Running**: Allowing developers to run subsets of tests

## Special Testing Scenarios

We have specific approaches for certain testing scenarios:

### Regression Testing
- **Baseline Establishment**: Establishing known good behavior
- **Change Impact Analysis**: Understanding what areas changes might affect
- **Targeted Regression**: Focusing regression tests on likely affected areas
- **Full Regression**: Periodic full regression testing before major releases
- **Regression Test Suite**: Maintaining a suite of tests specifically for regression

### Performance Regression Testing
- **Baseline Metrics**: Establishing performance baselines
- **Load Testing Scripts**: Reusable scripts for load testing
- **Resource Monitoring**: Monitoring CPU, memory, disk, network during tests
- **Trend Analysis**: Tracking performance metrics over time
- **Alerting**: Setting up alerts for significant performance degradations

### Security Regression Testing
- **Known Vulnerability Tests**: Tests for previously fixed security issues
- **Security Baseline**: Establishing known good security posture
- **Automated Security Scans**: Regular automated security scanning
- **Manual Security Review**: Periodic manual security assessment
- **Compliance Testing**: Ensuring we maintain compliance with relevant standards

### Localization/Internationalization Testing
- **Language Testing**: Testing in multiple languages if applicable
- **Format Testing**: Testing date, number, currency formats
- **Layout Testing**: Ensuring UI accommodates different text lengths
- **Input Method Testing**: Testing with different keyboard layouts/IMEs
- **Cultural Appropriateness**: Ensuring content is culturally appropriate

### Accessibility Testing
- **Automated Checks**: Using axe-core or similar for automated accessibility testing
- **Manual Testing**: Keyboard navigation, screen reader testing
- **Color Contrast**: Verifying sufficient color contrast ratios
- **ARIA Attributes**: Testing proper use of ARIA attributes
- **Focus Management**: Ensuring logical focus order and management
- **Accessibility Regression**: Ensuring we don't introduce accessibility regressions

## Testing in Different Environments

We adapt our testing approach for different environments:

### Local Development Testing
- **Fast Feedback**: Prioritizing fast tests for quick iteration
- **Watch Mode**: Using test watchers for instant feedback on changes
- **Debugging**: Easy debugging when tests fail
- **Selective Running**: Running only relevant tests for current work
- **Test Isolation**: Less concern about parallel test conflicts

### Continuous Integration Testing
- **Comprehensive**: Running full test suite to gate merges
- **Parallelization**: Maximizing parallel execution to reduce time
- **Resource Constraints**: Working within CI resource limits
- **Artifact Preservation**: Saving logs, reports, screenshots for debugging
- **Notifications**: Alerting relevant parties on test failures

### Staging/Pre-Production Testing
- **Production-Like**: Using environment similar to production
- **Smoke Tests**: Basic functionality verification
- **Integration Tests**: Testing integrations with staging external services
- **Performance Tests**: Load testing in staging environment
- **Stakeholder Verification**: Allowing stakeholders to verify in staging

### Production Testing (Limited)
- **Smoke Tests**: Basic health checks after deployment
- **Synthetic Transactions**: Periodic synthetic user transactions
- **Canary Testing**: Testing with small percentage of real traffic
- **Feature Flags**: Testing new features behind flags with small user groups
- **Monitoring**: Relying on production monitoring and alerting

## Conclusion

Our testing and quality gates approach for Chikit is designed to ensure we deliver a reliable, secure, and performant healthcare platform that meets the needs of our users while maintaining developer velocity.

We've built a comprehensive testing strategy that:
- Tests at multiple levels (unit, integration, end-to-end)
- Focuses on what matters most rather than pursuing metrics for their own sake
- Automates what we can to ensure consistency and efficiency
- Maintains test trust through reliability and meaningfulness
- Adapts to different contexts and types of changes
- Continuously improves based on feedback and experience

Our quality gates ensure that:
- Code meets our standards before it's shared with the team
- Changes are properly reviewed before they enter our main codebase
- Releases meet our quality, security, and performance standards
- We maintain a high bar for what constitutes "done" work
- We balance thoroughness with pragmatism to avoid slowing down delivery

By following these practices, we've been able to build confidence in our codebase, reduce production incidents, and deliver value to our users consistently. We continue to refine our approach as we learn what works best for our team, our product, and our users.

Remember: The goal of our testing isn't to achieve perfection or to follow testing dogma, but to enable us to build better software for our patients and healthcare providers. We regularly ask ourselves: "Is this helping us deliver safer, more reliable, more valuable software?" If the answer is no, we adjust our approach.