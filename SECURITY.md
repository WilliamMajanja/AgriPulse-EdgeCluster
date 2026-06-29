# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 2.x     | :white_check_mark: |
| < 2.0   | :x:                |

## Reporting a Vulnerability

AgriPulse FMIS runs on a sovereign edge cluster with no cloud dependencies. Security is paramount for agricultural control systems.

**Do not** open public GitHub issues for security vulnerabilities. Report via email to **security@agripulse.local**.

Include:
- Description of the vulnerability
- Steps to reproduce
- Affected versions
- Potential impact on edge cluster operations

You should receive a response within 48 hours. If the vulnerability is accepted, a fix will be prioritized and released within 7 days.

## Scope

- Authentication bypass (if any)
- Remote code execution
- Sensor data integrity / tampering
- Actuator command injection via WebSocket
- Unauthorized access to actuator controls
- Data exfiltration from the edge cluster
- Minima blockchain data integrity (if enabled)

## Out of Scope

- Physical access to the IP65 enclosure
- Local network attacks requiring prior access
- Denial of service via resource exhaustion
- Social engineering

## Edge-First Security Principles

1. All processing happens locally on the 3-node cluster — no cloud dependencies
2. Actuator commands require explicit user confirmation before execution
3. Sensor data is validated at ingestion (range checks, bounds checking)
4. WebSocket connections are accepted only from the local network
5. Database files are stored on the NVMe SSD with restricted file permissions
