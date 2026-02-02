---
name: platform-android-design
description: Material Design 3 guidelines encoded as actionable rules for native-quality Android apps
triggers:
  - "android design"
  - "android app"
  - "material design"
  - "material 3"
  - "md3"
  - "google design"
  - "/android-design"
---

# Material Design 3 — Android Design Skill

Build Android apps that feel native and delightful by applying Google's Material Design 3 guidelines as actionable rules.

## Core Philosophy

Material Design 3 (Material You) principles:

| Principle | Meaning | Implementation |
|-----------|---------|----------------|
| **Personal** | Adapts to user's style | Dynamic color from wallpaper |
| **Expressive** | Enables brand identity | Custom color schemes |
| **Adaptive** | Works on all screens | Responsive layouts |

## Dynamic Color

### Color Scheme from Wallpaper

```kotlin
// Material 3 dynamic colors
@Composable
fun AppTheme(
    useDynamicColor: Boolean = true,
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    val colorScheme = when {
        useDynamicColor && Build.VERSION.SDK_INT >= Build.VERSION_CODES.S -> {
            val context = LocalContext.current
            if (darkTheme) dynamicDarkColorScheme(context)
            else dynamicLightColorScheme(context)
        }
        darkTheme -> darkColorScheme()
        else -> lightColorScheme()
    }

    MaterialTheme(
        colorScheme = colorScheme,
        content = content
    )
}
```

### Color Roles

```
┌─────────────────────────────────────────────────────────────────┐
│ MATERIAL 3 COLOR ROLES                                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│ PRIMARY (brand identity)                                         │
│ ├── primary              Main brand color                        │
│ ├── onPrimary            Content on primary                      │
│ ├── primaryContainer     Tonal primary surface                   │
│ └── onPrimaryContainer   Content on container                    │
│                                                                  │
│ SECONDARY (supporting elements)                                  │
│ ├── secondary            Less prominent than primary             │
│ ├── onSecondary          Content on secondary                    │
│ ├── secondaryContainer   Chips, filter buttons                   │
│ └── onSecondaryContainer Content on container                    │
│                                                                  │
│ TERTIARY (accent, contrast)                                      │
│ ├── tertiary             Complementary accent                    │
│ ├── onTertiary           Content on tertiary                     │
│ ├── tertiaryContainer    Accent surfaces                         │
│ └── onTertiaryContainer  Content on container                    │
│                                                                  │
│ SURFACE (backgrounds)                                            │
│ ├── surface              Main background                         │
│ ├── onSurface            Primary text on surface                 │
│ ├── surfaceVariant       Cards, dialogs                          │
│ ├── onSurfaceVariant     Secondary text                          │
│ └── surfaceTint          Elevated surface tint                   │
│                                                                  │
│ ERROR (feedback)                                                 │
│ ├── error                Error states                            │
│ ├── onError              Content on error                        │
│ ├── errorContainer       Error surfaces                          │
│ └── onErrorContainer     Content on error container              │
│                                                                  │
│ OUTLINE                                                          │
│ ├── outline              Borders, dividers                       │
│ └── outlineVariant       Subtle dividers                         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Color Usage Rules

```kotlin
// ✓ CORRECT: Semantic colors
Surface(color = MaterialTheme.colorScheme.surface) {
    Text(
        text = "Hello",
        color = MaterialTheme.colorScheme.onSurface
    )
}

// ✗ WRONG: Hard-coded colors
Surface(color = Color.White) {
    Text(text = "Hello", color = Color.Black)
}

// ✓ CORRECT: Container colors for elevated content
Card(
    colors = CardDefaults.cardColors(
        containerColor = MaterialTheme.colorScheme.surfaceVariant
    )
)
```

## Typography

### Type Scale

```
┌─────────────────────────────────────────────────────────────────┐
│ MATERIAL 3 TYPE SCALE                                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│ DISPLAY (hero moments)                                           │
│ ├── displayLarge    57sp  Line height: 64sp                      │
│ ├── displayMedium   45sp  Line height: 52sp                      │
│ └── displaySmall    36sp  Line height: 44sp                      │
│                                                                  │
│ HEADLINE (screen headers)                                        │
│ ├── headlineLarge   32sp  Line height: 40sp                      │
│ ├── headlineMedium  28sp  Line height: 36sp                      │
│ └── headlineSmall   24sp  Line height: 32sp                      │
│                                                                  │
│ TITLE (subheadings)                                              │
│ ├── titleLarge      22sp  Line height: 28sp  Medium weight       │
│ ├── titleMedium     16sp  Line height: 24sp  Medium weight       │
│ └── titleSmall      14sp  Line height: 20sp  Medium weight       │
│                                                                  │
│ BODY (paragraphs)                                                │
│ ├── bodyLarge       16sp  Line height: 24sp                      │
│ ├── bodyMedium      14sp  Line height: 20sp                      │
│ └── bodySmall       12sp  Line height: 16sp                      │
│                                                                  │
│ LABEL (buttons, captions)                                        │
│ ├── labelLarge      14sp  Line height: 20sp  Medium weight       │
│ ├── labelMedium     12sp  Line height: 16sp  Medium weight       │
│ └── labelSmall      11sp  Line height: 16sp  Medium weight       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

