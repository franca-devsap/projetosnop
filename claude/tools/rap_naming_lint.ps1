param(
  [Parameter(Mandatory = $true)]
  [string]$Path,

  [string]$Prefix = "YLMS",

  [switch]$Quiet
)

# RAP naming + doctrine linter.
# Scans a single spec file (.md or .txt) for the rule set surfaced in the LMS validator pass.
# Exit codes: 0 = pass, 1 = warnings only, 2 = blockers found.

if (-not (Test-Path -LiteralPath $Path)) {
  Write-Error "File not found: $Path"
  exit 2
}

$text = Get-Content -LiteralPath $Path -Raw
$lines = Get-Content -LiteralPath $Path
$findings = New-Object System.Collections.ArrayList

function Add-Finding {
  param([string]$Severity, [string]$Rule, [int]$Line, [string]$Detail)
  [void]$findings.Add([pscustomobject]@{
    Severity = $Severity
    Rule     = $Rule
    Line     = $Line
    Detail   = $Detail
  })
}

# Rule 1 - DDIC table names <= 16 chars
$tableRegex = '(?i)\b' + $Prefix + '_[A-Z0-9_]+\b'
$matches = [regex]::Matches($text, $tableRegex)
$longTables = $matches | Where-Object { $_.Value.Length -gt 16 } | Select-Object -ExpandProperty Value -Unique
foreach ($t in $longTables) {
  for ($i = 0; $i -lt $lines.Count; $i++) {
    if ($lines[$i] -match [regex]::Escape($t)) {
      $ctx = $lines[$i]
      if ($ctx -match '(?i)\b(table|from|references|define table|@AbapCatalog)\b') {
        Add-Finding "BLOCKER" "table-name-le-16" ($i + 1) "$t length=$($t.Length) chars - DDIC tables must be <=16 chars"
        break
      }
    }
  }
}

# Rule 2 - SCDO / SNRO names <= 10 chars
$scdoSnroRegex = '(?i)(SCDO|SNRO|change document object|number range object)[^\n]*?(' + $Prefix + '[A-Z0-9_]+)'
$m2 = [regex]::Matches($text, $scdoSnroRegex)
foreach ($mm in $m2) {
  $name = $mm.Groups[2].Value
  if ($name.Length -gt 10) {
    $lineNum = ($text.Substring(0, $mm.Index) -split "`n").Count
    Add-Finding "BLOCKER" "scdo-snro-le-10" $lineNum "$name length=$($name.Length) chars - SCDO/SNRO names must be <=10 chars"
  }
}

# Rule 3 - with draft token presence
for ($i = 0; $i -lt $lines.Count; $i++) {
  if ($lines[$i] -match '(?i)\bwith\s+draft\s*;') {
    if ($lines[$i] -notmatch '^\s*(//|--|\*|\#)') {
      Add-Finding "BLOCKER" "with-draft-token" ($i + 1) "with draft; token present - keyword turns draft ON regardless of comments"
    }
  }
}

# Rule 4 - etag column must be LocalLastChangedAt
for ($i = 0; $i -lt $lines.Count; $i++) {
  if ($lines[$i] -match '(?i)etag\s+master\s+LastChangedAt(?!\w)') {
    Add-Finding "WARNING" "etag-local-last-changed" ($i + 1) "etag master LastChangedAt - use LocalLastChangedAt"
  }
}

# Rule 5 - strict mode declared on managed BDEFs
$hasManaged = $text -match '(?i)managed\s+implementation\s+in\s+class'
$hasStrict2 = $text -match '(?i)strict\s*\(\s*2\s*\)'
if ($hasManaged -and -not $hasStrict2) {
  Add-Finding "WARNING" "strict-mode-missing" 0 "Managed BDEF detected but no strict ( 2 ) declaration found"
}

# Rule 6 - NUMC declared on letter-bearing identifier
for ($i = 0; $i -lt $lines.Count; $i++) {
  if ($lines[$i] -match '(?i)\b(TRAINING_CODE|REGULATION_MASTER_ID|GROUP_ORIENTATION)\b\s*:\s*numc') {
    Add-Finding "WARNING" "numc-vs-char" ($i + 1) "Letter-bearing identifier typed NUMC - verify NUMC-vs-CHAR rule"
  }
}

# Rule 7 - CHAR declared on pure-numeric identifier
for ($i = 0; $i -lt $lines.Count; $i++) {
  if ($lines[$i] -match '(?i)\b(VERSION|SEQUENCE|SEQ|COUNTER|CPF)\b\s*:\s*char') {
    Add-Finding "WARNING" "numc-vs-char" ($i + 1) "Pure-numeric identifier typed CHAR - verify NUMC-vs-CHAR rule"
  }
}

# Output
$blockers = ($findings | Where-Object Severity -eq "BLOCKER").Count
$warnings = ($findings | Where-Object Severity -eq "WARNING").Count

if (-not $Quiet) {
  Write-Host ""
  Write-Host "RAP naming lint - $Path"
  Write-Host ("=" * 60)
  if ($findings.Count -eq 0) {
    Write-Host "PASS - no findings"
  } else {
    $sorted = $findings | Sort-Object @{Expression={$_.Severity}; Descending=$true}, Line
    foreach ($f in $sorted) {
      $tag = "[$($f.Severity)]"
      if ($f.Line -gt 0) { $loc = "L$($f.Line)" } else { $loc = "-" }
      Write-Host ("{0,-10} {1,-26} {2,-6} {3}" -f $tag, $f.Rule, $loc, $f.Detail)
    }
  }
  Write-Host ""
  Write-Host ("Summary: {0} BLOCKERS, {1} WARNINGS" -f $blockers, $warnings)
}

if ($blockers -gt 0) { exit 2 }
if ($warnings -gt 0) { exit 1 }
exit 0
