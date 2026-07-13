# Grafana MongoDB Plugin

The Grafana MongoDB Plugin allows you to explore your MongoDB documents within
Grafana.

![Grafana MongoDB Plugin](https://raw.githubusercontent.com/ricoberger/grafana-mongodb-plugin/refs/heads/main/src/img/screenshots/filter-raw.png)

<div align="center">
  <table>
    <tr>
      <td><img src="https://raw.githubusercontent.com/ricoberger/grafana-mongodb-plugin/refs/heads/main/src/img/screenshots/filter-table.png" /></td>
      <td><img src="https://raw.githubusercontent.com/ricoberger/grafana-mongodb-plugin/refs/heads/main/src/img/screenshots/aggregate-raw.png" /></td>
    </tr>
  </table>
</div>

## Usage

- Filter:

```json
{ "_id": { "$oid": "6a4cad8eea14f073b66a98e8" } }
```

- Aggregation:

```json
[
  { "$group": { "_id": "$scope", "count": { "$sum": 1 } } },
  { "$sort": { "count": -1 } },
  { "$project": { "_id": 0, "scope": "$_id", "count": 1 } }
]
```

## Installation

1. Before you can install the plugin, you have to add
   `ricoberger-mongodb-datasource` to the
   [`allow_loading_unsigned_plugins`](https://grafana.com/docs/grafana/latest/setup-grafana/configure-grafana/#allow_loading_unsigned_plugins)
   configuration option or to the `GF_PLUGINS_ALLOW_LOADING_UNSIGNED_PLUGINS`
   environment variable.
2. The plugin can then be installed by adding
   `ricoberger-mongodb-datasource@<VERSION>@https://github.com/ricoberger/grafana-mongodb-plugin/releases/download/v<VERSION>/ricoberger-mongodb-datasource-<VERSION>.zip`
   to the
   [`preinstall_sync`](https://grafana.com/docs/grafana/latest/setup-grafana/configure-grafana/#preinstall_sync)
   configuration option or the `GF_PLUGINS_PREINSTALL_SYNC` environment
   variable.

### Configuration File

```ini
[plugins]
allow_loading_unsigned_plugins = ricoberger-mongodb-datasource
preinstall_sync = ricoberger-mongodb-datasource@0.1.0@https://github.com/ricoberger/grafana-mongodb-plugin/releases/download/v0.1.0/ricoberger-mongodb-datasource-0.1.0.zip
```

### Environment Variables

```bash
export GF_PLUGINS_ALLOW_LOADING_UNSIGNED_PLUGINS=ricoberger-mongodb-datasource
export GF_PLUGINS_PREINSTALL_SYNC=ricoberger-mongodb-datasource@0.1.0@https://github.com/ricoberger/grafana-mongodb-plugin/releases/download/v0.1.0/ricoberger-mongodb-datasource-0.1.0.zip
```

## Contributing

If you want to contribute to the project, please read through the
[contribution guideline](https://github.com/ricoberger/grafana-mongodb-plugin/blob/main/CONTRIBUTING.md).
Please also follow our
[code of conduct](https://github.com/ricoberger/grafana-mongodb-plugin/blob/main/CODE_OF_CONDUCT.md)
in all your interactions with the project.