```kotlin
// ✓ CORRECT: Use type scale
Text(
    text = "Title",
    style = MaterialTheme.typography.headlineMedium
)

// ✗ WRONG: Custom text styles
Text(
    text = "Title",
    fontSize = 28.sp,
    fontWeight = FontWeight.Bold
)
```

## Touch Targets

```
┌─────────────────────────────────────────────────────────────────┐
│ MINIMUM TOUCH TARGET: 48 × 48 dp                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────┐                                    │
│  │                          │                                    │
│  │     ┌────────────┐       │  Visual element: 24dp icon         │
│  │     │    ★       │       │  Touch area: 48 × 48dp             │
│  │     └────────────┘       │                                    │
│  │                          │                                    │
│  └──────────────────────────┘                                    │
│                                                                  │
│ ✓ IconButton includes 48dp minimum automatically                 │
│ ✗ Raw Icon without touch padding                                 │
│                                                                  │
│ Adjacent targets: 8dp minimum spacing                            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

```kotlin
// ✓ CORRECT: IconButton has proper touch target
IconButton(onClick = { }) {
    Icon(Icons.Default.Star, contentDescription = "Favorite")
}

// ✗ WRONG: Icon only, no touch target
Icon(
    Icons.Default.Star,
    contentDescription = "Favorite",
    modifier = Modifier.clickable { }  // Touch target too small
)
```

## Layout & Spacing

### Spacing Scale

```
MATERIAL 3 SPACING TOKENS
4dp   — Tight spacing (icon to text)
8dp   — Default compact spacing
12dp  — Comfortable spacing
16dp  — Standard margin/padding
24dp  — Section spacing
32dp  — Component spacing
48dp  — Large section breaks
```

### Layout Grid

```
┌─────────────────────────────────────────────────────────────────┐
│ RESPONSIVE LAYOUT GRID                                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│ COMPACT (phones: 0-599dp)                                        │
│ ├── Columns: 4                                                   │
│ ├── Margins: 16dp                                                │
│ └── Gutters: 8dp                                                 │
│                                                                  │
│ MEDIUM (tablets portrait: 600-839dp)                             │
│ ├── Columns: 8                                                   │
│ ├── Margins: 24dp                                                │
│ └── Gutters: 16dp                                                │
│                                                                  │
│ EXPANDED (tablets landscape: 840dp+)                             │
│ ├── Columns: 12                                                  │
│ ├── Margins: 24dp                                                │
│ └── Gutters: 24dp                                                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Canonical Layouts

```kotlin
// List-Detail (tablets)
ListDetailPaneScaffold(
    listPane = { ListContent() },
    detailPane = { DetailContent() }
)

// Supporting Pane (reference content)
SupportingPaneScaffold(
    supportingPane = { SupportingContent() },
    mainPane = { MainContent() }
)

// Navigation Rail (large screens)
NavigationRail {
    NavigationRailItem(
        icon = { Icon(Icons.Default.Home, "Home") },
        label = { Text("Home") },
        selected = selected,
        onClick = { }
    )
}
```

## Navigation Components

### Navigation Bar (Bottom)

