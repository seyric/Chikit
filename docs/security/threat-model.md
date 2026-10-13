# Threat Model for Chikit

We built Chikit with security as a fundamental consideration. To systematically identify, quantify, and address the security risks associated with our healthcare platform, we developed a comprehensive threat model. This document outlines our threat modeling approach, identified threats, risk assessments, and mitigation strategies for Chikit.

## Our Threat Modeling Approach

We followed a structured threat modeling process based on industry best practices:

### Methodology
We used a combination of STRIDE (Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service, Elevation of Privilege) and PASTA (Process for Attack Simulation and Threat Analysis) methodologies:

1. **Asset Identification**: Identifying what we need to protect
2. **Architecture Review**: Understanding our system architecture and data flows
3. **Threat Identification**: Identifying potential threats using STRIDE categories
4. **Risk Assessment**: Evaluating the likelihood and impact of each threat
5. **Mitigation Planning**: Developing strategies to mitigate or accept risks
6. **Validation**: Verifying that mitigations are effective and properly implemented
7. **Review and Update**: Regularly reviewing and updating the threat model

### Scope
Our threat model covers:
- **Application**: The Chikit web application (frontend and backend)
- **Data**: All data stored, processed, or transmitted by Chikit
- **Infrastructure**: Servers, networks, and hosting environments
- **Integrations**: External systems like ABDM and MedGemma
- **Users**: Patients, doctors, administrators, and other system users
- **Development**: Our development processes and tooling

### Assumptions
We made several key assumptions in our threat modeling:
1. **Network Security**: We assume basic network security controls (firewalls, segmentation) are in place
2. **Physical Security**: We assume physical security of infrastructure is handled by hosting providers or IT
3. **Personnel Security**: We assume basic personnel security measures (background checks, training) are in place
4. **Compliance Baseline**: We assume we need to meet basic healthcare data protection standards
5. **Threat Actor Capabilities**: We considered threat actors ranging from opportunistic attackers to determined, well-resourced adversaries

## Assets We Need to Protect

We identified the following critical assets in our system:

### Data Assets
1. **Patient Health Information (PHI)**: Medical records, diagnoses, treatments, prescriptions, lab results
2. **Personal Identifying Information (PII)**: Names, addresses, phone numbers, email addresses, ID numbers
3. **Authentication Credentials**: Passwords, tokens, biometric data (if used)
4. **Financial Information**: Billing information, insurance details, payment records
5. **Operational Data**: Appointment schedules, staff schedules, hospital resource data
6. **Audit Logs**: Records of who accessed what and when
7. **Configuration Data**: System configuration, API keys, integration credentials
8. **Intellectual Property**: Source code, algorithms, proprietary business logic

### System Assets
1. **Frontend Application**: The React web application running in users' browsers
2. **Backend API**: The Node.js/Express API server
3. **Database**: PostgreSQL database storing all application data
4. **Authentication System**: JWT-based authentication and authorization system
5. **Integration Points**: ABDM and MedGemma integration services
6. **File Storage**: Any file storage for documents, images, or exports
7. **API Endpoints**: All exposed HTTP endpoints
8. **Network Infrastructure**: Communication channels between components

## Threat Identification

Using the STRIDE methodology, we identified threats in each category:

### Spoofing Threats
Threats where an attacker impersonates something or someone else:

1. **User Impersonation**: Attacker gains access to legitimate user credentials
   - *Impact*: Unauthorized access to patient data, ability to perform actions as legitimate user
   - *Likelihood*: Medium (depends on password strength, phishing susceptibility)
   
2. **Service Impersonation**: Attacker creates fake service that mimics Chikit
   - *Impact*: Users may disclose credentials to fake service, man-in-the-middle attacks
   - *Likelihood*: Low-Medium (requires domain spoofing or similar attacks)
   
3. **Medical Device Impersonation**: Attacker impersonates medical devices sending data to Chikit
   - *Impact*: False medical data entered into system, potentially leading to incorrect treatment
   - *Likelihood*: Low (depends on device integration methods)
   
4. **Admin Impersonation**: Attacker gains administrator-level access
   - *Impact*: Full system access, ability to modify configurations, create users, access all data
   - *Likelihood*: Low (administrator accounts are typically better protected)

### Tampering Threats
Threats where an attacker modifies something they shouldn't:

