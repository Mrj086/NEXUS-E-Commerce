#!/usr/bin/env python3
"""Strip nested motion.div wrappers from seller-panel.tsx render functions."""

import re

with open('/home/z/my-project/src/components/seller/seller-panel.tsx', 'r') as f:
    content = f.read()

# 1. Replace staggerContainer wrappers
content = re.sub(
    r'<motion\.div\s+\{\.\.\.staggerContainer\}\s+initial="hidden"\s+animate="visible"\s+(className="[^"]*")\s*>',
    r'<div \1>',
    content
)

# 2. Replace motion.div with variants={fadeIn} className="X">
content = re.sub(
    r'<motion\.div\s+variants=\{fadeIn\}\s+className="([^"]*)"\s*>',
    r'<div className="\1">',
    content
)

# 3. Replace motion.div with variants={fadeIn} transition={{...}} className="X">
content = re.sub(
    r'<motion\.div\s+variants=\{fadeIn\}\s+transition=\{[^}]*\}\s+className="([^"]*)"\s*>',
    r'<div className="\1">',
    content
)

# 4. Replace motion.div with key={...} variants={fadeIn} transition={{...}}>
content = re.sub(
    r'<motion\.div\s+key=\{[^}]*\}\s+variants=\{fadeIn\}\s+transition=\{[^}]*\}\s*>',
    r'<div>',
    content
)

# 5. Replace multiline motion.div with variants={fadeIn} (order cards)
content = re.sub(
    r'<motion\.div\s+key=\{[^}]*\}\s+variants=\{fadeIn\}\s*\n',
    r'<div\n',
    content
)

# 6. Replace remaining variants={fadeIn} with just className
content = re.sub(
    r'<motion\.div\s+variants=\{fadeIn\}\s+transition=\{[^}]*\}\s*>',
    r'<div>',
    content
)

# Now handle closing tags - find the outer AnimatePresence child and protect it
lines = content.split('\n')

# Find the outer motion.div (child of AnimatePresence with key={activeTab})
outer_close_line = None
for i, line in enumerate(lines):
    if '</AnimatePresence>' in line:
        # Find the </motion.div> just before it
        for j in range(i - 1, -1, -1):
            stripped = lines[j].strip()
            if stripped == '</motion.div>':
                outer_close_line = j
                break
        break

# Replace all </motion.div> except the outer one
new_lines = []
for i, line in enumerate(lines):
    if '</motion.div>' in line and i != outer_close_line:
        line = line.replace('</motion.div>', '</div>')
    new_lines.append(line)

content = '\n'.join(new_lines)

with open('/home/z/my-project/src/components/seller/seller-panel.tsx', 'w') as f:
    f.write(content)

print("Done!")
