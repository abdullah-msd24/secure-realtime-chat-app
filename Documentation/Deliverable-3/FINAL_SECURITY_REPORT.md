# CY321 - Final Security Report
## End-to-End Secure Real-Time Chat Application

**Course:** Secure Software Development and Development (CY321)
**Instructor:** Dr. Zubair Ahmad
**Team Members:** 
*   M. Abdullah Mahsud (2023346)
*   M. Zamad Safi (2023552)
*   Hassan Khan (2023243)

---

### 1. Abstract & Introduction
This project proposes the design and development of an end-to-end secure real-time chat application with a strong emphasis on secure software design principles. The system integrates modern web technologies, real-time communication, and proactive vulnerability assessment using automated scanning tools. The primary goal is to mitigate common web application vulnerabilities, specifically the OWASP Top 10, and demonstrate secure development and deployment practices suitable for enterprise environments.

### 2. Threat Model & Risk Management
Risk management ensures that potential security threats are systematically identified, assessed, and mitigated. Based on the risk identification phase, the following threats were modeled alongside their respective mitigations:

*   **Unauthorized Access:** Attackers gaining access to accounts or sensitive data. Mitigated via strong authentication, Role-Based Access Control (RBAC), and optional Multi-Factor Authentication (MFA).
*   **Data Breach:** Exposure of messages or credentials. Mitigated by encrypting data in transit and at rest.
*   **Injection Attacks:** SQL/NoSQL injection through input fields. Mitigated via input validation and parameterized queries.
*   **Cross-Site Scripting (XSS):** Malicious scripts executed in users' browsers. Mitigated via output encoding and Content Security Policy (CSP) policies.
*   **Denial of Service (DoS):** Overloading the server to disrupt availability. Mitigated via rate limiting and server monitoring.
*   **Man-in-the-Middle (MITM):** Interception of data in transit. Mitigated via TLS encryption and secure WebSockets.
*   **Misconfigured Controls:** Weak default configurations or outdated libraries. Mitigated via security audits and dependency updates.

### 3. Integrated Security Features
The system follows a layered architecture utilizing a Next.js frontend, a FastAPI (Python) backend, secure WebSockets, and a PostgreSQL database. The following security controls were implemented to ensure the confidentiality, integrity, and availability of data:

*   **Authentication & Authorization:** Implemented token-based authentication (JWT or OAuth2) for APIs. The system enforces strong password policies, optional MFA, and role-based access control for sensitive operations.
*   **Data Protection:** Applied secure password hashing utilizing bcrypt or a similar algorithm. Sensitive data is encrypted at rest within the PostgreSQL database and in transit utilizing TLS/SSL.
*   **Communication Security:** Utilized secure WebSockets (WSS) to protect real-time messaging against MITM and replay attacks.
*   **System Security & Validation:** Implemented strict input validation to prevent injection attacks. Authentication endpoints are secured with rate limiting and brute-force protection mechanisms.

### 4. Security Testing Techniques and Analysis
To validate the effectiveness of the implemented security controls, a multi-layered testing methodology was executed:

*   **Unit & Functional Testing (Pytest):** Created 9 security-focused test cases targeting authentication endpoints and authorization logic. Achieved a 100% test success rate (9/9 passed). Overall code coverage reached 49%, with the specific security test module achieving 97% coverage.
*   **Static Application Security Testing (Bandit):** Scanned 923 lines of backend Python code for vulnerabilities. The scan returned 0 Critical, High, or Medium severity issues, indicating a production-ready security level. The 16 Low severity issues detected were verified as acceptable false positives related to hardcoded assertions in test data.
*   **Dynamic Application Security Testing (OWASP ZAP):** Executed a dynamic scan against the OpenAPI endpoints to simulate real-world attacks. The active scan completed successfully and identified a low-risk alert regarding a missing `X-Content-Type-Options` header.
*   **Code Quality Analysis (Radon):** Analyzed 52 distinct code blocks for complexity. The codebase achieved an average complexity grade of A (2.62/10), indicating excellent maintainability and clean architectural design.
*   **CI/CD Pipeline Integration (CodeQL):** Utilized GitHub Actions for continuous integration, deployment, and automated security monitoring via CodeQL. The scan resulted in zero security alerts across the Python and JavaScript codebases, validating the local SAST findings.

### 5. Final Security Fixes and Enhancements
Following the testing analysis phase, the following final enhancements were applied to the application to patch identified weaknesses:

*   **Header Configuration:** Resolved the OWASP ZAP finding by explicitly configuring security headers (e.g., `X-Content-Type-Options: nosniff`).
*   **Path Configuration:** Fixed a configuration issue by replacing a hardcoded log path in `route/chats.py` (Line 33) with a dynamic relative path utilizing `os.path`.
*   **CORS Hardening:** Updated Cross-Origin Resource Sharing (CORS) configurations for production, restricting access from wildcard origins and limiting HTTP methods.

### 6. Conclusion
This project successfully bridges theoretical secure software design concepts with practical implementation. By integrating modern technologies and rigorous vulnerability assessment tools, the application demonstrates solid security practices and excellent code quality. The risk management strategies and automated testing ensure that the chat application maintains confidentiality, integrity, and availability while providing a secure environment for real-time communication.