1. **Data Tampering**: Attacker modifies patient records, prescriptions, or other clinical data
   - *Impact*: Incorrect medical information leading to misdiagnosis or mistreatment
   - *Likelihood*: Medium (if attacker gains sufficient access)
   
2. **Configuration Tampering**: Attacker modifies system configuration or security settings
   - *Impact*: Weakening of security controls, creation of backdoors, disruption of service
   - *Likelihood*: Low-Medium (requires elevated privileges)
   
3. **Audit Log Tampering**: Attacker modifies or deletes audit logs to cover tracks
   - *Impact*: Loss of accountability, inability to investigate incidents, compliance violations
   - *Likelihood*: Low (requires database access)
   
4. **Code Tampering**: Attacker modifies frontend or backend code
   - *Impact*: Introduction of malicious functionality, backdoors, or logic errors
   - *Likelihood*: Low (requires access to source code or build systems)
   
5. **Integration Tampering**: Attacker modifies data flowing to/from external integrations
   - *Impact*: Incorrect ABDM or MedGemma data leading to errors in processing
   - *Likelihood*: Medium (network-level attacks possible)

### Repudiation Threats
Threats where an attacker denies performing an action:

1. **Action Denial**: User denies performing an action that was actually performed by them
   - *Impact*: Loss of accountability, inability to enforce policies, legal complications
   - *Likelihood*: Medium (without proper non-repudiation measures)
   
2. **System Denial**: System denies responsibility for actions it actually performed
   - *Impact*: Inability to trace issues, compliance violations, debugging difficulties
   - *Likelihood*: Low (requires systematic logging failures)
   
3. **Transaction Denial**: User denies a transaction (appointment, prescription, etc.) that occurred
   - *Impact*: Billing disputes, legal issues, confusion in medical records
   - *Likelihood*: Medium (without proper transaction logging)

### Information Disclosure Threats
Threats where an attacker gains access to sensitive information:

1. **Unauthorized Data Access**: Attacker accesses patient data without authorization
   - *Impact*: Privacy violation, potential discrimination, identity theft, legal liability
   - *Likelihood*: Medium-High (primary target for healthcare attacks)
   
2. **Credential Exposure**: Attacker gains access to authentication credentials
   - *Impact*: Enables further attacks (impersonation, elevated access)
   - *Likelihood*: Medium (phishing, brute force, credential stuffing)
   
3. **Configuration Disclosure**: Attacker gains access to system configuration
   - *Impact*: Reveals security weaknesses, integration details, potential attack vectors
   - *Likelihood*: Low-Medium (if improperly protected)
   
4. **API Key Exposure**: Attacker gains access to external service API keys
   - *Impact*: Unauthorized use of ABDM/MedGemma services, potential financial loss
   - *Likelihood*: Low (if properly secured)
   
5. **Network Traffic Interception**: Attacker intercepts unencrypted network traffic
   - *Impact*: Exposure of PHI, credentials, sensitive data in transit
   - *Likelihood*: Medium (if encryption not properly implemented)
   
6. **Log Exposure**: Attacker gains access to application or system logs
   - *Impact*: Exposure of sensitive data that may be inadvertently logged
   - *Likelihood*: Low-Medium (depends on logging practices)

### Denial of Service Threats
Threats where an attacker disrupts service availability:

1. **Application Layer DoS**: Attacker overwhelms application with excessive requests
   - *Impact*: Slow response times, timeout errors, inability to serve legitimate users
   - *Likelihood*: Medium (relatively easy to attempt)
   
2. **Network Layer DoS**: Attacker overwhelms network infrastructure
   - *Impact*: Complete service unavailability
   - *Likelihood*: Low-Medium (requires more resources)
   
3. **Database DoS**: Attacker overwhelms database with expensive queries
   - *Impact*: Database becomes unresponsive, affecting all application functionality
   - *Likelihood*: Medium (if queries not properly optimized/limited)
   
4. **Resource Exhaustion**: Attacker consumes excessive system resources (memory, CPU, disk)
   - *Impact*: System instability, crashes, performance degradation
   - *Likelihood*: Medium (various attack vectors possible)
   
5. **Integration Point DoS**: Attacker targets external service integrations
   - *Impact*: Loss of ABDM or MedGemma functionality, impacting specific features
   - *Likelihood*: Medium (external services may be less protected)
   
