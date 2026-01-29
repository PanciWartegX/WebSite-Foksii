// anggota.js
import {
    logoutUser,
    showNotification,
    getAttendances,
    getAttendanceSettings,
    checkAttendanceStatus,
    hasUserAttendedToday,
    submitAttendance
} from './auth.js';

let currentUser = null;

document.addEventListener('DOMContentLoaded', async function() {
    // Check authentication
    const userData = sessionStorage.getItem('currentUser');
    if (!userData) {
        window.location.href = 'index.html';
        return;
    }
    
    currentUser = JSON.parse(userData);
    
    // Check if user is anggota
    if (currentUser.role !== 'anggota') {
        showNotification('Akses ditolak! Hanya anggota yang bisa mengakses halaman ini.', 'error');
        window.location.href = 'admin.html';
        return;
    }
    
    // Initialize the dashboard
    initDashboard();
    
    // Load user data
    loadUserData();
    
    // Load attendance data
    await loadAttendanceData();
    
    // Setup event listeners
    setupEventListeners();
});

function initDashboard() {
    // Setup user info
    const userName = document.getElementById('userName');
    const userAvatar = document.getElementById('userAvatar');
    const greeting = document.getElementById('greeting');
    
    if (currentUser && currentUser.nama) {
        userName.textContent = currentUser.nama;
        userAvatar.innerHTML = currentUser.nama.charAt(0).toUpperCase();
        greeting.textContent = `Selamat Datang, ${currentUser.nama}`;
    }
    
    // Logout button
    document.getElementById('logoutBtn').addEventListener('click', async function() {
        const success = await logoutUser();
        if (success) {
            window.location.href = 'index.html';
        }
    });
}

function loadUserData() {
    // Fill profile information
    document.getElementById('profileName').textContent = currentUser.nama || '-';
    document.getElementById('profileEmail').textContent = currentUser.email || '-';
    document.getElementById('profilePosition').textContent = currentUser.jabatan || '-';
    document.getElementById('profileRegional').textContent = currentUser.regional || '-';
    document.getElementById('profileSchool').textContent = currentUser.sekolah || '-';
    
    // Fill member info in welcome card
    const memberInfo = document.getElementById('memberInfo');
    memberInfo.textContent = `Jabatan: ${currentUser.jabatan || '-'} | Regional: ${currentUser.regional || '-'} | Sekolah: ${currentUser.sekolah || '-'}`;
}

async function loadAttendanceData() {
    try {
        // Load attendance settings
        const settings = await getAttendanceSettings();
        if (settings.success) {
            document.getElementById('activityName').textContent = settings.data.namaKegiatan || '-';
            document.getElementById('activityDate').textContent = settings.data.tanggal || '-';
            document.getElementById('activityTime').textContent = `${settings.data.jamBuka || '08:00'} - ${settings.data.jamTutup || '17:00'}`;
            document.getElementById('activityStatus').textContent = settings.data.isActive ? 'Dibuka' : 'Ditutup';
            
            // Check attendance status
            const status = await checkAttendanceStatus();
            const hasAttended = await hasUserAttendedToday(currentUser.uid);
            
            updateAttendanceUI(status, hasAttended, settings.data);
        }
        
        // Load attendance history
        const history = await getAttendances(currentUser.uid);
        if (history.success) {
            renderAttendanceHistory(history.data);
        }
        
    } catch (error) {
        console.error('Load attendance data error:', error);
        showNotification('Gagal memuat data absensi', 'error');
    }
}

function updateAttendanceUI(status, hasAttended, settings) {
    const statusInfo = document.getElementById('attendanceStatusInfo');
    const formContainer = document.getElementById('attendanceFormContainer');
    const messageContainer = document.getElementById('attendanceMessage');
    
    // Clear containers
    formContainer.innerHTML = '';
    messageContainer.innerHTML = '';
    
    if (hasAttended) {
        // User has already attended today
        statusInfo.innerHTML = '<span class="attendance-status status-submitted">Sudah Absen</span>';
        messageContainer.innerHTML = `
            <div class="alert alert-success">
                <i class="fas fa-check-circle"></i>
                <div>
                    <p>Anda sudah mengisi absensi hari ini.</p>
                    <p><small>Terima kasih telah mengisi absensi tepat waktu.</small></p>
                </div>
            </div>
        `;
    } else if (status === 'open') {
        // Attendance is open and user hasn't attended
        statusInfo.innerHTML = '<span class="attendance-status status-open">Absensi Dibuka</span>';
        renderAttendanceForm();
    } else {
        // Attendance is closed
        statusInfo.innerHTML = '<span class="attendance-status status-closed">Absensi Ditutup</span>';
        
        let message = 'Absensi belum dibuka.';
        if (settings.isActive && status === 'closed') {
            message = 'Absensi sudah ditutup atau waktu absensi telah berakhir.';
        }
        
        messageContainer.innerHTML = `
            <div class="alert alert-warning">
                <i class="fas fa-clock"></i>
                <div>
                    <p>${message}</p>
                    <p><small>Waktu absensi: ${settings.jamBuka} - ${settings.jamTutup}</small></p>
                </div>
            </div>
        `;
    }
}

