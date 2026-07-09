# MIST Platform — API Specification

**Version:** 1.0.0  
**Last Updated:** 2026-07-09  
**Base URL:** `https://mist.insomniacsgmrs.com/api`  
**Protocol:** HTTPS (REST) + WebSocket (real-time subscriptions)  
**Format:** JSON (request/response)  
**Auth:** Bearer JWT  

---

## Table of Contents

1. [Conventions](./01-conventions.md)
2. [Authentication](./02-authentication.md)
3. [Users](./03-users.md)
4. [Profiles](./04-profiles.md)
5. [Chat](./05-chat.md)
6. [Groups](./06-groups.md)
7. [Images](./07-images.md)
8. [Notifications](./08-notifications.md)
9. [Weather](./09-weather.md)
10. [Repeaters](./10-repeaters.md)
11. [Maps](./11-maps.md)
12. [Events](./12-events.md)
13. [Emergency Alerts](./13-alerts.md)
14. [AI Services](./14-ai-services.md)
15. [Forum Integration](./15-forum.md)
16. [Feed](./16-feed.md)
17. [Real-Time (WebSocket)](./17-realtime.md)
18. [Error Handling](./18-errors.md)
19. [Rate Limits](./19-rate-limits.md)
20. [Changelog](./20-changelog.md)

---

## Architecture Summary

MIST is a modular, API-first communications platform for the GMRS community. Each module exposes its own REST API with independent entities, functions, and automations. MyBB is reduced to an optional forum adapter behind the Forum Integration API.

**Designed for:** 100,000+ users  
**Real-time:** WebSocket via entity subscriptions  
**Auth:** JWT (access + refresh tokens)  
**Roles:** admin, moderator, member, guest

---

**End of Overview**