6. **Authentication Flood**: Attacker overwhelms authentication system with login attempts
   - *Impact*: Legitimate users unable to lock out, potential account lockouts
   - *Likelihood*: Medium (credential stuffing attacks)

### Elevation of Privilege Threats
Threats where an attacker gains higher-level permissions than intended:

1. **Privilege Escalation via Bugs**: Attacker exploits software bugs to gain higher privileges
   - *Impact*: Access to unauthorized data or functionality
   - *Likelihood*: Medium (depends on code quality and testing)
   
2. **Insecure Direct Object References (IDOR)**: Attacker accesses objects they shouldn't by manipulating references
   - *Impact*: Unauthorized access to specific patient records or other data
   - *Likelihood*: Medium-High (common web application vulnerability)
   
3. **Role Confusion**: Attacker exploits confusion between roles to gain elevated access
   - *Impact*: Performing actions reserved for higher privilege roles
   - *Likelihood*: Low-Medium (depends on role implementation clarity)
   
4. **Token Manipulation**: Attacker forges or modifies JWT tokens to gain elevated privileges
   - *Impact*: Unauthorized access based on falsified claims
   - *Likelihood*: Low-Medium (depends on token implementation strength)
   
5. **Session Hijacking**: Attacker steals or predicts session identifiers to impersonate users
   - *Impact*: Unauthorized access as legitimate user
   - *Likelihood*: Medium (depends on session management implementation)
   
6. **Vertical Privilege Escalation**: Low-privilege user gains administrator access
   - *Impact*: Complete system compromise
   - *Likelihood*: Low (requires significant vulnerability chaining)

## Data Flow Analysis

We analyzed data flows through our system to identify additional threats:

### User Interaction Flow
1. **User -> Browser -> Chikit Frontend -> API Gateway -> Backend Services -> Database**
   - *Threats*: Man-in-the-middle, XSS, CSRF, session hijacking, API abuse
   - *Protections*: HTTPS, input validation, output encoding, CSRF tokens, secure session management

### Data Entry Flow
1. **User Input -> Frontend Validation -> API Validation -> Service Processing -> Database Storage**
   - *Threats*: Injection attacks (SQL, XSS, command), bypassed validation, logic flaws
   - *Protections*: Parameterized queries, input/output encoding, validation layers, WAF

### Data Retrieval Flow
1. **User Request -> API Authentication -> Authorization Check -> Data Retrieval -> Response -> User**
   - *Threats*: Broken authentication, broken authorization, information leakage
   - *Protections*: Strong authentication, proper authorization checks, minimal necessary data exposure

### Integration Flow (ABDM/MedGemma)
1. **Chikit Service -> External Service API -> External Service Response -> Chikit Processing**
   - *Threats*: API abuse, credential theft, man-in-the-middle, malicious responses
   - *Protections*: Secure credential storage, certificate validation, input validation, response validation

### Administrative Flow
1. **Admin User -> Authentication -> Authorization -> Administrative Action -> Audit Log**
   - *Threats*: Privilege escalation, excessive permissions, audit log tampering
   - *Protections*: Least privilege principle, strong authentication, immutable audit logs, segregation of duties

## Risk Assessment

We assessed each identified threat using a risk matrix that considers:

### Likelihood Levels
- **Rare**: Unlikely to occur in years
- **Unlikely**: Could occur once every few years
- **Possible**: Might occur once a year
- **Likely**: Will occur several times per year
- **Almost Certain**: Will occur monthly or more frequently

### Impact Levels
- **Insignificant**: Minimal impact, no lasting damage
- **Minor**: Minor impact, easily recoverable
- **Moderate**: Significant impact, requires effort to recover
- **Major**: Major impact, significant recovery effort required
- **Catastrophic**: Severe impact, potentially unrecoverable, existential threat

### Risk Levels (Likelihood × Impact)
- **Low**: Acceptable with basic controls
- **Medium**: Requires specific mitigation efforts
- **High**: Requires priority mitigation efforts
- **Critical**: Requires immediate, comprehensive mitigation efforts

### Risk Assessment Results

After assessing each threat, we categorized them by risk level:

#### Critical Risks
1. **Unauthorized PHI Access** (Information Disclosure)
   - *Likelihood*: Medium
   - *Impact*: Catastrophic (privacy violation, legal liability, loss of trust)
   - *Risk Level*: High-Medium → **High** (mitigated to Medium with controls)

