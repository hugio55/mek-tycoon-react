# Component Library Schema - Visual Diagram

## Table Relationships

```
┌────────────────────────────────────────────────────────────────────────┐
│                         COMPONENT LIBRARY SYSTEM                        │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │                        MAIN STORAGE                              │  │
│  │                                                                  │  │
│  │  ┌─────────────────────────────────────────────────────────┐   │  │
│  │  │              components                                   │   │  │
│  │  │  • name, slug, description                               │   │  │
│  │  │  • code, props, dependencies                             │   │  │
│  │  │  • category, tags                                        │   │  │
│  │  │  • usageCount, currentVersion                            │   │  │
│  │  │  • previewImage, primaryColor                            │   │  │
│  │  │  • isPublic, isArchived                                  │   │  │
│  │  └───────────────────┬───────────────────────────────────────┘   │  │
│  │                      │                                           │  │
│  │         ┌────────────┼────────────┬───────────────┬────────────┐│  │
│  │         │            │            │               │            ││  │
│  │         ▼            ▼            ▼               ▼            ││  │
│  │  ┌─────────────┐ ┌──────────┐ ┌──────────┐ ┌─────────────────┐││  │
│  │  │ component   │ │component │ │component │ │transformation   │││  │
│  │  │ Versions    │ │ Usage    │ │ Preview  │ │ History         │││  │
│  │  │             │ │          │ │ States   │ │                 │││  │
│  │  │ • version#  │ │• page    │ │• test    │ │• original code  │││  │
│  │  │ • code      │ │• section │ │  props   │ │• transformed    │││  │
│  │  │ • changes   │ │• active  │ │• expected│ │• corrections    │││  │
│  │  │ • previous  │ │• props   │ │• screenshot│• isSuccessful │││  │
│  │  └─────────────┘ └──────────┘ └──────────┘ └─────────────────┘││  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │                        AI LEARNING SYSTEM                        │  │
│  │                                                                  │  │
│  │  ┌────────────────────────────────────────────────────────┐    │  │
│  │  │          transformationHistory                          │    │  │
│  │  │  • originalCode, transformedCode                        │    │  │
│  │  │  • aiModel, prompt                                      │    │  │
│  │  │  • sessionId, iterationNumber                           │    │  │
│  │  │  • userFeedback, correctionsMade                        │    │  │
│  │  │  • colorMappings, classNamePatterns                     │    │  │
│  │  │  • isSuccessful                                         │    │  │
│  │  └────────────────────┬───────────────────────────────────┘    │  │
│  │                       │                                         │  │
│  │                       │ Extract patterns                        │  │
│  │                       ▼                                         │  │
│  │  ┌────────────────────────────────────────────────────────┐    │  │
│  │  │          userPreferences                                │    │  │
│  │  │  • preferenceType (color, className, etc.)              │    │  │
│  │  │  • sourcePattern → targetPattern                        │    │  │
│  │  │  • timesApplied, timesCorrect                           │    │  │
│  │  │  • confidenceScore                                      │    │  │
│  │  │  • priority                                             │    │  │
│  │  └────────────────────────────────────────────────────────┘    │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │                    ORGANIZATION & SESSIONS                       │  │
│  │                                                                  │  │
│  │  ┌───────────────────────┐    ┌──────────────────────────────┐ │  │
│  │  │ componentCollections  │    │ transformationSessions       │ │  │
│  │  │                       │    │                              │ │  │
│  │  │ • name, slug          │    │ • sessionId                  │ │  │
│  │  │ • componentIds[]      │    │ • goal, sourceLibrary        │ │  │
│  │  │ • isSystem            │    │ • totalIterations            │ │  │
│  │  │ • thumbnailUrl        │    │ • wasSuccessful              │ │  │
│  │  └───────────────────────┘    │ • keyLearnings               │ │  │
│  │                               └──────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          USER WORKFLOW                                   │
└─────────────────────────────────────────────────────────────────────────┘

1. User pastes code
   ┌──────────────────────┐
   │ "Paste HTML/CSS code"│
   └───────┬──────────────┘
           │
           ▼
2. AI transformation
   ┌──────────────────────────────┐
   │ transformationHistory        │───────┐
   │ • Store original code        │       │
   │ • Store AI output            │       │
   │ • iterationNumber: 1         │       │ Grouped by
   └───────┬──────────────────────┘       │ sessionId
           │                               │
           ▼                               │
3. User previews                           │
   ┌──────────────────────────────┐       │
   │ "Looks good but wrong color" │       │
   └───────┬──────────────────────┘       │
           │                               │
           ▼                               │
4. Record correction                       │
   ┌──────────────────────────────┐       │
   │ correctionsMade[]            │       │
   │ • issueType: "color"         │       │
   │ • original: "#3b82f6"        │       │
   │ • corrected: "#fab617"       │       │
   └───────┬──────────────────────┘       │
           │                               │
           ▼                               │
5. AI re-transforms                        │
   ┌──────────────────────────────┐       │
   │ transformationHistory        │───────┤
   │ • Apply corrections          │       │
   │ • iterationNumber: 2         │       │
   │ • isSuccessful: true         │       │
   └───────┬──────────────────────┘       │
           │                               │
           ▼                               │
6. Save component                          │
   ┌──────────────────────────────┐       │
   │ components                   │       │
   │ • name, slug                 │       │
   │ • final code                 │       │
   │ • currentVersion: 1          │       │
   └───────┬──────────────────────┘       │
           │                               │
           ├─────────────────────────┐     │
           │                         │     │
           ▼                         ▼     ▼
   ┌────────────────┐      ┌─────────────────────┐
   │componentVersions│     │transformationSessions│
   │ • version 1    │      │ • sessionId         │
   │ • initial code │      │ • successful: true  │
   └────────────────┘      │ • iterations: 2     │
                           └─────────────────────┘
           │
           ▼
7. Extract learning
   ┌──────────────────────────────┐
   │ userPreferences              │
   │ • type: "color"              │
   │ • source: "#3b82f6"          │
   │ • target: "#fab617"          │
   │ • confidence: 1.0            │
   └──────────────────────────────┘
           │
           │ Applied to future
           │ transformations
           ▼
   [Next transformation uses learned preferences automatically]
```

