# Contributing to AirConsole

Thanks for helping improve AirConsole. Contributions to code, documentation, tests, and issue reports are welcome. AirConsole is a student-built browser platform for local multiplayer games, with a shared TV or desktop display and mobile phones used as controllers.

## Before you start

- Search the repository's open and closed issues before reporting a problem or proposing a change.
- Open an issue before beginning a feature or substantial architecture change so its scope can be agreed upon. Small fixes and documentation improvements may go directly to a pull request.
- Do not disclose vulnerabilities in public issues or pull requests. Follow [SECURITY.md](SECURITY.md).
- Test only sessions, devices, networks, and data that you own or are authorized to use.
- Never commit credentials, private session data, personal information, or generated build and test artifacts.

## Reporting an issue

Open an issue in the [AirConsole repository](https://github.com/BevyOnYourTV/Main_app/issues) and keep it focused on one problem or proposal.

### Bug reports

Include:

- The affected experience: shared home page, TV/desktop console, mobile controller, game, or server.
- Your browser, operating system, device type, and the AirConsole version or commit.
- Clear reproduction steps, including the relevant URL or user action.
- The expected and actual behavior.
- Relevant error messages, sanitized logs, or screenshots.
- Whether the issue involves one device, communication between the console and controller, or an entire multiplayer session.

For build or tooling failures, also include the output of `node --version` and `npm --version`. Put commands and logs in fenced code blocks. Remove tokens, session identifiers, network addresses, personal data, and other sensitive information before posting.

### Feature requests

Describe the player or developer problem, who benefits, the proposed behavior, and alternatives you considered. For changes to session communication, controller behavior, TV navigation, or the game integration contract, explain how existing clients would be affected.

## Developing locally

The current web client lives in `apps/web`.

```bash
cd apps/web
npm install
npm run dev
```

Before submitting a pull request, run the checks relevant to your change:

```bash
npm run lint
npm run build
```

Add or update tests when behavior changes. Manually verify changes on the device classes they affect, especially TV or keyboard navigation and mobile layouts.

## Pull requests

- Keep each pull request focused and explain both the reason for the change and its user-visible effect.
- Link the relevant issue. Use `Fixes #123` only when the pull request fully resolves it.
- Describe how the change was tested and list any checks that could not be run.
- Include screenshots or recordings for visible interface changes when useful.
- Update documentation when setup, architecture, user flows, or public interfaces change.
- Follow the [Code of Conduct](CODE_OF_CONDUCT.md) in all project discussions.
