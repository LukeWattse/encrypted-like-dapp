# PowerShell script to deploy contracts to Sepolia testnet
# Usage:
#   $env:SEPOLIA_RPC_URL="https://your-rpc-url"
#   $env:MNEMONIC="your mnemonic phrase here"
#   .\deploy-sepolia.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Deploying to Sepolia Testnet" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if required environment variables are set
if (-not $env:SEPOLIA_RPC_URL) {
    Write-Host "ERROR: SEPOLIA_RPC_URL environment variable is not set!" -ForegroundColor Red
    Write-Host "Please set it using: `$env:SEPOLIA_RPC_URL='https://your-rpc-url'" -ForegroundColor Yellow
    exit 1
}

if (-not $env:MNEMONIC) {
    Write-Host "ERROR: MNEMONIC environment variable is not set!" -ForegroundColor Red
    Write-Host "Please set it using: `$env:MNEMONIC='your mnemonic phrase here'" -ForegroundColor Yellow
    exit 1
}

Write-Host "✓ SEPOLIA_RPC_URL is set" -ForegroundColor Green
Write-Host "✓ MNEMONIC is set" -ForegroundColor Green
Write-Host ""

# Compile contracts first
Write-Host "Compiling contracts..." -ForegroundColor Yellow
npm run compile
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Compilation failed!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Deploying to Sepolia..." -ForegroundColor Yellow
Write-Host ""

# Deploy to Sepolia
npm run deploy:sepolia
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Deployment failed!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "Deployment completed successfully!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Go to frontend directory" -ForegroundColor White
Write-Host "2. Run: npm run genabi" -ForegroundColor White
Write-Host "   This will generate ABI files with Sepolia address mapping" -ForegroundColor White

