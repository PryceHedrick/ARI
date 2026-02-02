---
name: platform-web-design
description: Modern web design guidelines with WCAG accessibility, responsive design, and cross-browser patterns
triggers:
  - "web design"
  - "web app"
  - "website"
  - "responsive design"
  - "wcag"
  - "accessibility"
  - "a11y"
  - "/web-design"
---

# Modern Web Design — Accessibility & Responsive Skill

Build web applications that are accessible, responsive, and performant by applying WCAG 2.2 guidelines and modern web standards as actionable rules.

## Core Principles

### The Web Platform Advantages

| Principle | Meaning | Implementation |
|-----------|---------|----------------|
| **Progressive Enhancement** | Core functionality without JS | Server-rendered HTML, CSS-first |
| **Responsive** | Works on all screen sizes | Fluid layouts, breakpoints |
| **Accessible** | Usable by everyone | WCAG 2.2 AA compliance |
| **Performant** | Fast on slow networks | Core Web Vitals targets |

## Typography

### Responsive Type Scale

```css
/* Fluid typography using clamp() */
:root {
  /* Base: 16px at 320px, 18px at 1200px */
  --text-base: clamp(1rem, 0.95rem + 0.25vw, 1.125rem);

  /* Scale: Perfect fourth (1.333) */
  --text-sm: clamp(0.75rem, 0.72rem + 0.15vw, 0.844rem);
  --text-lg: clamp(1.25rem, 1.2rem + 0.25vw, 1.5rem);
  --text-xl: clamp(1.5rem, 1.4rem + 0.5vw, 2rem);
  --text-2xl: clamp(2rem, 1.8rem + 1vw, 3rem);
  --text-3xl: clamp(2.5rem, 2.2rem + 1.5vw, 4rem);
}

body {
  font-family: system-ui, -apple-system, BlinkMacSystemFont,
               'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
  font-size: var(--text-base);
  line-height: 1.6;
}
```

### Font Stack Recommendations

```css
/* System fonts (fastest) */
font-family: system-ui, -apple-system, BlinkMacSystemFont,
             'Segoe UI', Roboto, sans-serif;

/* Serif (for long-form reading) */
font-family: Charter, 'Bitstream Charter', 'Sitka Text',
             Cambria, serif;

/* Monospace (code) */
font-family: ui-monospace, 'Cascadia Code', 'Source Code Pro',
             Menlo, Consolas, monospace;
```

### Typography Rules

```
┌─────────────────────────────────────────────────────────────────┐
│ TYPOGRAPHY BEST PRACTICES                                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│ LINE LENGTH                                                      │
│ ├── Optimal: 45-75 characters per line                          │
│ ├── Too short: Choppy, disrupts reading                         │
│ └── Too long: Eye strain, hard to track                         │
│                                                                  │
│ LINE HEIGHT                                                      │
│ ├── Body text: 1.5-1.75                                         │
│ ├── Headings: 1.1-1.3                                           │
│ └── Large text (>24px): 1.3-1.5                                 │
│                                                                  │
│ HEADING HIERARCHY                                                │
│ ├── h1: Page title (one per page)                               │
│ ├── h2: Major sections                                          │
│ ├── h3: Subsections                                             │
│ └── Don't skip levels (h1 → h3)                                 │
│                                                                  │
│ FONT WEIGHT                                                      │
│ ├── Regular (400): Body text                                    │
│ ├── Medium (500): Emphasis, labels                              │
│ ├── Semibold (600): Buttons, headings                           │
│ └── Bold (700): Strong emphasis                                 │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Color & Contrast

### WCAG Contrast Requirements

```
┌─────────────────────────────────────────────────────────────────┐
│ WCAG 2.2 CONTRAST RATIOS                                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│ LEVEL AA (REQUIRED)                                              │
│ ├── Normal text (<18pt): 4.5:1                                  │
│ ├── Large text (≥18pt bold, ≥24pt): 3:1                         │
│ └── UI components, graphical objects: 3:1                       │
│                                                                  │
│ LEVEL AAA (ENHANCED)                                             │
│ ├── Normal text: 7:1                                            │
│ ├── Large text: 4.5:1                                           │
│                                                                  │
│ EXCEPTIONS                                                       │
│ ├── Decorative elements                                         │
│ ├── Inactive controls                                           │
│ └── Incidental text (in images of other things)                 │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Color System

