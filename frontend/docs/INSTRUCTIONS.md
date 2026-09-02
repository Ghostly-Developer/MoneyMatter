# Instructions for MoneyMatter

This document captures the core instructions for working on MoneyMatter, using the current README as the primary source.

## Project Goal
Build a personal finance management tool that helps users import, track, analyze, and manage financial records and documents.

## Key Objectives
- Support import and export of financial files from accounting apps in JSON and XML formats.
- Enable users to import payslips, credit card bills, account statements, tax forms, and personal documents.
- Allow users to add and track investments such as fixed deposits, mutual funds, equities, and retirement savings.
- Provide expense and investment analysis through charts and grouped reporting.

## Development Instructions
1. Preserve the current feature set from the README in all new work.
2. Maintain clear naming and hygiene for file types and document imports.
3. Ensure import/export workflows are robust against malformed JSON and XML.
4. Build dedicated screens or modules for:
   - Document record management
   - Investment tracking
   - Bill and expense tracking
   - Tax document storage and retrieval
5. Add analytics views for:
   - Investment trends
   - Credit card expense trends
   - Grouped and merged expenses

## Priorities
- First implement stable import/export support.
- Next, add document management for retirement accounts and IDs.
- Then add expense grouping and merge flows.
- Finally, develop graphing and visualization for analysis.

## Notes for Contributors
- Keep README-derived requirements central to feature scope.
- Document any added functionality and map it back to the base feature list.
- Use modular components and clear separation between import logic, data storage, and analysis views.