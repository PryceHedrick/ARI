---
name: platform-ios-design
description: iOS Human Interface Guidelines encoded as actionable design rules for native-quality iOS/iPadOS apps
triggers:
  - "ios design"
  - "ios app"
  - "iphone app"
  - "ipad app"
  - "apple design"
  - "hig"
  - "human interface guidelines"
  - "/ios-design"
---

# iOS Human Interface Guidelines — Design Skill

Build iOS apps that feel native, intuitive, and delightful by applying Apple's Human Interface Guidelines as actionable rules.

## Core Principles

Apple's design philosophy distilled:

| Principle | Meaning | Violation Example |
|-----------|---------|-------------------|
| **Clarity** | Content is the focus, not decoration | Heavy textures, skeuomorphic elements |
| **Deference** | UI recedes, content takes center stage | Busy backgrounds, competing colors |
| **Depth** | Visual layers create hierarchy | Flat, undifferentiated content |

## Typography System

### SF Pro (System Font)

```
┌─────────────────────────────────────────────────────────────────┐
│ iOS TYPOGRAPHY SCALE                                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│ Large Title    34pt  Regular   "Settings"                        │
│ Title 1        28pt  Regular   Navigation bar titles             │
│ Title 2        22pt  Regular   Section headers                   │
│ Title 3        20pt  Regular   Subsection headers                │
│ Headline       17pt  Semibold  List item titles                  │
│ Body           17pt  Regular   Primary content                   │
│ Callout        16pt  Regular   Secondary content                 │
│ Subhead        15pt  Regular   Tertiary content                  │
│ Footnote       13pt  Regular   Captions, timestamps              │
│ Caption 1      12pt  Regular   Labels, badges                    │
│ Caption 2      11pt  Regular   Smallest readable text            │
│                                                                  │
│ ✓ Always use Dynamic Type for accessibility                      │
│ ✗ Never use fixed font sizes                                     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Font Usage Rules

```swift
// ✓ CORRECT: Dynamic Type
Text("Hello")
    .font(.headline)

// ✗ WRONG: Fixed size
Text("Hello")
    .font(.system(size: 17))

// ✓ CORRECT: SF Symbols for icons
Image(systemName: "star.fill")

// ✗ WRONG: Custom icon images when SF Symbol exists
Image("custom-star")
```

## Color System

### Semantic Colors

```
┌─────────────────────────────────────────────────────────────────┐
│ iOS SEMANTIC COLOR PALETTE                                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│ LABELS (text)                                                    │
│ ├── .primary       Main text, 100% opacity                       │
│ ├── .secondary     Subtitles, 60% opacity                        │
│ ├── .tertiary      Placeholder, 30% opacity                      │
│ └── .quaternary    Disabled, 18% opacity                         │
│                                                                  │
│ FILLS (backgrounds)                                              │
│ ├── .primarySystemFill         Form controls                     │
│ ├── .secondarySystemFill       Selected states                   │
│ ├── .tertiarySystemFill        Grouped content                   │
│ └── .quaternarySystemFill      Subtle backgrounds                │
│                                                                  │
│ GROUPED BACKGROUNDS                                              │
│ ├── .systemGroupedBackground   List backgrounds                  │
│ └── .secondarySystemGroupedBackground   Card content             │
│                                                                  │
│ TINT                                                             │
│ ├── .blue          Primary action, links                         │
│ ├── .green         Success, positive                             │
│ ├── .red           Error, destructive                            │
│ ├── .orange        Warning                                       │
│ └── .purple        Creative, premium                             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Color Rules

```swift
// ✓ CORRECT: Semantic colors adapt to Dark Mode
Text("Label")
    .foregroundColor(.primary)

// ✗ WRONG: Hard-coded colors break Dark Mode
Text("Label")
    .foregroundColor(Color(red: 0, green: 0, blue: 0))

// ✓ CORRECT: System tint for interactive elements
Button("Tap") { }
    .tint(.blue)

// ✓ CORRECT: Custom accent with semantic fallback
Color.accentColor  // Auto-adapts to user's system accent
```

