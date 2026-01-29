# Sistem Absensi FOKSI

Sistem absensi digital untuk organisasi FOKSI dengan fitur lengkap dan integrasi Firebase.

## 🚀 Fitur Utama

### Untuk Admin:
- Dashboard dengan statistik real-time
- Manajemen data absensi (filter, export, cetak)
- Manajemen anggota (tambah, edit, hapus)
- Pengaturan sistem (jadwal absensi, email, dll)
- Laporan dan analisis data
- Export data ke Excel/CSV

### Untuk Anggota:
- Dashboard pribadi
- Form absensi dengan validasi waktu
- Riwayat absensi pribadi
- Profil anggota

### Sistem Umum:
- Authentication dengan Firebase Auth
- Database dengan Firestore
- Role-based access control
- Responsive design
- Tema merah yang konsisten
- UI/UX modern

## 📋 Persyaratan Sistem

- Browser modern (Chrome, Firefox, Safari, Edge)
- Koneksi internet
- Firebase account

## 🔧 Instalasi dan Setup

### 1. Setup Firebase

1. **Buat Project Firebase:**
   - Buka [Firebase Console](https://console.firebase.google.com/)
   - Klik "Add project"
   - Beri nama "web-foksi"
   - Enable Google Analytics (opsional)
   - Klik "Create project"

2. **Tambahkan Aplikasi Web:**
   - Di dashboard project, klik ikon web (</>)
   - Beri nama app "Sistem Absensi FOKSI"
   - Copy konfigurasi Firebase
   - Klik "Register app"

3. **Enable Authentication:**
   - Di sidebar, pilih "Authentication"
   - Pilih tab "Sign-in method"
   - Klik "Email/Password"
   - Enable "Email/Password" dan "Passwordless email link sign-in"
   - Klik "Save"

4. **Enable Firestore Database:**
   - Di sidebar, pilih "Firestore Database"
   - Klik "Create database"
   - Pilih "Start in test mode" (untuk development)
   - Pilih region terdekat
   - Klik "Enable"

### 2. Deploy File ke Hosting

#### Opsi A: Firebase Hosting (Rekomendasi)

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login ke Firebase
firebase login

# Inisialisasi project
firebase init

# Pilih:
# - Hosting
# - Firestore
# - Use existing project
# - Pilih "web-foksi"
# - Public directory: public
# - Configure as SPA: Yes
# - Overwrite index.html: No

# Copy semua file ke folder public/

# Deploy
firebase deploy