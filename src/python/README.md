# Json tree pyang plugin

This plugin generates json data from YANG modules that can be loaded into YangTreeViewer component.

## Usage

```bash
pyang --plugindir . -f json-tree <your-yang-modules> -o ../data/example-data.json
```
