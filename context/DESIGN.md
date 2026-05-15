---
name: Financial Data System
colors:
  surface: '#131313'
  surface-dim: '#131313'
  surface-bright: '#3a3939'
  surface-container-lowest: '#0e0e0e'
  surface-container-low: '#1c1b1b'
  surface-container: '#201f1f'
  surface-container-high: '#2a2a2a'
  surface-container-highest: '#353534'
  on-surface: '#e5e2e1'
  on-surface-variant: '#c7c4d7'
  inverse-surface: '#e5e2e1'
  inverse-on-surface: '#313030'
  outline: '#908fa0'
  outline-variant: '#464554'
  surface-tint: '#c0c1ff'
  primary: '#c0c1ff'
  on-primary: '#1000a9'
  primary-container: '#8083ff'
  on-primary-container: '#0d0096'
  inverse-primary: '#494bd6'
  secondary: '#4edea3'
  on-secondary: '#003824'
  secondary-container: '#00a572'
  on-secondary-container: '#00311f'
  tertiary: '#ffb3ad'
  on-tertiary: '#68000a'
  tertiary-container: '#ff5451'
  on-tertiary-container: '#5c0008'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e1e0ff'
  primary-fixed-dim: '#c0c1ff'
  on-primary-fixed: '#07006c'
  on-primary-fixed-variant: '#2f2ebe'
  secondary-fixed: '#6ffbbe'
  secondary-fixed-dim: '#4edea3'
  on-secondary-fixed: '#002113'
  on-secondary-fixed-variant: '#005236'
  tertiary-fixed: '#ffdad7'
  tertiary-fixed-dim: '#ffb3ad'
  on-tertiary-fixed: '#410004'
  on-tertiary-fixed-variant: '#930013'
  background: '#131313'
  on-background: '#e5e2e1'
  surface-variant: '#353534'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  data-tabular:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  gutter: 16px
  margin-desktop: 40px
  margin-mobile: 16px
  container-padding: 24px
---

## Brand & Style

The design system is anchored in a **Modern Minimalist** aesthetic, specifically tailored for high-density financial data visualization. The personality is secure, professional, and sophisticated, aiming to evoke a sense of absolute control and precision. 

The visual narrative is driven by a "Bento Box" layout—a structured, modular grid that organizes disparate data points into cohesive, digestible units. By utilizing an OLED-black foundation, the system emphasizes "Data as Light," where information glows against a void, reducing cognitive load and visual noise. The style avoids unnecessary ornamentation, relying on perfect alignment, generous whitespace within modules, and a surgical use of color to signal meaning and hierarchy.

## Colors

The palette is optimized for OLED displays and long-duration analytical sessions. 

- **Foundation:** The true black (#000000) background provides infinite depth, while the deep charcoal (#111111) is reserved for container surfaces to create a subtle secondary layer.
- **Accents:** Deep Indigo (#6366F1) serves as the primary action color, providing a sophisticated, tech-forward feel. Emerald Green (#10B981) and Crimson (#EF4444) are strictly functional, representing positive growth and expenditures/alerts respectively.
- **Borders:** A refined grey (#1F1F1F) defines the edges of the bento modules, ensuring structure without breaking the minimalist dark aesthetic.

## Typography

This design system utilizes **Inter** for its exceptional legibility and technical neutrality. The typographic scale is designed to highlight large-scale financial figures while maintaining clarity in dense data tables.

Key implementation details:
- **Tabular Figures:** Always enable `tnum` (tabular numbers) and `lnum` (lining numbers) for financial data to ensure currency symbols and decimals align vertically.
- **Hierarchy:** Use the `label-sm` in uppercase for section headers within bento cards to provide a clear, "heads-up display" (HUD) feel.
- **Contrast:** Utilize weight (Medium to Bold) rather than size to differentiate importance, keeping the interface compact.

## Layout & Spacing

The layout follows a **Fixed Bento Grid** model. On desktop, the system operates on a 12-column grid with a fixed maximum width of 1440px. 

- **Bento Modules:** Content is organized into "cells" that span 3, 4, 6, or 12 columns. Every cell has a uniform 16px gutter from its neighbor.
- **Vertical Rhythm:** Spacing is strictly based on an 8px scale.
- **Responsive Reflow:** 
    - **Desktop:** 12-column, multi-height modules.
    - **Tablet:** 6-column grid; modules maintain their aspect ratios but stack more aggressively.
    - **Mobile:** Single column stack. Margin reduces to 16px. Bento cards become full-width with reduced internal padding.

## Elevation & Depth

In this design system, depth is achieved through **Tonal Layering** rather than traditional shadows. 

1. **Background (Level 0):** Pure #000000. This is the canvas.
2. **Bento Surface (Level 1):** #111111 with a 1px solid border of #1F1F1F. This creates a "recessed" or "inset" feel.
3. **Overlays/Modals (Level 2):** #1A1A1A with a subtle 10% Indigo-tinted shadow (0px 20px 40px rgba(0,0,0,0.4)).
4. **Interaction:** Hovering over a bento card should slightly brighten the border to #333333, signaling interactivity without shifting the z-index.

## Shapes

The shape language is defined by **Soft Geometric Precision**. 

- **Bento Cards:** Use a 16px (`rounded-lg`) corner radius to soften the high-contrast technical aesthetic.
- **Buttons & Inputs:** Use a 12px (`base`) corner radius.
- **Status Badges:** Fully rounded (pill-shaped) to distinguish them from structural modules.
- **Charts:** Donut charts and sparklines should use rounded caps on all paths to maintain consistency with the container shapes.

## Components

### Buttons & Actions
Primary actions use the Indigo (#6366F1) background with white text. Secondary actions use the charcoal surface with a subtle border. Ghost buttons are reserved for "Low-Emphasis" navigation.

### Bento Cards
These are the core containers. Each must have a `label-sm` header and consistent `container-padding`. 

### Data Visualization
- **Sparklines:** Minimalist, no-axis line charts. Use Emerald for growth and Crimson for decline. Use a 2px stroke width with a subtle gradient fill below the line.
- **Donut Charts:** 24px stroke width for the rings. Use Indigo for the primary data point and grey for the remaining "track."

### Inputs & Fields
Inputs are dark-themed with #000000 fills and #1F1F1F borders. On focus, the border transitions to Indigo. 

### Status Badges
Small, high-contrast pills. For example, a "Success" badge uses a 10% Emerald background with a 100% Emerald text color to ensure legibility against the dark theme.

### Tables
Use the `data-tabular` font. Remove vertical borders. Use thin #1F1F1F horizontal dividers only. The header row should be `label-sm` with a dimmed opacity (60%).