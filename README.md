# Release to Keygen.sh (Github Action)

This Github action creates (and, if needed, publishes) a release for any artifact/file from your repository.

## Usage

```yaml
- name: Release to Keygen
  uses: hfend/keygen-release-action-typescript@main # TODO: update action ref
  with:
    # Required: Keygen Account ID or slug
    account-id: 'your-keygen-account-id-or-slug'

    # Required: A Product or User Token (ref. https://keygen.sh/docs/api/authentication/#token-authentication)
    token: 'your-token'

    # Required: Product ID
    product-id: 'your-product-id'

    # Required (boolean): true to publish the created release; false to keep it in the DRAFT state.
    release-publish: true

    # Optional
    release-name: 'Product v1-alpha.1'
    # Required: must be a valid semver value, without the `v` prefix
    release-version: '1.0.0-alpha.1'
    # Required
    release-channel: 'alpha'
    # Optional
    release-tag: 'latest'

    # Required: Path to the artifact/file
    # Must be made available in the Github Runner runtime through any adequate preceeding workflow step
    # e.g. using the 'actions/checkout@v3' Github action for checking-out Github repository files.
    artifact-filepath: './README.md'

    # Optional
    artifact-platform: 'darwin'
    # Optional
    artifact-arch: 'amd64'
```
