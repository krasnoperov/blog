---
title: "Approving your coding agent's pull requests"
summary: 'An agent using your GitHub account opens PRs you cannot approve yourself. Separate GitHub Apps let the writer, reviewer, and human act under different identities.'
publishedAt: 2026-11-27
readingTime: 4 min read
tags: github, agentic-development, authentication, code-review, gpg
featured: true
---

Your coding agent opens a pull request. You want to approve it yourself and have a second agent review it independently. But the coding agent uses your GitHub credentials, so the PR belongs to you—and GitHub won't let you approve your own PR. Changing the Git author name doesn't change who opened it.

The writer, reviewer, and human need different GitHub identities. One way to provide the two bot identities is through GitHub Apps. Their credentials expire every hour, which means renewing them without interrupting the agents. If your repositories also require signed commits, signing needs its own keys and restart handling.

The setup below runs on a Linux host and supports unattended jobs and interactive sessions. It's the configuration I use, extracted into a [project-neutral template repository](https://github.com/krasnoperov/github-agent-identities).

## Give each agent its own identity

Another personal access token for your account would leave the PR under the same identity. GitHub Apps provide separate identities without extra human accounts.

Each App has a private key. Use it to sign a JWT, then exchange that for an [installation access token](https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/authenticating-as-a-github-app-installation). The token can access the repositories covered by that installation, within the App's permissions. Obtaining it doesn't require a webhook server.

Create separate Apps for the writer and reviewer. Sharing one would bring back the [self-approval restriction](https://docs.github.com/en/pull-requests/how-tos/review-pull-requests/approving-a-pull-request-with-required-reviews). In this setup, the writer gets Contents and Pull requests write permissions; the reviewer gets Contents read and Pull requests write. CI operations need their own permissions.

The template selects these through `writer` and `reviewer` profiles. A shell launched with the writer profile acts as that App, including commands you type yourself. Submit your human approval through your own GitHub account separately.

## Keep credentials fresh during long sessions

Installation tokens last one hour. To keep a long session working, the template uses a systemd timer to mint a replacement every 30 minutes. It loads the App key from an encrypted credential and atomically replaces that profile's private `hosts.yml`.

The running agent must actually use the new file. If it inherited `GH_TOKEN` at startup, it would keep the old value: environment tokens [take precedence over gh's stored credentials](https://cli.github.com/manual/gh_help_environment). The launcher removes `GH_TOKEN` and `GITHUB_TOKEN` and sets `GH_CONFIG_DIR` instead. Each new `gh` command reads the current token from that directory.

Git also needs the refreshed credentials. Configure it to use `gh auth git-credential`:

```ini
[credential "https://github.com"]
    helper =
    helper = !/usr/bin/gh auth git-credential
```

The empty entry clears inherited helpers for this scope. The launcher passes the configuration to child processes and rewrites GitHub remotes to HTTPS without changing your global Git config.

Each installation gets its own profile and token file. That matters when the same App is installed in more than one organization.

## Keep commit signing working unattended

Separate PR identities solve the approval problem. If you also need signatures on locally created commits, pushing with an App token doesn't add them.

Give each writing identity a GPG certificate and put only its private signing subkey on the runner. Keep the primary certification key elsewhere. The profile selects a dedicated `GNUPGHOME` and pins the exact signing subkey with a trailing `!` in `user.signingKey`.

In this configuration, the App's bot is the Git author. The committer uses a dedicated signer email, verified on your GitHub account and included in the public GPG certificate registered there. GitHub [checks that email against both the key and the account](https://docs.github.com/en/authentication/troubleshooting-commit-signature-verification/using-a-verified-email-address-in-your-gpg-key). A verified signature records use of the signing key; your human approval remains a separate PR review.

A protected subkey adds another failure to handle: after GPG loses its passphrase cache, a commit can wait for someone to answer a password prompt. A service reads the passphrase from an encrypted systemd credential and supplies it over stdin to `gpg-preset-passphrase`. It checks the cache every two seconds and restores it when needed. The agent process receives the signing configuration without the passphrase in its environment.

The [signing guide](https://github.com/krasnoperov/github-agent-identities/blob/main/docs/signing.md) covers importing the subkey, configuring the service, and testing recovery. You'll still need backups and a plan for key renewal.

Profiles don't isolate services running under one Unix user: a process with that user's access can read another profile's credentials or request a signature. Use separate OS users or machines if you need to enforce that boundary.

## Check the approvals, rotation, and recovery

Before relying on the setup, use a disposable PR to check bot attribution, signature verification, and approvals from both your account and the reviewer App. The template includes [acceptance checks](https://github.com/krasnoperov/github-agent-identities/blob/main/docs/verification.md) for the review actors, token rotation, and signing recovery.

Repository rules still need attention. Two approvals can come from two agents; requiring a human as well means checking who approved, not only counting reviews.

You can now approve the coding agent's PR under your own name, alongside an independent agent review. Keeping that working means maintaining App registrations, token rotation, Git settings, and GPG services on a single box.

Could source-control tools built for agents remove some of that work? The next post will compare how they assign identities, preserve reviews after a push, and show which agent is working or waiting for input.
