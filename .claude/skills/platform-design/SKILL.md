---
name: platform-design
description: Router skill that guides to the correct platform-specific design guidelines (iOS, Android, Web)
triggers:
  - "platform design"
  - "design guidelines"
  - "design system"
  - "native design"
  - "/platform-design"
---

# Platform Design Skills — Router

This skill helps you select the right platform-specific design guidelines for your project.

## Available Platform Skills

| Platform | Skill | Use When |
|----------|-------|----------|
| 🍎 **iOS/iPadOS** | `/ios-design` | Building native iOS apps with SwiftUI/UIKit |
| 🤖 **Android** | `/android-design` | Building native Android apps with Jetpack Compose |
| 🌐 **Web** | `/web-design` | Building web apps with any framework |

## Quick Selection Guide

```
What are you building?
│
├─► iOS/iPadOS App
│   └─► Use: /ios-design (Human Interface Guidelines)
│       • SF Symbols, Dynamic Type
│       • Navigation bars, tab bars
│       • Safe areas, touch targets (44pt)
│
├─► Android App
│   └─► Use: /android-design (Material Design 3)
│       • Dynamic color, Material You
│       • Navigation bar/rail
│       • Touch targets (48dp)
│
├─► Web App
│   └─► Use: /web-design (WCAG + Responsive)
│       • Accessibility compliance
│       • Responsive breakpoints
│       • Core Web Vitals
│
└─► Cross-Platform App
    └─► Consider:
        • React Native: Start with /ios-design OR /android-design
        • Flutter: Combine Material Design + platform adaptations
        • PWA: Start with /web-design, add mobile considerations
```

## Platform Comparison

### Touch Targets

| Platform | Minimum Size | Notes |
|----------|--------------|-------|
| iOS | 44 × 44pt | Includes hidden hit area |
| Android | 48 × 48dp | Material 3 guideline |
| Web | 44 × 44px (AAA), 24 × 24px (AA) | WCAG 2.2 standards |

### Typography

| Platform | System Font | Base Size |
|----------|-------------|-----------|
| iOS | SF Pro | 17pt Body |
| Android | Roboto | 16sp Body |
| Web | System UI stack | 16px Body |

### Navigation

| Platform | Primary | Secondary |
|----------|---------|-----------|
| iOS | Tab Bar (bottom) | Navigation Bar (top) |
| Android | Navigation Bar/Rail | Top App Bar |
| Web | Header nav / Sidebar | Breadcrumbs, footer |

### Spacing

| Platform | Base Unit | Standard Margin |
|----------|-----------|-----------------|
| iOS | 8pt | 16pt |
| Android | 4dp | 16dp |
| Web | 4px | 16px |

## Cross-Platform Design Principles

When designing for multiple platforms, follow these principles:

### 1. Platform-Native Over Consistency

```
✓ CORRECT:
  iOS: Tab bar at bottom with SF Symbols
  Android: Navigation bar with Material icons

✗ WRONG:
  iOS: Material-style FAB
  Android: iOS-style navigation bar
```

### 2. Shared Design Tokens, Platform Expressions

```
BRAND TOKENS (shared)
├── Colors: Primary, Secondary, Neutral
├── Typography scale: Headline, Body, Caption
└── Spacing scale: xs, sm, md, lg, xl

PLATFORM EXPRESSIONS (different)
├── iOS: SF Pro, 44pt targets, rounded rects
├── Android: Roboto, 48dp targets, Material surfaces
└── Web: System fonts, semantic HTML, WCAG contrast
```

### 3. Feature Parity, Not Visual Parity

- Same features, different expressions
- Respect platform conventions
- Users expect platform-native behavior

## When to Use Each Skill

| Scenario | Recommended Skill |
|----------|-------------------|
| "I'm building an iPhone app" | `/ios-design` |
| "I'm building for Android" | `/android-design` |
| "I'm building a website" | `/web-design` |
| "I'm building a React Native app" | Start with primary platform, then adapt |
| "I'm building a PWA" | `/web-design` + mobile considerations |
| "I need accessibility guidelines" | `/web-design` (WCAG applies everywhere) |
| "I need Material Design" | `/android-design` |
| "I need Human Interface Guidelines" | `/ios-design` |

## Quick Reference Card

```
┌─────────────────────────────────────────────────────────────────┐
│ PLATFORM DESIGN AT A GLANCE                                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│              iOS           Android          Web                  │
│ ─────────────────────────────────────────────────────────────── │
│ Touch        44pt          48dp             44px (AAA)           │
│ Font         SF Pro        Roboto           system-ui            │
│ Nav          Tab bar       Nav bar/rail     Header/sidebar       │
│ Color        Semantic      Dynamic          CSS custom props     │
│ Motion       0.3s ease     300ms standard   prefers-reduced      │
│ Radius       10-12pt       4-28dp           4-16px               │
│                                                                  │
│ /ios-design  /android-design  /web-design                        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Triggering the Right Skill

Simply invoke the skill for your target platform:

```
User: I'm building an iOS app
→ Invoke /ios-design

User: How should I handle Android navigation?
→ Invoke /android-design

User: I need to make my website accessible
→ Invoke /web-design

User: What's the Material Design button style?
→ Invoke /android-design
```
