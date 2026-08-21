# DANCE HUB — Security Rules

**Status:** Draft

These rules apply to humans and AI agents.

- Never commit secrets.
- Never expose service-role or equivalent privileged credentials to browser code.
- Never disable authorization controls merely to unblock development.
- Do not implement authorization solely in UI conditions.
- Database changes must be migration-driven.
- Production credentials must not be required for local tests.
- User-controlled input must be treated as untrusted.
- Generated or uploaded media must not be assumed safe solely from file extension.