```css
/* Define with CSS custom properties */
:root {
  /* Neutral scale (grays) */
  --gray-50: #fafafa;
  --gray-100: #f5f5f5;
  --gray-200: #e5e5e5;
  --gray-300: #d4d4d4;
  --gray-400: #a3a3a3;
  --gray-500: #737373;
  --gray-600: #525252;
  --gray-700: #404040;
  --gray-800: #262626;
  --gray-900: #171717;

  /* Semantic colors */
  --color-text: var(--gray-900);
  --color-text-muted: var(--gray-600);
  --color-background: white;
  --color-surface: var(--gray-50);

  /* Brand colors */
  --color-primary: #2563eb;       /* Blue-600 */
  --color-primary-hover: #1d4ed8; /* Blue-700 */

  /* Feedback colors */
  --color-success: #16a34a;
  --color-warning: #d97706;
  --color-error: #dc2626;
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  :root {
    --color-text: var(--gray-100);
    --color-text-muted: var(--gray-400);
    --color-background: var(--gray-900);
    --color-surface: var(--gray-800);
  }
}
```

### Color Accessibility Rules

```
✓ ALWAYS:
  - Provide 4.5:1 contrast for body text
  - Use 3:1 contrast for large text and UI elements
  - Never use color alone to convey meaning
  - Test with color blindness simulators

✗ NEVER:
  - Gray text on gray background (#777 on #ccc = 2.3:1 ❌)
  - Red text on green background (color blind issues)
  - Light text on light background without sufficient contrast
```

## Spacing System

### 4px Base Grid

```css
:root {
  --space-1: 0.25rem;  /* 4px */
  --space-2: 0.5rem;   /* 8px */
  --space-3: 0.75rem;  /* 12px */
  --space-4: 1rem;     /* 16px */
  --space-5: 1.25rem;  /* 20px */
  --space-6: 1.5rem;   /* 24px */
  --space-8: 2rem;     /* 32px */
  --space-10: 2.5rem;  /* 40px */
  --space-12: 3rem;    /* 48px */
  --space-16: 4rem;    /* 64px */
  --space-20: 5rem;    /* 80px */
  --space-24: 6rem;    /* 96px */
}
```

### Spacing Usage

```
COMPONENT INTERNAL SPACING
├── Dense: 8px (forms, lists)
├── Default: 16px (most components)
└── Comfortable: 24px (cards, sections)

SECTION SPACING
├── Between related groups: 24px
├── Between sections: 48px
└── Between major sections: 80px+

RESPONSIVE SPACING
├── Mobile: Reduce by 25%
├── Desktop: Standard values
└── Large screens: Increase by 25% max
```

## Responsive Design

### Breakpoint System

```css
/* Mobile-first breakpoints */
:root {
  --breakpoint-sm: 640px;   /* Large phones, landscape */
  --breakpoint-md: 768px;   /* Tablets */
  --breakpoint-lg: 1024px;  /* Laptops */
  --breakpoint-xl: 1280px;  /* Desktops */
  --breakpoint-2xl: 1536px; /* Large screens */
}

/* Usage: Start mobile, add complexity */
.container {
  padding: var(--space-4);
}

@media (min-width: 768px) {
  .container {
    padding: var(--space-6);
  }
}

@media (min-width: 1024px) {
  .container {
    padding: var(--space-8);
    max-width: 1200px;
    margin: 0 auto;
  }
}
```

### Fluid Layouts