```
┌─────────────────────────────────────────────────────────────────┐
│ NAVIGATION BAR (M3)                                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │                                                             │ │
│ │  ┌───────┐    ┌───────┐    ┌───────┐    ┌───────┐           │ │
│ │  │  🏠   │    │  🔍   │    │  📧   │    │  👤   │           │ │
│ │  │ Home  │    │Search │    │ Mail  │    │Profile│           │ │
│ │  └───────┘    └───────┘    └───────┘    └───────┘           │ │
│ │   [pill]                                                    │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│ ✓ 3-5 destinations                                              │
│ ✓ Pill indicator on selected item                               │
│ ✓ Labels always visible                                         │
│ ✓ 80dp height                                                   │
│                                                                  │
│ ✗ Never hide on scroll (disorienting)                           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

```kotlin
NavigationBar {
    destinations.forEach { destination ->
        NavigationBarItem(
            icon = { Icon(destination.icon, null) },
            label = { Text(destination.label) },
            selected = currentDestination == destination,
            onClick = { navigate(destination) }
        )
    }
}
```

### Navigation Rail (Large Screens)

```
┌─────────────────────────────────────────────────────────────────┐
│ NAVIGATION RAIL                                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│ ┌────┬──────────────────────────────────────────────────────┐   │
│ │    │                                                      │   │
│ │ ☰  │                                                      │   │
│ │    │                                                      │   │
│ │────│                                                      │   │
│ │ 🏠 │                                                      │   │
│ │Home│            MAIN CONTENT                              │   │
│ │    │                                                      │   │
│ │ 🔍 │                                                      │   │
│ │    │                                                      │   │
│ │ 📧 │                                                      │   │
│ │    │                                                      │   │
│ └────┴──────────────────────────────────────────────────────┘   │
│                                                                  │
│ Width: 80dp (icons only) or 360dp (extended with labels)        │
│ Use on screens ≥ 600dp                                          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Navigation Drawer

```kotlin
// Modal drawer (phones)
ModalNavigationDrawer(
    drawerContent = {
        ModalDrawerSheet {
            NavigationDrawerItem(
                icon = { Icon(Icons.Default.Home, null) },
                label = { Text("Home") },
                selected = selected,
                onClick = { }
            )
        }
    }
) {
    Scaffold { /* Content */ }
}

// Permanent drawer (large screens)
PermanentNavigationDrawer(
    drawerContent = { PermanentDrawerSheet { /* items */ } }
) {
    /* Content */
}
```

## Buttons

### Button Types

```
┌─────────────────────────────────────────────────────────────────┐
│ MATERIAL 3 BUTTONS                                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│ FILLED (high emphasis — primary action)                          │
│ ┌─────────────────────────────────────┐                          │
│ │          Submit                     │  Primary color fill      │
│ └─────────────────────────────────────┘                          │
│                                                                  │
│ FILLED TONAL (medium emphasis — alternative actions)             │
│ ┌─────────────────────────────────────┐                          │
│ │          Cancel                     │  SecondaryContainer      │
│ └─────────────────────────────────────┘                          │
│                                                                  │
│ OUTLINED (medium emphasis — significant but not primary)         │
│ ┌─────────────────────────────────────┐                          │
│ │          Learn More                 │  Outlined border         │
│ └─────────────────────────────────────┘                          │
│                                                                  │
│ TEXT (low emphasis — tertiary actions)                           │
│           Skip                            No container            │
│                                                                  │
│ ELEVATED (medium emphasis — on patterned backgrounds)            │
│ ┌─────────────────────────────────────┐                          │
│ │          Upload                     │  Shadow elevation        │
│ └─────────────────────────────────────┘                          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

```kotlin
// High emphasis
Button(onClick = { }) {
    Text("Submit")
}

// Medium emphasis
FilledTonalButton(onClick = { }) {
    Text("Cancel")
}

// Medium emphasis (outlined)
OutlinedButton(onClick = { }) {
    Text("Learn More")
}

// Low emphasis
TextButton(onClick = { }) {
    Text("Skip")
}
```

### FAB (Floating Action Button)

```kotlin
// Standard FAB
FloatingActionButton(onClick = { }) {
    Icon(Icons.Default.Add, "Add")
}

// Small FAB
SmallFloatingActionButton(onClick = { }) {
    Icon(Icons.Default.Add, "Add")
}

// Large FAB
LargeFloatingActionButton(onClick = { }) {
    Icon(Icons.Default.Add, "Add")
}

// Extended FAB
ExtendedFloatingActionButton(
    text = { Text("Create") },
    icon = { Icon(Icons.Default.Add, null) },
    onClick = { }
)

// FAB placement: Bottom right, 16dp from edges
// Only one per screen
```

## Cards

```kotlin
// Elevated card (default)
ElevatedCard {
    // Content
}

// Filled card (prominent)
Card(
    colors = CardDefaults.cardColors(
        containerColor = MaterialTheme.colorScheme.surfaceVariant
    )
) {
    // Content
}

