# Email

This document explains how email is implemented in the backend, how to create a new email, how to configure the transport and how to test it locally. It describes the code in `backend/src/modules/mail/` and the related configuration.

## Overview

Emails are written as MJML, compiled to HTML at send time and delivered with Nodemailer. There is no manual compile step: the template service compiles the MJML every time an email is sent.

```text
SendMailPayload -> MailService.send -> MailTemplateService.render -> mjml2html -> nodemailer (or console log)
```

1. The caller builds a `SendMailPayload` (`to`, `subject`, `text`, `mjml` and optional `values`). The `mjml` field is only the body fragment of the email, not a full document.
2. `MailService.send` adds two reserved values to `values`: `brandName` (from `MAIL_FROM_NAME`) and `logoUrl` (from `MAIL_LOGO_URL`), and calls `MailTemplateService.render`.
3. `render` reads `layout.mjml` and `header.mjml` from disk. If `logoUrl` is empty, it removes the `mj-image` tag from the header. It inserts the header into `{{ header }}` and the caller fragment into `{{ content }}` of the layout.
4. Then every remaining `{{ name }}` placeholder is replaced with the matching value, HTML-escaped. If a value is missing, render fails with `Missing mail template variable: name`.
5. The result is compiled with `mjml2html` using `validationLevel: 'strict'` and `ignoreIncludes: true`, so invalid MJML fails with an error instead of producing a broken email, and `mj-include` is not processed.
6. If `MAIL_TRANSPORT=console`, no email is sent: the service only logs the recipient, subject and plain text. The MJML is still rendered first, so template errors also show up in console mode. If `MAIL_TRANSPORT=smtp`, Nodemailer sends the plain text and the HTML, and the call fails if the SMTP server does not accept the recipient.

## File map

| Path | Purpose |
| --- | --- |
| `backend/src/modules/mail/mail.module.ts` | Nest module. Exports `MailService`. |
| `backend/src/modules/mail/services/mail.service.ts` | Builds the Nodemailer transport and sends or logs the email. |
| `backend/src/modules/mail/services/mail-template.service.ts` | Merges layout, header and content, injects values and compiles MJML to HTML. |
| `backend/src/modules/mail/mjml/layout.mjml` | Shared layout: fonts, default styles, body and footer. |
| `backend/src/modules/mail/mjml/header.mjml` | Shared header with logo and brand name. |
| `backend/src/modules/mail/types/send-mail-payload.types.ts` | `SendMailPayload` contract. |
| `backend/src/config/mail.config.ts` | Zod schema for the mail environment variables. |
| `backend/scripts/copy-mail-templates.ts` | Copies the `.mjml` files into `dist` during the build. |
| `backend/src/modules/mail/tests/mail.spec.ts` | Unit tests for the mail services. |

## Creating a new email

Write only a body fragment, build the payload and call `MailService.send`.

```ts
await this.mailService.send({
  to,
  subject: 'Activation code',
  text: `Your activation code is ${code}`,
  mjml: `
    <mj-section>
      <mj-column>
        <mj-text>Your activation code: {{ code }}</mj-text>
      </mj-column>
    </mj-section>
  `,
  values: { code },
});
```

Rules:

- Do not include `<mjml>`, `<mj-head>` or `<mj-body>`. The layout already provides them, and the fragment is placed inside an `mj-wrapper`, so use `mj-section` and `mj-column` as the outer elements.
- Placeholders use the form `{{ name }}` with letters, digits or underscore. Every placeholder needs an entry in `values`, except `brandName` and `logoUrl`, which are always provided.
- Placeholders inside the fragment are replaced too, because the fragment is inserted into the layout before values are injected.
- Values are HTML-escaped. Pass plain text, not HTML. To change markup, change the MJML.
- `text` is the plain-text version of the email. It is not generated from the MJML, so write it yourself.
- Branding, fonts, colors and the footer live in `layout.mjml` and `header.mjml`. Edit them to change all emails at once.

## Can MJML be sent directly?

No, not with the current setup. Nodemailer is called with `text` and `html` only, and the `html` comes from `mjml2html`. MJML is a source format that must be compiled to HTML, and mail clients only render HTML. Sending raw MJML would show markup instead of a designed email. What is already automatic is the compile step: developers only write the MJML fragment and the service compiles it when sending.

