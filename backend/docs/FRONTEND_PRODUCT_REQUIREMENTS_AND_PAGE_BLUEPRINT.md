# Esoteric Library Frontend Product Requirements & Page Blueprint

**Document status:** Approved implementation baseline  
**Version:** 1.0  
**Audience:** Product, business, UX/UI, engineering, editorial, operations, QA, compliance  
**Platform:** Responsive web application (Angular SSR/PWA)  
**Backend:** Esoteric Library NestJS REST API

---

## 1. Product vision

Esoteric Library is a trusted digital sanctuary for studying enduring philosophical, spiritual, and esoteric works. The experience must combine the authority of a carefully maintained archive, the calm of a private study room, and the clarity of a modern learning platform.

The product must never feel sensational, occult-themed, gamified, or commercially aggressive. It should communicate scholarship, provenance, contemplation, privacy, and responsible access. Every page must help a visitor understand what a work is, why it can be trusted, and what to do next without creating cognitive noise.

### Product promise

> Carefully sourced wisdom, structured for serious study, in a private and respectful digital space.

### Business outcomes

- Convert qualified visitors into verified members.
- Help members discover relevant works and learning paths.
- Increase lesson completion and responsible long-term engagement.
- Build trust through visible sources, rights, authorship, and editorial governance.
- Monetize premium works and bundles without weakening the scholarly character.
- Give editorial and operational teams traceable, permission-controlled workflows.

### Experience principles

1. **Quiet authority:** restrained design, precise language, no unnecessary urgency.
2. **Provenance first:** sources, contributors, editions, rights, and corrections remain visible.
3. **Progress without pressure:** encourage continuity without streaks, anxiety, or dark patterns.
4. **Privacy by design:** clearly explain private notes, reflections, consent, and session controls.
5. **Layered depth:** offer a clear first reading with deeper context available on demand.
6. **Inclusive scholarship:** readable, keyboard-accessible, responsive, and localization-ready.
7. **Operational integrity:** admin actions show status, ownership, consequences, and auditability.

---

## 2. Audience and roles

| Audience              | Primary needs                                                                        |
| --------------------- | ------------------------------------------------------------------------------------ |
| Visitor               | Understand the value, browse trusted material, preview works, register or purchase   |
| Member                | Access owned works, learn, track progress, and maintain a private knowledge practice |
| Returning learner     | Resume immediately, review progress, revisit notes, and continue a learning path     |
| Customer              | Purchase securely, retrieve invoices, monitor orders, and request eligible refunds   |
| Writer                | Create structured works, modules, lessons, versions, sources, and claims             |
| Reviewer              | Validate scholarship, evidence, content reports, and editorial submissions           |
| Publisher             | Manage rights, approvals, schedules, publication, archival, and corrections          |
| Support agent         | Find users and resolve support cases with minimum necessary access                   |
| Operations/Growth     | Manage notifications, campaigns, entitlements, and service outcomes                  |
| Finance/Reporting     | Review commerce and learning reports without editorial permissions                   |
| Administrator/Auditor | Govern access, roles, flags, settings, and immutable audit history                   |

---

## 3. Information architecture

### Public navigation

- Home
- Explore
  - Catalogue
  - Learning Paths
  - Categories
  - Topics
  - Insights
- About the Library
- Search
- Sign in
- Become a member
- Cart

### Member navigation

- My Library
- Continue Studying
- Saved Knowledge
  - Bookmarks
  - Highlights
  - Notes
  - Reflections
- Orders
- Notifications
- Account

### Administrative navigation

- Dashboard
- Content
- Editorial
- Commerce
- People & Support
- Reports
- Governance
- Settings

Navigation visibility must be permission-driven. Unauthorized destinations must not be shown and must remain protected at route and API levels.

---

## 4. Brand and visual system

### Brand character

The visual language is **scholarly, contemplative, archival, and warm**. It should evoke a rare-book room and a contemporary museum publication—not fantasy, astrology software, or a generic SaaS dashboard.

### Colour system

