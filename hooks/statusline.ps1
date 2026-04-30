# PowerShell statusline for Windows users.
# Add to %USERPROFILE%\.claude\settings.json:
#   "statusLine": { "type": "command", "command": "pwsh <plugin_root>/hooks/statusline.ps1" }

$ClaudeDir = if ($env:CLAUDE_CONFIG_DIR) { $env:CLAUDE_CONFIG_DIR } else { Join-Path $env:USERPROFILE '.claude' }
$Cfg   = Join-Path $ClaudeDir '.tersely.json'
$Stats = Join-Path $ClaudeDir '.tersely-stats.jsonl'

if (-not (Test-Path $Cfg)) { Write-Output 'tersely:default'; exit 0 }

$Profile = 'default'
try {
  $cfgObj = Get-Content $Cfg -Raw | ConvertFrom-Json
  if ($cfgObj.profile) { $Profile = $cfgObj.profile }
} catch {}

if ($Profile -eq 'off') { Write-Output 'tersely:off'; exit 0 }
if (-not (Test-Path $Stats)) { Write-Output "tersely:$Profile"; exit 0 }

$today = (Get-Date).ToString('yyyy-MM-dd')
$tok = 0; $cost = 0.0
Get-Content $Stats | ForEach-Object {
  try {
    $o = $_ | ConvertFrom-Json
    if ($o.ts -and $o.ts.StartsWith($today)) {
      $tok  += ($o.input_tokens  | ForEach-Object { if ($_ -eq $null) { 0 } else { $_ } })
      $tok  += ($o.output_tokens | ForEach-Object { if ($_ -eq $null) { 0 } else { $_ } })
      if ($o.cost) { $cost += $o.cost }
    }
  } catch {}
}

$tokFmt = if ($tok -ge 1000000) { '{0:N2}M' -f ($tok / 1000000.0) }
          elseif ($tok -ge 1000) { '{0:N1}K' -f ($tok / 1000.0) }
          else { "$tok" }
$costFmt = if ($cost -lt 1) { '${0:N3}' -f $cost } else { '${0:N2}' -f $cost }

Write-Output "tersely:$Profile · $tokFmt tok · $costFmt today"