2. **Broken Authentication Allowing Account Takeover** (Spoofing)
   - *Likelihood*: Medium
   - *Impact*: Catastrophic (full access as legitimate user, potential PHI access)
   - *Risk Level*: High-Medium → **High** (mitigated to Medium with controls)

#### High Risks
1. **SQL Injection Leading to Data Breach or Manipulation** (Tampering/Information Disclosure)
   - *Likelihood*: Medium
   - *Impact*: Major (compromised data integrity/confidentiality)
   - *Risk Level*: **High**

2. **Broken Object Level Authorization (IDOR)** (Elevation of Privilege)
   - *Likelihood*: Medium-High
   - *Impact*: Major (unauthorized access to specific records)
   - *Risk Level*: **High**

3. **Cross-Site Scripting (XSS)** (Information Disclosure/Tampering)
   - *Likelihood*: Medium
   - *Impact*: Major (session hijacking, malware distribution, defacement)
   - *Risk Level*: **High**

4. **Insufficient Logging and Monitoring** (Repudiation)
   - *Likelihood*: Likely
   - *Impact*: Moderate (difficulty detecting and responding to incidents)
   - *Risk Level*: **High**

#### Medium Risks
1. **Cross-Site Request Forgery (CSRF)** (Tampering)
   - *Likelihood*: Medium
   - *Impact*: Moderate (unauthorized actions performed as user)
   - *Risk Level*: **Medium**

2. **Security Misconfiguration** (Multiple Categories)
   - *Likelihood*: Likely
   - *Impact*: Moderate (exposure of sensitive information, weakened controls)
   - *Risk Level*: **Medium**

3. **Use of Components with Known Vulnerabilities** (Multiple Categories)
   - *Likelihood*: Possible
   - *Impact*: Major (if critical component affected)
   - *Risk Level*: **Medium**

4. **Insufficient Attack Protection** (Denial of Service)
   - *Likelihood*: Possible
   - *Impact*: Moderate (service degradation or temporary unavailability)
   - *Risk Level*: **Medium**

5. **Sensitive Data Exposure via Logs or Error Messages** (Information Disclosure)
   - *Likelihood*: Possible
   - *Impact*: Moderate (accidental exposure of sensitive data)
   - *Risk Level*: **Medium**

#### Low Risks
1. **XML External Entities (XXE)** (Information Disclosure)
   - *Likelihood*: Unlikely
   - *Impact*: Moderate (if XML processing used)
   - *Risk Level*: **Low**

2. **Insecure Deserialization** (Tampering/Code Execution)
   - *Likelihood*: Unlikely
   - *Impact*: Major (remote code execution possible)
   - *Risk Level*: **Low**

3. **Missing Function Level Access Control** (Elevation of Privilege)
   - *Likelihood*: Unlikely
   - *Impact*: Moderate (unauthorized access to specific functions)
   - *Risk Level*: **Low**

4. **Using Broken or Risky Cryptographic Algorithms** (Information Disclosure)
   - *Likelihood*: Unlikely
   - *Impact*: Major (if encryption broken)
   - *Risk Level*: **Low**

## Mitigation Strategies

For each identified threat, we developed specific mitigation strategies:

### Authentication and Access Control Mitigations
1. **Strong Password Policies**
   - Minimum length requirements
   - Complexity requirements
   - Regular rotation (where appropriate)
   - Prevention of common passwords

2. **Multi-Factor Authentication (MFA)**
   - Optional or required for sensitive operations
   - Multiple factors (something you know, have, are)
   - Adaptive based on risk signals

3. **Secure Session Management**
   - Secure, HTTP-only cookies for session tokens
   - Proper session timeout and invalidation
   - Session regeneration after login
   - Concurrent session limits

4. **Least Privilege Authorization**
   - Role-based access control (RBAC) with well-defined roles
   - Resource-based permissions where needed
   - Regular permission reviews and cleanup
   - Separation of duties for critical operations

5. **Secure Token Implementation**
   - Strong JWT signing with adequate entropy
   - Appropriate expiration times
   - Token revocation capability for logout
   - Protection against token theft

