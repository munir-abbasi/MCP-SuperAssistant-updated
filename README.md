# Publish to Facebook — OJS 3.5 Plugin

**Version:** 1.0.4.0  
**Author:** Munir Abbasi  
**Website:** [syntaxhouse.com](https://syntaxhouse.com)  
**GitHub:** [munir-abbasi](https://github.com/munir-abbasi/)  
**License:** GNU General Public License v3  
**OJS Compatibility:** Source-checked against OJS 3.5.0.5; runtime validation still required

---

## Overview

Publish to Facebook is a [PKP](https://pkp.sfu.ca) [Open Journal Systems](https://pkp.sfu.ca/ojs/) (OJS) generic plugin that enables journal managers and site administrators to publish article links to a configured Facebook Page.

The plugin supports **automatic article posting** with database-backed reservation for duplicate mitigation and error logging. Manual article posting via API is also available for programmatic use. Issue auto-posting is inactive in this release because the verified OJS 3.5.0.5 issue hook fires before final issue persistence.

---

## Features

| Feature | Description |
|---|---|
| **Auto-posting (articles)** | Automatically post when an article is published (toggle in settings) |
| **Auto-posting (issues)** | Inactive in this release pending a verified post-persistence OJS hook or outbox design |
| **Duplicate mitigation** | Reserves a post-log row before external posting to reduce duplicate posts under concurrency |
| **Outcome logging** | Logs post attempts with `pending`, `success`, `error`, or `uncertain` status and timestamps |
| **API endpoint** | POST endpoint for programmatic manual posting |
| **History API** | GET endpoint for checking the latest post status; it does not retry or mutate state |
| **Settings UI** | Vue-based settings panel integrated via OJS 3.5 modal |
| **Custom message format** | Configurable message templates with placeholders |
| **Safe URL building** | Uses OJS dispatcher for canonical article URLs |

---

## Requirements

- OJS 3.5.0.5 target source; broader OJS 3.5.x runtime compatibility is not yet proven
- PHP 8.3 or later
- A Facebook Page access token for the target Page, requested by someone who can perform the Page `CREATE_CONTENT` task
- Meta Page feed publishing docs list `pages_manage_posts`, `pages_read_engagement`, and `pages_show_list` for Page access/token workflows; verify these permissions and app review status for your Page/app before production use
- Server with `allow_url_fopen` or `curl` enabled

---

## Installation

1. **Download** the plugin into `plugins/generic/publishToFacebook/` of your OJS installation.

2. **Enable** the plugin in OJS:
   - Go to **Website Settings → Plugins → Generic Plugin List**
   - Find **Publish to Facebook** and click **Enable**

3. **Run the migration** (verify on a disposable OJS instance before production):
   - Go to **Administration → System Info → Expire User Sessions & Upgrade**
   - This should trigger the plugin migration that creates or upgrades the `publish_to_facebook_post_logs` table

4. **Configure** the plugin (see below).

---

## Configuration

Go to **Website Settings → Plugins → Publish to Facebook → Settings** (gear icon).

| Setting | Description |
|---|---|
| **Facebook Page ID** | The numeric ID of your Facebook Page |
| **Facebook Page Access Token** | A long-lived Page Access Token for the configured Page; Meta Page feed publishing docs require a token requested by someone with the Page `CREATE_CONTENT` task and list `pages_manage_posts`, `pages_read_engagement`, and `pages_show_list` for Page access/token workflows |
| **Default article message format** | Message template for article posts (see placeholders below) |
| **Auto-publish articles** | When enabled, newly published articles are posted automatically |

### Article Message Format Placeholders

| Placeholder | Description |
|---|---|
| `{$articleTitle}` | The article title |
| `{$articleUrl}` | The canonical article URL (built via OJS dispatcher) |
| `{$journalName}` | The journal/press name |

**Default article format:**
```
New article published: {$articleTitle}
{$articleUrl}

{$journalName}
```

## Usage

### Automatic Article Posting

When enabled in settings, any article that becomes published (status set to `STATUS_PUBLISHED`) is automatically posted to Facebook. Auto-posting:

- Runs from the OJS `Publication::publish` hook after the publication record/status update path in OJS 3.5.0.5 source
- Catches plugin failures so handled Facebook errors should not abort publication
- Uses a database reservation before the Facebook call; successful and in-flight reservations are skipped

### Automatic Issue Posting

Issue auto-posting is inactive in this release. OJS 3.5.0.5 source shows `IssueGridHandler::publishIssue` fires before `Repo::issue()->updateCurrent($contextId, $issue)`, so posting to Facebook from that hook can publish an external link before final issue persistence succeeds. Re-enable only after implementing a verified post-persistence hook or an outbox/reconciliation design.

---

## File Structure

```
plugins/generic/publishToFacebook/
├── index.php                          # Plugin loader
├── PublishToFacebookPlugin.php        # Main plugin class (hooks, registration)
├── PostController.php                 # API controller (post, history)
├── SettingsController.php             # Settings UI controller
├── SettingsForm.php                   # Vue FormComponent settings form
├── version.xml                        # Plugin version metadata
├── phpunit.xml                        # PHPUnit configuration
├── classes/
│   ├── Constants.php                  # Setting key constants
│   ├── FacebookService.php            # Facebook Graph API client
│   ├── PostLog.php                    # PostLog data object
│   ├── PostLogDAO.php                 # PostLog CRUD + dedup queries
│   ├── IssuePostBuilder.php           # Inactive issue message + URL builder
│   ├── PublicationPostBuilder.php     # Article message + URL builder
│   └── migrations/
│       ├── PostLogMigration.php       # Fresh-install database migration
│       └── AddPostLogReservationIndexesMigration.php # Upgrade reservation indexes
├── docs/
│   └── architectural-decisions.md     # Historical design notes (archival)
├── formRequests/
│   └── EditSettingsRequest.php        # Settings form validation
├── locale/
│   └── en_US/
│       └── locale.po                  # English locale strings
├── schema/
│   └── log.json                       # PostLog JSON schema
└── tests/
    ├── bootstrap.php                  # Test bootstrap
    ├── Unit/
    │   ├── ConstantsTest.php          # Constants unit tests
    │   └── PostLogTest.php            # PostLog DataObject unit tests
    └── Integration/
        └── PostLogDAOTest.php         # PostLogDAO integration tests
```

---

## Architecture

### Component Diagram

```
PublishToFacebookPlugin
│
├── register()
│   ├── Hook::add(APIHandler::endpoints::plugin)   [register API controllers]
│   ├── Hook::add(Schema::get::postLog)            [register custom schema]
│   └── addAutoPublishHook()                        [article auto-pub]
│
├── SettingsController  ──> EditSettingsRequest ──> Constants
│
├── PostController (manual article posts; API group: publishToFacebookPost)
│   ├── POST /                         # Submit to Facebook; body includes submissionId
│   ├── GET  /history/{submissionId}   # Get post status
│   │
│   ├── FacebookService                # Graph API call
│   ├── PublicationPostBuilder         # Article message + URL
│   └── PostLogDAO                     # Persistence + reservation/duplicate checks
│
└── Auto hook handlers
    └── addAutoPublishHook()
        ├── PublicationPostBuilder     # Article message + URL
        ├── FacebookService            # Graph API call
        └── PostLogDAO                 # Persistence + reservation/duplicate checks
```

### Data Flow (API-Triggered Manual Post)

```
[POST /{contextPath}/api/{version}/publishToFacebookPost]
       │
       ▼
PostController::submit()
       │
       ├── Read submissionId from request body
       ├── PublicationPostBuilder::buildMessage()
       ├── PostLogDAO::hasExistingPost()  ──► 409 if already successful
       ├── PostLogDAO::reserveArticlePost() ──► 409 if reservation exists
       ├── FacebookService::postLink()
       │       └── Graph API POST /{pageId}/feed
       ├── PostLogDAO::markReservationComplete() (success, error, or uncertain)
       └── Returns JSON response
```

### Data Flow (Auto-Post Article)

```
[Publication::publish hook fires]
       │
       ▼
PublishToFacebookPlugin::addAutoPublishHook()
       │
       ├── Check autoPublishArticles setting
       ├── PostLogDAO::hasExistingPost()  ──► skip if already successful
       ├── PublicationPostBuilder::buildMessage()
       ├── PostLogDAO::reserveArticlePost() ──► skip if reservation exists
       ├── FacebookService::postLink()
       ├── PostLogDAO::markReservationComplete() (success, error, or uncertain)
       └── Catches plugin exceptions so handled Facebook failures do not abort publication
```

## Database

### `publish_to_facebook_post_logs`

| Column | Type | Description |
|---|---|---|
| `post_log_id` | bigint (PK) | Auto-increment primary key |
| `submission_id` | bigint | OJS submission ID |
| `issue_id` | bigint | Reserved for future issue posting; currently `null` for active article posts |
| `context_id` | bigint | Journal/context ID |
| `status` | varchar(20) | `pending`, `success`, `error`, or `uncertain` |
| `facebook_post_id` | varchar(255) | Facebook Graph API post ID (nullable) |
| `message` | text | The message that was posted (nullable) |
| `error_message` | text | Error details on failure (nullable) |
| `link` | varchar(2048) | The posted URL (nullable) |
| `date_posted` | datetime | When the post attempt occurred |

**Indexes:**
- `ptf_article_unique` unique reservation key on `(context_id, submission_id)`
- `ptf_issue_unique` unique reservation key on `(context_id, issue_id)` reserved for future issue posting
- `post_logs_status_idx` on `(status)`

---

## API Endpoints

| Method | Path | Description |
|---|---|---|
| `POST` | `/{contextPath}/api/{version}/publishToFacebookPost` | Post submission to Facebook. Include `submissionId` in the request body. |
| `GET` | `/{contextPath}/api/{version}/publishToFacebookPost/history/{submissionId}` | Get latest post log for submission |

The settings endpoint is registered under the `publishToFacebook` API group. Manual posting/history endpoints are registered under the `publishToFacebookPost` API group. The manual posting/history controller requires a logged-in user in the current context with the OJS manager role, or a site administrator.

> **Note:** In OJS 3.5, the submission details page uses Vue.js, so the legacy manual posting button (via `Templates::Submission::SubmissionDetails::Main` hook) is not available. Manual posting is accessible via the API endpoint. Auto-posting hooks are source-checked against OJS 3.5.0.5 but still require runtime smoke tests before production release.

---

## Local Development

### Setup

1. **Clone** the plugin into your OJS installation:
   ```bash
   cd /path/to/ojs
   git clone https://github.com/munir-abbasi/OJSOnline-publishToFacebook.git \
     plugins/generic/publishToFacebook
   ```

2. **Enable** the plugin in OJS: **Website Settings → Plugins → Generic Plugin List**.

3. **Run migrations**: **Administration → System Info → Expire User Sessions & Upgrade**. Verify the plugin migration/upgrade lifecycle on a disposable OJS instance before production use.

### Syntax Checking

```bash
find plugins/generic/publishToFacebook -name '*.php' -exec php -l {} \;
```

All PHP files must pass `php -l` without errors or warnings.

To verify against the supported PHP baseline when PHP 8.3 is installed:

```bash
php8.3 -v
find plugins/generic/publishToFacebook -name '*.php' -exec php8.3 -l {} \;
php8.3 plugins/generic/publishToFacebook/tests/validatePluginMetadata.php
```

If `php8.3` is not available, PHP 8.3 compatibility remains unverified even if checks pass on a newer local PHP version.

### Running Tests

Tests require OJS to be bootstrapped with a test database. From the OJS root:

```bash
php lib/pkp/vendor/bin/phpunit \
  -c plugins/generic/publishToFacebook/phpunit.xml
```

**Test suites:**

| Suite | File | What it covers |
|---|---|---|
| Unit | `tests/Unit/ConstantsTest.php` | Setting key constants (no OJS deps) |
| Unit | `tests/Unit/PostLogTest.php` | PostLog DataObject getters/setters |
| Integration | `tests/Integration/PostLogDAOTest.php` | PostLogDAO DB queries (requires test DB) |

**Note:** The Constants test is self-contained and can run without OJS bootstrapping if the plugin namespace is autoloaded. The PostLog and DAO tests require OJS framework.

If PHPUnit is not installed in the OJS checkout, these tests cannot be executed from the plugin repository alone. Install/use the OJS development dependencies first, then run the command above from the OJS root so `BASE_SYS_DIR`, the service container, schema service, and test database are available.

### Runtime Smoke Test Checklist

Run these checks in a non-production OJS 3.5 instance before release:

1. Install plugin at `plugins/generic/publishToFacebook`.
2. Enable, disable, and re-enable it from **Website Settings → Plugins**.
3. Open the settings modal, save valid settings, reject invalid settings, and confirm a blank access token preserves an existing token.
4. Verify non-manager users cannot access `publishToFacebook` or `publishToFacebookPost` API routes.
5. Verify state-changing `PUT`/`POST` requests reject missing/invalid CSRF tokens for browser-authenticated requests.
6. Verify journal A cannot read or post journal B submissions/history.
7. Publish a test article with auto-publish enabled and confirm a scoped log row is inserted.
8. Confirm issue publication does not create Facebook posts or post-log rows in this release.
9. Confirm no new fatal/error log entries appear after settings save, manual API post, article publish, issue publish, disable, and re-enable.

### Migration Rollback and Uninstall Safety

Rolling back the plugin migration drops the `publish_to_facebook_post_logs` table and permanently deletes all post history (success logs, Facebook post IDs, error records). The upgrade rollback that removes `issue_id` also removes the issue-post linkage from historical rows. Do not run destructive rollback/uninstall operations on production data without an explicit database backup, operator approval, and a restore plan.

### Code Style

- Namespace: `APP\plugins\generic\publishToFacebook`
- PHP 8.0+ strict types where applicable
- PSR-4 class loading via namespace
- Use `$this->plugin->getSetting()` / `updateSetting()` for context-scoped settings
- Use `__()` locale keys, never hardcoded strings
- Use OJS `dispatcher->url()` for canonical URLs
- Catch and log external API failures without intentionally aborting OJS publication workflows

---

## Development & Contribution

1. Fork the repository.
2. Create a feature branch.
3. Make changes following the source-checked OJS 3.5 plugin conventions and the code style guide above.
4. Run syntax check and tests before committing.
5. Submit a pull request.

---

## Known Limitations

- **Manual posting button**: The "Publish to Facebook" button on the submission detail page does not appear in OJS 3.5 because the submission details page is now rendered by Vue.js. The legacy `Templates::Submission::SubmissionDetails::Main` hook no longer fires. Manual posting is available via `POST /{contextPath}/api/{version}/publishToFacebookPost` with `submissionId` in the request body.
- **Vue component approach**: A Vue component to restore the manual posting button is planned for a future release.
- **Runtime verification**: Static compatibility checks have passed, but production readiness still requires install/enable/settings/API/hook smoke tests in a real OJS 3.5 runtime.
- **Issue auto-posting inactive**: OJS 3.5.0.5 source does not expose a verified post-persistence issue publish hook in the inspected path. Issue posting should remain inactive until a safe hook or outbox design is implemented and tested.
- **Synchronous posting**: Facebook calls still occur synchronously during publication/manual-post requests. Timeouts are bounded, but an outbox/worker design is required for stronger latency, retry, and reconciliation guarantees.
- **Ambiguous outcomes**: Timeouts and successful HTTP responses without a Facebook post ID are recorded as `uncertain`. Operators should not blindly retry uncertain rows without reconciling against the configured Facebook Page.

---

## Version History

| Version | Date | Changes |
|---|---|---|
| 1.0.4.0 | 2026-07-02 | Fix OJS 3.5 compatibility: remove broken template hook, fix EntityDAO fromRow() type error, update documentation |
| 1.0.3.0 | 2026-07-02 | Hardened posting logs and plugin migrations |
| 1.0.2.0 | 2026-07-01 | Issue auto-posting (IssuePostBuilder, IssueGridHandler hook) |
| 1.0.1.0 | 2026-07-01 | PostLog migration, auto-posting, retry/status display, PublicationPostBuilder |
| 1.0.0.0 | — | Initial modernization (namespace, settings, manual post, FacebookService) |

---

## License

This plugin is distributed under the GNU General Public License v3. See the `docs/COPYING` file in your OJS installation for the full license text.
