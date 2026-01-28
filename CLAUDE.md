# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Cloud File Manager (CFM) is a JavaScript/TypeScript library that enables applications to save and load files from various file systems using a simple consistent API. It's published as `@concord-consortium/cloud-file-manager` on npm.

Supported providers:
- Google Drive
- Local and remote read-only files
- Browser LocalStorage (mostly for development/testing)

## Build and Development Commands

```bash
# Install dependencies
npm install

# Development build
npm run build

# Production build
npm run build:production

# Build library (for npm publishing)
npm run build:library

# Start development server (http://localhost:8080/examples/)
npm start

# Start with SSL (requires mkcert setup)
npm run start:secure

# Lint
npm run lint
npm run lint:fix
```

## Testing Commands

```bash
# Run Jest unit tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## Local Development with Client Projects

Use yalc to test CFM changes in client projects (like CODAP v3) without publishing:

```bash
# In CFM: publish to local yalc repository
npm run yalc:publish

# In client project: add local CFM
npx yalc add @concord-consortium/cloud-file-manager

# After making more CFM changes, push updates
npm run yalc:publish
```

## Development Workflow

### Starting Work on a Jira Story

When the user says "Let's start work on CFM-XXX" (or similar):

1. **Ask about the base branch**: Usually `master`, but occasionally work builds on a previous PR branch. Confirm before creating the branch.

2. **Create a feature branch**:
   - Branch name format: `{JIRA-ID}-{short-description}`
   - Example: `CFM-6-ios-local-file-save`
   - Use lowercase kebab-case for the description
   - Keep it concise but descriptive

3. **Update Jira status**: Transition the story to "In Progress"

### Creating a Pull Request

When the work is ready for initial CI validation:

1. **Create a draft PR**:
   - Title format: `{JIRA-ID}: {description}` (e.g., `CFM-6: fix iOS local file save`)
   - Description should include:
     - Summary of the changes
     - Reference to the Jira story (e.g., `Fixes CFM-6` or link to the story) so Jira links it automatically
   - Apply relevant labels if any

2. **Initial CI validation**:
   - CI runs automatically on PRs (lint, build, tests)
   - Review CI results and fix any issues

3. **Finalize the PR**:
   - Request Copilot review
   - Ensure all tests pass

4. **Ready for review**:
   - Once CI passes:
     - Mark PR as "Ready for Review" (no longer draft)
     - Assign to another developer for review
     - Transition the Jira story to "In Code Review"
   - Ensure Jira story has approvers specified:
     - **Developer Approver**: The code reviewer
     - **Project Team Approver**: Someone to verify the fix/feature
   - If approvers aren't specified, ask the user about them

5. **After code review approval**:
   - Mark PR as approved
   - Transition Jira story to "Ready for Merge"

6. **After merge**:
   - Once the PR is merged and builds successfully on `master`
   - Transition Jira story to "In Project Team Review"

7. **Project team review**:
   - Project Team Approver verifies the fix/feature
   - If approved: Transition Jira story to "Done"
   - If rejected: Either stay in current status (for discussion) or transition back to "In Progress" if more work is required

8. **Rejection at any review stage**:
   - If Developer Approver or Project Team Approver rejects:
     - Stay in current review status if there's ongoing discussion
     - Transition back to "In Progress" if more work is needed

### Jira Integration

- The project uses Jira for issue tracking at `concord-consortium.atlassian.net`
- Stories are in the CFM project (e.g., CFM-6)
- Use the Atlassian MCP tools to read/update Jira issues
- Jira status transitions:
  - **To Do** → **In Progress**: When starting work on a story
  - **In Progress** → **In Code Review**: When PR is ready for human review
  - **In Code Review** → **Ready for Merge**: When code review is approved
  - **Ready for Merge** → **In Project Team Review**: After merge and successful build on `master`
  - **In Project Team Review** → **Done**: When Project Team Approver approves
  - **Any review status** → **In Progress**: If more work is required after rejection

### Publishing to npm

After changes are merged and tested:
- Preview: `npm run publish:npm:latest:preview`
- Publish: `npm run publish:npm:latest`
- For pre-release versions: `npm run publish:npm:next`

## Project Structure

- `src/code/` - Main source code
- `src/code/providers/` - File system provider implementations
- `dist/` - Build output
- `examples/` - Example applications for testing
