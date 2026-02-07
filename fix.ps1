
$path = "main.js"
$lines = Get-Content $path
$targetIndex = 3198
if ($lines.Count -gt $targetIndex) {
    if ($lines[$targetIndex].Trim() -eq "},") {
        Write-Host "Already has comma"
    } elseif ($lines[$targetIndex].Trim() -eq "}") {
        $lines[$targetIndex] = "    },"
        $lines | Set-Content $path -Encoding UTF8
        Write-Host "Fixed line 3199"
    } else {
        Write-Host "Line mismatch: $($lines[$targetIndex])"
    }
} else {
    Write-Host "File too short"
}
