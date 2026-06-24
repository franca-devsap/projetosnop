param(
  [Parameter(Mandatory = $true)]
  [string]$Path,

  [ValidateSet("Model", "GlobalClass")]
  [string]$Mode = "Model"
)

$text = Get-Content -LiteralPath $Path -Raw

if ($Mode -eq "Model") {
  $checks = @(
    @{ Name = "Has behavior definition"; Pattern = "define behavior for" },
    @{ Name = "Has unmanaged implementation"; Pattern = "unmanaged implementation in class" },
    @{ Name = "Has strict mode"; Pattern = "strict\s*\(\s*2\s*\)" },
    @{ Name = "Has projection behavior action exposure"; Pattern = "use action" },
    @{ Name = "Has behavior handler"; Pattern = "cl_abap_behavior_handler" },
    @{ Name = "Has behavior saver"; Pattern = "cl_abap_behavior_saver" },
    @{ Name = "Uses global logic delegation"; Pattern = "=>get_instance\(\s*\)->" }
  )
} else {
  $checks = @(
    @{ Name = "Uses SE24 public final class"; Pattern = "PUBLIC\s+FINAL\s+CREATE\s+PUBLIC" },
    @{ Name = "Defines RAP table aliases"; Pattern = "TYPE TABLE FOR" },
    @{ Name = "Defines get_instance singleton"; Pattern = "CLASS-METHODS\s+get_instance" },
    @{ Name = "Avoids c_failed entity component"; Pattern = "c_failed-\w+"; Invert = $true },
    @{ Name = "Avoids c_reported entity component"; Pattern = "c_reported-\w+"; Invert = $true },
    @{ Name = "Has cleanup method"; Pattern = "METHODS\s+cleanup|CLASS-METHODS\s+cleanup" }
  )
}

foreach ($check in $checks) {
  $found = [regex]::IsMatch($text, $check.Pattern, [Text.RegularExpressions.RegexOptions]::IgnoreCase)
  if ($check.Invert) { $ok = -not $found } else { $ok = $found }
  $status = if ($ok) { "OK" } else { "REVIEW" }
  "{0,-8} {1}" -f $status, $check.Name
}
