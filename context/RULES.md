# Rules for Working on MoneyMatter

This document defines rules and conventions for consistent development across the MoneyMatter project.

## General Rules
- Align all features with the core product scope from the README.
- Keep feature additions focused on finance document management, import/export, investments, bills, and expense analysis.
- Avoid adding unrelated functionality unless it is explicitly valuable to personal finance tracking.

## Code Quality Rules
- Write clean, readable code with meaningful names.
- Use modular components and separate concerns clearly.
- Document any non-obvious logic, especially import parsing and data transformation.
- Follow standard language conventions and formatting rules.

## Data Handling Rules
- Validate imported JSON and XML content before processing.
- Preserve source metadata for every imported file.
- Normalize expense categories and group names where possible.
- Keep user document storage secure and clearly labeled.

## Feature Rules
- Implement import/export of accounting data as a priority.
- Support document storage for retirement accounts, IDs, and tax forms.
- Provide analysis views for investment and expenses.
- Allow users to create expense groups and merged expense records.

## Collaboration Rules
- Update README and context files when requirements change.
- Use `PROGRESS.md` to log milestones and current work.
- Review and confirm that new work matches the documented project context.
