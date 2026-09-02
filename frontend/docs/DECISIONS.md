# Decisions Log

Short record of product/design decisions made for this app. Check this file before
starting new work — if a new task conflicts with something here, flag it instead of
silently overriding it.

## Theme

- Default theme = system preference (`prefers-color-scheme`), fallback to **light** if unavailable. Never hardcode a default. (2026-09-02)
- Theme toggle lives as a standalone icon button in the Header's quick-action icons, placed **before** the Settings button — not inside the profile dropdown. (2026-09-02)
- Toggle icon: `lucide-react`'s `Moon` (dark theme active) / `Sun` (light theme active), 22px. Chosen over Material Symbols `dark_mode`/`light_mode` and other lucide pairs (`MoonStar`/`SunMedium`, `CloudMoon`/`CloudSun`) after visual comparison — first icon in the header to use lucide-react instead of Material Symbols. (2026-09-02)

## Icons

- Replaced **all** Material Symbols Outlined icons app-wide with `lucide-react`, for one consistent icon system (started as just the theme toggle, extended to the whole app). Google Fonts Material Symbols link removed from `index.html`; `.material-symbols-outlined` CSS rule removed from `theme.css`. (2026-09-02)
- Mapping used — Header: `search`→`Search`, `expand_more`→`ChevronDown`, `check`→`Check`, `add_circle`→`CirclePlus`, `settings`→`Settings`, `account_circle` (Support button)→`LifeBuoy`. Sidebar: `dashboard`→`LayoutDashboard`, `lock`→`Lock`, `upload_file`→`FileUp`, `account_balance_wallet`→`Wallet`, `settings`→`Settings`, `help`→`LifeBuoy`. `LifeBuoy` used for Support in both Header and Sidebar for consistency (previously mismatched: `account_circle` in Header vs `help` in Sidebar for the same concept). (2026-09-02)

- Header's Settings icon button removed (Settings already lives in the Sidebar footer — was a duplicate). Header's Support (`LifeBuoy`) button replaced with an Alerts button (`Bell`, lucide-react, chosen over `BellRing`/`AlertTriangle`). Shows a small red (`#ef4444`) dot badge, top-right of the icon, only when `hasAlerts` is true (prop on `Header`, no count yet — just unread/no-unread). (2026-09-02)

## Sidebar

- Removed the "Encrypted Sync / TLS 1.3" status box (was placeholder/inaccurate — no actual sync or TLS claim was backed by real functionality). Replaced with one plain line: "100% Private & Offline" with a small red (`#ef4444`) filled `Heart` (lucide-react) pinned to the right edge (`justify-between`), muted text color, no card/border, single line (`whitespace-nowrap`). (2026-09-02)
- Brand block (logo) height set to `h-16` (64px) to match the Header's row height exactly, flush to the sidebar's top edge — reads as one continuous top bar with the Header instead of floating lower with its own margin. (2026-09-02)
- Removed the internal divider lines (`border-b` under the logo, `border-t` above the Settings/Support footer) — sidebar sections now flow without separating lines. (2026-09-02)
- Sidebar is collapsible: toggle button (`PanelLeftClose`/`PanelLeftOpen`, lucide-react) next to the logo collapses it from `w-64` to an icon-only `w-20` rail (labels hidden, `title` tooltips added). Collapse state lives in `App.tsx` and is passed down to both `Sidebar` and `Header` so the Header's `left` offset and the main content's `margin-left` animate in sync (`transition-all duration-200`). (2026-09-02)
