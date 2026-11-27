---
title: "I wanted to approve my agent's pull request"
summary: 'How I configured separate GitHub identities for coding and review agents, with credentials and signing keys that work through long sessions and restarts.'
publishedAt: 2026-11-27
readingTime: 4 min read
tags: github, agentic-development, authentication, code-review, gpg
featured: true
---

I want to approve a coding agent's pull request under my own name. I also want another agent to review it independently. If the coding agent uses my GitHub credentials, the PR belongs to me, and GitHub won't let me approve it. A different name in the commit doesn't change who opened the PR.

On my Linux host, the agents use GitHub Apps for their identities. The credentials expire every hour, so services replace them while the agents keep running. Both `gh` and Git read the replacement credentials. Signed commits need GPG keys as well, with another service to make them usable after a restart.

That setup works for unattended jobs and sessions where I'm typing alongside an agent. I've extracted it into a [project-neutral template repository](https://github.com/krasnoperov/github-agent-identities).

## GitHub identities

Creating another personal access token would still leave the PR under my account. I need credentials belonging to a different identity. GitHub Apps provide that without requiring me to maintain extra human accounts.

Each App has a private key. I use it to sign a JWT, then exchange that for an [installation access token](https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/authenticating-as-a-github-app-installation). The token can access the repositories covered by that installation, within the App's permissions. There is no webhook server involved in obtaining it.

The writer and reviewer have separate Apps. Sharing one would give them the same identity and bring back the [self-approval restriction](https://docs.github.com/en/pull-requests/how-tos/review-pull-requests/approving-a-pull-request-with-required-reviews). The writer gets Contents and Pull requests write permissions; the reviewer gets Contents read and Pull requests write. CI operations need their own permissions.

The template selects these through `writer` and `reviewer` profiles. A shell launched with the writer profile acts as the writer App, including commands I type myself. I approve through my own GitHub account separately.

## Keeping a session working

Installation tokens last one hour. I don't want to restart a coding session whenever one expires, so a systemd timer mints a replacement every 30 minutes. It loads the App key from an encrypted credential and atomically replaces that profile's private `hosts.yml`.

The running agent must actually use the new file. If it inherited `GH_TOKEN` at startup, it would keep the old value: environment tokens [take precedence over gh's stored credentials](https://cli.github.com/manual/gh_help_environment). The launcher removes `GH_TOKEN` and `GITHUB_TOKEN` and sets `GH_CONFIG_DIR` instead. Each new `gh` command reads the current token from that directory.

Git uses the same credentials through `gh auth git-credential`:

```ini
[credential "https://github.com"]
    helper =
    helper = !/usr/bin/gh auth git-credential
```

The empty entry clears inherited helpers for this scope. The launcher passes the configuration to child processes and rewrites GitHub remotes to HTTPS. It doesn't change my global Git config.

Each installation gets its own profile and token file. That matters when the same App is installed in more than one organization.

## Signing commits

The PR identities are now separate, but I also want signatures on commits created locally. Pushing with an App token doesn't add one.

I give each writing identity a GPG certificate and put only its private signing subkey on the runner. The primary certification key stays off that machine. The profile selects a dedicated `GNUPGHOME` and pins the exact signing subkey with a trailing `!` in `user.signingKey`.

The App's bot is the Git author. The committer uses a dedicated signer email, which I verify on my GitHub account and include in the public GPG certificate registered there. GitHub [checks that email against both the key and the account](https://docs.github.com/en/authentication/troubleshooting-commit-signature-verification/using-a-verified-email-address-in-your-gpg-key). A verified signature records use of the signing key; my human approval is still a separate PR review.

A protected subkey adds another failure to handle: after GPG loses its passphrase cache, a commit can wait for someone to answer a password prompt. A service reads the passphrase from an encrypted systemd credential and supplies it over stdin to `gpg-preset-passphrase`. It checks the cache every two seconds and restores it when needed. The agent process receives the signing configuration without the passphrase in its environment.

The [signing guide](https://github.com/krasnoperov/github-agent-identities/blob/main/docs/signing.md) covers importing the subkey, configuring the service, and testing recovery. Backups and key renewal remain my responsibility.

My services share a Unix user, so these profiles don't isolate them from each other. A process with that user's access can read another profile's credentials or request a signature. Separate OS users or machines would be needed to enforce that boundary.

## Reviewing the result

On a disposable PR, I checked the bot attribution, GitHub's signature verification, and my human approval on the exact commit. Automated reviews use the separate reviewer App. The template includes [acceptance checks](https://github.com/krasnoperov/github-agent-identities/blob/main/docs/verification.md) for the review actors, token rotation, and signing recovery.

Repository rules still need attention. Two approvals can come from two agents; requiring a human as well means checking who approved, not only counting reviews.

I can approve the agent's work as myself now. Maintaining that arrangement means looking after App registrations, token rotation, Git settings, and GPG services on a single box.

For the next post, I want to compare source-control tools built for agents: how they assign identities, what happens to a review after another push, and whether I can see which agent is working or waiting for me. How much of this administration would I still have to do?
