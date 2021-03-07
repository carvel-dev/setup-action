# carvel-setup-action

[![Build Status](https://github.com/vmware-tanzu/carvel-setup-action/workflows/build/badge.svg?branch=develop)](https://github.com/vmware-tanzu/carvel-setup-action/actions?query=branch%3Adevelop+workflow%3Abuild)
[![Release Status](https://github.com/vmware-tanzu/carvel-setup-action/workflows/release/badge.svg)](https://github.com/vmware-tanzu/carvel-setup-action/actions?query=workflow%3Arelease)

A [Github Action](https://github.com/features/actions) to install Carvel apps (such as ytt, kbld, kapp, etc.)

- Slack: [#carvel in Kubernetes slack](https://slack.kubernetes.io)

## Usage

By default, installs latest versions of `ytt`, `kbld`, `kapp`, `kwt`, `imgpkg` and `vendir`:

```yaml
steps:
- uses: vmware-tanzu/carvel-setup-action@v1
- run: |
    ytt version
    kbld version
```

`carvel-setup-action` uses the GitHub API to find information about latest releases. To avoid [rate limits](https://developer.github.com/v3/#rate-limiting) it is recommended you pass a [token](https://help.github.com/en/actions/configuring-and-managing-workflows/authenticating-with-the-github_token):

```yaml
steps:
- uses: vmware-tanzu/carvel-setup-action@v1
  with:
    token: ${{ secrets.GITHUB_TOKEN }}
- run: |
    ytt version
    kbld version
```

To install only specific apps:

```yaml
steps:
- uses: vmware-tanzu/carvel-setup-action@v1
  with:
    only: ytt, kbld
- run: |
    ytt version
    kbld version
```

To exclude specific apps:

```yaml
steps:
- uses: vmware-tanzu/carvel-setup-action@v1
  with:
    exclude: kwt, vendir
- run: |
    ytt version
    kbld version
```

To use a specific version of an app:

```yaml
steps:
- uses: vmware-tanzu/carvel-setup-action@v1
  with:
    only: ytt, kbld
    kbld: v0.28.0
- run: |
    ytt version
    kbld version
```

## Development

See [DEVELOPMENT](https://github.com/vmware-tanzu/carvel-setup-action/blob/develop/DEVELOPMENT.md).
