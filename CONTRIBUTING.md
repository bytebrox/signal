# Contributing to SIGNAL

Thanks for your interest in contributing to SIGNAL! This document outlines the process for contributing to the project.

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/signal.git
   cd signal
   ```
3. **Install dependencies**:
   ```bash
   npm install
   ```
4. **Set up environment variables** (see README.md)
5. **Run the development server**:
   ```bash
   npm run dev
   ```

## How to Contribute

### Reporting Bugs

- Check if the bug has already been reported in [Issues](https://github.com/bytebrox/signal/issues)
- If not, create a new issue with:
  - Clear title and description
  - Steps to reproduce
  - Expected vs actual behavior
  - Screenshots if applicable
  - Browser/OS information

### Suggesting Features

- Open an issue with the `feature` label
- Describe the feature and why it would be useful
- Be open to discussion

### Submitting Code

1. **Create a branch** for your changes:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**:
   - Follow the existing code style
   - Write meaningful commit messages
   - Keep changes focused and atomic

3. **Test your changes**:
   - Make sure the app builds: `npm run build`
   - Test functionality manually

4. **Push and create a Pull Request**:
   ```bash
   git push origin feature/your-feature-name
   ```
   Then open a PR on GitHub.

## Code Style

- **TypeScript**: Use strict types, avoid `any`
- **React**: Functional components with hooks
- **Styling**: Tailwind CSS, follow existing patterns
- **Naming**: camelCase for variables/functions, PascalCase for components

## Commit Messages

Use clear, descriptive commit messages:

```
feat: Add wallet filtering by time range
fix: Resolve scan timeout issue
docs: Update README installation steps
style: Fix button alignment on mobile
```

Prefixes:
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation
- `style:` - UI/styling changes
- `refactor:` - Code refactoring
- `test:` - Tests
- `chore:` - Maintenance

## Pull Request Guidelines

- Fill out the PR template
- Reference related issues
- Keep PRs focused (one feature/fix per PR)
- Be responsive to feedback

## Questions?

- Open an issue for general questions
- Join our community on [X/Twitter](https://x.com/bytebrox)

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
