# DANCE HUB - Pull-request Labels and Evidence

**Status:** Draft  
**Last Updated:** 2026-09-03

## Required labels

Apply every relevant label from the fixed set and path map in
[`AGENTS.md`](../../AGENTS.md#pull-request-areas-and-evidence). The pull-request
template presents that same checklist so authors identify all affected areas before
review.

## RLS evidence

A pull request carrying `area:db` or `area:auth` follows the negative-RLS evidence
requirement in [`AGENTS.md`](../../AGENTS.md#pull-request-areas-and-evidence).

## Administration status

This repository has no label-sync configuration or workflow that derives labels from
changed paths. Static files cannot create GitHub labels. A repository administrator
must create and maintain the six labels in GitHub, and pull-request authors and
reviewers apply them manually. No CI path filters are configured for these labels, so
the existing CI workflow continues to run its full application and database coverage
for pull requests.