## Query Performance Map

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        INDEXES & PERFORMANCE                             │
└─────────────────────────────────────────────────────────────────────────┘

components table:
├─ by_slug [slug] ──────────────────────────────► O(log n) - Unique lookup
├─ by_category [category] ──────────────────────► O(log n) - Filter by type
├─ by_usage [usageCount] ───────────────────────► O(log n) - Most popular
├─ by_last_used [lastUsed] ─────────────────────► O(log n) - Recent
├─ by_created [createdAt] ──────────────────────► O(log n) - Chronological
├─ by_public [isPublic] ────────────────────────► O(log n) - Filter public
├─ by_archived [isArchived] ────────────────────► O(log n) - Hide archived
├─ search_name (searchField: name) ─────────────► Full-text search
└─ search_tags (searchField: tags) ─────────────► Full-text search

componentVersions table:
├─ by_component [componentId] ──────────────────► O(log n) - All versions
├─ by_component_version [componentId, versionNumber] ► O(1) - Exact version
└─ by_created [createdAt] ──────────────────────► O(log n) - Chronological

transformationHistory table:
├─ by_component [componentId] ──────────────────► O(log n) - Component history
├─ by_successful [isSuccessful] ────────────────► O(log n) - Learning data
├─ by_session [sessionId] ──────────────────────► O(log n) - Session grouping
├─ by_created [createdAt] ──────────────────────► O(log n) - Chronological
└─ by_source_type [originalSourceType] ─────────► O(log n) - Filter by source

userPreferences table:
├─ by_type [preferenceType] ────────────────────► O(log n) - Filter by type
├─ by_confidence [confidenceScore] ─────────────► O(log n) - High confidence
├─ by_priority [priority] ──────────────────────► O(log n) - Order application
├─ by_last_used [lastUsed] ─────────────────────► O(log n) - Active prefs
└─ by_user [userId] ────────────────────────────► O(log n) - Multi-user

