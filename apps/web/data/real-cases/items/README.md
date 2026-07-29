# Real Case Items

This directory stores one file per real platform case.

Why this exists:

- avoid turning `index.json` into a giant unreadable array
- make each real case independently editable
- keep future review, diff, and validation cleaner

Current convention:

- one file per case: `real-001.json`
- `index.json` only stores lightweight references such as `id`, `file`, and `status`
