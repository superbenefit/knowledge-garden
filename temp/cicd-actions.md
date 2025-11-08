# CI/CD Auto-Update Setup (In Progress)

## Status: Partially Complete

### ✅ Completed (knowledge-garden repo)

Created `.github/workflows/update-submodule.yml` that automatically updates the knowledge-base submodule.

**Workflow triggers:**
- `repository_dispatch` - Webhook from knowledge-base repo (event type: `knowledge-base-updated`)
- `workflow_dispatch` - Manual trigger from GitHub UI
- `schedule` - Hourly check (`0 * * * *`)

**What it does:**
1. Checks out knowledge-garden with submodules
2. Updates knowledge-base submodule to latest commit
3. Commits and pushes changes if submodule updated
4. Triggers Cloudflare Pages rebuild automatically

**File location:** `.github/workflows/update-submodule.yml`

**Committed:** Yes (commit 916b319)

---

### ⏸️ Pending (knowledge-base repo)

Need to set up the webhook trigger in the knowledge-base repository.

---

## Claude Code Prompt for knowledge-base Repo

**Copy and paste this when working in the `knowledge-base` repository:**

```
I need you to set up a GitHub Actions workflow that triggers the knowledge-garden repository to update its submodule whenever content is pushed to the main branch of this repository (knowledge-base).

Requirements:
1. Create a workflow file at `.github/workflows/notify-knowledge-garden.yml`
2. The workflow should trigger on push to the main branch
3. It should send a repository_dispatch event to the superbenefit/knowledge-garden repository
4. The event type should be "knowledge-base-updated"

Important notes:
- This requires a Personal Access Token (PAT) with repo permissions
- The PAT needs to be stored as a repository secret named `KNOWLEDGE_GARDEN_PAT`
- Use the peter-evans/repository-dispatch@v2 action
- The target repository is: superbenefit/knowledge-garden
- Make the workflow name descriptive like "Notify Knowledge Garden"

After creating the workflow:
1. Commit it with an appropriate message
2. Push to the main branch
3. Let me know what PAT permissions are needed so I can create it in GitHub

Additional context:
- This is part of an automated content pipeline where knowledge-base is a git submodule in knowledge-garden
- When content updates here, we want knowledge-garden to automatically pull those updates and rebuild
```

---

## Manual Steps Required (After knowledge-base workflow created)

### 1. Create Personal Access Token (PAT)

**Location:** GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)

**Settings:**
- Name: `knowledge-garden-dispatch`
- Scopes: ✅ `repo` (full control of private repositories)
- Expiration: Your choice (recommend 1 year with renewal reminder)

**Action:** Generate and copy the token

### 2. Add PAT as Repository Secret

**Location:** knowledge-base repo Settings → Secrets and variables → Actions

**Settings:**
- Name: `KNOWLEDGE_GARDEN_PAT`
- Value: Paste the PAT from step 1

### 3. Merge PR to Enable Workflow

Both workflows need to be on their respective default branches to function:
- knowledge-garden: Merge PR to `v4` branch
- knowledge-base: Merge PR to `main` branch

---

## How It Works (End-to-End)

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Edit content in knowledge-base (Obsidian or any editor) │
└───────────────────┬─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Commit and push to knowledge-base/main                   │
└───────────────────┬─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. GitHub Actions workflow in knowledge-base triggers       │
│    - Sends repository_dispatch to knowledge-garden          │
└───────────────────┬─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. GitHub Actions workflow in knowledge-garden receives     │
│    - Updates submodule to latest commit                     │
│    - Commits change to v4 branch                            │
└───────────────────┬─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. Cloudflare Pages detects commit to v4 branch             │
│    - Automatically rebuilds and deploys site                │
└─────────────────────────────────────────────────────────────┘
```

**Fallback:** If webhook fails, hourly scheduled check ensures updates within 1 hour.

---

## Testing the Setup

### Test Manual Trigger (Before webhook setup)

1. Go to knowledge-garden repo → Actions tab
2. Select "Update Knowledge Base Submodule" workflow
3. Click "Run workflow"
4. Select `v4` branch
5. Click "Run workflow"
6. Check that submodule updates and commits

### Test Webhook Trigger (After setup complete)

1. Make a trivial change in knowledge-base repo
2. Commit and push to main branch
3. Check knowledge-base Actions tab - should see "Notify Knowledge Garden" run
4. Check knowledge-garden Actions tab - should see "Update Knowledge Base Submodule" run
5. Check knowledge-garden v4 branch - should see new commit updating submodule
6. Check Cloudflare Pages - should see new deployment triggered

### Test Hourly Trigger

Wait for next hour (or adjust cron to test sooner). Check Actions history for scheduled runs.

---

## Troubleshooting

### Workflow doesn't trigger from webhook
- Check PAT is valid and has `repo` scope
- Check PAT is added as secret `KNOWLEDGE_GARDEN_PAT` in knowledge-base repo
- Check both workflows are on their default branches (not just in PR)

### Submodule doesn't update
- Check workflow has `contents: write` permission
- Check default branch is `v4` (not `main`)
- Check GITHUB_TOKEN has sufficient permissions

### Cloudflare doesn't rebuild
- Check Cloudflare is watching the `v4` branch
- Check build isn't failing due to other issues
- Check Cloudflare build logs for errors

---

## Current Implementation Details

### Workflow File Contents

**knowledge-garden: `.github/workflows/update-submodule.yml`**

```yaml
name: Update Knowledge Base Submodule

