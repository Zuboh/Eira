# Auth Architecture Research (Eira)

Research note, not a spec. Answers six concrete questions about the current
auth design in light of best practice, for an **internal, small-scale
clinical tool** (one hospital ward, tens of users, not internet-facing to
the public). Current implementation is documented in `docs/SECURITY.md`
(§1) — read that first; this file doesn't repeat it, only reasons about it.

Risk framing used throughout: Eira's threat model is *not* "random
internet attacker brute-forcing accounts from outside" (it likely sits
behind hospital network/VPN, low exposure) — it's mostly **insider risk**:
a nurse or ex-employee with legitimate former access, a shared/unlocked
workstation on the ward, or a leaked temp password on a sticky note. Recommendations
are calibrated to that, not to a public SaaS threat model. Over-engineering
for a threat that doesn't apply here (e.g. Vault-grade secret rotation,
enterprise SSO) is itself a cost — this note tries not to recommend that.

---

## Prioritized recommendations

Ranked by (risk reduced) / (effort to implement). "Effort" assumes solo
dev, FastAPI + SQLite stack already in place.

| # | Recommendation | Risk addressed | Effort | Priority |
|---|---|---|---|---|
| 1 | Fail-fast JWT secret validation at startup (no hardcoded fallback outside dev) | Prod deploy silently signs tokens with a public, known secret → full auth bypass | Low (~20 min) | **Do now** |
| 2 | Add expiry to `PasswordResetRequirement` (e.g. 24-72h) | Indefinitely-valid temp password is a standing credential if leaked/overheard | Low-Medium (1 migration + 1 check) | **Do now** |
| 3 | Basic rate limiting on `/auth/token`, `/register`, `/change-temporary-password` via `slowapi` | Brute force / credential stuffing against numeric IDs (small keyspace) | Low-Medium (~1-2h incl. testing) | **Do soon** |
| 4 | Generic response on `/register` regardless of duplicate email | Email enumeration (409 leak) | Low (~30 min) | **Do soon** |
| 5 | Keep numeric-ID login, but document it as a deliberate choice; optionally add a short-lived per-account lockout counter alongside rate limiting | See §1 — not itself a vulnerability given the isolation invariant already enforced | N/A (decision, not code) | Informational |
| 6 | MFA | Low marginal benefit at current scale/threat model | High relative to benefit | **Not now** — revisit if scope grows (multi-ward, remote access, admin/caposala accounts) |

The two "do now" items are cheap and close a real gap (secret fallback is
a live footgun; unlimited-lifetime temp passwords are a real if narrow
exposure). Rate limiting and enumeration are legitimate but lower urgency
given the small, largely-trusted user population and lack of public
exposure. MFA is explicitly *not* recommended yet — see §5.

---

## 1. Login by numeric ID instead of email/username — anti-pattern or defensible?

**Verdict: defensible as-is, but only because of a specific mitigating
fact — the JWT/session model never trusts the ID as a secret, only as an
identifier.** It is not the architecture I'd start from on a green-field
design, but it is not worth an urgent rewrite either.

Reasoning:

- Security literature (OWASP Authentication Cheat Sheet, and the general
  identity-management principle "separate identity from credential")
  converges on: **the login identifier does not need to be secret or
  hard to guess** — only the credential (password) does. A username,
  email, or employee ID are all in the same trust class: public-ish,
  enumerable, not a security boundary by themselves. What actually
  protects the account is the password + rate limiting/lockout on top of
  it. So "the ID is guessable (sequential integers)" is not on its own a
  vulnerability — email addresses are also frequently guessable
  (`firstname.lastname@hospital.it` patterns), and usernames are
  routinely enumerable too.
