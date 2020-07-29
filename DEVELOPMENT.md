# Development

## Build and test

Run unit tests:

    jest
    
Build all (format, build, pack, test):

    npm run all

### Running a workflow locally

If you want to run the e2e tests locally to try out the action, install [act](https://github.com/nektos/act).

You can then run all workflows like this:

    ./run-workflows.sh

Typically, if you just want to try out the action, it's sufficient to run a single e2e test like this:

    npm run build && npm run pack && act -j test-e2e-specific-apps

This will execute the test-e2e-specific-apps job, which runs the action configured to install a couple of apps (ytt and kbld).

Note: remember to run `build` and `pack` first, as the workflow will act upon the `dist/index.js` file.

### Submitting PRs

Before submitting a PR, you need to:

1. Format your code.
2. Update `dist/index.js`.

You can do this with `npm run prepare`.

If you forget, the `check build up to date` build step will fail.
