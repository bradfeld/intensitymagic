#!/usr/bin/env python3
"""Generate CLAUDE.md from template + PROJECT_CONFIG.md"""

import sys
import re
import os

def extract_section(config_content, section_name):
    """Extract content between section markers"""
    pattern = f'^## {section_name}$\n(.*?)(?=^## |\\Z)'
    match = re.search(pattern, config_content, re.MULTILINE | re.DOTALL)
    if match:
        return match.group(1).strip()
    return ""

def main():
    template_file = os.environ.get('TEMPLATE_FILE', '/Users/bfeld/Code/project-template/CLAUDE.md')
    config_file = os.environ.get('CONFIG_FILE', '.claude/PROJECT_CONFIG.md')
    output_file = os.environ.get('OUTPUT_FILE', 'CLAUDE.md')

    # Read template
    with open(template_file, 'r') as f:
        template = f.read()

    # Read config
    with open(config_file, 'r') as f:
        config = f.read()

    # Extract sections
    project_desc = extract_section(config, 'PROJECT_DESCRIPTION')
    domain_specifics = extract_section(config, 'DOMAIN_SPECIFICS')
    db_schema_ref = extract_section(config, 'DATABASE_SCHEMA_REF')

    # Replace placeholders
    output = template.replace('{{PROJECT_DESCRIPTION}}', project_desc)
    output = output.replace('{{DOMAIN_SPECIFICS}}', domain_specifics)

    # Update schema reference if provided
    if db_schema_ref:
        schema_line = f"2. Review `{db_schema_ref}`"
        output = output.replace('2. Review schema documentation (check `docs/db/` for schema baselines)', schema_line)

    # Write output
    with open(output_file, 'w') as f:
        f.write(output)

    print(f"✅ Generated {output_file} from template + project config")

if __name__ == '__main__':
    main()