- The real risks specific to *this* choice are usability and future
  flexibility, not security:
  - **Enumeration is trivially cheap** (ids `1..N` for N in the tens) —
    but this is fine specifically because login already returns a
    generic error for both "no such id" and "wrong password" per
    `docs/SECURITY.md` — so enumeration via `/auth/token` gains an
    attacker nothing beyond what they'd get from guessing usernames
    anyway. This is the mitigating fact referenced above.
  - **UX cost**: nurses must remember or look up a numeric ID rather than
    typing their own email — worse UX than email/username login, though
    tolerable for a small trusted staff population with printed
    ID/onboarding sheets.
  - **Coupling to a DB primary key as a login credential** is the more
    interesting long-term architecture smell: if you ever need to
    merge/reassign/reset accounts, migrate to a different identity
    provider (e.g. hospital SSO/Active Directory in the future), or
    support multi-tenancy across ward instances, having the PK be the
    login field is friction. The industry-standard pattern here (see
    identity/SSO guidance) is: **keep an immutable internal ID as DB PK,
    but let a separate, user-facing, mutable field (email, or a
    human-readable username) be the login identifier** — decoupling
    "who this account is" from "how they authenticate."
- Comparing options directly for this app's scale (dozens of users per
  ward):
  - **Numeric ID (current)**: simplest to implement, zero uniqueness
    logic needed beyond PK, but worst UX and couples login to PK.
  - **Email-based login**: `email` column already exists and is unused
    for lookup — using it would improve UX (nurses already know their
    email) and decouple login from PK, at the cost of needing a unique
    index + duplicate-check on registration (which already exists, since
    `/register` already checks for duplicate email for the 409).
  - **Human-readable username**: better UX than numeric ID, no email
    dependency, but adds a new field + uniqueness constraint for no
    added security over the ID approach.

**Recommendation**: not a fire-drill fix. If/when doing other auth work
anyway (e.g. implementing rate limiting, which needs a rate-limit *key*
per login attempt), switch the login field to `email` — it's already a
unique, validated column, needs no new migration, and removes the "type a
random integer to log in" UX oddity for free. If left as-is, no security
regression follows from the numeric ID itself, given the generic-error
behavior already in place — just note this as a conscious tradeoff in
`SECURITY.md` rather than an oversight.

Sources: [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html) (generic-error-message guidance, applies symmetrically to any identifier choice); enterprise identifier trade-off analysis synthesized from LoginRadius identity-vs-credential guidance and Microsoft Entra ID's UPN/email login constraints (illustrates why large IdPs settled on email/UPN over raw employee ID — retrofitting is the actual cost, not raw guessability).

---

## 2. Rate limiting for FastAPI

### Library choice: `slowapi`