| Token        | Colour               | Purpose                                        |
| ------------ | -------------------- | ---------------------------------------------- |
| Archive Ink  | `#232621`            | Primary text, dark panels, primary actions     |
| Parchment    | `#F5F0E7`            | Main application background                    |
| Ivory        | `#FFFDF8`            | Cards, forms, reading surfaces                 |
| Antique Gold | `#A98542`            | Focus, active states, meaningful accents       |
| Deep Gold    | `#73591F`            | Accessible accent text and links               |
| Sage         | `#556D55`            | Success, verified, completed, safe states      |
| Oxblood      | `#8A3F38`            | Errors, destructive actions, critical warnings |
| Slate        | `#6F6A60`            | Secondary copy and metadata                    |
| Hairline     | `rgba(53,48,39,.14)` | Dividers and quiet boundaries                  |

Gold is an accent, not a background default. Oxblood is reserved for genuine risk. Status must never rely on colour alone.

### Typography

- **Display/editorial:** refined serif for titles, quotations, work names, and contemplative content.
- **Interface:** highly legible sans-serif for navigation, forms, metadata, tables, and controls.
- Reading content targets 65–75 characters per line, generous line height, and user-controlled scale.
- Use sentence case. Avoid all caps except short metadata labels with increased tracking.

### Layout and components

- Twelve-column desktop grid, eight-column tablet grid, four-column mobile grid.
- Maximum public-content width: 1,280 px; reading width: 760–820 px.
- Spacing uses an 8 px base rhythm.
- Corners remain restrained (2–8 px); circles are reserved for seals, avatars, and compact status.
- Core components: global header, search overlay, work card, path card, source citation, progress rail, lesson navigator, side sheet, modal, toast, data table, filters, pagination, empty state, skeleton, and confirmation dialog.
- Motion duration: 150–300 ms. Respect `prefers-reduced-motion` and the member preference.

### Imagery and iconography

- Prefer manuscripts, archival textures, geometry, maps, art details, and restrained abstract symbolism.
- Each image needs rights metadata, meaningful alternative text, and a defined focal point.
- Avoid stereotypical mystical imagery, glowing effects, stock meditation poses, and culturally careless symbolism.
- Icons use one consistent thin-line family and always include accessible labels where meaning is not obvious.

### Voice and content style

- Calm, exact, respectful, and informed.
- Use “study,” “work,” “lesson,” and “source”; avoid “consume,” “hack,” or exaggerated transformation claims.
- Explain specialized terminology in context.
- Errors state what happened, whether data was saved, and the next safe action.
- Empty states teach the user how content arrives there.

---

## 5. Global application requirements

Every page must support loading, empty, error, offline, unauthorized, and success states where applicable. Public pages require SSR metadata, canonical URLs, structured data, and share imagery. Protected pages must preserve the intended destination through authentication. Forms need inline validation, server-error mapping, submission locking, and preservation of non-sensitive input after recoverable errors.

The global header changes by authentication state. The footer contains About, Editorial Standards, Privacy, Terms, Accessibility, Support, and copyright. A command-style search overlay is available from the header and keyboard shortcut. Cookie/consent presentation must be regional and non-blocking except where legally necessary.

---

## 6. Page catalogue and content requirements

### A. Public discovery

#### 1. Home

**Purpose:** Establish trust, explain the proposition, and guide visitors into relevant study.  
**Content:** Editorial hero; primary “Explore the library” action; secondary “Begin a learning path” action; featured works; curated learning path; browse-by-theme section; editorial standards/provenance statement; “continue studying” module for authenticated users; latest insights; membership value; quiet newsletter invitation; institutional footer.  
**Rules:** Content should be API-driven from catalogue home. Signed-in users receive a personalized continuation block without replacing the public value proposition. No autoplay or aggressive pop-ups.

#### 2. Catalogue

**Purpose:** Provide browsable access to all published works.  
**Content:** Page introduction; result count; filters for category, topic, language; sort by newest/title; active-filter chips; grid/list toggle; work cards with title, contributor, language, summary, access status, and progress; pagination; curated no-results alternatives.  
**Rules:** Filters persist in the URL and browser history. Mobile filters open in an accessible side sheet.

#### 3. Search Results

**Purpose:** Return relevant material for a free-text query.  
**Content:** Search field with submitted query; result total; grouped or typed results; highlighted matching context; filters; pagination; spelling/empty guidance; recent searches stored locally with consent.  
**Rules:** Search is distinct from catalogue filtering and uses the backend search endpoint. Queries are sanitized and shareable by URL.

#### 4. Category