```css
/* Container with max-width and fluid padding */
.container {
  width: 100%;
  max-width: min(1200px, 100% - 2rem);
  margin-inline: auto;
  padding-inline: clamp(1rem, 5vw, 3rem);
}

/* Grid that adapts to content */
.auto-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(300px, 100%), 1fr));
  gap: var(--space-6);
}

/* Sidebar + main content */
.with-sidebar {
  display: grid;
  grid-template-columns: minmax(250px, 25%) 1fr;
  gap: var(--space-8);
}

@media (max-width: 768px) {
  .with-sidebar {
    grid-template-columns: 1fr;
  }
}
```

### Responsive Images

```html
<!-- Responsive with art direction -->
<picture>
  <source
    media="(min-width: 1024px)"
    srcset="hero-desktop.webp 1920w, hero-desktop@2x.webp 3840w"
    sizes="100vw"
  />
  <source
    media="(min-width: 640px)"
    srcset="hero-tablet.webp 768w, hero-tablet@2x.webp 1536w"
    sizes="100vw"
  />
  <img
    src="hero-mobile.webp"
    srcset="hero-mobile.webp 375w, hero-mobile@2x.webp 750w"
    sizes="100vw"
    alt="Hero image description"
    loading="lazy"
    decoding="async"
  />
</picture>
```

```css
/* Make images responsive by default */
img {
  max-width: 100%;
  height: auto;
  display: block;
}
```

## Touch Targets

```
┌─────────────────────────────────────────────────────────────────┐
│ MINIMUM TOUCH TARGET: 44 × 44 CSS pixels                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│ WCAG 2.2 Target Size Requirements:                               │
│                                                                  │
│ Level AA (2.5.8): 24×24 CSS pixels minimum                       │
│ Level AAA (2.5.5): 44×44 CSS pixels minimum                      │
│                                                                  │
│ BEST PRACTICE: Always use 44×44 for:                             │
│ ├── Buttons                                                      │
│ ├── Links in navigation                                          │
│ ├── Form controls                                                │
│ ├── Interactive icons                                            │
│ └── Checkboxes and radio buttons                                 │
│                                                                  │
│ SPACING between targets: 8px minimum                             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

```css
/* Ensure touch targets */
button,
a:not([class]),
input[type="checkbox"],
input[type="radio"] {
  min-height: 44px;
  min-width: 44px;
}

/* For inline links, use padding */
a {
  padding: 0.5rem 0;
  display: inline-block;
}

/* Icon buttons */
.icon-button {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
}
```

## Accessibility (WCAG 2.2)

### Semantic HTML

```html
<!-- ✓ CORRECT: Semantic structure -->
<header>
  <nav aria-label="Main navigation">
    <ul>
      <li><a href="/">Home</a></li>
      <li><a href="/about">About</a></li>
    </ul>
  </nav>
</header>

<main>
  <article>
    <h1>Page Title</h1>
    <section aria-labelledby="section-heading">
      <h2 id="section-heading">Section Title</h2>
      <p>Content...</p>
    </section>
  </article>
</main>

<footer>
  <nav aria-label="Footer navigation">
    <!-- Links -->
  </nav>
</footer>

<!-- ✗ WRONG: Div soup -->
<div class="header">
  <div class="nav">
    <div class="nav-item">Home</div>
  </div>
</div>
```

### Focus Management

```css
/* Visible focus indicator */
:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

/* Remove default only if custom provided */
:focus:not(:focus-visible) {
  outline: none;
}

/* Skip link */
.skip-link {
  position: absolute;
  top: -40px;
  left: 0;
  background: var(--color-primary);
  color: white;
  padding: 8px;
  z-index: 100;
}

.skip-link:focus {
  top: 0;
}
```

```html
<!-- Skip link (first element in body) -->
<a href="#main-content" class="skip-link">Skip to main content</a>