### Input Validation and Output Encoding Mitigations
1. **Comprehensive Input Validation**
   - Validate all inputs (query params, headers, body, path params)
   - Use allowlists where possible, blocklists only when necessary
   - Validate type, length, format, and range
   - Reject invalid input rather than attempting to sanitize

2. **Output Encoding for Context**
   - HTML encoding for HTML contexts
   - JavaScript encoding for JavaScript contexts
   - URL encoding for URL contexts
   - CSS encoding for CSS contexts
   - Use contextual auto-escaping in templates

3. **Parameterized Queries**
   - Use parameterized queries or ORM methods for all database access
   - Never concatenate user input into SQL strings
   - Use ORM escaping facilities when building dynamic queries

4. **Content Security Policy (CSP)**
   - Implement strong CSP to mitigate XSS risks
   - Restrict sources for scripts, styles, images, etc.
   - Consider nonce-based or hash-based approaches for inline scripts

### Data Protection Mitigations
1. **Encryption at Rest**
   - Encrypt sensitive data in database (PHI, PII, credentials)
   - Use appropriate encryption algorithms (AES-256-GCM)
   - Secure key management (separate from data)
   - Consider field-level encryption for most sensitive data

2. **Encryption in Transit**
   - Enforce TLS 1.2+ for all communications
   - Use HTTPS for all web traffic
   - Use mutual TLS for service-to-service communication where appropriate
   - Validate certificates properly
   - Disable weak cipher suites

3. **Data Minimization and Retention**
   - Collect only data necessary for specified purposes
   - Implement data retention policies
   - Securely delete data when no longer needed
   - Regularly review data holdings

4. **Secure Data Handling**
   - Avoid logging sensitive data
   - Mask sensitive data in displays when full detail not needed
   - Securely transmit sensitive data between components
   - Use secure memory handling for sensitive data in memory

### Security Configuration and Maintenance Mitigations
1. **Secure Defaults**
   - Change default passwords and configurations
   - Disable unnecessary services and features
   - Implement least privilege for service accounts
   - Secure default configurations for frameworks and libraries

2. **Vulnerability Management**
   - Regular dependency scanning (npm audit, Dependabot, etc.)
   - Prompt patching of identified vulnerabilities
   - Maintain inventory of third-party components
   - Subscribe to security advisories for critical components

3. **Security Monitoring and Logging**
   - Implement comprehensive logging of security events
   - Monitor for suspicious activities (failed logins, unusual access patterns)
   - Implement log integrity measures (write-once storage, signing)
   - Regular log review and analysis

4. **Regular Security Testing**
   - Conduct regular penetration testing
   - Perform regular vulnerability scanning
   - Conduct code reviews with security focus
   - Implement bug bounty program or responsible disclosure process

### Specific Integration Mitigations
1. **ABDM Integration Security**
   - Secure storage of ABDM credentials
   - Use sandbox environment for development/testing
   - Validate all ABDM API responses
   - Implement proper error handling for ABDM service unavailability
   - Audit all ABDM interactions for compliance

2. **MedGemma Integration Security**
   - Ensure MedGemma inference server is properly secured
   - Validate all inputs to MedGemma service
   - Ensure no PHI leaves infrastructure for MedGemma processing
   - Implement fallback to rule-based system when MedGemma unavailable
   - Monitor MedGemma service performance and availability

### Application Security Mitigations
1. **Cross-Site Request Forgery (CSRF) Protection**
   - Implement CSRF tokens for state-changing operations
   - Validate CSRF tokens on server side
   - Consider SameSite cookie attributes
   - Implement double-submit cookie pattern where appropriate

2. **Clickjacking Protection**
   - Implement X-Frame-Options header
   - Use Content Security Policy frame-ancestors directive
   - Consider frame-breaking JavaScript for legacy browsers

3. **Secure Headers Implementation**
   - Implement HTTP Strict Transport Security (HSTS)
   - Implement X-Content-Type-Options: nosniff
   - Implement X-Permitted-Cross-Domain-Policies: none
   - Implement Referrer-Policy: strict-origin-when-cross-origin
   - Consider implementing Public Key Pinning (HPKP) with caution