**Purpose:** Explain an editorial category and display its published works.  
**Content:** Category name, description, parent/breadcrumb context, child categories, featured work, complete work listing, related topics, optional editorial introduction.  
**Rules:** Hierarchy must remain understandable on mobile and to screen readers.

#### 5. Topic

**Purpose:** Connect works around a focused concept.  
**Content:** Topic definition, related works, contributors, learning paths, adjacent topics, and relevant insights.  
**Rules:** Distinguish editorial relationships from algorithmic recommendations.

#### 6. Author / Contributor Profile

**Purpose:** Establish contributor identity and show credited works.  
**Content:** Name, portrait, biography, roles by work (author, translator, narrator, reviewer), credited works, language/context, and source attribution.  
**Rules:** Only public profiles render; credits must not imply authorship where the role differs.

#### 7. Work Details

**Purpose:** Help a visitor assess and begin or purchase a work.  
**Content:** Cover/artwork; title/subtitle; summary and full description; authors/contributors; categories/topics; language; learning scope; module/lesson outline; estimated commitment when derivable; preview; references; editorial status/provenance; rating summary; access/price state; primary action based on entitlement.  
**Rules:** CTA states: Preview, Add to cart, Begin study, Continue, or Unavailable. Never route an entitled member through checkout.

#### 8. Work Preview

**Purpose:** Demonstrate value without disclosing restricted content.  
**Content:** Work identity, approved preview material, sample lesson/excerpt, outline, contributor context, references included in preview, price/access card, purchase or sign-in action.  
**Rules:** Preview boundaries come exclusively from the backend; do not expose hidden lesson payloads in client code.

#### 9. References

**Purpose:** Make evidence and provenance inspectable.  
**Content:** Work header; grouped citations; author, title, publisher, publication date, ISBN/URL when available; source classification; locator; linked claims; access date where relevant; citation-copy action.  
**Rules:** External links open safely and are visibly identified. Missing metadata is omitted rather than replaced with invented values.

#### 10. Learning Paths

**Purpose:** Offer guided sequences for members who do not know where to begin.  
**Content:** Introductory guidance; path cards with purpose, level, included works, and sequence length; filters; featured starter path; progress for members.  
**Rules:** Do not promise duration unless backed by content metadata.

#### 11. Learning Path Details

**Purpose:** Explain the outcome and ordered journey of a path.  
**Content:** Title, description, intended audience, prerequisite guidance, ordered works, completion/progress state, access state per work, total price if applicable, start/continue action.  
**Rules:** Locked and available works are clearly differentiated; bundle purchase may be offered where configured.

#### 12. Insights Listing

**Purpose:** Surface public editorial articles and contextual scholarship.  
**Content:** Featured insight, chronological cards, excerpts, publication dates, related work/topic labels, pagination.  
**Rules:** Clearly distinguish insights from primary works and lessons.

#### 13. Insight Details

**Purpose:** Present a focused editorial article.  
**Content:** Title, excerpt, author/editor attribution if available, publication date, body, references, related works/topics, share action, next reading.  
**Rules:** Full SEO/article metadata and readable long-form layout are required.

### B. Identity and onboarding

#### 14. Sign In

**Content:** Email/password mode; passwordless OTP mode; forgot-password link; registration link; clear validation; privacy reassurance; rate-limit feedback. Redirect authenticated users safely.

#### 15. Register

**Content:** Name, email, password, strength guidance, required terms/privacy acknowledgement, benefit summary, existing-account link. Continue to verification without losing context.

#### 16. OTP Verification

**Content:** Masked destination, six-digit input, expiry guidance, resend action/cooldown, change-address route, development code only in local development. Support registration and login purposes.

#### 17. Forgot Password

**Content:** Email input, neutral confirmation message, sign-in return. Never disclose whether an account exists.

#### 18. Reset Password

**Content:** New password, confirmation, strength requirements, expired/invalid token state, success state, sign-in action. Existing sessions are handled according to backend policy.

### C. Member learning

#### 19. My Library

**Purpose:** Become the member’s primary return destination.  
**Content:** Continue studying; owned/entitled works; completion progress; recently accessed; filters by in progress/completed/not started; learning paths; empty-state route to catalogue.  
**Rules:** Progress and entitlement states come from the backend; never infer access from order UI alone.

