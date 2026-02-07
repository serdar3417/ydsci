
lines = open('main.js', 'r', encoding='utf-8').readlines()
target_idx = 3198
if len(lines) > target_idx:
    current = lines[target_idx]
    if current.strip() == '},':
        print(f"Already fixed line {target_idx+1}: {current.strip()}")
    elif current.strip() == '}':
         # It might be indented differently or have no comma
         lines[target_idx] = '    },\n'
         print(f"Fixed line {target_idx+1}")
         with open('main.js', 'w', encoding='utf-8') as f:
             f.writelines(lines)
    elif current.strip() == '},':
         print("Already has comma")
    else:
         print(f"Unexpected content at line {target_idx+1}: '{current.rstrip()}'")
         # Check nearby lines
         for i in range(max(0, target_idx-2), min(len(lines), target_idx+3)):
             print(f"{i+1}: {lines[i].rstrip()}")
else:
    print("File too short")
