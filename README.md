oclif-hello-world
=================

oclif example Hello World CLI

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/oclif-hello-world.svg)](https://npmjs.org/package/oclif-hello-world)
[![CircleCI](https://circleci.com/gh/oclif/hello-world/tree/main.svg?style=shield)](https://circleci.com/gh/oclif/hello-world/tree/main)
[![Downloads/week](https://img.shields.io/npm/dw/oclif-hello-world.svg)](https://npmjs.org/package/oclif-hello-world)
[![License](https://img.shields.io/npm/l/oclif-hello-world.svg)](https://github.com/oclif/hello-world/blob/main/package.json)

<!-- toc -->
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->
# Usage
<!-- usage -->
```sh-session
$ npm install -g blubber
$ blubber COMMAND
running command...
$ blubber (--version)
blubber/0.0.0 darwin-arm64 node-v16.14.2
$ blubber --help [COMMAND]
USAGE
  $ blubber COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`blubber hello PERSON`](#blubber-hello-person)
* [`blubber hello world`](#blubber-hello-world)
* [`blubber help [COMMAND]`](#blubber-help-command)
* [`blubber plugins`](#blubber-plugins)
* [`blubber plugins:install PLUGIN...`](#blubber-pluginsinstall-plugin)
* [`blubber plugins:inspect PLUGIN...`](#blubber-pluginsinspect-plugin)
* [`blubber plugins:install PLUGIN...`](#blubber-pluginsinstall-plugin-1)
* [`blubber plugins:link PLUGIN`](#blubber-pluginslink-plugin)
* [`blubber plugins:uninstall PLUGIN...`](#blubber-pluginsuninstall-plugin)
* [`blubber plugins:uninstall PLUGIN...`](#blubber-pluginsuninstall-plugin-1)
* [`blubber plugins:uninstall PLUGIN...`](#blubber-pluginsuninstall-plugin-2)
* [`blubber plugins update`](#blubber-plugins-update)

## `blubber hello PERSON`

Say hello

```
USAGE
  $ blubber hello [PERSON] -f <value>

ARGUMENTS
  PERSON  Person to say hello to

FLAGS
  -f, --from=<value>  (required) Whom is saying hello

DESCRIPTION
  Say hello

EXAMPLES
  $ oex hello friend --from oclif
  hello friend from oclif! (./src/commands/hello/index.ts)
```

_See code: [dist/commands/hello/index.ts](https://github.com/getblend/blubber/blubber/blob/v0.0.0/dist/commands/hello/index.ts)_

## `blubber hello world`

Say hello world

```
USAGE
  $ blubber hello world

DESCRIPTION
  Say hello world

EXAMPLES
  $ oex hello world
  hello world! (./src/commands/hello/world.ts)
```

## `blubber help [COMMAND]`

Display help for blubber.

```
USAGE
  $ blubber help [COMMAND] [-n]

ARGUMENTS
  COMMAND  Command to show help for.

FLAGS
  -n, --nested-commands  Include all nested commands in the output.

DESCRIPTION
  Display help for blubber.
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v5.1.10/src/commands/help.ts)_

## `blubber plugins`

List installed plugins.

```
USAGE
  $ blubber plugins [--core]

FLAGS
  --core  Show core plugins.

DESCRIPTION
  List installed plugins.

EXAMPLES
  $ blubber plugins
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v2.0.11/src/commands/plugins/index.ts)_

## `blubber plugins:install PLUGIN...`

Installs a plugin into the CLI.

```
USAGE
  $ blubber plugins:install PLUGIN...

ARGUMENTS
  PLUGIN  Plugin to install.

FLAGS
  -f, --force    Run yarn install with force flag.
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Installs a plugin into the CLI.

  Can be installed from npm or a git url.

  Installation of a user-installed plugin will override a core plugin.

  e.g. If you have a core plugin that has a 'hello' command, installing a user-installed plugin with a 'hello' command
  will override the core plugin implementation. This is useful if a user needs to update core plugin functionality in
  the CLI without the need to patch and update the whole CLI.

ALIASES
  $ blubber plugins add

EXAMPLES
  $ blubber plugins:install myplugin 

  $ blubber plugins:install https://github.com/someuser/someplugin

  $ blubber plugins:install someuser/someplugin
```

## `blubber plugins:inspect PLUGIN...`

Displays installation properties of a plugin.

```
USAGE
  $ blubber plugins:inspect PLUGIN...

ARGUMENTS
  PLUGIN  [default: .] Plugin to inspect.

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Displays installation properties of a plugin.

EXAMPLES
  $ blubber plugins:inspect myplugin
```

## `blubber plugins:install PLUGIN...`

Installs a plugin into the CLI.

```
USAGE
  $ blubber plugins:install PLUGIN...

ARGUMENTS
  PLUGIN  Plugin to install.

FLAGS
  -f, --force    Run yarn install with force flag.
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Installs a plugin into the CLI.

  Can be installed from npm or a git url.

  Installation of a user-installed plugin will override a core plugin.

  e.g. If you have a core plugin that has a 'hello' command, installing a user-installed plugin with a 'hello' command
  will override the core plugin implementation. This is useful if a user needs to update core plugin functionality in
  the CLI without the need to patch and update the whole CLI.

ALIASES
  $ blubber plugins add

EXAMPLES
  $ blubber plugins:install myplugin 

  $ blubber plugins:install https://github.com/someuser/someplugin

  $ blubber plugins:install someuser/someplugin
```

## `blubber plugins:link PLUGIN`

Links a plugin into the CLI for development.

```
USAGE
  $ blubber plugins:link PLUGIN

ARGUMENTS
  PATH  [default: .] path to plugin

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Links a plugin into the CLI for development.

  Installation of a linked plugin will override a user-installed or core plugin.

  e.g. If you have a user-installed or core plugin that has a 'hello' command, installing a linked plugin with a 'hello'
  command will override the user-installed or core plugin implementation. This is useful for development work.

EXAMPLES
  $ blubber plugins:link myplugin
```

## `blubber plugins:uninstall PLUGIN...`

Removes a plugin from the CLI.

```
USAGE
  $ blubber plugins:uninstall PLUGIN...

ARGUMENTS
  PLUGIN  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ blubber plugins unlink
  $ blubber plugins remove
```

## `blubber plugins:uninstall PLUGIN...`

Removes a plugin from the CLI.

```
USAGE
  $ blubber plugins:uninstall PLUGIN...

ARGUMENTS
  PLUGIN  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ blubber plugins unlink
  $ blubber plugins remove
```

## `blubber plugins:uninstall PLUGIN...`

Removes a plugin from the CLI.

```
USAGE
  $ blubber plugins:uninstall PLUGIN...

ARGUMENTS
  PLUGIN  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ blubber plugins unlink
  $ blubber plugins remove
```

## `blubber plugins update`

Update installed plugins.

```
USAGE
  $ blubber plugins update [-h] [-v]

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Update installed plugins.
```
<!-- commandsstop -->