#### 20. Work Learning Dashboard

**Content:** Work title and progress; resume action; module/lesson hierarchy; completed/current/locked states; work resources; transcript availability; personal knowledge counts; rating prompt after meaningful completion.  
**Rules:** Preserve curriculum order and return focus to the selected lesson after navigation.

#### 21. Lesson Reader

**Content:** Distraction-minimized reader; breadcrumb/module context; structured lesson content; supported media; transcript; previous/next lesson; progress control; completion action; bookmark/highlight/note/reflection tools; report-content action.  
**Rules:** Autosave progress carefully, announce saved state without interruption, support keyboard selection tools, and respect text-scale/reduced-motion preferences.

#### 22. Quiz

**Content:** Purpose/instructions; question progress; one question or structured group at a time; answer choices; save/continue; submit confirmation; accessible validation.  
**Rules:** Do not reveal correctness before submission unless configured. Prevent duplicate submissions and preserve the active attempt.

#### 23. Quiz Results

**Content:** Score, pass state, attempt summary, question-level feedback, explanations, retry eligibility, return-to-lesson and continue actions.  
**Rules:** Use encouraging factual language; avoid celebratory gamification inappropriate to the brand.

### D. Personal knowledge

#### 24. Bookmarks

**Content:** Saved lesson locations grouped by work; label, context, date, direct return; search/filter; delete confirmation; empty-state education.

#### 25. Highlights

**Content:** Quoted text, colour/category, source lesson and locator, date, edit metadata, direct return, filter/search, delete. Colour is supplementary to a visible label.

#### 26. Notes

**Content:** Searchable notes; work/lesson context; updated date; preview; create/edit side panel; autosave status; deletion confirmation. Clearly distinguish note text from quoted source text.

#### 27. Reflections

**Content:** Privacy explanation; encrypted reflection list; work/lesson context; create/edit/delete; local decryption failure state; export consideration for future scope.  
**Rules:** Never send plaintext into analytics, logs, previews, notifications, or admin interfaces.

### E. Account and privacy

#### 28. Account Profile

**Content:** Display name, verified identifier, language, time zone, membership date, save confirmation. Identifier changes remain out of scope until backend verification supports them.

#### 29. Preferences

**Content:** Reading scale, reduced motion, auto-resume, language/time zone shortcut, and future media preferences. Include immediate preview when practical.

#### 30. Privacy and Consent

**Content:** Required consent status, optional communication consent, version/date history, privacy explanations, policy links. Withdrawal effects must be explained before confirmation.

#### 31. Devices and Sessions

**Content:** Active sessions with recognizable browser/device, IP when appropriate, last used, expiry, current-session marker, revoke action, sign out everywhere. Sensitive location precision should not be implied.

#### 32. Account Controls

**Content:** Account deletion request, consequence summary, optional reason, confirmation, request status, support route. Require deliberate confirmation and do not imply immediate erasure where retention applies.

### F. Commerce

#### 33. Products

**Content:** Available individual works and bundles, current price/currency, included content, filters, access badges, and product cards. Hide inactive/draft products.

#### 34. Product Details

**Content:** Product name, linked work or bundle contents, description, active price, access benefits, existing-entitlement state, refund/policy summary, add-to-cart action.

#### 35. Cart

**Content:** Items, quantity, unit/line totals, remove action, coupon input/removal, discount, subtotal and total, currency, checkout action, empty cart. Cart must survive sign-in and reconcile ownership.

#### 36. Checkout

**Content:** Order summary, verified account context, price breakdown, policy acknowledgements, payment method handoff, duplicate-payment prevention, processing state. A server quote is authoritative.

#### 37. Payment Status

**Content:** Processing, success, failure, cancelled, and delayed-confirmation states; order/payment reference; verify action; library/orders routes; support guidance. Never trust return-query parameters as final payment truth.

#### 38. Orders

**Content:** Orders by date with number, status, amount/currency, items, and details link; filters; empty state. Status vocabulary must match backend states.

#### 39. Order Details

**Content:** Order number, timeline/status, line items, totals/discount, payment status, invoice action, cancel action when eligible, refund request action, entitlement outcome, support link.

#### 40. Invoices

**Content:** Invoice preview/download, invoice number, issued date, customer details supplied by backend, tax/line totals, order/payment reference. Print/PDF output must remain legible and immutable.