<!-- Main content target -->
<main id="main-content" tabindex="-1">
```

### Forms

```html
<!-- Accessible form -->
<form>
  <div class="form-group">
    <label for="email">
      Email address
      <span class="required" aria-hidden="true">*</span>
    </label>
    <input
      type="email"
      id="email"
      name="email"
      required
      aria-required="true"
      aria-describedby="email-hint email-error"
    />
    <p id="email-hint" class="hint">We'll never share your email.</p>
    <p id="email-error" class="error" role="alert" aria-live="polite"></p>
  </div>

  <fieldset>
    <legend>Notification preferences</legend>
    <div>
      <input type="radio" id="notify-email" name="notify" value="email" />
      <label for="notify-email">Email</label>
    </div>
    <div>
      <input type="radio" id="notify-sms" name="notify" value="sms" />
      <label for="notify-sms">SMS</label>
    </div>
  </fieldset>

  <button type="submit">Submit</button>
</form>
```

### ARIA Patterns

```html
<!-- Tab Panel -->
<div class="tabs">
  <div role="tablist" aria-label="Settings tabs">
    <button
      role="tab"
      id="tab-1"
      aria-controls="panel-1"
      aria-selected="true"
    >
      General
    </button>
    <button
      role="tab"
      id="tab-2"
      aria-controls="panel-2"
      aria-selected="false"
      tabindex="-1"
    >
      Privacy
    </button>
  </div>

  <div
    role="tabpanel"
    id="panel-1"
    aria-labelledby="tab-1"
  >
    <!-- General settings content -->
  </div>

  <div
    role="tabpanel"
    id="panel-2"
    aria-labelledby="tab-2"
    hidden
  >
    <!-- Privacy settings content -->
  </div>
</div>

<!-- Modal Dialog -->
<dialog
  id="modal"
  aria-labelledby="modal-title"
  aria-describedby="modal-desc"
>
  <h2 id="modal-title">Confirm Action</h2>
  <p id="modal-desc">Are you sure you want to proceed?</p>
  <button>Cancel</button>
  <button>Confirm</button>
</dialog>
```

### Screen Reader Utilities

```css
/* Visually hidden but accessible */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* Focusable when visually hidden */
.sr-only-focusable:focus,
.sr-only-focusable:active {
  position: static;
  width: auto;
  height: auto;
  overflow: visible;
  clip: auto;
  white-space: normal;
}
```

## Motion & Animation

### Respecting User Preferences

```css
/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}

