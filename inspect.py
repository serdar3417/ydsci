
try:
    with open('main.js', 'rb') as f:
        lines = f.readlines()
        start = 3190
        end = 3205
        for i, line in enumerate(lines[start:end]):
            print(f"{start+i+1}: {line}")
except Exception as e:
    print(e)
