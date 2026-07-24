param(
    [string]$SenderEmail,
    [string]$SmtpHost = "smtp.gmail.com",
    [ValidateRange(1, 65535)]
    [int]$SmtpPort = 587
)

if ([string]::IsNullOrWhiteSpace($SenderEmail)) {
    $SenderEmail = Read-Host "SMTP sender email"
}

if ([string]::IsNullOrWhiteSpace($SenderEmail)) {
    throw "SMTP sender email is required."
}

$securePassword = Read-Host "SMTP password or provider app password" -AsSecureString
$credential = [System.Management.Automation.PSCredential]::new($SenderEmail, $securePassword)
$plainPassword = $credential.GetNetworkCredential().Password

try {
    if ($SmtpHost.Equals("smtp.gmail.com", [System.StringComparison]::OrdinalIgnoreCase)) {
        # Google displays App Passwords in grouped form. Clipboard content can
        # also contain non-breaking or zero-width separators, so retain only
        # the actual letters and digits before validating and storing it.
        $plainPassword = [System.Text.RegularExpressions.Regex]::Replace(
            $plainPassword,
            "[^A-Za-z0-9]",
            ""
        )

        if ($plainPassword.Length -ne 16) {
            Write-Host (
                "Setup stopped: Gmail SMTP requires a 16-character Google App Password. " +
                "The entered value contains {0} characters after removing separators." -f
                $plainPassword.Length
            ) -ForegroundColor Red
            exit 1
        }
    }

    $settings = [ordered]@{
        "EmailSettings:Host" = $SmtpHost
        "EmailSettings:Port" = $SmtpPort
        "EmailSettings:EnableSsl" = $true
        "EmailSettings:UseAuthentication" = $true
        "EmailSettings:UserName" = $SenderEmail
        "EmailSettings:Password" = $plainPassword
        "EmailSettings:FromEmail" = $SenderEmail
        "EmailSettings:FromName" = "Product Stock Tracker"
    }

    $settings | ConvertTo-Json -Compress | dotnet user-secrets set --project $PSScriptRoot
    if ($LASTEXITCODE -ne 0) {
        throw "Unable to save the email settings."
    }

    Write-Host "Email settings saved to .NET User Secrets. Restart the API before testing."
}
finally {
    $plainPassword = $null
    $credential = $null
    $securePassword.Dispose()
}