/* Safe animations (non-motion) */
.fade-in {
  animation: fadeIn 200ms ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Avoid for reduced motion */
.slide-in {
  animation: slideIn 300ms ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .slide-in {
    animation: fadeIn 200ms ease-out;
  }
}
```

### Animation Guidelines

```
┌─────────────────────────────────────────────────────────────────┐
│ MOTION BEST PRACTICES                                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│ DURATION                                                         │
│ ├── Micro-interactions: 100-200ms                               │
│ ├── Standard transitions: 200-300ms                             │
│ ├── Complex animations: 300-500ms                               │
│ └── Page transitions: 300-500ms                                 │
│                                                                  │
│ EASING                                                           │
│ ├── ease-out: For elements entering                             │
│ ├── ease-in: For elements leaving                               │
│ ├── ease-in-out: For elements moving on screen                  │
│ └── linear: Only for continuous animations (spinners)           │
│                                                                  │
│ ACCESSIBILITY                                                    │
│ ├── Respect prefers-reduced-motion                              │
│ ├── Provide pause/stop for auto-playing content                 │
│ ├── No flashing content (>3 times/second)                       │
│ └── Avoid parallax scrolling (vestibular triggers)              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Performance

### Core Web Vitals Targets

```
┌─────────────────────────────────────────────────────────────────┐
│ CORE WEB VITALS (2024)                                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│ LCP (Largest Contentful Paint)                                   │
│ ├── Good: ≤2.5s                                                 │
│ ├── Needs improvement: 2.5s-4s                                  │
│ └── Poor: >4s                                                   │
│                                                                  │
│ INP (Interaction to Next Paint)                                  │
│ ├── Good: ≤200ms                                                │
│ ├── Needs improvement: 200ms-500ms                              │
│ └── Poor: >500ms                                                │
│                                                                  │
│ CLS (Cumulative Layout Shift)                                    │
│ ├── Good: ≤0.1                                                  │
│ ├── Needs improvement: 0.1-0.25                                 │
│ └── Poor: >0.25                                                 │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Performance Patterns

```html
<!-- Preload critical assets -->
<link rel="preload" href="/fonts/Inter.woff2" as="font" type="font/woff2" crossorigin />
<link rel="preload" href="/hero.webp" as="image" />

<!-- Defer non-critical JS -->
<script src="/main.js" defer></script>

<!-- Lazy load below-fold images -->
<img src="photo.webp" loading="lazy" decoding="async" alt="Description" />

<!-- Preconnect to required origins -->
<link rel="preconnect" href="https://api.example.com" />
<link rel="dns-prefetch" href="https://cdn.example.com" />
```

```css
/* Prevent layout shift */
img, video {
  aspect-ratio: attr(width) / attr(height);
  width: 100%;
  height: auto;
}

/* Font loading optimization */
@font-face {
  font-family: 'Inter';
  src: url('/fonts/Inter.woff2') format('woff2');
  font-display: swap;
  font-weight: 400 700;
}

/* Reduce paint complexity */
.hardware-accelerated {
  transform: translateZ(0);
  will-change: transform;
}
```

## Navigation Patterns

### Primary Navigation

```html
<!-- Responsive navigation -->
<header class="header">
  <a href="/" class="logo">Brand</a>

  <button
    class="menu-toggle"
    aria-expanded="false"
    aria-controls="nav-menu"
    aria-label="Toggle navigation"
  >
    <span class="hamburger"></span>
  </button>

  <nav id="nav-menu" aria-label="Main navigation">
    <ul class="nav-list">
      <li><a href="/" aria-current="page">Home</a></li>
      <li><a href="/features">Features</a></li>
      <li><a href="/pricing">Pricing</a></li>
      <li><a href="/contact">Contact</a></li>
    </ul>
  </nav>
</header>
```

```css
/* Mobile-first navigation */
.nav-list {
  display: none;
  flex-direction: column;
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  padding: var(--space-4);
}

.nav-list[aria-expanded="true"] {
  display: flex;
}

.menu-toggle {
  display: block;
}

/* Desktop navigation */
@media (min-width: 768px) {
  .nav-list {
    display: flex;
    flex-direction: row;
    position: static;
    background: none;
    padding: 0;
    gap: var(--space-6);
  }

  .menu-toggle {
    display: none;
  }
}
```

### Breadcrumbs

```html
<nav aria-label="Breadcrumb">
  <ol class="breadcrumb">
    <li><a href="/">Home</a></li>
    <li><a href="/products">Products</a></li>
    <li aria-current="page">Product Name</li>
  </ol>
</nav>
```

## Buttons & Links

### Button Patterns

```css
/* Base button */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-4);
  min-height: 44px;
  min-width: 44px;
  font-size: var(--text-base);
  font-weight: 500;
  text-decoration: none;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 150ms ease-out, transform 100ms ease-out;
}

.btn:active {
  transform: scale(0.98);
}

/* Primary */
.btn-primary {
  background: var(--color-primary);
  color: white;
}

.btn-primary:hover {
  background: var(--color-primary-hover);
}

/* Secondary */
.btn-secondary {
  background: transparent;
  color: var(--color-primary);
  border: 2px solid var(--color-primary);
}

/* Disabled state */
.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

### Link Patterns

```css
/* Text links */
a {
  color: var(--color-primary);
  text-decoration: underline;
  text-underline-offset: 2px;
  transition: color 150ms;
}

a:hover {
  color: var(--color-primary-hover);
}

/* Visited links (when meaningful) */
a:visited {
  color: #6b21a8; /* Purple for visited */
}

/* External link indicator */
a[target="_blank"]::after {
  content: "";
  display: inline-block;
  width: 12px;
  height: 12px;
  margin-left: 4px;
  background-image: url("data:image/svg+xml,...");
}
```

