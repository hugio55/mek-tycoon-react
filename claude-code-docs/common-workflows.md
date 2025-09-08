# Common workflows

> Learn patterns and best practices for common development tasks with Claude Code

This guide covers frequently used workflows and patterns that will help you be more productive with Claude Code.

## Building features

When implementing new features, describe what you want in natural language. Claude Code will:

1. Understand your requirements
2. Examine your codebase for context
3. Create a implementation plan
4. Write the necessary code
5. Verify the implementation works

**Example prompts:**
- "Add a dark mode toggle to the settings page"
- "Create a REST API endpoint for user authentication"
- "Build a React component that displays a sortable data table"

## Debugging and fixing issues

For debugging, provide error messages, symptoms, or unexpected behavior:

**Example prompts:**
- "The login button isn't working - nothing happens when I click it"
- "Getting TypeError: Cannot read property 'map' of undefined on the products page"
- "The API returns 500 errors when submitting the contact form"

Claude Code will analyze the issue, identify root causes, and implement fixes.

## Code refactoring

Request specific refactoring tasks or improvements:

**Example prompts:**
- "Refactor this function to use async/await instead of callbacks"
- "Extract the validation logic into a separate utility module"
- "Convert this class component to a functional component with hooks"

## Understanding codebases

Ask questions about your project structure and implementation:

**Example prompts:**
- "How does the authentication flow work in this app?"
- "What files handle payment processing?"
- "Explain the data flow between the frontend and backend"

## Writing tests

Claude Code can create comprehensive test suites:

**Example prompts:**
- "Write unit tests for the user service"
- "Add integration tests for the checkout flow"
- "Create end-to-end tests for the registration process"

## Documentation

Generate or update documentation:

**Example prompts:**
- "Document the API endpoints in this service"
- "Add JSDoc comments to all public methods"
- "Create a README with setup instructions"