## Touch Targets

```
┌─────────────────────────────────────────────────────────────────┐
│ MINIMUM TOUCH TARGET: 44 × 44 points                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────┐                                        │
│  │                      │                                        │
│  │   ┌────────────┐     │  Visual element: 24pt icon             │
│  │   │    ☆       │     │  Touch area: 44 × 44pt (invisible)     │
│  │   └────────────┘     │                                        │
│  │                      │                                        │
│  └──────────────────────┘                                        │
│                                                                  │
│ ✓ Small icons with 44pt hit area                                 │
│ ✗ Tiny buttons that are hard to tap                              │
│                                                                  │
│ Adjacent targets: 8pt minimum spacing                            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

```swift
// ✓ CORRECT: Adequate touch target
Button(action: { }) {
    Image(systemName: "star")
        .frame(minWidth: 44, minHeight: 44)
}

// ✗ WRONG: Icon only, tiny hit area
Button(action: { }) {
    Image(systemName: "star")
}
```

## Layout & Spacing

### Safe Areas

```
┌─────────────────────────────────────────────────────────────────┐
│ iPHONE LAYOUT STRUCTURE                                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│ ┌───────────────────────────────────────────┐                    │
│ │░░░░░░░░░░ STATUS BAR (safe area) ░░░░░░░░░│  Dynamic Island    │
│ ├───────────────────────────────────────────┤                    │
│ │           NAVIGATION BAR                  │  44pt standard     │
│ ├───────────────────────────────────────────┤                    │
│ │                                           │                    │
│ │                                           │                    │
│ │           CONTENT AREA                    │  Your content      │
│ │                                           │                    │
│ │                                           │                    │
│ ├───────────────────────────────────────────┤                    │
│ │            TAB BAR                        │  49pt standard     │
│ ├───────────────────────────────────────────┤                    │
│ │░░░░░░░░░░ HOME INDICATOR ░░░░░░░░░░░░░░░░░│  34pt (safe area)  │
│ └───────────────────────────────────────────┘                    │
│                                                                  │
│ ✓ Always respect safe areas                                      │
│ ✗ Never clip content under notch/Dynamic Island                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Margin System

```
Standard margins by context:

LIST CONTENT
├── Leading margin: 16pt (standard) or 20pt (inset)
├── Trailing margin: 16pt
├── Cell height: 44pt minimum
└── Separator inset: Match leading content

FORM CONTENT
├── Section header: 16pt top, 8pt bottom
├── Field spacing: 8pt between
└── Section spacing: 35pt between groups

BUTTONS
├── Full-width: 16pt horizontal margins
├── Standard height: 50pt
└── Pill/capsule corners: height / 2
```

## Navigation Patterns

### Tab Bar (Bottom Navigation)

```
┌─────────────────────────────────────────────────────────────────┐
│ TAB BAR RULES                                                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│ ✓ 3-5 tabs maximum (5 is ideal for core app)                    │
│ ✓ Each tab represents top-level destination                     │
│ ✓ Icons: 25 × 25pt, SF Symbols preferred                        │
│ ✓ Labels: Always visible, brief (one word ideal)                │
│ ✓ Badge: Circular, 18pt diameter maximum                        │
│                                                                  │
│ ┌─────┬─────┬─────┬─────┬─────┐                                  │
│ │ 🏠  │ 🔍  │ ➕  │ 💬  │ 👤  │                                  │
│ │Home │Search│ New │Chat │Profile│                               │
│ └─────┴─────┴─────┴─────┴─────┘                                  │
│                                                                  │
│ ✗ More than 5 tabs → use "More" with table view                 │
│ ✗ Hiding tab bar on scroll (disorienting)                       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Navigation Bar (Top)

```
┌─────────────────────────────────────────────────────────────────┐
│ NAVIGATION BAR RULES                                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│ ┌───────────────────────────────────────────────────────────┐   │
│ │  < Back          Title                            Edit    │   │
│ └───────────────────────────────────────────────────────────┘   │
│                                                                  │
│ LEFT:   Back button (< chevron + previous title or "Back")      │
│ CENTER: Current screen title (or large title below)             │
│ RIGHT:  Primary action (Edit, Done, Share, +)                   │
│                                                                  │
│ LARGE TITLE (optional):                                         │
│ ┌───────────────────────────────────────────────────────────┐   │
│ │  < Back                                          Edit     │   │
│ │                                                           │   │
│ │  Settings                                                 │   │
│ │  ═════════                                                │   │
│ └───────────────────────────────────────────────────────────┘   │
│                                                                  │
│ ✓ Large titles: Root views, important destinations              │
│ ✓ Standard titles: Child views, modal sheets                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Modal Presentation

