param(
  [Parameter(Mandatory = $true)][string]$OldSiteRoot,
  [Parameter(Mandatory = $true)][string]$PublicationDataPath
)

$ErrorActionPreference = 'Stop'

function Normalize-Title([string]$Title) {
  return ($Title.ToLowerInvariant() -replace '[^a-z0-9]', '')
}

function Read-FrontMatterValue([string[]]$Lines, [string]$Key) {
  $line = $Lines | Where-Object { $_ -match "^$([regex]::Escape($Key)):\s*" } | Select-Object -First 1
  if (-not $line) { return '' }
  $value = ($line -replace "^$([regex]::Escape($Key)):\s*", '').Trim()
  if ($value.Length -ge 2 -and (($value[0] -eq "'" -and $value[-1] -eq "'") -or ($value[0] -eq '"' -and $value[-1] -eq '"'))) {
    $value = $value.Substring(1, $value.Length - 2)
  }
  return $value.Trim()
}

$raw = Get-Content -LiteralPath $PublicationDataPath -Raw
$jsonStart = $raw.IndexOf('[')
if ($jsonStart -lt 0) { throw "Could not find the publication array in $PublicationDataPath" }
$current = $raw.Substring($jsonStart).Trim().TrimEnd(';') | ConvertFrom-Json

$knownTitles = @{}
foreach ($publication in $current) { $knownTitles[(Normalize-Title $publication.title)] = $true }

$imported = @()
$skippedDuplicates = 0
$skippedWorkshops = 0
$oldFiles = Get-ChildItem -LiteralPath (Join-Path $OldSiteRoot '_publications') -File | Sort-Object Name

foreach ($file in $oldFiles) {
  $lines = Get-Content -LiteralPath $file.FullName
  $title = Read-FrontMatterValue $lines 'title'
  $venue = Read-FrontMatterValue $lines 'venue'
  $citation = Read-FrontMatterValue $lines 'citation'
  $paper = Read-FrontMatterValue $lines 'paper'
  $code = Read-FrontMatterValue $lines 'code'
  $teaserLine = $lines | Where-Object { $_ -match '^\s*teaser:\s*' } | Select-Object -First 1
  $teaser = ($teaserLine -replace '^\s*teaser:\s*', '').Trim().Trim("'").Trim('"')

  if (-not $title) { continue }
  if ($venue -match '(?i)workshop') { $skippedWorkshops++; continue }
  $normalized = Normalize-Title $title
  if ($knownTitles.ContainsKey($normalized)) { $skippedDuplicates++; continue }

  $yearMatch = [regex]::Match($file.Name, '^(\d{4})')
  if (-not $yearMatch.Success) { throw "Cannot determine year from $($file.Name)" }
  if (-not $venue) { $venue = 'Preprint' }
  $relativeTeaser = $teaser -replace '^papers[/\\]', '' -replace '\\', '/'

  $record = [ordered]@{
    title = $title
    year = [int]$yearMatch.Groups[1].Value
    type = 'paper'
    venue = $venue
    authorsText = $citation
    paper = $paper
    image = "assets/images/publications/archive/$relativeTeaser"
  }
  if ($code) { $record.code = $code }
  $imported += [pscustomobject]$record
  $knownTitles[$normalized] = $true
}

$combined = @($current) + @($imported)
$json = $combined | ConvertTo-Json -Depth 8 -Compress
[System.IO.File]::WriteAllText($PublicationDataPath, "window.PUBLICATIONS = $json;`r`n", [System.Text.UTF8Encoding]::new($false))

[pscustomobject]@{
  Existing = @($current).Count
  Imported = @($imported).Count
  Total = @($combined).Count
  SkippedDuplicates = $skippedDuplicates
  SkippedWorkshops = $skippedWorkshops
}