#### 41. Refund Requests

**Content:** Eligible order/item, amount, reason, policy notice, submit confirmation, request history and status, decision reason where present. Prevent repeated requests for the same eligible amount.

### G. Engagement and service

#### 42. Notifications

**Content:** Chronological notification centre; type/channel; read/unread treatment if later supported; relevant deep link; empty state and communication preference route. Never include private reflection/note content.

#### 43. Reviews and Ratings

**Content:** Work context, rating control, optional review if backend expands, existing rating, edit/remove actions, community aggregate, responsible participation guidance. One rating per member/work.

#### 44. Support

**Content:** Subject, issue category, message, related order/work reference when relevant, submission confirmation, case reference, case history/status when supported, self-service links.

#### 45. Content Report

**Content:** Work/lesson context, issue type, details, optional locator, what happens next, submission confirmation. Keep reporting distinct from general support and protect reporter privacy.

#### 46. Referrals

**Content:** Referral code entry/claim, eligibility explanation, success/already-claimed/invalid states, benefit explanation. Do not promise rewards not represented by backend configuration.

### H. Editorial and administration

#### 47. Admin Dashboard

**Content:** Role-specific work queue; key counts; pending reviews/rights/support/refunds; recent activity; system notices; shortcuts. Widgets are permission-filtered, traceable, and operational—not decorative.

#### 48. Content Management

**Content:** Works table with status, language, owner/assignment, version, updated date, workflow state; filters/search; create work; context actions; pagination; saved views as future enhancement.

#### 49. Work Editor

**Content:** Core metadata, language, version history, published/draft comparison, categories/topics/contributors, preview/references, modules, assignment, validation summary, submit-for-review. Warn clearly about unsaved changes.

#### 50. Lesson Editor

**Content:** Lesson metadata, position, structured content editor, transcript, media, version history, preview, validation, create version, module context. Published versions remain immutable; corrections create traceable versions.

#### 51. Media Library

**Content:** Media assets by type/status; search/filter; file metadata; checksum/size; owner; upload/presign workflow; processing progress; completion/failure recovery; usage context; rights/alt-text fields when supported.

#### 52. Sources and Claims

**Content:** Sources list/editor; citation metadata; claims queue; statement/locator/classification; linked sources; verification status; reviewer note; approve/dispute/reject actions. Evidence remains visible beside decisions.

#### 53. Rights Management

**Content:** Rights records by work; basis, territory, status, evidence, dates; preflight result and blockers; create/update actions; expiry warnings. Publication actions remain blocked when preflight fails.

#### 54. Editorial Workflow

**Content:** Workflow queue; stage, assignee, work/version, age; timeline of actions; submit/approve/request changes/transition; scheduling; publish/archive/correction actions based on role. Consequential actions require confirmation and outcome feedback.

#### 55. User Management

**Content:** User search; status, identifier, joined date, roles; user detail with minimum necessary account/order/support context; block/unblock with reason and confirmation. Private learning content is excluded.

#### 56. Roles and Permissions

**Content:** Roles, permission summaries, user-role assignment, affected-user confirmation, success/audit reference. Avoid implying that frontend visibility is the security boundary.

#### 57. Order Management

**Content:** Administrative order search/filter; order/customer/status/amount/date; order details; payment and entitlement state; cancellation/refund links; anomaly states. Financial values display currency explicitly.

#### 58. Refund Management

**Content:** Refund queue; order/payment/user context; requested amount and reason; status; approve/reject decision with rationale; webhook/processing state; immutable decision history.

#### 59. Reports and Analytics

**Content:** Overview, commerce, and learning tabs; date range; KPI definitions; trends; breakdown tables; export when supported; freshness timestamp; empty/partial-data warnings. Analytics are aggregate and must exclude private content.

#### 60. Audit Logs

**Content:** Actor, action, resource, timestamp, metadata summary; filters; pagination; detail drawer; correlation context. Audit records are read-only and sensitive fields are redacted.

#### 61. Feature Flags and System Settings

**Content:** Flag key, state, description/configuration, environment, last change; safe edit/confirmation; system settings separated by domain; secret values never displayed. High-impact changes explain scope and rollback expectations.

### I. System states (shared routes/templates)

#### Not Found

