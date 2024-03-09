# Copyright (c) 2024 Jakub Holcman.
#
# This source code is licensed under the GPLv3 license found in the
# LICENSE file in the root directory of this source tree.

import optparse

import json
from pyang import plugin
import pyang.statements


def pyang_plugin_init():
    plugin.register_plugin(JsonTreePlugin("json-tree"))


class JsonTreePlugin(plugin.PyangPlugin):
    def add_output_format(self, fmts):
        self.multiple_modules = True
        fmts["json-tree"] = self

    def setup_fmt(self, ctx):
        ctx.implicit_errors = False

    def emit(self, ctx, modules, fd):
        tree = emit(modules)
        tree_json = json.dumps(tree)
        fd.write(tree_json)


def emit(modules):
    def iter(node, _key=0):
        node_obj = {"_key": _key, "keyword": node.keyword, "name": node.arg}

        meta_nodes = [
            "description",
            "reference",
            "type",
            "prefix",
            "namespace",
            "yang-version",
            "organization",
            "contact",
        ]
        for meta_node in meta_nodes:
            outcome = node.search(meta_node)
            if outcome:
                for o in outcome:
                    node_obj[o.keyword] = o.arg

        node_obj["children"] = []

        if not hasattr(node, "i_children"):
            return node_obj

        for index, child in enumerate(node.i_children):
            if child.keyword not in [
                "leaf",
                "leaf-list",
                "case",
                "choice",
                "list",
                "container",
                "action",
                "notification",
                "anydata",
                "anyxml",
                "rpc",
                "input",
                "output",
            ]:
                continue
            else:
                child_obj = iter(child, index)
                if (
                    child_obj["keyword"] in ["input", "output"]
                    and child_obj["children"] == []
                ):
                    continue
                node_obj["children"].append(child_obj)

        return node_obj

    json_tree = {"name": "root", "tree-root": True, "modules": []}

    for module in modules:
        mod_obj = iter(module)
        json_tree["modules"].append(mod_obj)

    return json_tree