```swift
// Sheet (partial cover)
.sheet(isPresented: $showSheet) {
    SheetContent()
}

// Full screen cover
.fullScreenCover(isPresented: $showFullScreen) {
    FullScreenContent()
}

// When to use which:
// Sheet: Non-disruptive, can be dismissed easily
// Full screen: Immersive content, video players, cameras
```

## List & Form Design

### List Styles

```swift
// Inset Grouped (modern, recommended)
List {
    Section("Section") {
        Text("Row")
    }
}
.listStyle(.insetGrouped)

// Plain (for simple lists)
.listStyle(.plain)

// Sidebar (iPad/Mac navigation)
.listStyle(.sidebar)
```

### Cell Anatomy

```
┌─────────────────────────────────────────────────────────────────┐
│ STANDARD LIST CELL                                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│ ┌───────────────────────────────────────────────────────────┐   │
│ │ ┌───┐                                              ┌───┐  │   │
│ │ │ 🔔│ Title                              Detail    │ > │  │   │
│ │ │   │ Subtitle (optional)                          │   │  │   │
│ │ └───┘                                              └───┘  │   │
│ │   ↑              ↑                         ↑         ↑    │   │
│ │ Leading       Primary                  Secondary  Accessory│   │
│ │ Content        Text                      Text      View   │   │
│ └───────────────────────────────────────────────────────────┘   │
│                                                                  │
│ Leading: 29×29 icon or 40×40 image                              │
│ Accessory: Chevron (>), checkmark (✓), info (i), switch        │
│ Min height: 44pt                                                 │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Alerts & Confirmations

### Alert Anatomy

```swift
// Standard alert
.alert("Title", isPresented: $showAlert) {
    Button("Cancel", role: .cancel) { }
    Button("Delete", role: .destructive) { }
} message: {
    Text("This action cannot be undone.")
}

// Button order (iOS convention):
// - Cancel: Left or less prominent
// - Default: Right or more prominent
// - Destructive: Bold red, always requires confirmation
```

### Confirmation Dialog (Action Sheet)

```swift
.confirmationDialog("Title", isPresented: $showDialog) {
    Button("Option 1") { }
    Button("Option 2") { }
    Button("Delete", role: .destructive) { }
    Button("Cancel", role: .cancel) { }
}
```

## SF Symbols

### Symbol Configuration

```swift
// Size variants
Image(systemName: "star.fill")
    .imageScale(.small)   // Compact
    .imageScale(.medium)  // Default
    .imageScale(.large)   // Emphasized

// Weight
    .fontWeight(.regular)  // Default
    .fontWeight(.semibold) // Emphasized
    .fontWeight(.bold)     // Strong emphasis

// Rendering modes
    .symbolRenderingMode(.monochrome)  // Single color
    .symbolRenderingMode(.hierarchical) // Depth with opacity
    .symbolRenderingMode(.palette)      // Multi-color
    .symbolRenderingMode(.multicolor)   // Full color (built-in)