## Accessibility Checklist

```
┌─────────────────────────────────────────────────────────────────┐
│ WCAG 2.2 LEVEL AA CHECKLIST                                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│ PERCEIVABLE                                                      │
│ ☐ All images have alt text (or alt="" if decorative)            │
│ ☐ Video has captions and audio description                      │
│ ☐ Color is not sole indicator of meaning                        │
│ ☐ Text has 4.5:1 contrast ratio (3:1 for large text)            │
│ ☐ Page can zoom to 200% without loss of content                 │
│ ☐ Text spacing can be adjusted without breaking layout          │
│                                                                  │
│ OPERABLE                                                         │
│ ☐ All functionality available via keyboard                      │
│ ☐ No keyboard traps                                             │
│ ☐ Skip navigation link present                                  │
│ ☐ Touch targets are at least 24×24 CSS pixels                   │
│ ☐ Focus indicator visible on all interactive elements           │
│ ☐ No time limits (or user can extend)                           │
│ ☐ Animations can be paused                                      │
│ ☐ Focus order is logical                                        │
│                                                                  │
│ UNDERSTANDABLE                                                   │
│ ☐ Page language is specified (lang="en")                        │
│ ☐ Navigation is consistent across pages                         │
│ ☐ Errors are identified and described                           │
│ ☐ Labels are associated with form inputs                        │
│ ☐ Error suggestions are provided                                │
│                                                                  │
│ ROBUST                                                           │
│ ☐ HTML validates (no major errors)                              │
│ ☐ Status messages are announced to screen readers               │
│ ☐ ARIA is used correctly (or not at all)                        │
│                                                                  │
│ TESTING                                                          │
│ ☐ Tested with keyboard only                                     │
│ ☐ Tested with screen reader (NVDA/VoiceOver)                    │
│ ☐ Tested with browser zoom at 200%                              │
│ ☐ Tested with prefers-reduced-motion                            │
│ ☐ Tested on mobile devices                                      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Common Anti-Patterns

| Don't | Do Instead |
|-------|------------|
| `<div onclick>` | `<button>` |
| `<a href="#">` | `<button>` if no navigation |
| Placeholder as label | Visible label + placeholder |
| Color-only status | Color + icon + text |
| Custom select/checkbox | Style native or use aria |
| Autoplaying video | Paused by default, controls visible |
| Infinite scroll without alt | Load more button + page navigation |
| Fixed sticky elements on mobile | Consider viewport size |
| `tabindex > 0` | Use natural DOM order |

## Quick Reference

```
┌─────────────────────────────────────────────────────────────────┐
│ WEB DESIGN QUICK REFERENCE                                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│ SIZES                                                            │
│ Touch target:     44px minimum (24px WCAG AA)                    │
│ Line length:      45-75 characters                               │
│ Line height:      1.5-1.75 for body text                        │
│ Standard margin:  16px                                           │
│ Container max:    1200px                                         │
│                                                                  │
│ BREAKPOINTS                                                      │
│ Mobile:           <640px                                         │
│ Tablet:           640px-1024px                                   │
│ Desktop:          >1024px                                        │
│                                                                  │
│ CONTRAST                                                         │
│ Normal text:      4.5:1                                          │
│ Large text:       3:1                                            │
│ UI elements:      3:1                                            │
│                                                                  │
│ PERFORMANCE                                                      │
│ LCP:              <2.5s                                          │
│ INP:              <200ms                                         │
│ CLS:              <0.1                                           │
│                                                                  │
│ ANIMATION                                                        │
│ Micro:            100-200ms                                      │
│ Standard:         200-300ms                                      │
│ Complex:          300-500ms                                      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Testing Tools

### Accessibility Testing

```bash
# Lighthouse (Chrome DevTools)
# Run from Chrome DevTools → Lighthouse tab
# Or via CLI:
npm install -g lighthouse
lighthouse https://example.com --view

# axe DevTools (Browser extension)
# Install: https://www.deque.com/axe/devtools/
# Run from browser DevTools → axe tab

# WAVE (Browser extension)
# Install: https://wave.webaim.org/extension/
# Visual feedback on accessibility issues
```

