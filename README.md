# CloudCannon Hugo

Creates [CloudCannon](https://cloudcannon.com/) build information for sites made with Hugo.

This tool runs after your Hugo build, reading your configuration to find pages, collections, and
data files to create a JSON file used to automatically integrate the site with CloudCannon. This
JSON file is written to `_cloudcannon/info.json` in your destination folder.

[<img src="https://img.shields.io/npm/v/cloudcannon-hugo?logo=npm" alt="version badge">](https://www.npmjs.com/package/cloudcannon-hugo)
[<img src="https://img.shields.io/npm/dt/cloudcannon-hugo" alt="downloads badge">](https://www.npmjs.com/package/cloudcannon-hugo)
[![Build Status](https://travis-ci.com/CloudCannon/cloudcannon-hugo.svg?branch=master)](https://travis-ci.com/CloudCannon/cloudcannon-hugo)
[![codecov](https://codecov.io/gh/CloudCannon/cloudcannon-hugo/branch/master/graph/badge.svg?token=HZJBYKA8ZF)](https://codecov.io/gh/CloudCannon/cloudcannon-hugo)

***

- [Installation](#installation)
- [Configuration](#configuration)
- [Development](#development)
- [License](#license)

***

## Installation

**You don't have to install anything** when building on CloudCannon. This tool is automatically
installed before your site is built. This gives you the latest support, new features, and fixes
as they are released.

Although **not necessary**, you can install the tool locally to debug an integration issue.

<details>
<summary>Manual installation steps</summary>

<blockquote>

```sh
$ npm install --global cloudcannon-hugo
```

This gives you access to the `cloudcannon-hugo` binary.

</blockquote>
</details>


## Configuration

Configuration files should be in the root directory (or the same directory you run
`cloudcannon-hugo`). The first supported file found in this order is used:

- `cloudcannon.config.json`
- `cloudcannon.config.yaml`
- `cloudcannon.config.yml`
- `cloudcannon.config.js`
- `cloudcannon.config.cjs`

Alternatively, use a specific file with the `CLOUDCANNON_CONFIG_PATH` environment variable:

```sh
$ CLOUDCANNON_CONFIG_PATH=src/cloudcannon.config.js cloudcannon-hugo
```

Your global CloudCannon configuration is set in this file as well, as it's used as a base to
generate `_cloudcannon/info.json` (used to integrate your site with CloudCannon).

Example content for `cloudcannon.config.yml`:

```yaml
# Global CloudCannon configuration
_inputs:
  title:
    type: text
    comment: The title of your page.
_select_data:
  colors:
    - Red
    - Green
    - Blue

# Base path to your site source files
source: src

# The subpath your built output files are mounted at
base_url: /documentation

# Populates collections for navigation and metadata in the editor
collections_config:
  people:
    # Base path for files in this collection, relative to source
    path: content/people

    # Whether this collection produces output files or not
    output: true

    # Collection-level configuration
    name: Personnel
    _enabled_editors:
      - data
  posts:
    path: _posts
    output: true
  pages:
    name: Main pages

# Generates the data for select and multiselect inputs matching these names
data_config:
  # Populates data with authors from an data file with the matching name
  authors: true
  offices: true

paths:
  # The default location for newly uploaded files, relative to source
  uploads: assets/uploads

  # The path to site data files, relative to source
  data: _data

  # The path to site layout files, relative to source
  layouts: _layouts
```

See the [CloudCannon documentation](https://cloudcannon.com/documentation/) for more information
on the available features you can configure.

Configuration is set in `cloudcannon.config.*`, but the tool also automatically
reads and processes the following from Hugo if unset:

- `collections_config` from your folder structure inside `contentDir` in Hugo config
- `paths.layouts` from `layoutsDir` in Hugo config
- `paths.data` from `dataDir` in Hugo config
- `paths.static` from `staticDir` in Hugo config
- `base_url` from the `--baseURL` CLI option or `baseURL` in Hugo config
- `source` from `source` in Hugo config

## Development

Install dependencies:

```sh
$ npm i
```

Lint code:

```sh
$ npm run lint
```

### Testing

Run tests:

```sh
$ npm test
$ npm run test:integration
$ npm run test:all
$ npm run report-coverage
```

Link this package locally to test it on a site folder, then run it within your site folder:

```sh
$ npm link
$ cd ../my-hugo-site
$ cloudcannon-hugo
```

### Releasing new versions

Prerelease:

```sh
$ npm run release:next
```

Release:

```sh
$ npm run release:latest
```

## License

ISC