[`slowapi`](https://github.com/laurentS/slowapi) (`pip install slowapi`) is
the standard pick for FastAPI/Starlette — a thin wrapper around the
`limits` library, ported from `flask-limiter`. Despite being labeled
early-stage in its own README, it's reported in production use handling
millions of requests/month, and is the most-referenced option in current
FastAPI rate-limiting guides. Alternative: `fastapi-limiter`, which is
Redis-only (no in-memory backend) — better fit if you already run Redis,
otherwise `slowapi`'s in-memory backend is the simpler starting point for
a single-process SQLite-backed app like Eira (no Redis dependency to
stand up).

### Wiring (concrete pattern)

```python
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

limiter = Limiter(key_func=get_remote_address)  # per-IP by default
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

@router.post("/token")
@limiter.limit("5/minute")
async def login(request: Request, form_data: OAuth2PasswordRequestForm = Depends(), ...):
    ...
```

Notes on the mechanics:
- `request: Request` must be an explicit parameter on the decorated
  endpoint — `slowapi` hooks into it via the decorator, it won't work
  without it in the signature.
- In-memory storage is fine for Eira's single-process deployment; only
  move to the Redis backend if the app is ever run with multiple worker
  processes (in-memory counters don't share across processes).
- Per-*account* limiting (as opposed to per-IP) needs a custom
  `key_func` that reads the submitted username/id from the request body
  — `slowapi` supports this but it requires reading the form body inside
  the key function, which is slightly awkward with FastAPI's dependency
  injection; the common workaround is combining a per-IP limiter
  (`get_remote_address`) with a **separate application-level counter**
  keyed by account id/email, incremented on `Utente` or in a small
  `login_attempts` table, rather than trying to force account-keying
  through `slowapi`'s decorator alone.

### Concrete recommended policy for Eira

Given the "insider/ward" threat model (§ intro) rather than internet-scale
credential stuffing, don't over-build. Recommended, in order of how much
protection they add per unit of effort:

1. **Per-IP rate limit on `/auth/token`**: `5/minute` via `slowapi` decorator — stops
   any single script from hammering the endpoint, costs nothing in UX for
   legitimate users (a nurse mistyping a password 5 times/minute is
   already unusual).
2. **Per-IP rate limit on `/register`**: `3/minute` — same mechanism,
   protects against automated account-creation spam given it's
   unauthenticated.
3. **Per-IP rate limit on `/change-temporary-password`**: `5/minute` —
   same reasoning as `/auth/token`, since it's also a password-guessing
   surface (guessing the temp password).
4. **Capped exponential backoff per account**, layered on top of the
   per-IP limit, per OWASP Authentication Cheat Sheet: track failed
   attempts per user id in memory or a small table; delay is `min(2^n, cap)`
   seconds after each consecutive failure (e.g. 1s, 2s, 4s, 8s… capped at
   ~30s), reset on success. This is more effective than IP limiting alone
   because it survives IP rotation and doesn't require Redis. **Never**
   turn this into a hard/permanent lockout — OWASP explicitly warns hard
   lockouts on existing-account-only create an enumeration channel (locked
   accounts leak "this account exists") and let an attacker DoS a
   coworker by deliberately locking their account. Keep the response
   identical (still the generic "Email o password non validi") whether
   the account is delayed or the password was simply wrong — never return
   a distinct "account locked" status.
5. Do **not** bother with CAPTCHA or WAF-level IP throttling — those are
   defenses against internet-scale/public-facing attacks and are
   disproportionate here.

Sources: [slowapi README](https://github.com/laurentS/slowapi); [fastapi-limiter](https://github.com/long2ice/fastapi-limiter); [OWASP: Blocking Brute Force Attacks](https://owasp.org/www-community/controls/Blocking_Brute_Force_Attacks); [OWASP Authentication Cheat Sheet — lockout guidance](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html).

---

## 3. JWT secret management — fail-fast without over-engineering

**Problem today**: `core/config.py` has `jwt_secret_key` default to
`"dev-secret-change-in-production"` if the env var is unset. If that env
var is simply forgotten on deploy, the app starts up fine, signs valid
tokens, and every token is forgeable by anyone who reads this
publicly-known default (it's in the repo). This is exactly the failure
mode documented in real-world incident writeups: a fallback constant
becomes an admin-forgeable master key the moment someone forgets to set
one env var.

**Fix, scaled correctly for a small self-hosted app** — don't reach for
Vault/AWS Secrets Manager, that's solving a problem Eira doesn't have
(no multi-service secret sharing, no rotation requirement at this scale).
Instead:

1. Keep using environment variables (`.env` locally, gitignored;
   platform/host env vars in production) — this is the standard
   recommendation for small-to-medium projects, reserving a dedicated
   secrets manager for when you need rotation/audit trails across
   multiple services.
2. Distinguish "dev" vs "prod" via an explicit `environment` /
   `app_env` setting (Eira likely already has some notion of this via
   `.env` files, check `core/config.py`).
3. In the Pydantic `Settings` model (or a `model_validator` /
   `__init__` check right after settings load), **fail fast at import/startup**
   if running in a non-dev environment and `jwt_secret_key` is unset or
   still equals the known dev default:

```python
from pydantic import model_validator

class Settings(BaseSettings):
    environment: str = "development"
    jwt_secret_key: str = "dev-secret-change-in-production"  # dev-only default

    @model_validator(mode="after")
    def _check_jwt_secret(self):
        if self.environment != "development" and (
            not self.jwt_secret_key
            or self.jwt_secret_key == "dev-secret-change-in-production"
        ):
            raise RuntimeError(
                "JWT_SECRET_KEY must be set to a strong, non-default value "
                "outside development."
            )
        return self
```

   This raises at process startup (import time / app construction), so a
   misconfigured deploy crashes immediately and loudly instead of running
   with a forgeable secret — the same "validate at startup, throw instead
   of falling back" pattern documented as best practice across the
   researched sources, just expressed in Pydantic's validator hook rather
   than a manual `if` in `main.py`.
4. Generate the real production secret with a CSPRNG, e.g.
   `python -c "import secrets; print(secrets.token_urlsafe(64))"`, and
   document that generation step in `SETUP.md`/deployment notes so
   whoever redeploys doesn't reintroduce the placeholder.
5. Optional, low-cost extra layer: a one-line check in the deploy
   script/CI (if one exists) that greps the target env for
   `JWT_SECRET_KEY` presence before shipping — cheap backstop, not
   required to get the core fix's benefit.

This is the entire fix. No secrets manager, no rotation policy, no KMS —
those are the right call only once there's more than one service sharing
a secret or a compliance requirement forcing rotation, neither of which
applies to Eira today.

Sources: incident pattern and fix synthesized from ["Node.js Secret Management in Production" (DEV Community)](https://dev.to/axiom_agent/nodejs-secret-management-in-production-vault-aws-secrets-manager-and-zero-leakage-patterns-21a6) and ["Where to Store JWT Secret Keys Safely"](https://jwtsecretkeygenerator.com/blog/where-to-store-jwt-secret-keys); Pydantic `model_validator` mechanism per Pydantic v2 docs (standard `BaseSettings` validation hook).

---

## 4. Temporary password / admin-reset flow hardening

**Current gap, per the task description**: `PasswordResetRequirement` has
no expiry — a caposala-generated 12-char temp password is valid
indefinitely until the nurse uses it. This is a real, if narrow, exposure:
a temp password written on a sticky note or read aloud/over the phone
(plausible in a ward setting) stays a valid credential for as long as
nobody uses it — days, weeks, longer if the nurse is on leave.

**Standard practice for admin-initiated resets** (synthesizing current
NIST SP 800-63B-4 guidance and general practitioner consensus):
- NIST's current position is against *forced periodic* password
  expiration for normal use (rotating passwords on a schedule encourages
  weak, predictable, incrementally-modified passwords) — but this
  guidance is about **long-lived user-chosen passwords**, not
  **admin-generated temporary credentials**, which are a different
  category. For temp/reset passwords specifically, the near-universal
  practice (reflected in every major IdP: Okta, Azure AD, Google
  Workspace admin resets) is a **short, event-based expiry**: the temp
  credential is valid only for a bounded window (commonly 24-72 hours),
  after which it's invalidated and the caposala must issue a new one.
- This is not in tension with NIST's anti-rotation stance — that
  guidance targets discouraging forced rotation of a user's own
  long-term password, not admin-issued one-time bootstrap credentials,
  which are expected to be short-lived by design in every reset flow NIST
  itself describes elsewhere in SP 800-63B (memorized secret verifiers
  issuing time-limited temporary secrets).

**Recommended concrete fix**:
- Add an `expires_at` timestamp to `PasswordResetRequirement`, set to
  `now + 48h` (reasonable default for a ward — long enough to survive a
  shift/day off, short enough to bound exposure) when the caposala
  generates the temp password.
- `POST /auth/change-temporary-password` checks `expires_at > now` before
  accepting; if expired, reject with the same generic-style error and
  direct the nurse to ask her caposala to regenerate.
- No change needed to the *generation* endpoint's behavior beyond adding
  the timestamp — the caposala-facing UX stays the same (single
  admin action), only the validity window changes.
- This is a small, additive migration — one nullable/defaulted column
  plus one comparison in the existing `change-temporary-password` check.

Sources: [NIST SP 800-63B Revision 4 summary](https://specopssoft.com/blog/nist-password-reset-guidelines/) (current anti-forced-rotation stance, scoped to user-chosen long-term secrets); general admin-reset expiry practice is standard across major IdPs, not from a single cited doc — treat as consensus practitioner guidance rather than a single authoritative source.

---

## 5. MFA / additional hardening for clinical data in Italy — brief note

**Recommendation: not warranted yet at Eira's current scale — password + JWT is
adequate for this specific risk profile, revisit if scope grows.**

Reasoning, kept brief per the brief:
- Searched for an explicit Italian Garante Privacy mandate for MFA on
  staff-facing internal healthcare tools specifically — **found none**.
  Garante enforcement actions in this space (e.g. the Alto Adige
  ASL case) focus on **role-based access control, audit trails, and
  anomaly detection for unauthorized *authorized-user* access** (a
  nurse viewing records she has no clinical reason to view) — not on
  authentication factor count. Eira's existing reparto-isolation
  invariant (§2.2 of `SECURITY.md`) is actually the more relevant
  control for this specific enforcement pattern, more so than MFA would
  be.
- MFA's marginal benefit here is low relative to its cost: it primarily
  defends against credential theft/phishing from *outside* the trust
  boundary, but Eira's realistic threat is an insider with a valid
  session or a shared ward workstation, which MFA doesn't meaningfully
  address (a shared, logged-in device with cached 8h JWT session is
  unaffected by how the login itself was gated). This is the same
  distinction as GDPR Art. 32 (security "appropriate to the risk") —
  proportionality cuts against MFA for a small internal tool where audit
  logging and access scoping do more of the actual work.
- If scope changes — remote access from outside the hospital network,
  multiple wards/hospitals on one instance, or admin/caposala accounts
  gaining broader cross-department privileges — MFA (even simple TOTP)
  becomes worth reconsidering, particularly for caposala accounts given
  their elevated privilege.
- What's actually worth prioritizing over MFA for the "clinical data,
  Italy" angle: an **audit log of record access** (who viewed which
  patient record, when) — this is what the Garante enforcement pattern
  actually targets, and Eira doesn't appear to have one yet based on the
  provided context. That's a separate, larger piece of work outside this
  auth-specific research scope, but worth flagging as the actually
  relevant compliance-adjacent gap.

Sources: [Garante Privacy — dati sanitari overview (Agenda Digitale)](https://www.agendadigitale.eu/sicurezza/privacy/protezione-dei-dati-in-sanita-tutti-i-paletti-del-garante-privacy/); [GDPRhub — Garante decision 10001279 (Alto Adige unauthorized EHR access)](https://gdprhub.eu/index.php?title=Garante_per_la_protezione_dei_dati_personali_(Italy)_-_10001279); this section is a directional recommendation, not legal advice — worth a real compliance review before treating as final if Eira scales beyond a single ward pilot.

---

## 6. Register endpoint email enumeration (409 leak)

**Worth fixing — it's cheap and the current fix pattern is simple, even
though the actual risk at Eira's scale is low** (small closed user
population, `/register` presumably only used during onboarding, not a
public signup flow attackers would target for enumeration/spam). Fix it
because it's low effort, not because it's urgent.

**Standard OWASP fix**: registration's generic-response problem is
slightly different from login's, because you can't silently deny the
create (you must NOT create a duplicate account) but you also can't leak
"this email already exists" via the response. OWASP's Authentication
Cheat Sheet guidance is to extend the same generic-response principle
used for login to registration.

Concrete pattern:
- Always return the same success-shaped response (e.g. `201` with a
  generic "Registrazione ricevuta, in attesa di attivazione" message) for
  both new and duplicate emails.
- On the backend, if the email already exists, **don't create a second
  row** — just return the same response shape without persisting
  anything new, or optionally trigger a side-channel notification (e.g.
  log it for the caposala to notice, since Eira presumably has an
  activation step already per the `stato=in_attesa` flow) rather than
  exposing the duplicate via the HTTP response.
- Match status code, body shape, and response time between the two paths
  — if the duplicate-check query is fast and the create-path is slower,
  a timing side-channel can leak the same information the status code
  used to; for Eira's scale this is a minor concern but doing equivalent
  work (e.g. still running the password hash) on the duplicate path
  costs nothing and closes it for free.
- This does mean the caposala/admin activation step becomes the place
  where a genuine duplicate registration attempt would need to be
  surfaced/handled (e.g. two `in_attesa` rows can't both use the same
  email, so the *actual* dedup logic still has to exist somewhere — just
  not observably in the HTTP response to the person submitting the
  form).

Sources: [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html) (explicit extension of generic-error principle to registration); registration-specific nuance (can't literally reuse login's error message, needs a success-shaped generic response instead) per practitioner writeup at Akimbo Core ("Preventing Username Enumeration").

---

## Summary of file references

- Read for context, not modified: `/Users/zubo/Projects/eira/docs/SECURITY.md`
- Relevant existing code (not modified, referenced only):
  `app/core/config.py` (jwt_secret_key default), `app/core/security.py`
  (bcrypt), `app/routers/auth.py` (`/token`, `/register`,
  `/change-temporary-password`), `frontend/src/api/auth.ts` (login
  identifier sent as `String(utenteId)`).