// Outlined card (low emphasis)
OutlinedCard {
    // Content
}
```

### Card Anatomy

```
┌─────────────────────────────────────────────────────────────────┐
│ CARD ANATOMY                                                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ ┌───────────────────────────────────────────────────────┐   │ │
│ │ │                   MEDIA (optional)                    │   │ │
│ │ │               (image, video, map)                     │   │ │
│ │ └───────────────────────────────────────────────────────┘   │ │
│ │                                                             │ │
│ │  Header (optional)                             ⋮            │ │
│ │  Subhead (optional)                                         │ │
│ │                                                             │ │
│ │  Supporting text (optional)                                 │ │
│ │  The main content of the card goes here...                  │ │
│ │                                                             │ │
│ │  ┌────────────────────────────────────────────────────────┐ │ │
│ │  │ [Action 1]                            [Action 2]       │ │ │
│ │  └────────────────────────────────────────────────────────┘ │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│ Padding: 16dp internal, 12dp for buttons                         │
│ Corner radius: 12dp                                              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Dialogs

```kotlin
// Basic dialog
AlertDialog(
    onDismissRequest = { },
    title = { Text("Title") },
    text = { Text("Supporting text") },
    confirmButton = {
        TextButton(onClick = { }) {
            Text("Confirm")
        }
    },
    dismissButton = {
        TextButton(onClick = { }) {
            Text("Cancel")
        }
    }
)

// Full-screen dialog (complex input)
Dialog(
    onDismissRequest = { },
    properties = DialogProperties(usePlatformDefaultWidth = false)
) {
    Surface(modifier = Modifier.fillMaxSize()) {
        // Full-screen content with top app bar
    }
}
```

## Text Fields

```kotlin
// Filled text field (default)
TextField(
    value = value,
    onValueChange = { },
    label = { Text("Label") },
    supportingText = { Text("Supporting text") }
)

// Outlined text field
OutlinedTextField(
    value = value,
    onValueChange = { },
    label = { Text("Label") }
)

// States
TextField(
    value = value,
    onValueChange = { },
    isError = true,
    supportingText = { Text("Error message", color = MaterialTheme.colorScheme.error) }
)
```

## Chips

```kotlin
// Assist chips (smart actions)
AssistChip(
    onClick = { },
    label = { Text("Add to calendar") },
    leadingIcon = { Icon(Icons.Default.Event, null) }
)

// Filter chips (selection)
FilterChip(
    selected = selected,
    onClick = { },
    label = { Text("Filter") },
    leadingIcon = if (selected) {
        { Icon(Icons.Default.Done, null) }
    } else null
)

// Input chips (user input)
InputChip(
    selected = false,
    onClick = { },
    label = { Text("Tag") },
    trailingIcon = { Icon(Icons.Default.Close, "Remove") }
)

// Suggestion chips (autocomplete)
SuggestionChip(
    onClick = { },
    label = { Text("Suggestion") }
)
```

## Top App Bar

```kotlin
// Small (standard)
TopAppBar(
    title = { Text("Title") },
    navigationIcon = {
        IconButton(onClick = { }) {
            Icon(Icons.Default.Menu, "Menu")
        }
    },
    actions = {
        IconButton(onClick = { }) {
            Icon(Icons.Default.Search, "Search")
        }
    }
)

// Medium (collapsing with scroll)
MediumTopAppBar(
    title = { Text("Title") },
    scrollBehavior = scrollBehavior
)

// Large (bold statement)
LargeTopAppBar(
    title = { Text("Title") },
    scrollBehavior = scrollBehavior
)
```

## Snackbar

```kotlin
// Snackbar host
val snackbarHostState = remember { SnackbarHostState() }

Scaffold(
    snackbarHost = { SnackbarHost(snackbarHostState) }
) {
    // Content
}

// Show snackbar
LaunchedEffect(message) {
    snackbarHostState.showSnackbar(
        message = "Message",
        actionLabel = "Undo",
        duration = SnackbarDuration.Short
    )
}
```

## Haptics

```kotlin
val haptic = LocalHapticFeedback.current

// Use haptic feedback for:
haptic.performHapticFeedback(HapticFeedbackType.LongPress)  // Selection
haptic.performHapticFeedback(HapticFeedbackType.TextHandleMove)  // Drag

// When to use:
// ✓ Toggle switches
// ✓ Long press actions
// ✓ Pull-to-refresh threshold
// ✓ Confirmation of destructive actions
// ✗ Every tap (overuse)
```

## Motion

### Duration Scale

