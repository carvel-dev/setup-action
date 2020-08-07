# setup-k14s-action

A [Github Action](https://github.com/features/actions) to install k14s apps (such as ytt, kbld, kapp, etc.)

- Slack: [#k14s in Kubernetes slack](https://slack.kubernetes.io)

## Usage

By default, installs latest versions of `ytt`, `kbld`, `kapp`, `kwt`, `imgpkg` and `vendir`:

```yaml
steps:
- uses: k14s/setup-k14s-action@v1
- run: |
    ytt version
    kbld version
```

`setup-k14s-action` uses the GitHub API to find information about latest releases. To avoid [rate limits](https://developer.github.com/v3/#rate-limiting) it is recommended you pass a [token](https://help.github.com/en/actions/configuring-and-managing-workflows/authenticating-with-the-github_token):

```yaml
steps:
- uses: k14s/setup-k14s-action@v1
  with:
    token: ${{ secrets.GITHUB_TOKEN }}
- run: |
    ytt version
    kbld version
```

To install only specific apps:

```yaml
steps:
- uses: k14s/setup-k14s-action@v1
  with:
    only: ytt, kbld
- run: |
    ytt version
    kbld version
```

To use a specific version of an app:

```yaml
steps:
- uses: k14s/setup-k14s-action@v1
  with:
    only: ytt, kbld
    kbld: v0.28.0
- run: |
    ytt version
    kbld version
```

## Development

See [DEVELOPMENT.md](https://github.com/k14s/setup-k14s-action/blob/develop/DEVELOPMENT.md).