```

### Common SF Symbols

```
NAVIGATION
├── chevron.left / chevron.right    Back/forward
├── house.fill                       Home
├── magnifyingglass                  Search
├── gear                             Settings
└── ellipsis                         More options

ACTIONS
├── plus                             Add/create
├── minus                            Remove/decrease
├── xmark                            Close/dismiss
├── checkmark                        Confirm/complete
├── pencil                           Edit
├── trash                            Delete
└── square.and.arrow.up              Share

STATUS
├── bell.fill                        Notifications
├── envelope.fill                    Messages
├── heart.fill                       Favorites
├── star.fill                        Ratings
└── bookmark.fill                    Saved
```

## Haptic Feedback

```swift
// Use haptics for feedback, not decoration

// Impact (physical touch)
let impact = UIImpactFeedbackGenerator(style: .light) // .medium, .heavy
impact.impactOccurred()

// Selection (picking items)
let selection = UISelectionFeedbackGenerator()
selection.selectionChanged()

// Notification (outcomes)
let notification = UINotificationFeedbackGenerator()
notification.notificationOccurred(.success)  // .warning, .error

// When to use:
// ✓ Confirming actions (toggle switch, delete)
// ✓ Selection changes (picker scroll)
// ✓ Success/error outcomes
// ✗ Every tap (overuse dulls the experience)
```

## Dark Mode

```swift
// ✓ All colors should be semantic or adaptive
Color.primary          // Adapts automatically
Color.secondary        // Adapts automatically
Color(.systemBackground) // Adapts automatically

// Custom colors need both appearances
extension Color {
    static let brandPrimary = Color("BrandPrimary") // Asset catalog with Light/Dark variants
}

// Testing
@Environment(\.colorScheme) var colorScheme

// Force mode (use sparingly)
.preferredColorScheme(.dark)  // Force dark
.preferredColorScheme(.light) // Force light
```

## Accessibility Checklist

```
┌─────────────────────────────────────────────────────────────────┐
│ iOS ACCESSIBILITY REQUIREMENTS                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│ ☐ Dynamic Type: All text scales with user settings              │
│ ☐ VoiceOver: All elements have meaningful labels                │
│ ☐ Color contrast: 4.5:1 for normal text, 3:1 for large          │
│ ☐ Touch targets: 44×44pt minimum                                │
│ ☐ Motion: Reduce motion preference honored                      │
│ ☐ Bold text: Heavier weights when enabled                       │
│ ☐ Color alone: Not sole indicator of meaning                    │
│                                                                  │
│ TESTING:                                                         │
│ Settings → Accessibility → turn on each feature                  │
│ Xcode → Accessibility Inspector                                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

```swift
// VoiceOver labels
Image(systemName: "heart.fill")
    .accessibilityLabel("Favorite")
    .accessibilityHint("Double tap to add to favorites")

// Grouping related elements
VStack {
    Text("Title")
    Text("Subtitle")
}
.accessibilityElement(children: .combine)

// Custom actions
.accessibilityAction(.magicTap) {
    // Primary action for this context
}
```

## Animation Guidelines

```swift
// ✓ iOS standard animations
withAnimation(.easeInOut(duration: 0.3)) {
    // State change
}

// Spring animations (natural feel)
withAnimation(.spring(response: 0.5, dampingFraction: 0.7)) {
    // Bouncy transition
}

// Respect Reduce Motion
@Environment(\.accessibilityReduceMotion) var reduceMotion

if reduceMotion {
    // Simpler transition (fade, no motion)
} else {
    // Full animation
}
```

## Common Anti-Patterns

| Don't | Do Instead |
|-------|------------|
| Custom back button design | Use system back button |
| Hamburger menu | Use tab bar or split view |
| Pull-to-refresh everywhere | Only on scrollable content |
| Custom alerts | Use system UIAlertController |
| Tiny touch targets | 44×44pt minimum |
| Fixed font sizes | Dynamic Type |
| Hard-coded colors | Semantic colors |
| Hidden features | Discoverable UI |
| Complex gestures | Standard iOS gestures |
| Onboarding carousels | Contextual guidance |

