# ZipBi — Official Website

> **Smarter operations. Better café experiences.**

The official landing page for **ZipBi**, a café and restaurant operations platform designed to bring orders, menus, kitchen workflows, and sales records into one connected system.

---

## ☕ Core Highlights

- **Visual Alignment**: Matched directly to the official visual reference layout, spacing, section badges, pill buttons, and typography.
- **Customer App**: Free to use with minimal in-app ads. Diners discover cafés, view menus, scan table QR codes, and track order progress.
- **Merchant App**: One unified application with distinct role-based views for Owners, Counter Staff, and Kitchen teams.
- **Kitchen Display**: An integrated operational mode inside the Merchant App.
- **Web Dashboard (Phase 2)**: Designed for comprehensive menu management, CSV exports, and administrative controls on larger screens.
- **Planned AI Capabilities**: 5-node progressive rollout for AI menu import, categorization, intelligent reporting, and stock forecasting.
- **Two-Tier Pricing**: Basic (₹219/mo or ₹2,365/yr with 10% annual discount) and Advanced (₹289/mo or ₹2,948/yr with 15% annual discount & "More Insights").
- **Working Contact Form with Resend**: Sales enquiries are validated, backed up to `enquiries.json`, and dispatched via Resend to `amarmicrosoft2021@gmail.com`.

---

## 🎨 Color Tokens & Reference Styling

- **Primary Green**: `#0C7744`
- **Hover Green**: `#085430`
- **Mint Badges**: `#E8F6EE` with border `#CDEBD8`
- **Section Band Background**: `#F1F9F4`
- **Card Background**: Pure white `#FFFFFF` with `rounded-2xl` / `rounded-3xl`
- **Pill Buttons**: `rounded-full`

---

## 📧 Resend Email Setup

To connect your Resend account so enquiries automatically send to `amarmicrosoft2021@gmail.com`:

1. Sign up or log into [Resend](https://resend.com/api-keys) and generate an API key.
2. In your terminal (in the project root), run the secure command:

**PowerShell (Windows):**
```powershell
$val = Read-Host "Enter RESEND_API_KEY (typing hidden)" -AsSecureString; $BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($val); $plain = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR); Add-Content -Path ".env" -Value "RESEND_API_KEY=$plain"; Write-Output "Saved."
```

**Bash / macOS / Linux:**
```bash
printf "Enter RESEND_API_KEY (typing hidden): " && read -s val && echo && echo "RESEND_API_KEY=$val" >> ".env" && echo "Saved."
```

All submissions are automatically logged to [`enquiries.json`](./enquiries.json) as a fail-safe backup.

---

## 🚀 Running the Project

### 1. Development Server
```bash
npm run dev
```
Accessible at [http://localhost:3000](http://localhost:3000).

### 2. Standalone Production Server
```bash
npm run build
node server.js
```

---

## 📍 Headquarters

**ZipBi Technologies**  
Coimbatore, Tamil Nadu, India.