4. **API Security**
   - Implement rate limiting to prevent abuse
   - Validate all API inputs strictly
   - Implement proper error handling (don't leak stack traces)
   - Use API gateway or WAF where appropriate
   - Version APIs appropriately

## Residual Risks and Acceptance

After implementing our mitigations, we identified residual risks that we accept with monitoring:

### Accepted Risks with Monitoring
1. **Sophisticated Targeted Attacks**
   - *Residual Risk*: Advanced persistent threats specifically targeting healthcare
   - *Mitigation*: Enhanced monitoring, threat intelligence sharing, incident response planning
   - *Acceptance Basis*: Cost of perfect protection prohibitive; focus on detection and response

2. **Insider Threats**
   - *Residual Risk*: Malicious or negligent actions by authorized users
   - *Mitigation*: Least privilege, separation of duties, monitoring, background checks
   - *Acceptance Basis*: Inherent risk in any system with trusted users; focus on detection

3. **Zero-Day Vulnerabilities**
   - *Residual Risk*: Previously unknown vulnerabilities in our dependencies or code
   - *Mitigation*: Rapid patching, defense in depth, minimal attack surface
   - *Acceptance Basis*: Impossible to protect against unknowns; focus on reducing impact

4. **Physical Security Breaches**
   - *Residual Risk*: Physical access to servers or infrastructure
   - *Mitigation*: Encryption at rest, logging, provider security assurances
   - *Acceptance Basis*: Delegated to hosting provider/infrastructure team

5. **Social Engineering**
   - *Residual Risk*: Users tricked into revealing credentials or performing actions
   - *Mitigation*: Security awareness training, phishing simulations, clear policies
   - *Acceptance Basis*: Human factor remains weakest link; focus on education and technical controls

## Threat Model Maintenance

We treat our threat model as a living document that requires regular updates:

### Review Schedule
- **Quarterly Reviews**: Regular review of threat model accuracy and completeness
- **After Major Changes**: Review after significant architectural or feature changes
- **After Security Incidents**: Review to incorporate lessons learned
- **When New Threats Emerge**: Review when new threat vectors are identified
- **Annually**: Comprehensive review and update

### Update Triggers
Our threat model is updated when:
1. **New Features Added**: New functionality may introduce new threat vectors
2. **Architecture Changes**: Changes to system architecture affect threat landscape
3. **New Regulations**: New compliance requirements may change risk calculations
4. **Threat Intelligence**: New information about threat actor tactics, techniques, and procedures
5. **Vulnerability Disclosures**: New vulnerabilities in our technology stack
6. **Incident Post-Mortems**: Lessons learned from security incidents or near misses
7. **Penetration Test Results**: Findings from professional security assessments
8. **Audit Findings**: Results from internal or external security audits

### Responsibility
- **Primary Owner**: Security team or designated security champion
- **Stakeholder Input**: Input from development, operations, compliance, and product teams
- **Executive Oversight**: Periodic review by leadership to ensure adequacy
- **External Input**: Consideration of external audits, assessments, and benchmarks

### Documentation
- **Version Control**: Threat model stored in version control with change history
- **Change Rationale**: Documentation of why changes were made
- **Effectiveness Tracking**: Tracking of mitigation effectiveness over time
- **Metrics**: Metrics related to threat model accuracy and mitigation effectiveness

## Conclusion

Our threat model for Chikit represents a systematic approach to identifying and addressing the security risks inherent in our healthcare platform. By following a structured methodology, we've been able to:

1. **Identify Critical Assets**: Clearly define what we need to protect
2. **Understand Threat Landscape**: Systematically identify potential threats using established frameworks
3. **Assess Risks Objectively**: Evaluate threats based on likelihood and impact
4. **Implement Targeted Mitigations**: Apply specific controls to address identified risks
5. **Accept Residual Risks Consciously**: Make informed decisions about unavoidable risks
6. **Establish Maintenance Process**: Keep our threat model current and effective

By implementing this threat model and continuously refining it based on experience and changing conditions, we've been able to build a more secure healthcare platform that better protects our users' sensitive health information while enabling the valuable functionality our users depend on.

We recognize that threat modeling is not a one-time activity but an ongoing process that must evolve with our application and the threat landscape. We commit to regularly reviewing, updating, and improving our threat model to ensure it continues to serve its purpose of enabling us to build and operate Chikit securely.

Remember: The goal of our threat modeling isn't to eliminate all risk (which is impossible), but to understand and manage risk effectively to enable us to deliver better, safer software for our patients and healthcare providers.