---
title: "I wanted to approve my agent's pull request"
summary: 'Separate GitHub identities for a coding agent, a reviewer, and me took two Apps, rotating tokens, and a GPG service. Here is the setup and its reusable configs.'
publishedAt: 2026-11-27
readingTime: 5 min read
tags: github, agentic-development, authentication, code-review, gpg
featured: true
---

I wanted an agent to open a PR, another agent to review it, and to approve it myself. But the coding agent used my GitHub credentials, so GitHub saw me trying to approve my own PR. Changing the commit author wouldn't help: the PR belongs to whoever opened it through the API.

[This exchange on X](https://x.com/snejink/status/2126207173864620226) brought me back to the setup I'd already built for this. It works for autonomous services and terminals where I'm steering an agent.

The short version: the writer and reviewer each get a GitHub App. Their installation tokens expire after an hour, so a timer replaces them every 30 minutes. Running sessions read credentials from files because environment variables would keep the expired tokens. Git uses `gh` as its credential helper so both tools act as the same bot.

I also wanted signed commits. That required separate GPG keys, then a service to supply their passphrases after restarts. The [scripts and configuration are in this template repo](https://github.com/krasnoperov/github-agent-identities). Here are the parts that needed care.

## A token isn't a separate identity

Another personal access token would still represent me. GitHub Apps give the agents their own actors without extra human accounts. I install each App on selected repositories and use its private key to mint installation credentials:

```text
App private key → signed JWT → installation token → gh and Git over HTTPS
```

The writer needs Contents and Pull requests write permissions. The reviewer needs Contents read and Pull requests write. CI operations may need additional permissions. Minting tokens doesn't require a webhook server; GitHub documents the [authentication flow](https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/authenticating-as-a-github-app-installation).

The reviewer needs a different App because [PR authors cannot approve their own PRs](https://docs.github.com/en/pull-requests/how-tos/review-pull-requests/approving-a-pull-request-with-required-reviews). Another token or installation of the writer App would still be the writer.

My host has separate Apps for [patchrelay](/posts/patchrelay), [review-quill](/posts/review-quill), and interactive coding. The template uses `writer` and `reviewer` profiles. Commands I type inside a writer session also run as that App.

## Rotating a token doesn't update a running process

A systemd timer mints replacement tokens every 30 minutes. Its service loads the App key through `LoadCredentialEncrypted` and atomically replaces a private `hosts.yml` file.

But `GH_TOKEN` and `GITHUB_TOKEN` [override credentials stored by gh](https://cli.github.com/manual/gh_help_environment). An agent launched with either variable would keep using the old token. The launcher therefore removes them and sets `GH_CONFIG_DIR` to the selected profile's directory. Every new `gh` invocation reads the current file.

Git calls `gh` for credentials:

```ini
[credential "https://github.com"]
    helper =
    helper = !/usr/bin/gh auth git-credential
```

The empty entry clears inherited helpers for that scope. The launcher supplies this configuration through `GIT_CONFIG_COUNT` and rewrites GitHub URLs to HTTPS, keeping the human's global Git configuration intact.

An installation token covers one installation. A second organization needs another profile and token file. Selecting the profile once for both tools keeps `git push` and `gh pr create` on the same identity.

## A push credential doesn't sign a commit

Separate Apps solve the approval problem. Signing local commits requires another key.

Each writing identity gets a GPG certificate. The primary certification key stays off the runner; only the signing subkey goes onto it. The launcher selects a dedicated `GNUPGHOME` and pins that subkey with `user.signingKey=SIGNING_SUBKEY_FINGERPRINT!`. The trailing `!` prevents GPG from choosing a different key. If the configured key is missing, committing fails.

The Git author is the App's bot. The committer uses a dedicated signer email, verified on my GitHub account and included in the public GPG certificate registered there. That lets GitHub [verify the signature](https://docs.github.com/en/authentication/troubleshooting-commit-signature-verification/using-a-verified-email-address-in-your-gpg-key) while retaining the bot as author. The bot's noreply address uses its numeric user ID, which is different from the App ID.

The runner can use that signing subkey without me. My approval remains a separate review event on the PR.

## A protected key can still block unattended work

After a restart, GPG's passphrase cache is empty. The next commit can stop at a password prompt.

A separate service reads the passphrase from an encrypted systemd credential and feeds it over stdin to [`gpg-preset-passphrase`](https://www.gnupg.org/documentation/manuals/gnupg/gpg_002dpreset_002dpassphrase.html). It addresses the subkey by its keygrip, refreshes the cache hourly, and checks every two seconds for cache loss. The coding agent gets signing configuration without receiving the passphrase itself.

The [signing guide](https://github.com/krasnoperov/github-agent-identities/blob/main/docs/signing.md) covers GPG preset permissions, socket paths, service setup, and recovery. Backups, revocation, and subkey renewal still need handling.

My services share a Unix user. These profiles keep routine actions attributed correctly, but a process running as that user can access another profile's credentials. Isolating untrusted agents requires separate OS permissions too.

## What this buys me

On a disposable PR I checked that the coding App owned it, GitHub verified its commit signature, and my human approval referred to that exact commit. The separate reviewer App handles automated review in the normal review-quill flow. The template includes [acceptance checks](https://github.com/krasnoperov/github-agent-identities/blob/main/docs/verification.md) for both reviewers, token rotation, and signing failures.

Repository rules still decide which approvals count. Requiring two reviews doesn't necessarily mean one human and one agent; a gate that requires both must check the actors.

I can now approve the agent's work as myself and distinguish that approval from the automated review. Getting there took App registrations, credential rotation, Git configuration, GPG keys, and background services on one box.

Next I want to look at source-control systems built for this workflow: agents with separate identities, review loops that survive another push, and a human view of what each agent changed and what needs a decision. Can they replace this setup with less administration? That's the next post.