Calm 404 message, catalogue/search actions, preserved global navigation, and no blame-oriented language.

#### Error / Maintenance

Human-readable incident state, retry action, request/correlation reference when safe, status link if available, and route home. Never expose stack traces or internal payloads.

#### Access Denied

Explain whether sign-in, entitlement, or role is required without revealing protected resource details. Offer the correct next action.

#### Offline

Explain connection state, show cached reading where available, identify unsynced changes, and retry automatically with visible control.

---

## 7. Responsive behaviour

- **Mobile (320–767 px):** one-column content; bottom-safe controls; touch targets at least 44 px; filters/dense tools use sheets; lesson actions remain reachable without covering content.
- **Tablet (768–1,023 px):** adaptive two-column discovery; collapsible learning outline; admin tables may use prioritized columns plus detail drawer.
- **Desktop (1,024 px+):** full navigation, multi-column discovery, persistent lesson outline where space permits, and dense admin workspaces.
- No critical action may require hover. Content order in the DOM must remain logical at every breakpoint.

---

## 8. Accessibility and inclusion

- Target WCAG 2.2 AA.
- Complete keyboard operation, visible focus, skip links, semantic landmarks, labelled controls, and predictable focus restoration.
- Minimum normal-text contrast 4.5:1 and large-text contrast 3:1.
- Screen-reader announcements for loading completion, validation, autosave, filters, and important state changes.
- Captions/transcripts for time-based media; alt text for meaningful imagery.
- Zoom to 200% without loss of function; reflow at 320 CSS px.
- Do not use colour, position, icon, or motion as the only carrier of meaning.
- Respect reduced-motion and text-scale preferences throughout the application.

---

## 9. Content, SEO, and trust requirements

- Public pages use unique title, description, canonical URL, Open Graph, and structured data appropriate to CollectionPage, CreativeWork, Person, Article, or BreadcrumbList.
- Work, contributor, reference, and insight content must display backend facts without embellishment.
- Dates use the member locale/time zone while retaining an unambiguous machine-readable value.
- Prices always show currency; payment and entitlement status are distinct.
- Editorial corrections are visible and linked to the affected work where supplied.
- Legal, privacy, refund, and accessibility copy is centrally governed and versioned.

---

## 10. Analytics framework

Track business events, not private reading content. Recommended events include home CTA selection, search submitted, filter applied, work viewed, preview viewed, registration started/completed, lesson started/completed, checkout started, payment outcome viewed, support submitted, and admin workflow action completed.

Never collect note text, selected highlight text, reflection content, passwords, OTPs, tokens, full payment payloads, or sensitive form messages. Analytics consent and retention must follow the member’s applicable choices.

---

## 11. Quality and acceptance standards

A page is complete only when:

1. It uses the shared tokens and approved components.
2. It is connected to the correct backend endpoint and typed response model.
3. Loading, empty, error, unauthorized, offline, and success states are handled.
4. Desktop, tablet, and mobile behaviour has been verified.
5. Keyboard and screen-reader behaviour has been tested.
6. Forms map client and server validation without losing safe user input.
7. Permission, entitlement, and status rules match backend authority.
8. Public metadata and protected-page indexing rules are correct.
9. Relevant analytics exclude sensitive content.
10. Unit/component tests and the critical end-to-end journey pass.
11. Copy has been reviewed for clarity, trust, and domain appropriateness.
12. No placeholder data, dead action, hidden failure, or console error remains.

---

## 12. Recommended delivery sequence

1. Shared design system, shell, accessibility primitives, and API conventions.
2. Identity, onboarding, account, privacy, and sessions.
3. Home, catalogue, search, taxonomy, work, references, paths, and insights.
4. My Library, work dashboard, lesson reader, media, transcript, and progress.
5. Personal knowledge, quizzes, ratings, reports, and support.
6. Products, cart, checkout, payment outcomes, orders, invoices, and refunds.
7. Editorial content, sources, claims, rights, workflows, and media administration.
8. User/support operations, commerce operations, reporting, audit, flags, and settings.
9. Full accessibility, performance, security, browser, SEO, and production-readiness audit.

This document is the product and UX baseline. Individual implementation tickets may add detail, but they must not contradict its trust, privacy, provenance, accessibility, or design-system requirements without an approved product decision.