function renderAttendanceForm() {
    const formContainer = document.getElementById('attendanceFormContainer');
    
    formContainer.innerHTML = `
        <form id="attendanceForm">
            <div class="form-group">
                <label>Status Kehadiran *</label>
                <div class="radio-group" style="display: flex; flex-direction: column; gap: 10px;">
                    <div class="radio-option">
                        <input type="radio" id="status-H" name="status" value="H" required>
                        <label for="status-H">
                            <span class="badge badge-success">H - Hadir</span>
                            <small>Hadir dalam kegiatan</small>
                        </label>
                    </div>
                    <div class="radio-option">
                        <input type="radio" id="status-I" name="status" value="I">
                        <label for="status-I">
                            <span class="badge badge-warning">I - Izin</span>
                            <small>Tidak hadir dengan alasan</small>
                        </label>
                    </div>
                    <div class="radio-option">
                        <input type="radio" id="status-S" name="status" value="S">
                        <label for="status-S">
                            <span class="badge badge-info">S - Sakit</span>
                            <small>Tidak hadir karena sakit</small>
                        </label>
                    </div>
                    <div class="radio-option">
                        <input type="radio" id="status-A" name="status" value="A">
                        <label for="status-A">
                            <span class="badge badge-danger">A - Alpa</span>
                            <small>Tidak hadir tanpa keterangan</small>
                        </label>
                    </div>
                </div>
            </div>
            
            <div class="form-group">
                <label for="keterangan">Keterangan (Opsional)</label>
                <textarea id="keterangan" rows="3" placeholder="Tambahkan keterangan jika diperlukan..."></textarea>
            </div>
            
            <div class="form-group">
                <p style="font-size: 0.9rem; color: #666;">
                    <i class="fas fa-info-circle"></i> Pastikan data yang Anda isi sudah benar. 
                    Absensi hanya bisa diisi sekali dan tidak dapat diubah.
                </p>
            </div>
            
            <button type="submit" class="btn btn-success btn-block">
                <i class="fas fa-paper-plane"></i> Kirim Absensi
            </button>
        </form>
    `;
}

function renderAttendanceHistory(attendances) {
    const tableBody = document.getElementById('attendanceHistoryBody');
    
    if (attendances.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; padding: 30px;">
                    <i class="fas fa-history" style="font-size: 2rem; color: #ddd;"></i>
                    <p>Belum ada riwayat absensi</p>
                </td>
            </tr>
        `;
        return;
    }
    
    let html = '';
    attendances.forEach((att, index) => {
        const statusClass = `badge-${att.status === 'H' ? 'success' : att.status === 'I' ? 'warning' : att.status === 'S' ? 'info' : 'danger'}`;
        html += `
            <tr>
                <td>${index + 1}</td>
                <td>${att.tanggal}</td>
                <td><span class="badge ${statusClass}">${att.status}</span></td>
                <td>${att.keterangan || '-'}</td>
                <td>${att.jamIsi}</td>
            </tr>
        `;
    });
    
    tableBody.innerHTML = html;
}

function setupEventListeners() {
    // Attendance form submission (delegated because form is dynamically created)
    document.addEventListener('submit', async function(e) {
        if (e.target && e.target.id === 'attendanceForm') {
            e.preventDefault();
            
            const form = e.target;
            const status = form.querySelector('input[name="status"]:checked');
            const keterangan = form.querySelector('#keterangan').value;
            
            if (!status) {
                showNotification('Pilih status kehadiran terlebih dahulu!', 'error');
                return;
            }
            
            const attendanceData = {
                status: status.value,
                keterangan: keterangan
            };
            
            try {
                const result = await submitAttendance(attendanceData);
                if (result.success) {
                    showNotification('Absensi berhasil dikirim!', 'success');
                    // Reload attendance data
                    await loadAttendanceData();
                }
            } catch (error) {
                console.error('Submit attendance error:', error);
            }
        }
    });
}