```
MATERIAL 3 MOTION DURATIONS
Short1:  50ms   — Micro-interactions
Short2:  100ms  — Small elements
Short3:  150ms  — Small complex elements
Short4:  200ms  — Standard elements

Medium1: 250ms  — Page transitions
Medium2: 300ms  — Complex transitions
Medium3: 350ms  — Large elements
Medium4: 400ms  — Full-screen transitions

Long1:   450ms  — Complex choreography
Long2:   500ms  — Large complex elements
Long3:   550ms  — Dramatic transitions
Long4:   600ms  — Extra dramatic
```

### Easing

```kotlin
// Standard easing (most common)
val EasingStandard = CubicBezierEasing(0.2f, 0.0f, 0.0f, 1.0f)

// Emphasized easing (attention-grabbing)
val EasingEmphasized = CubicBezierEasing(0.2f, 0.0f, 0.0f, 1.0f)

// Usage
animateFloatAsState(
    targetValue = target,
    animationSpec = tween(
        durationMillis = 300,
        easing = EasingStandard
    )
)
```

## Accessibility

```kotlin
// Content descriptions
Icon(
    Icons.Default.Favorite,
    contentDescription = "Add to favorites"
)

// Semantic properties
Modifier.semantics {
    contentDescription = "Rating: 4 out of 5 stars"
    stateDescription = "Selected"
}

// Custom actions
Modifier.semantics {
    customActions = listOf(
        CustomAccessibilityAction("Delete") { /* action */ }
    )
}

// Clickable with role
Modifier.clickable(
    onClick = { },
    role = Role.Button
)
```

### Accessibility Checklist

```
┌─────────────────────────────────────────────────────────────────┐
│ ANDROID ACCESSIBILITY REQUIREMENTS                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│ ☐ Touch targets: 48×48dp minimum                                 │
│ ☐ Color contrast: 4.5:1 for text, 3:1 for graphics              │
│ ☐ Content descriptions for all images and icons                  │
│ ☐ Logical focus order for keyboard/TalkBack navigation          │
│ ☐ State announcements for dynamic content                       │
│ ☐ Labels for all form fields                                    │
│ ☐ Reduce motion preference honored                              │
│                                                                  │
│ TESTING:                                                         │
│ TalkBack → Navigate entire screen with gestures                  │
│ Switch Access → Verify all actions reachable                     │
│ Accessibility Scanner → Automated checks                         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Dark Theme

```kotlin
@Composable
fun AppTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    val colorScheme = if (darkTheme) {
        darkColorScheme(
            primary = PrimaryDark,
            // ... dark colors
        )
    } else {
        lightColorScheme(
            primary = PrimaryLight,
            // ... light colors
        )
    }

    MaterialTheme(
        colorScheme = colorScheme,
        content = content
    )
}

// Force theme (use sparingly)
Surface(
    tonalElevation = 2.dp  // Creates subtle surface tint
) {
    // Content
}
```

## Common Anti-Patterns

| Don't | Do Instead |
|-------|------------|
| Custom navigation patterns | Use Material navigation components |
| More than 5 bottom nav items | Use navigation drawer |
| Hiding navigation on scroll | Keep navigation visible |
| Hard-coded colors | Dynamic color tokens |
| Fixed font sizes | Scalable sp units |
| Custom dialogs | Use Material dialogs |
| Tiny touch targets | 48dp minimum |
| Icon-only buttons without labels | Add content descriptions |

## Quick Reference

```
┌─────────────────────────────────────────────────────────────────┐
│ ANDROID DESIGN QUICK REFERENCE                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│ SIZES                                                            │
│ Touch target:        48dp minimum                                │
│ Navigation bar:      80dp                                        │
│ Navigation rail:     80dp                                        │
│ Top app bar:         64dp (small), 112dp (medium), 152dp (large) │
│ FAB:                 56dp (standard), 40dp (small), 96dp (large) │
│ Standard margin:     16dp                                        │
│                                                                  │
│ TYPOGRAPHY                                                       │
│ Body Large:          16sp                                        │
│ Title Medium:        16sp Medium                                 │
│ Headline Medium:     28sp                                        │
│ Display Small:       36sp                                        │
│                                                                  │
│ CORNER RADIUS                                                    │
│ Extra small:         4dp                                         │
│ Small:               8dp                                         │
│ Medium:              12dp                                        │
│ Large:               16dp                                        │
│ Extra large:         28dp                                        │
│ Full:                50% (circular)                              │
│                                                                  │
│ ELEVATION                                                        │
│ Level 1:             1dp (cards, menus)                          │
│ Level 2:             3dp (FAB resting)                           │
│ Level 3:             6dp (snackbar, dialogs)                     │
│ Level 4:             8dp (FAB pressed)                           │
│ Level 5:             12dp (modal bottom sheet)                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Foldable Device Considerations