## Configuration

Variables are validated at startup by `backend/src/config/mail.config.ts`. `backend/.env.example` has the defaults and `backend/compose.yml` passes them to the container.

| Variable | Default | Notes |
| --- | --- | --- |
| `MAIL_TRANSPORT` | `console` | `console` or `smtp`. |
| `MAIL_FROM_ADDRESS` | `no-reply@umssy.local` | Must be a valid email address. |
| `MAIL_FROM_NAME` | `UMSSY` | Also used as `brandName` in templates. |
| `MAIL_REPLY_TO` | empty | Optional email address. |
| `MAIL_LOGO_URL` | `https://umssy.zer4c.dev/icons/umssy-logo-web.svg` | Must be an `https` URL, or empty to hide the logo. |
| `SMTP_HOST` | `localhost` | |
| `SMTP_PORT` | `1025` | Integer from 1 to 65535. |
| `SMTP_SECURE` | `false` | Accepts only `true` or `false`. |
| `SMTP_REQUIRE_TLS` | `false` | Accepts only `true` or `false`. |
| `SMTP_USER` | empty | Must be set together with `SMTP_PASSWORD`. |
| `SMTP_PASSWORD` | empty | Must be set together with `SMTP_USER`. |

## Local testing

Option 1: console transport. Keep `MAIL_TRANSPORT=console`. Nothing is sent, and the recipient, subject and plain text appear in the backend log. The MJML is still compiled, so use this mode to catch template errors.

Option 2: a local SMTP catcher such as Mailpit or MailHog. It is not part of `compose.yml`, so start it separately. Both listen for SMTP on port 1025 and serve a web inbox on port 8025, which matches the default `SMTP_HOST` and `SMTP_PORT`.

```powershell
docker run -d --name mailpit -p 8025:8025 -p 1025:1025 axllent/mailpit
```

Then set `MAIL_TRANSPORT=smtp` and keep the default `SMTP_*` values. Open `http://localhost:8025` to see the rendered email.

Option 3: Gmail. Use it only with a test account.

Status: the values below follow Google documentation and the project configuration. They have not been verified with a real send yet.

1. Turn on 2-Step Verification for the Google account. App passwords only work on accounts that have it.
2. Create an app password. Google states that app passwords are not recommended when the app supports "Sign in with Google", and that they are revoked when the account password changes.
3. Configure the backend:

```text
MAIL_TRANSPORT=smtp
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_REQUIRE_TLS=true
SMTP_USER=<full Gmail address>
SMTP_PASSWORD=<app password>
MAIL_FROM_ADDRESS=<same Gmail address>
```

Google lists port 587 for TLS and port 465 for SSL on `smtp.gmail.com`. For port 465, use `SMTP_PORT=465` and `SMTP_SECURE=true`.

Keep the app password only in your local `.env` file and never commit it.

Official Google references:

- App passwords: https://support.google.com/accounts/answer/185833
- Gmail SMTP server and ports (Google Workspace): https://knowledge.workspace.google.com/admin/gmail/send-email-from-a-printer-scanner-or-app
- App password page (not from Google documentation, open it and confirm it works): https://myaccount.google.com/apppasswords

## Production

Production uses Brevo over SMTP: `MAIL_TRANSPORT=smtp`, a verified sender and an SMTP key (not an API key). For port 587, use `SMTP_SECURE=false` and `SMTP_REQUIRE_TLS=true`. The unit tests use `smtp-relay.brevo.com` on port 587 as the example. Credentials are stored as Kubernetes Secrets, not in the repository.

## Build

The `build` script runs `tsc -p tsconfig.build.json && node scripts/copy-mail-templates.ts`. The templates are read from disk at runtime, so the script copies `src/modules/mail/mjml/` to `dist/modules/mail/mjml/`. `nest-cli.json` also lists `modules/mail/mjml/**/*.mjml` as assets. A new `.mjml` file under that folder is copied to `dist` automatically, but `MailTemplateService` only loads `layout.mjml` and `header.mjml`, so using another file requires a code change.

## Current usage

At the time of writing, no module outside `modules/mail` uses `MailService`. The `access-requests` module has its own `MailSender` interface and a `ConsoleMailSender` that only writes simulated emails to the log, so changing the `SMTP_*` variables does not affect it yet.