componentUsage table:
├─ by_component [componentId] ──────────────────► O(log n) - Where used
├─ by_page [pageRoute] ─────────────────────────► O(log n) - Components on page
├─ by_active [isActive] ────────────────────────► O(log n) - Active only
├─ by_component_active [componentId, isActive] ─► O(1) - Compound filter
└─ by_page_active [pageRoute, isActive] ────────► O(1) - Compound filter

All indexes provide O(log n) or better performance for indexed queries.
```

## State Machine - Component Lifecycle

```
┌────────────────────────────────────────────────────────────────────┐
│                    COMPONENT STATE MACHINE                          │
└────────────────────────────────────────────────────────────────────┘

                    ┌─────────────────┐
                    │   User Pastes   │
                    │   Source Code   │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
            ┌──────►│ Transforming    │◄──────┐
            │       │ (AI Processing) │       │
            │       └────────┬────────┘       │
            │                │                │
            │                ▼                │
            │       ┌─────────────────┐       │
            │       │   Previewing    │       │
            │       │ (User Reviews)  │       │
            │       └────────┬────────┘       │
            │                │                │
            │      ┌─────────┴──────────┐     │
            │      │                    │     │
            │      ▼                    ▼     │
            │  ┌────────┐          ┌────────┐│
            └──┤ Reject │          │ Accept ├┘
               │(Iterate)          │ (Save) │
               └────────┘          └───┬────┘
                                      │
                                      ▼
                             ┌─────────────────┐
                             │   Saved         │
                             │ (In Library)    │
                             └────────┬────────┘
                                      │
                    ┌─────────────────┼─────────────────┐
                    │                 │                 │
                    ▼                 ▼                 ▼
           ┌─────────────┐   ┌─────────────┐   ┌─────────────┐
           │   Used      │   │  Updated    │   │  Archived   │
           │ (Active)    │   │(New Version)│   │ (Retired)   │
           └─────────────┘   └─────────────┘   └─────────────┘
```

## Integration with Existing Mek Tycoon Schema

```
┌────────────────────────────────────────────────────────────────────┐
│                   EXISTING MEK TYCOON SCHEMA                        │
│                                                                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐          │
│  │  meks    │  │  users   │  │  saves   │  │ essence  │          │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘          │
│       │              │              │              │               │
│       └──────────────┴──────────────┴──────────────┘               │
│                      │                                             │
│                      │ No direct relationships                     │
│                      │ (Component library is independent module)   │
│                      │                                             │
└──────────────────────┼─────────────────────────────────────────────┘
                       │
                       │ Coexists peacefully
                       │
┌──────────────────────┼─────────────────────────────────────────────┐
│                      │                                             │
│                      ▼                                             │
│         COMPONENT LIBRARY SCHEMA                                   │
│                                                                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐          │
│  │components│  │ versions │  │transform │  │ prefs    │          │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘          │
│                                                                     │
│  Future: Could link to users table for multi-user support          │
│          (createdBy field already in schema)                       │
└────────────────────────────────────────────────────────────────────┘
```

## Size Estimates

```
┌────────────────────────────────────────────────────────────────────┐
│                    ESTIMATED STORAGE SIZES                          │
└────────────────────────────────────────────────────────────────────┘

Per Component:
├─ components: ~2-5 KB (code + metadata)
├─ componentVersions: ~2-5 KB per version
├─ componentUsage: ~0.5 KB per usage
├─ componentPreviewStates: ~1-2 KB per preview
└─ Total: ~5-15 KB per component (depends on usage)

Per Transformation:
├─ transformationHistory: ~5-10 KB (includes code snapshots)
├─ transformationSessions: ~1 KB
└─ Total: ~6-11 KB per transformation attempt

Per Preference:
└─ userPreferences: ~0.5 KB

Example Library (100 components):
├─ 100 components × 10 KB = 1 MB
├─ 300 versions (avg 3 per component) × 5 KB = 1.5 MB
├─ 1000 usages × 0.5 KB = 500 KB
├─ 500 transformations × 8 KB = 4 MB
├─ 200 preferences × 0.5 KB = 100 KB
└─ Total: ~7 MB

This is negligible compared to typical database sizes.
Convex free tier: 1 GB storage (enough for ~14,000 components)
```
