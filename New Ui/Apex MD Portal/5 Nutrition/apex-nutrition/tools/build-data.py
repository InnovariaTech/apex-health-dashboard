#!/usr/bin/env python3
"""Regenerate data/app-data.js from json/journal.json + json/plan.json."""
import json, os
HERE = os.path.dirname(__file__)
ROOT = os.path.abspath(os.path.join(HERE, '..'))
journal = json.load(open(os.path.join(ROOT, 'json', 'journal.json')))
plan = json.load(open(os.path.join(ROOT, 'json', 'plan.json')))
out = "/* Auto-generated from json/*.json by tools/build-data.py. Runtime data for the app. */\n"
out += "window.APEX_DATA = " + json.dumps({"journal": journal, "plan": plan}, indent=2) + ";\n"
open(os.path.join(ROOT, 'data', 'app-data.js'), 'w').write(out)
print("Wrote data/app-data.js")
