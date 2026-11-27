---
title: "I wanted to approve my agent's pull request"
summary: 'An agent opens a PR, another agent reviews it, and I approve it as myself. Getting those three identities right led through GitHub Apps, hourly tokens, credential helpers, and unattended GPG signing. A working setup, with reusable templates, for one Linux box.'
publishedAt: 2026-11-27
readingTime: 9 min read
tags: github, agentic-development, authentication, code-review, gpg
featured: true
---

I want an agent to open a pull request, a different agent to review it, and to be able to approve it myself. Three participants, three visible actions. I also want this to work when I'm sitting next to a coding agent in a terminal, rather than delegating the whole task to a service.

But if the coding agent uses my GitHub credentials, the PR belongs to me. GitHub sees me trying to approve my own work. Changing the name on the commit doesn't change who opened the PR.

[Marc Klingen described that problem on X](https://x.com/marcklingen/status/2126001068501020971): an agent opens a PR under his identity, so his human review can only be recorded as a comment. [My response](https://x.com/snejink/status/2126207173864620226) was that I want separate agent authentication and signing without extra accounts or a collection of GitHub Apps. I already have the collection of Apps. This is what it took to make them work.

I've put the project-neutral scripts and configuration in [github-agent-identities](https://github.com/krasnoperov/github-agent-identities). The first part is the whole chain in a few paragraphs. The second goes through the same chain with the details that made it hold together.

## The short version

I needed the writer to have its own identity, but another token issued to my account would still be me. So I registered a GitHub App and used its installation credentials. PRs opened with those credentials belong to the App's bot.

I needed an agentic reviewer too, but letting it use the writer's App would bring back the self-approval problem. So the reviewer got a separate App. My normal account stayed the human reviewer.

That worked, but an installation token expires after an hour. My coding sessions can last longer. So a background service mints replacement tokens every 30 minutes.

The service could refresh its token, but a running agent would still have the old one in its environment. So the agent inherits a path to a credential file. Every new `gh` invocation reads the current file, and Git gets the same credentials through `gh auth git-credential`.

Now both tools acted as the right bot, but pushing as an App didn't sign the commits created locally. So I gave the writer a dedicated GPG signing subkey, kept the App as the commit author, and configured a separate committer identity whose email and public key were registered with GitHub.

That produced verified commits, but unattended signing couldn't stop for a passphrase after a restart. So another service loads an encrypted credential and keeps the signing subkey available in the GPG agent's cache.

The result is what I wanted: a bot-authored PR, an independent agent review, a human approval, and verifiable commits. The route there includes two kinds of keys, expiring tokens, process environments, Git configuration, email verification, and background services. All of this is on one Linux box.

## First, make the PR belong to the writer

The first obstacle is easy to misdiagnose because Git and GitHub both have something called an author. Git stores author and committer fields inside each commit. GitHub records the actor that made the API request to create the pull request. They are separate records.

Setting `user.name` to a bot name, adding a `Co-authored-by` trailer, or making another personal access token doesn't give the PR a separate owner. [GitHub's review rules](https://docs.github.com/en/pull-requests/how-tos/review-pull-requests/approving-a-pull-request-with-required-reviews) prohibit PR authors from approving their own PRs. The credential used to open it has to represent someone else.

GitHub Apps provide that actor. I register an App, grant it repository permissions, install it on selected repositories, and generate its private key. The private key signs a short-lived JWT, which authenticates the request to mint an installation token:

```text
App private key
  → signed JWT
  → installation access token
  → GitHub API requests and Git over HTTPS
```

The JWT identifies the App; the installation token grants access to the repositories covered by that installation. The [JWT documentation](https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/generating-a-json-web-token-jwt-for-a-github-app) describes the exchange. It doesn't require running a webhook server just to obtain credentials.

For a writer that pushes code and opens PRs, the starting permissions are Contents read/write and Pull requests read/write. A reviewer that reads code and posts reviews starts with Contents read and Pull requests read/write. Workflow edits, CI reruns, and publishing checks need their corresponding permissions; I add those for the actual service rather than copying every permission from my production setup.

But one App still gives me only one bot. A second token, or a second installation of that App, changes credentials or repository access without creating another reviewer identity. So the writer and reviewer have different Apps.

On my host, [patchrelay](/posts/patchrelay) and [review-quill](/posts/review-quill) have their own Apps, and interactive coding sessions use another coding App. The template reduces that to `writer` and `reviewer`. A human typing commands inside the writer session also acts as the writer App. The session has an identity; it doesn't guess who typed the command.

## Keep that identity after the first hour

The next constraint is the [one-hour lifetime of installation tokens](https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/authenticating-as-a-github-app-installation). These tokens have to be minted again. A token copied into a shell at startup eventually stops working, even if the agent is still making progress.

So I moved token renewal outside the agent. The template uses a systemd service and a timer for each installation. Every 30 minutes the service loads the App key through `LoadCredentialEncrypted`, requests a token, and atomically replaces a private `hosts.yml` file. It also writes non-secret identity and expiry metadata so I can inspect the rotation without printing credentials.

But updating the file is useless if the agent keeps using an environment token. `GH_TOKEN` and `GITHUB_TOKEN` [take precedence over stored credentials](https://cli.github.com/manual/gh_help_environment). A child process inherits their values at launch; changing them in the parent later doesn't update the child.

So the session launcher removes those variables and sets `GH_CONFIG_DIR` to the writer's or reviewer's private directory. The long-lived agent holds the directory path. Each `gh` subprocess reads the current token. No restarting a coding session just to change its password.

That solves `gh`, but Git needs credentials too. I make it call the same CLI as its credential helper, using process-scoped configuration:

```ini
[credential "https://github.com"]
    helper =
    helper = !/usr/bin/gh auth git-credential
```

The empty helper clears the inherited helper list for that scope. The launcher supplies these settings through `GIT_CONFIG_COUNT` and its numbered key/value pairs, alongside GitHub URL rewrites to HTTPS. Neither the repository's config nor the human's global config needs to change.

Now `git push` and `gh pr create` consult the same rotating credentials. An already-running network operation won't change its credentials mid-request, but the next invocation gets the replacement token.

There's another boundary: an installation token belongs to one installation. A second organization needs another token file, even if it installs the same App. My host routes those by repository owner; the reusable template makes the selection explicit, with one profile per role and installation. The same profile launches both tools, so their routing can't quietly disagree.

## Authentication works. Signing is another job

At this point the approval problem is solved. I can open a PR as the writer App, have the reviewer App review it, and approve it through my own account. Signing is an additional requirement I wanted for locally produced commits.

But App authentication only proves that the push or API request had permission. It doesn't attach a cryptographic signature to a commit made by `git commit` on my machine. So the writer needs a signing key as well.

I chose GPG with a dedicated certificate for each writing identity. The primary certification key stays off the runner; the runner gets only the secret signing subkey. That limits which key material has to live on the unattended box, although the available subkey can still sign commits there.

The identity split looks like this:

| Record | Identity |
|-|-|
| PR creator | Writer App |
| Git author | Writer App's bot name and noreply email |
| Git committer | Dedicated signer name and email |
| Signature | Dedicated GPG signing subkey |
| Agent review | Reviewer App |
| Human review | My normal GitHub account |

The bot email includes its numeric **user ID**, which is different from the App ID. The template resolves that user ID from GitHub instead of constructing an address from the wrong number.

For signing, I register the public certificate with my GitHub account and verify the committer email. [GitHub checks that email against both the key and the account](https://docs.github.com/en/authentication/troubleshooting-commit-signature-verification/using-a-verified-email-address-in-your-gpg-key). The App remains the author, while GitHub can associate the signing committer with my account.

That association is not a human review. Software on the host can use the signing subkey; my approval is the separate review event on the PR.

The launcher pins the exact signing subkey, including the trailing `!` that prevents GPG from choosing another one:

```ini
[gpg]
    format = openpgp
    program = /usr/bin/gpg
[user]
    signingKey = SIGNING_SUBKEY_FINGERPRINT!
[commit]
    gpgSign = true
[tag]
    gpgSign = true
```

The signed profile also selects a dedicated `GNUPGHOME` and committer name/email. A missing configured key makes the commit fail. The template's unsigned reviewer profile explicitly disables signing, so it doesn't accidentally borrow a key from the host's global Git configuration.

## Make the key available after a restart

A passphrase-protected subkey works during an attended session, but the next unattended commit can block when the GPG agent loses its cache. Putting the passphrase into every agent process would spread another credential around the system.

So I gave that job to a separate service. It reads the passphrase from an encrypted systemd credential and passes it over stdin to [`gpg-preset-passphrase`](https://www.gnupg.org/documentation/manuals/gnupg/gpg_002dpreset_002dpassphrase.html). The application receives the GPG home and signing configuration, not the passphrase.

The helper addresses the signing subkey by its **keygrip**, checks whether its passphrase is cached, and restores the cache when necessary. It refreshes hourly and checks every two seconds. The GPG configuration must permit presets, and the service needs access to the right home and socket directory.

That last part is host-specific. So are binary paths, systemd credential support, Unix ownership, and recovery after a reboot. The [template's signing guide](https://github.com/krasnoperov/github-agent-identities/blob/main/docs/signing.md) makes those choices explicit. The keys still need backups, revocation procedures, and renewal before the subkeys expire.

My services intentionally share a Unix user. Separate credential directories keep ordinary operations attributed correctly; they don't stop a process with that user's access from reading another role's token or requesting a signature. Stronger isolation would need a different process and user boundary.

## Check the original outcome

I checked the setup against a disposable PR: the coding App owned the PR, its commit was attributed to the bot, GitHub reported the signature as valid, and an `APPROVED` review from my human account existed on that exact commit. Independent automated review is the separate App's job in the normal review-quill flow.

The [acceptance checks](https://github.com/krasnoperov/github-agent-identities/blob/main/docs/verification.md) reproduce the full sequence with generic writer and reviewer profiles. They check the PR creator, both review actors, the exact commit SHA and its signature, token rotation in the same long-lived session, and signing failures.

But permission to submit an approval isn't the whole merge policy. Repository rules determine which reviews count, when a new push dismisses them, and what other checks must pass. Requiring two approvals doesn't necessarily encode “one human and one agent.” If that distinction is mandatory, the integration gate has to check the actors as well as the count.

## One box, configured

The objective is met. I can distinguish the software that wrote the change, the software that reviewed it, and my own decision to approve it. The same setup works for autonomous runs and sessions where I'm steering the agent myself.

But getting there meant assembling an identity and credential system around a single development box. The template makes that work reproducible; it doesn't make App registrations, token rotation, key management, and restart behavior disappear.

My suspicion is that this is a useful place to reconsider the surrounding tools. I want to explore source-control and review systems that treat agents as participants from the start: separate identities, durable review loops, and a view where I can see what each agent changed, why it changed it, and where my judgment is needed. Whether those systems can replace this setup without losing its accountability is the question for the next post.
