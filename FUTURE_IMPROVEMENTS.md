# Future Improvements

GrowthPilot AI is already functional and submission-ready, but the current scope is intentionally focused on the core CRM workflow required by the assignment.

This document records the next engineering steps that would make the system more scalable, resilient, and production-ready.

## Current strengths

- Separate CRM backend and channel service
- Callback-driven communication lifecycle
- AI provider abstraction
- CSV ingestion for customers and orders
- Pagination across major list views
- Campaign analytics and attribution
- Automated test suite
- CI workflows for all services

## Planned improvements

### 1. Async campaign dispatch
Current campaign sends are intentionally simple and synchronous from the CRM side.  
At larger volumes, this should move to a background job system so dispatch does not depend on a single request lifecycle.

**Proposed approach**
- Add a queue worker
- Batch recipient sends
- Retry failed dispatches
- Track job progress separately from communication status

**Benefit**
- Better throughput for large campaigns
- Less request-time latency
- Safer retry handling

---

### 2. CSV batch processing
CSV import currently works well for normal demo-sized files.  
For larger files, processing should move to background jobs with chunked inserts.

**Proposed approach**
- Store the uploaded file first
- Process rows in batches
- Return import job status asynchronously
- Add import history and retry support

**Benefit**
- Better memory usage
- Better handling of large customer/order files
- Cleaner UX for enterprise-scale uploads

---

### 3. AI rate limiting and prompt safeguards
AI features are already isolated behind providers, but usage should be controlled more tightly in production.

**Proposed approach**
- Add provider-level rate limiting
- Add prompt caching where safe
- Track token usage per endpoint
- Add guardrails for malformed or oversized prompts

**Benefit**
- Lower API cost
- Better stability
- More predictable latency

---

### 4. Channel service batching and throttling
The channel simulator currently models realistic lifecycle events, but production providers often require batching, pacing, and delivery throttling.

**Proposed approach**
- Add channel-specific concurrency limits
- Process sends in small batches
- Add pacing per provider or channel
- Preserve callback ordering guarantees

**Benefit**
- Better realism
- Better scaling behavior
- Easier replacement with real providers later

---

### 5. Attribution improvements
Attribution is currently simple and sufficient for the assignment, but a production CRM would need more robust modeling.

**Proposed approach**
- Support attribution windows
- Support multi-touch attribution
- Track campaign influence over time
- Add configurable attribution policies

**Benefit**
- More credible analytics
- Better campaign performance reporting
- More realistic revenue attribution

---

### 6. Role-based access control
The current app is intentionally single-operator in scope.

**Proposed approach**
- Add authentication
- Add roles such as admin and marketer
- Restrict campaign send and data import permissions

**Benefit**
- Better multi-user support
- Safer production usage

---

### 7. Observability
The current project is good for a take-home, but production systems need better visibility.

**Proposed approach**
- Add structured logs
- Add request IDs
- Add tracing across CRM and channel service
- Add metrics for queue depth, callback failures, and AI latency

**Benefit**
- Easier debugging
- Better operational insight
- Faster incident response

---

## Deliberately not added yet

These were intentionally left out of the current scope:

- Redis caching
- BullMQ / queue workers
- Kafka / event streaming
- Kubernetes
- Microservice explosion
- Full multi-tenant architecture

These would add complexity without improving the assignment outcome materially.

## Why they were deferred

The assignment values:
- clear product scoping
- working system design
- AI-native workflow
- code quality
- deployment
- communication

The current repo already demonstrates those goals well.  
The items above are future-scale enhancements, not submission blockers.

## Summary

GrowthPilot AI is intentionally built as a focused, well-scoped CRM for shopper outreach.

The next improvements should prioritize:
1. scaling send workflows
2. scaling imports
3. controlling AI usage
4. improving observability
5. adding access control