### Automated Testing

```javascript
// Playwright accessibility tests
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('should not have accessibility violations', async ({ page }) => {
  await page.goto('https://example.com');

  const accessibilityScanResults = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();

  expect(accessibilityScanResults.violations).toEqual([]);
});

// Jest + @testing-library/react
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

test('should have no accessibility violations', async () => {
  const { container } = render(<App />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

### Manual Testing Tools

```
┌─────────────────────────────────────────────────────────────────┐
│ TESTING TOOLKIT                                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│ AUTOMATED SCANNING                                               │
│ ├── Lighthouse: Performance + accessibility (Chrome DevTools)   │
│ ├── axe DevTools: WCAG 2.2 rule engine (browser extension)      │
│ ├── WAVE: Visual feedback overlay (browser extension)           │
│ └── Pa11y: CI/CD integration for automated checks               │
│                                                                  │
│ MANUAL TESTING                                                   │
│ ├── Screen readers: NVDA (Windows), VoiceOver (Mac), JAWS       │
│ ├── Keyboard: Tab through entire page, check focus order        │
│ ├── Zoom: Test at 200% browser zoom                             │
│ ├── Color contrast: Chrome DevTools → Inspect → Contrast ratio  │
│ └── Vision simulators: Chrome DevTools → Rendering → Emulate    │
│                                                                  │
│ RESPONSIVE TESTING                                               │
│ ├── Chrome DevTools: Device toolbar (Cmd+Shift+M)               │
│ ├── Firefox: Responsive Design Mode (Cmd+Opt+M)                 │
│ ├── BrowserStack: Real device testing                           │
│ └── Playwright: Automated cross-browser testing                 │
│                                                                  │
│ PERFORMANCE                                                      │
│ ├── Chrome DevTools: Performance tab, Coverage tab              │
│ ├── WebPageTest: https://www.webpagetest.org/                   │
│ └── PageSpeed Insights: https://pagespeed.web.dev/              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## React/Vue Framework Examples

### React Patterns

```jsx
// Accessible form with React
import { useState } from 'react';

function AccessibleForm() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }
    // Submit logic
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-group">
        <label htmlFor="email">
          Email address
          <span className="required" aria-hidden="true">*</span>
        </label>
        <input
          type="email"
          id="email"
          name="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          aria-required="true"
          aria-describedby={error ? "email-error" : "email-hint"}
          aria-invalid={!!error}
        />
        <p id="email-hint" className="hint">
          We'll never share your email.
        </p>
        {error && (
          <p id="email-error" className="error" role="alert" aria-live="polite">
            {error}
          </p>
        )}
      </div>
      <button type="submit">Submit</button>
    </form>
  );
}

// Focus management with React
import { useEffect, useRef } from 'react';

function Modal({ isOpen, onClose, children }) {
  const dialogRef = useRef(null);
  const previousActiveElement = useRef(null);

  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement;
      dialogRef.current?.focus();
    } else {
      previousActiveElement.current?.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      ref={dialogRef}
      tabIndex={-1}
      aria-modal="true"
      aria-labelledby="dialog-title"
    >
      <h2 id="dialog-title">Modal Title</h2>
      {children}
      <button onClick={onClose}>Close</button>
    </div>
  );
}

// Responsive component
function ResponsiveNav() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="header">
      <a href="/" className="logo">Brand</a>

      <button
        className="menu-toggle"
        aria-expanded={isMobileMenuOpen}
        aria-controls="nav-menu"
        aria-label="Toggle navigation"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      >
        <span className="hamburger" />
      </button>

      <nav id="nav-menu" hidden={!isMobileMenuOpen}>
        <ul className="nav-list">
          <li><a href="/" aria-current="page">Home</a></li>
          <li><a href="/features">Features</a></li>
          <li><a href="/pricing">Pricing</a></li>
        </ul>
      </nav>
    </header>
  );
}
```