Material 3 is designed for all form factors, including foldables:

```kotlin
// Window size class
val windowSizeClass = calculateWindowSizeClass(this)

when (windowSizeClass.widthSizeClass) {
    WindowWidthSizeClass.Compact -> {
        // Phone-sized layout (single pane)
    }
    WindowWidthSizeClass.Medium -> {
        // Unfolded phone or small tablet
        // Consider list-detail layout
    }
    WindowWidthSizeClass.Expanded -> {
        // Tablet or unfolded foldable
        // Use multi-pane layouts
    }
}

// Folding feature detection
val foldingFeature = WindowInfoTracker.getOrCreate(context)
    .windowLayoutInfo(context)
    .map { it.displayFeatures.filterIsInstance<FoldingFeature>() }

// Adjust layout when folded
foldingFeature.collect { features ->
    features.forEach { fold ->
        when (fold.state) {
            FoldingFeature.State.FLAT -> {
                // Device is fully open
            }
            FoldingFeature.State.HALF_OPENED -> {
                // Device is partially folded (tabletop mode)
                // Split content across hinge
            }
        }
    }
}

// Hinge-aware layouts
BoxWithConstraints {
    if (maxWidth > 600.dp) {
        // Two-pane layout for large screens
        Row {
            Column(modifier = Modifier.weight(1f)) { /* Pane 1 */ }
            Column(modifier = Modifier.weight(1f)) { /* Pane 2 */ }
        }
    } else {
        // Single pane for small screens
        Column { /* Content */ }
    }
}
```

### Foldable Best Practices

```
┌─────────────────────────────────────────────────────────────────┐
│ FOLDABLE DESIGN GUIDELINES                                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│ ✓ DO:                                                            │
│ ├── Test on both folded and unfolded states                     │
│ ├── Avoid placing critical UI on the fold/hinge                 │
│ ├── Use WindowSizeClass for responsive layouts                  │
│ ├── Support state preservation across fold/unfold               │
│ └── Consider tabletop mode (half-open) for video/photos        │
│                                                                  │
│ ✗ DON'T:                                                         │
│ ├── Assume screen is always flat                                │
│ ├── Place primary buttons where the hinge splits screen         │
│ ├── Ignore window configuration changes                         │
│ └── Force single-pane layouts on large screens                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Related Skills

This skill works best in combination with:

- **platform-ios-design** — When building cross-platform apps, understand iOS HIG patterns to maintain platform-appropriate UX while keeping core features consistent
- **platform-web-design** — For WebView content within Android apps or when designing companion web experiences with Material Design principles

### Cross-Platform Considerations

When working across platforms, note these key differences:

| Pattern | Android (Material) | iOS (HIG) | Web |
|---------|-------------------|-----------|-----|
| Primary nav | Navigation bar (bottom) | Tab bar (bottom) | Top nav or sidebar |
| Back button | Top-left with arrow | Top-left with chevron | Browser back |
| Modality | Dialog centered | Sheet from bottom | Modal overlay |
| Touch target | 48×48dp | 44×44pt | 44px minimum |
| Typography | Roboto, scalable sp | SF Pro, Dynamic Type | System fonts, rem/em |
| Colors | Dynamic Material You | Semantic system colors | CSS custom properties |
| Elevation | Shadow/tonal | Blur/shadow | Shadow |

### Design System Mapping

```kotlin
// Material 3 ↔ iOS equivalents
MaterialTheme.colorScheme.primary          → .accentColor
MaterialTheme.colorScheme.onPrimary        → .white / .black (auto)
MaterialTheme.colorScheme.surface          → .systemBackground
MaterialTheme.colorScheme.onSurface        → .label
MaterialTheme.typography.headlineMedium    → .headline (28pt)
MaterialTheme.typography.bodyMedium        → .body (17pt)
```

## Resources

- [Material Design 3](https://m3.material.io/)
- [Material Theme Builder](https://m3.material.io/theme-builder)
- [Material Symbols](https://fonts.google.com/icons)
- [Compose Material 3](https://developer.android.com/jetpack/compose/designsystems/material3)
- [Adaptive Android Apps](https://developer.android.com/guide/topics/large-screens/get-started-with-large-screens)