## Quick Reference Card

```
┌─────────────────────────────────────────────────────────────────┐
│ iOS DESIGN QUICK REFERENCE                                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│ SIZES                                                            │
│ Touch target:     44pt minimum                                   │
│ Nav bar:          44pt (standard), 96pt (large title)            │
│ Tab bar:          49pt + 34pt home indicator                     │
│ Status bar:       47pt (iPhone 14+) or 20pt (older)              │
│ Standard margin:  16pt                                           │
│                                                                  │
│ TYPOGRAPHY                                                       │
│ Body:            17pt Regular                                    │
│ Headline:        17pt Semibold                                   │
│ Title:           28pt Regular                                    │
│ Large Title:     34pt Regular                                    │
│                                                                  │
│ ANIMATION                                                        │
│ Standard:        0.3s ease-in-out                                │
│ Quick feedback:  0.1s                                            │
│ Modal present:   0.35s                                           │
│                                                                  │
│ CORNER RADIUS                                                    │
│ Buttons:         10pt or height/2 (pill)                         │
│ Cards:           12pt                                            │
│ Modal sheets:    12pt top                                        │
│ App icons:       Continuous curve (squircle)                     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## UIKit Examples (Legacy Projects)

For projects not using SwiftUI, here are UIKit equivalents:

```swift
// Typography
label.font = UIFont.preferredFont(forTextStyle: .headline)
label.adjustsFontForContentSizeCategory = true

// Colors
label.textColor = .label
view.backgroundColor = .systemBackground

// Touch targets
button.frame = CGRect(x: 0, y: 0, width: 44, height: 44)

// Dynamic Type
override func traitCollectionDidChange(_ previousTraitCollection: UITraitCollection?) {
    super.traitCollectionDidChange(previousTraitCollection)
    if traitCollection.preferredContentSizeCategory != previousTraitCollection?.preferredContentSizeCategory {
        // Update layout for new text size
    }
}

// Haptics
let impact = UIImpactFeedbackGenerator(style: .medium)
impact.impactOccurred()

// Navigation
let controller = UIViewController()
navigationController?.pushViewController(controller, animated: true)

// Alerts
let alert = UIAlertController(title: "Title", message: "Message", preferredStyle: .alert)
alert.addAction(UIAlertAction(title: "Cancel", style: .cancel))
alert.addAction(UIAlertAction(title: "Delete", style: .destructive) { _ in })
present(alert, animated: true)
```

## Related Skills

This skill works best in combination with:

- **platform-android-design** — When building cross-platform experiences, understand Material Design patterns to identify platform differences and common ground
- **platform-web-design** — For responsive web views within iOS apps or when designing companion web experiences
- **ari-learning-mode** — When teaching iOS design principles or onboarding team members to Apple's HIG

### Cross-Platform Considerations

When working across platforms, note these key differences:

| Pattern | iOS (HIG) | Android (Material) | Web |
|---------|-----------|-------------------|-----|
| Primary nav | Tab bar (bottom) | Navigation bar (bottom) | Top nav or sidebar |
| Back button | Top-left with chevron | Top-left with arrow | Browser back |
| Modality | Sheet from bottom | Dialog centered | Modal overlay |
| Touch target | 44×44pt | 48×48dp | 44px minimum |
| Typography | SF Pro, Dynamic Type | Roboto, scalable sp | System fonts, rem/em |
| Colors | Semantic system colors | Dynamic Material You | CSS custom properties |

## Resources

- [Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [SF Symbols Browser](https://developer.apple.com/sf-symbols/)
- [Design Resources (Figma/Sketch)](https://developer.apple.com/design/resources/)
- [WWDC Design Videos](https://developer.apple.com/videos/design/)
