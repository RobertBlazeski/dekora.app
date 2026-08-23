# Deploying Dekora

Docker Compose stack: Postgres + the API + both Angular apps, behind Caddy for automatic
HTTPS. This has been reviewed carefully but **not execution-tested** (no Docker available in
the environment it was written in) — treat the first deploy as a test run, not a sure thing.

## Before you start

- A Hetzner server (see sizing note in chat — CX23 is a reasonable starting point).
- Two DNS records already pointed at the server's IP: your main domain (e.g. `dekora.mk`) and
  an admin subdomain (e.g. `admin.dekora.mk`). Caddy needs both resolving correctly *before*
  it starts, or it can't provision Let's Encrypt certificates.
- An SSH key pair, added when you create the server (Hetzner prompts for this at creation).

## 1. Create the server

In the Hetzner Cloud console: create a server, CX23, Ubuntu 24.04, add your SSH public key.
Note the IP address once it's up.

## 2. Point DNS

At your domain registrar / DNS provider, add two A records pointing at the server's IP:
- `dekora.mk` → server IP
- `admin.dekora.mk` → server IP

DNS propagation can take a few minutes to a few hours — confirm with `ping dekora.mk` from
your own machine before continuing.

## 3. Install Docker on the server

SSH in (`ssh root@<server-ip>`), then:

```bash
curl -fsSL https://get.docker.com | sh
```

## 4. Basic server hardening (do this before opening it to the world)

```bash
# Firewall: only SSH, HTTP, HTTPS
ufw allow OpenSSH
ufw allow 80
ufw allow 443
ufw enable

# Create a non-root user for day-to-day use instead of operating as root
adduser deploy
usermod -aG docker,sudo deploy
```

Also worth doing in the Hetzner console: enable their Cloud Firewall as a second layer, and
disable password-based SSH login (key-only) in `/etc/ssh/sshd_config`
(`PasswordAuthentication no`, then `systemctl restart sshd`).

## 5. Get the code onto the server

```bash
git clone <your-repo-url> /opt/dekora
cd /opt/dekora
```

(This assumes the project is pushed to a git remote — it isn't yet, since this repo was never
initialized. Set that up first if you haven't.)

## 6. Configure secrets

```bash
cp .env.example .env
nano .env
```

Fill in:
- `POSTGRES_PASSWORD` — a strong random password, **not** the `5939` used in local dev.
- `JWT_KEY` — generate with `openssl rand -base64 48`.
- `CUSTOMER_DOMAIN` / `ADMIN_DOMAIN` — the two domains from step 2.
- `EMAIL_ENABLED` / `SMTP_*` (optional but recommended) — without these, password-reset emails
  and new-order notification emails are only written to the API's logs, never actually sent.
  Any SMTP provider works — a transactional email service (SendGrid, Mailgun, Amazon SES's SMTP
  endpoint) is more reliable than a personal mailbox for this. Set `EMAIL_ENABLED=true` once
  filled in.
- `TELEGRAM_BOT_TOKEN` (optional) — lets the owner get an instant Telegram message for every
  new order. Free, no business verification: message [@BotFather](https://t.me/BotFather) on
  Telegram, run `/newbot`, and use the token it gives you. The *destination* chat is then set
  from the admin dashboard's Notifications page, not here — see step 10.

## 7. Build and start

```bash
docker compose up -d --build
```

First run will take a few minutes (builds the .NET API, the Angular SSR app, and the Angular
admin app from source). Watch for errors:

```bash
docker compose logs -f
```

The API applies EF migrations and seeds default data automatically on startup — no manual
migration step needed.

## 8. Verify

- `https://dekora.mk` should load the storefront (Caddy auto-provisions the certificate on
  first request — the very first load may take a few extra seconds).
- `https://admin.dekora.mk` should load the admin shell.
- `https://dekora.mk/api/products` should return `[]` (empty catalog, but a valid response).

## 9. Create the first admin account

There's no public "become admin" endpoint by design. Register a normal account through the
API, then promote it directly in the database — this direct-DB step is only needed once, to
bootstrap the very first admin:

```bash
docker compose exec postgres psql -U dekora -d dekora -c "
INSERT INTO \"AspNetUserRoles\" (\"UserId\", \"RoleId\")
SELECT u.\"Id\", r.\"Id\" FROM \"AspNetUsers\" u, \"AspNetRoles\" r
WHERE u.\"Email\" = 'your-email@example.com' AND r.\"Name\" = 'Admin';
"
```

Once that first admin can sign in, add anyone else (a second staff member, a family member
helping run the shop) from the admin dashboard's **Notifications** page → **Team access**
section — no more direct database access needed after this one-time bootstrap.

## 10. Turn on order notifications

In the admin dashboard's Notifications page, toggle on whichever channels you configured:
- **Email** — enter the address that should receive new-order emails.
- **Telegram** — message your bot once (search for it by the username you gave @BotFather),
  then open `https://api.telegram.org/bot<your-token>/getUpdates` in a browser and copy the
  numeric `chat.id` from the JSON response into the field — Telegram's API needs that ID, not
  the @handle.
- **WhatsApp** — the toggle and number are there for later, but nothing sends yet: the WhatsApp
  Business API requires a Meta/Twilio account with phone-number verification, which is a signup
  process only the business owner can complete. Wiring in a real provider once that account
  exists is a small, contained change (see `CompositeNotificationSender`).

## Updating after a code change

```bash
cd /opt/dekora
git pull
docker compose up -d --build
```

## Backups

Postgres data lives in the `postgres-data` Docker volume. At minimum, cron a nightly dump:

```bash
docker compose exec -T postgres pg_dump -U dekora dekora > /root/backups/dekora-$(date +%F).sql
```

Hetzner's snapshot feature (paid, per-snapshot) is a good second layer for whole-server
recovery, but isn't a substitute for application-level backups.
