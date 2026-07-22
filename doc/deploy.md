# Deployment

S3 deployment is handled by GitHub Actions. Pushes are deployed under
`models-resources/cloud-file-manager/` — branch builds to `branch/<name>/...` and tag
builds to `version/<tag>/...` — by the `s3-deploy` job in
[`ci.yml`](../.github/workflows/ci.yml). A version is promoted by recursively copying its
`version/<version>/` folder to `staging/` by
[`release-staging.yml`](../.github/workflows/release-staging.yml), and to the top level by
[`release_production.yml`](../.github/workflows/release_production.yml), each via `workflow_dispatch`.

## AWS Access

The GitHub Actions workflows in this project are allowed to update files in S3 using OIDC.
An IAM role has been created in AWS with a trust policy that allows GitHub Actions in
this specific repository to assume this IAM role. The IAM role has a `RepoName` tag
and a managed policy that uses this tag to give the role permission to update files under
`s3://models-resources/cloud-file-manager/`.

See
[deploy-setup.md in starter-projects](https://github.com/concord-consortium/starter-projects/blob/main/doc/deploy-setup.md)
for how the AWS side is set up.
