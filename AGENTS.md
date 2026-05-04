# AGENTS.md

## Cursor Cloud specific instructions

### Project Overview
This is a bilingual (Korean/English) Jekyll static blog about data engineering. It has no CI/CD pipeline, no linter config, and no automated tests. The primary development loop is: edit Markdown/Liquid → build → preview.

### Prerequisites
- Ruby 3.x with `bundler` and `jekyll` gems (installed system-wide via `sudo gem install bundler jekyll`)
- The `Gemfile` in the repo root declares project-level gem dependencies

### Development Commands
| Task | Command |
|------|---------|
| Install deps | `bundle install` (uses local `vendor/bundle` path via `.bundle/config`) |
| Build site | `bundle exec jekyll build` |
| Dev server | `bundle exec jekyll serve --host 0.0.0.0 --port 4000` |
| Dev server (detached) | `bundle exec jekyll serve --host 0.0.0.0 --port 4000 --detach` |

### Caveats
- **No linter or test suite**: This project has no ESLint, RuboCop, or automated test framework. Validation is limited to `jekyll build` succeeding without errors.
- **Liquid warnings are benign**: Build produces Liquid syntax warnings from dbt/Jinja template code embedded in blog post Markdown. These are cosmetic and do not affect the output.
- **`_site/` is committed**: The pre-built output is checked in. After `jekyll build`, the `_site/` directory is regenerated.
- **`vendor/bundle` is local**: Bundler is configured to install gems into `./vendor/bundle` (gitignored via `_config.yml` exclude). This avoids permission issues.
- **No Gemfile.lock committed**: The lock file is generated locally by `bundle install`.
