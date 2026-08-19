with open('/home/z/my-project/src/components/customer/customer-panel.tsx', 'r') as f:
    lines = f.readlines()

# Find the line with 'Invoice Modal'
for i, line in enumerate(lines):
    if 'Invoice Modal' in line:
        print(f'Found at line {i+1}: {repr(line)}')
        break

# Replace lines from 'Invoice Modal' comment to end
new_lines = lines[:i]
new_lines.append('      {invoiceOrderId && <InvoiceView orderId={invoiceOrderId} onClose={() => setInvoiceOrderId(null)} />}\n')
new_lines.append('    </div>\n')
new_lines.append('  )\n')
new_lines.append('}\n')

with open('/home/z/my-project/src/components/customer/customer-panel.tsx', 'w') as f:
    f.writelines(new_lines)

print('Fixed!')