on:
  repository_dispatch:
    types: [knowledge-base-updated]
  workflow_dispatch:
  schedule:
    - cron: '0 * * * *'

jobs:
  update-submodule:
    runs-on: ubuntu-latest
    permissions:
      contents: write

    steps:
      - name: Checkout repository with submodules
        uses: actions/checkout@v4
        with:
          submodules: true
          token: ${{ secrets.GITHUB_TOKEN }}
          ref: v4

      - name: Update submodule to latest commit
        run: |
          git submodule update --remote --merge

      - name: Check for changes
        id: check_changes
        run: |
          if git diff --quiet knowledge-base; then
            echo "changed=false" >> $GITHUB_OUTPUT
            echo "No submodule changes detected"
          else
            echo "changed=true" >> $GITHUB_OUTPUT
            echo "Submodule has been updated"
          fi

      - name: Commit and push if changed
        if: steps.check_changes.outputs.changed == 'true'
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"

          cd knowledge-base
          NEW_COMMIT=$(git rev-parse --short HEAD)
          cd ..

          git add knowledge-base
          git commit -m "chore: update knowledge-base submodule to ${NEW_COMMIT}"
          git push origin v4

      - name: Summary
        run: |
          if [ "${{ steps.check_changes.outputs.changed }}" == "true" ]; then
            echo "✅ Submodule updated and pushed to main"
          else
            echo "ℹ️ Submodule already up to date"
          fi
```

**knowledge-base: `.github/workflows/notify-knowledge-garden.yml`** (TO BE CREATED)

```yaml
name: Notify Knowledge Garden

on:
  push:
    branches: [main]

jobs:
  notify:
    runs-on: ubuntu-latest
    steps:
      - name: Repository Dispatch
        uses: peter-evans/repository-dispatch@v2
        with:
          token: ${{ secrets.KNOWLEDGE_GARDEN_PAT }}
          repository: superbenefit/knowledge-garden
          event-type: knowledge-base-updated
```

---

## Next Steps

1. ⏸️ **Put on hold** - Fix other problems first
2. Run Claude Code prompt in knowledge-base repo
3. Create PAT and add as secret
4. Merge both PRs
5. Test end-to-end workflow
6. Monitor for successful automatic updates

---

## Related Configuration

### Submodule Configuration

**File:** `.gitmodules`
```
[submodule "knowledge-base"]
	path = knowledge-base
	url = https://github.com/superbenefit/knowledge-base.git
```

### Content Directory Configuration

**File:** `quartz/cli/args.js`
```javascript
default: "knowledge-base",  // Changed from "content"
```

### Type Detection Configuration

**File:** `quartz/plugins/transformers/typeDetection.ts`
- Updated to use `ctx.argv.directory` dynamically
- Loads types from `${contentDir}/tools/types/`

### Ignored Content Patterns

**File:** `quartz.config.ts`
```javascript
ignorePatterns: [
  "private",
  "templates",
  ".obsidian",
  ".github",
  "drafts",              // Don't publish draft content
  "tools/templates",     // Templates excluded
  "tools/schemas",       // Schemas excluded
  "tools/workflows",     // Workflows excluded
  ".claude",
  ".export",
  "README.md",
  "CONTRIBUTING.md",
  "agents.md",
  "**/AIFS Meeting \\(*.md",     // Malformed frontmatter
  "**/rpp-archive/**",           // Data quality issues
  "**/rpp-tasks/**",
  "**/rpp-experiments/**",
  "**/rp-playbook.md"
]
```