### Vue Patterns

```vue
<!-- Accessible form with Vue 3 -->
<script setup>
import { ref, computed } from 'vue';

const email = ref('');
const error = ref('');

const emailDescribedBy = computed(() =>
  error.value ? 'email-error' : 'email-hint'
);

const handleSubmit = () => {
  if (!email.value.includes('@')) {
    error.value = 'Please enter a valid email address';
    return;
  }
  // Submit logic
};
</script>

<template>
  <form @submit.prevent="handleSubmit">
    <div class="form-group">
      <label for="email">
        Email address
        <span class="required" aria-hidden="true">*</span>
      </label>
      <input
        id="email"
        v-model="email"
        type="email"
        name="email"
        required
        aria-required="true"
        :aria-describedby="emailDescribedBy"
        :aria-invalid="!!error"
      />
      <p id="email-hint" class="hint">
        We'll never share your email.
      </p>
      <p
        v-if="error"
        id="email-error"
        class="error"
        role="alert"
        aria-live="polite"
      >
        {{ error }}
      </p>
    </div>
    <button type="submit">Submit</button>
  </form>
</template>

<!-- Modal with focus trap -->
<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue';

const props = defineProps(['isOpen']);
const emit = defineEmits(['close']);

const dialogRef = ref(null);
const previousActiveElement = ref(null);

watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    previousActiveElement.value = document.activeElement;
    setTimeout(() => dialogRef.value?.focus(), 0);
  } else {
    previousActiveElement.value?.focus();
  }
});
</script>

<template>
  <div
    v-if="isOpen"
    ref="dialogRef"
    role="dialog"
    tabindex="-1"
    aria-modal="true"
    aria-labelledby="dialog-title"
  >
    <h2 id="dialog-title">Modal Title</h2>
    <slot />
    <button @click="emit('close')">Close</button>
  </div>
</template>
```

## Related Skills

This skill works best in combination with:

- **platform-ios-design** — When building Progressive Web Apps (PWAs) or responsive sites that should feel native on iOS devices
- **platform-android-design** — For PWAs or sites that should respect Material Design patterns on Android devices

### Cross-Platform Web Strategy

When designing web experiences that work alongside native apps:

| Aspect | Web Approach | iOS App | Android App |
|--------|-------------|---------|-------------|
| Touch targets | 44px minimum | 44pt minimum | 48dp minimum |
| Navigation | Responsive (mobile: bottom/drawer, desktop: top) | Tab bar or nav bar | Navigation bar or drawer |
| Colors | CSS custom properties with `prefers-color-scheme` | Semantic colors | Dynamic color / Material tokens |
| Typography | System fonts with `rem`/`em` | SF Pro with Dynamic Type | Roboto with scalable `sp` |
| Forms | Native HTML5 with ARIA | Native controls | Material 3 components |
| Gestures | Touch events + swipe libraries | UIKit/SwiftUI gestures | Compose gestures |

### PWA Considerations

```javascript
// Web app manifest for native-like experience
{
  "name": "App Name",
  "short_name": "App",
  "start_url": "/",
  "display": "standalone",  // Hides browser UI
  "theme_color": "#2563eb",
  "background_color": "#ffffff",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"  // iOS safe area
    }
  ]
}
```

## Resources

- [Web Content Accessibility Guidelines (WCAG) 2.2](https://www.w3.org/TR/WCAG22/)
- [MDN Web Docs](https://developer.mozilla.org/)
- [web.dev](https://web.dev/)
- [A11y Project Checklist](https://www.a11yproject.com/checklist/)
- [Inclusive Components](https://inclusive-components.design/)
- [Lighthouse Documentation](https://developer.chrome.com/docs/lighthouse/)
- [axe Accessibility Testing](https://www.deque.com/axe/)
- [WAVE Web Accessibility Tool](https://wave.webaim.org/)
