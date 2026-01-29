// admin.js
import { 
    logoutUser, 
    showNotification, 
    getAllUsers, 
    getAttendances,
    getAttendanceStats,
    saveAttendanceSettings,
    getAttendanceSettings,
    checkAttendanceStatus,
    registerUser,
    deleteUser,
    updateUser,
    getAttendanceHistory
} from './auth.js';

let currentUser = null;
let allAttendances = [];
let allMembers = [];

document.addEventListener('DOMContentLoaded', async function() {
    // Check authentication
    const userData = sessionStorage.getItem('currentUser');
    if (!userData) {
        window.location.href = 'index.html';
        return;
    }
    
    currentUser = JSON.parse(userData);
    
    // Check if user is admin
    if (currentUser.role !== 'admin') {
        showNotification('Akses ditolak! Hanya admin yang bisa mengakses halaman ini.', 'error');
        window.location.href = 'anggota.html';
        return;
    }
    
    // Initialize the dashboard
    initDashboard();
    
    // Load initial data
    await loadDashboardData();
    await loadAttendanceSettingsData();
    await loadAllMembers();
    
    // Setup event listeners
    setupEventListeners();
});

function initDashboard() {
    // Setup user info in sidebar
    const adminAvatar = document.getElementById('adminAvatar');
    const adminDetails = document.getElementById('adminDetails');
    
    if (currentUser && currentUser.nama) {
        adminAvatar.innerHTML = currentUser.nama.charAt(0).toUpperCase();
        adminDetails.innerHTML = `
            <div style="font-weight: 600; font-size: 0.9rem;">${currentUser.nama}</div>
            <div style="font-size: 0.8rem; opacity: 0.8;">Admin</div>
        `;
    }
    
    // Sidebar toggle
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('mainContent');
    const toggleIcon = document.getElementById('toggleIcon');
    const sidebarTitle = document.getElementById('sidebarTitle');
    
    sidebarToggle.addEventListener('click', function() {
        sidebar.classList.toggle('collapsed');
        mainContent.classList.toggle('expanded');
        
        if (sidebar.classList.contains('collapsed')) {
            toggleIcon.className = 'fas fa-chevron-right';
            sidebarTitle.style.display = 'none';
        } else {
            toggleIcon.className = 'fas fa-chevron-left';
            sidebarTitle.style.display = 'block';
        }
    });
    
    // Navigation menu
    const menuItems = document.querySelectorAll('.menu-item');
    const pageContents = document.querySelectorAll('.page-content');
    
    menuItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Update active menu item
            menuItems.forEach(menu => menu.classList.remove('active'));
            this.classList.add('active');
            
            // Show corresponding page
            const pageId = this.getAttribute('data-page') + 'Page';
            pageContents.forEach(page => {
                page.classList.remove('active');
                if (page.id === pageId) {
                    page.classList.add('active');
                    
                    // Update page title
                    updatePageTitle(this.querySelector('.menu-text').textContent);
                    
                    // Load page data
                    loadPageData(pageId);
                }
            });
        });
    });
    
    // Logout button
    document.getElementById('logoutBtn').addEventListener('click', async function() {
        const success = await logoutUser();
        if (success) {
            window.location.href = 'index.html';
        }
    });
    
    // Refresh button
    document.getElementById('refreshBtn').addEventListener('click', async function() {
        showNotification('Memperbarui data...', 'info');
        await loadDashboardData();
        showNotification('Data berhasil diperbarui', 'success');
    });
}

function updatePageTitle(title) {
    const pageTitle = document.getElementById('pageTitle');
    const pageSubtitle = document.getElementById('pageSubtitle');
    
    pageTitle.textContent = title;
    
    // Set appropriate subtitles
    const subtitles = {
        'Dashboard': 'Selamat datang di panel administrasi sistem absensi FOKSI',
        'Data Absensi': 'Lihat dan kelola data absensi anggota',
        'Daftar Anggota': 'Kelola data anggota FOKSI',
        'Tambah Anggota': 'Tambahkan anggota baru ke sistem',
        'Pengaturan': 'Konfigurasi sistem absensi',
        'Laporan': 'Lihat laporan dan analisis data'
    };
    
    pageSubtitle.textContent = subtitles[title] || '';
}

async function loadDashboardData() {
    try {
        // Load quick stats
        const stats = await getAttendanceStats();
        if (stats.success) {
            const quickStats = document.getElementById('quickStats');
            quickStats.innerHTML = `
                <div class="stat-box">
                    <div class="stat-icon" style="background-color: #4caf50;">
                        <i class="fas fa-users"></i>
                    </div>
                    <div class="stat-content">
                        <h3>${stats.data.userCount || 0}</h3>
                        <p>Total Anggota</p>
                    </div>
                </div>
                <div class="stat-box">
                    <div class="stat-icon" style="background-color: #2196f3;">
                        <i class="fas fa-calendar-check"></i>
                    </div>
                    <div class="stat-content">
                        <h3>${stats.data.todayCount || 0}</h3>
                        <p>Absensi Hari Ini</p>
                    </div>
                </div>
                <div class="stat-box">
                    <div class="stat-icon" style="background-color: #ff9800;">
                        <i class="fas fa-database"></i>
                    </div>
                    <div class="stat-content">
                        <h3>${stats.data.totalCount || 0}</h3>
                        <p>Total Absensi</p>
                    </div>
                </div>
                <div class="stat-box">
                    <div class="stat-icon" style="background-color: #9c27b0;">
                        <i class="fas fa-chart-line"></i>
                    </div>
                    <div class="stat-content">
                        <h3>${stats.data.attendanceRate || 0}%</h3>
                        <p>Rate Kehadiran</p>
                    </div>
                </div>
            `;
        }
        
        // Load attendance status
        const status = await checkAttendanceStatus();
        const settings = await getAttendanceSettings();
        
        const attendanceStatusInfo = document.getElementById('attendanceStatusInfo');
        const attendanceActions = document.getElementById('attendanceActions');
        
        if (status === 'open') {
            attendanceStatusInfo.innerHTML = `
                <div style="display: flex; align-items: center; margin-bottom: 10px;">
                    <div style="width: 10px; height: 10px; background-color: #4caf50; border-radius: 50%; margin-right: 10px;"></div>
                    <div>
                        <h4 style="margin: 0; color: #4caf50;">Absensi Dibuka</h4>
                        <p style="margin: 5px 0 0; color: #666;">
                            ${settings.data.namaKegiatan || 'Kegiatan FOKSI'} - ${settings.data.tanggal || ''}
                        </p>
                        <p style="margin: 5px 0 0; color: #666;">
                            Waktu: ${settings.data.jamBuka || '08:00'} - ${settings.data.jamTutup || '17:00'}
                        </p>
                    </div>
                </div>
            `;
            
            attendanceActions.innerHTML = `
                <button class="btn btn-warning" id="closeAttendanceBtn">
                    <i class="fas fa-lock"></i> Tutup Absensi
                </button>
            `;
            
            // Close attendance button
            document.getElementById('closeAttendanceBtn').addEventListener('click', async function() {
                if (confirm('Apakah Anda yakin ingin menutup absensi?')) {
                    await saveAttendanceSettings({
                        ...settings.data,
                        isActive: false
                    });
                    await loadDashboardData();
                    showNotification('Absensi berhasil ditutup', 'success');
                }
            });
        } else {
            attendanceStatusInfo.innerHTML = `
                <div style="display: flex; align-items: center; margin-bottom: 10px;">
                    <div style="width: 10px; height: 10px; background-color: #f44336; border-radius: 50%; margin-right: 10px;"></div>
                    <div>
                        <h4 style="margin: 0; color: #f44336;">Absensi Ditutup</h4>
                        <p style="margin: 5px 0 0; color: #666;">
                            ${settings.data.isActive ? 'Waktu absensi telah berakhir' : 'Absensi belum diaktifkan'}
                        </p>
                    </div>
                </div>
            `;
            
            attendanceActions.innerHTML = `
                <button class="btn btn-success" id="openAttendanceBtn">
                    <i class="fas fa-unlock"></i> Buka Absensi
                </button>
            `;
            
            // Open attendance button
            document.getElementById('openAttendanceBtn').addEventListener('click', async function() {
                // Use current date as default
                const today = new Date().toISOString().split('T')[0];
                await saveAttendanceSettings({
                    namaKegiatan: 'Rapat Rutin FOKSI',
                    tanggal: today,
                    jamBuka: '08:00',
                    jamTutup: '17:00',
                    isActive: true
                });
                await loadDashboardData();
                showNotification('Absensi berhasil dibuka', 'success');
            });
        }
        
        // Load today's attendances
        const today = new Date().toISOString().split('T')[0];
        const todayAttendances = await getAttendances({ tanggal: today });
        
        const todayAttendancesBody = document.getElementById('todayAttendancesBody');
        if (todayAttendances.success && todayAttendances.data.length > 0) {
            let html = '';
            todayAttendances.data.forEach((att, index) => {
                const statusClass = `status-${att.status.toLowerCase()}`;
                html += `
                    <tr>
                        <td>${index + 1}</td>
                        <td>${att.nama}</td>
                        <td>${att.jabatan}</td>
                        <td><span class="badge badge-${att.status === 'H' ? 'success' : att.status === 'I' ? 'warning' : att.status === 'S' ? 'info' : 'danger'}">${att.status}</span></td>
                        <td>${att.jamIsi}</td>
                        <td>${att.keterangan || '-'}</td>
                    </tr>
                `;
            });
            todayAttendancesBody.innerHTML = html;
        } else {
            todayAttendancesBody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; color: #666;">
                        <i class="fas fa-inbox" style="font-size: 2rem; margin-bottom: 10px; display: block;"></i>
                        Belum ada absensi hari ini
                    </td>
                </tr>
            `;
        }
        
        // Load recent activity
        const recentActivity = document.getElementById('recentActivity');
        const allAttendances = await getAttendances();
        
        if (allAttendances.success && allAttendances.data.length > 0) {
            let html = '';
            allAttendances.data.slice(0, 5).forEach(att => {
                const timeAgo = getTimeAgo(att.createdAt);
                html += `
                    <div class="activity-item">
                        <div class="activity-icon">
                            <i class="fas fa-user-check"></i>
                        </div>
                        <div class="activity-content">
                            <p><strong>${att.nama}</strong> mengisi absensi</p>
                            <div class="activity-time">${timeAgo}</div>
                        </div>
                    </div>
                `;
            });
            recentActivity.innerHTML = html;
        } else {
            recentActivity.innerHTML = `
                <div style="text-align: center; color: #666; padding: 20px;">
                    <i class="fas fa-history" style="font-size: 2rem; margin-bottom: 10px;"></i>
                    <p>Belum ada aktivitas</p>
                </div>
            `;
        }
        
    } catch (error) {
        console.error('Load dashboard data error:', error);
        showNotification('Gagal memuat data dashboard', 'error');
    }
}

async function loadPageData(pageId) {
    switch(pageId) {
        case 'attendanceDataPage':
            await loadAttendanceData();
            break;
        case 'membersPage':
            await loadMembersTable();
            break;
        case 'reportsPage':
            await loadReports();
            break;
    }
}

async function loadAttendanceData() {
    try {
        const result = await getAttendances();
        if (result.success) {
            allAttendances = result.data;
            renderAttendanceTable(allAttendances);
        }
    } catch (error) {
        console.error('Load attendance data error:', error);
        showNotification('Gagal memuat data absensi', 'error');
    }
}

function renderAttendanceTable(attendances) {
    const tableBody = document.getElementById('allAttendancesBody');
    
    if (attendances.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="9" style="text-align: center; padding: 30px;">
                    <i class="fas fa-database" style="font-size: 2rem; color: #ddd; margin-bottom: 10px;"></i>
                    <p>Tidak ada data absensi</p>
                </td>
            </tr>
        `;
        return;
    }
    
    let html = '';
    attendances.forEach((att, index) => {
        const statusClass = `status-${att.status.toLowerCase()}`;
        html += `
            <tr>
                <td>${index + 1}</td>
                <td>${att.nama}</td>
                <td>${att.jabatan}</td>
                <td>${att.regional}</td>
                <td>${att.sekolah}</td>
                <td><span class="badge badge-${att.status === 'H' ? 'success' : att.status === 'I' ? 'warning' : att.status === 'S' ? 'info' : 'danger'}">${att.status}</span></td>
                <td>${att.keterangan || '-'}</td>
                <td>${att.tanggal}</td>
                <td>${att.jamIsi}</td>
            </tr>
        `;
    });
    
    tableBody.innerHTML = html;
}

async function loadAllMembers() {
    try {
        const result = await getAllUsers('anggota');
        if (result.success) {
            allMembers = result.data;
        }
    } catch (error) {
        console.error('Load all members error:', error);
    }
}

async function loadMembersTable() {
    try {
        const result = await getAllUsers('anggota');
        const tableBody = document.getElementById('membersTableBody');
        
        if (result.success && result.data.length > 0) {
            let html = '';
            result.data.forEach((member, index) => {
                const joinDate = member.createdAt ? 
                    new Date(member.createdAt.seconds * 1000).toLocaleDateString('id-ID') : 
                    '-';
                    
                html += `
                    <tr>
                        <td>${index + 1}</td>
                        <td>${member.nama}</td>
                        <td>${member.email}</td>
                        <td>${member.jabatan || '-'}</td>
                        <td>${member.regional || '-'}</td>
                        <td>${member.sekolah || '-'}</td>
                        <td>${joinDate}</td>
                        <td>
                            <button class="btn btn-sm btn-info" onclick="viewMember('${member.id}')">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="btn btn-sm btn-warning" onclick="editMember('${member.id}')">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-sm btn-danger" onclick="deleteMember('${member.id}')">
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    </tr>
                `;
            });
            tableBody.innerHTML = html;
        } else {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="8" style="text-align: center; padding: 30px;">
                        <i class="fas fa-users" style="font-size: 2rem; color: #ddd; margin-bottom: 10px;"></i>
                        <p>Belum ada anggota terdaftar</p>
                    </td>
                </tr>
            `;
        }
    } catch (error) {
        console.error('Load members table error:', error);
        showNotification('Gagal memuat data anggota', 'error');
    }
}

async function loadAttendanceSettingsData() {
    try {
        const settings = await getAttendanceSettings();
        if (settings.success) {
            document.getElementById('attendanceName').value = settings.data.namaKegiatan || '';
            document.getElementById('attendanceDate').value = settings.data.tanggal || '';
            document.getElementById('openTime').value = settings.data.jamBuka || '08:00';
            document.getElementById('closeTime').value = settings.data.jamTutup || '17:00';
            document.getElementById('attendanceActive').checked = settings.data.isActive || false;
        }
    } catch (error) {
        console.error('Load attendance settings error:', error);
    }
}

async function loadReports() {
    // This function will load report data
    // Implementation depends on the specific reporting requirements
    console.log('Loading reports...');
}

function setupEventListeners() {
    // Add member form
    const addMemberForm = document.getElementById('addMemberForm');
    addMemberForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const name = document.getElementById('memberName').value;
        const email = document.getElementById('memberEmail').value;
        const password = document.getElementById('memberPassword').value;
        const confirmPassword = document.getElementById('memberConfirmPassword').value;
        const position = document.getElementById('memberPosition').value;
        const regional = document.getElementById('memberRegional').value;
        const school = document.getElementById('memberSchool').value;
        const phone = document.getElementById('memberPhone').value;
        
        // Validate password
        if (password !== confirmPassword) {
            showNotification('Password tidak cocok', 'error');
            return;
        }
        
        if (password.length < 6) {
            showNotification('Password minimal 6 karakter', 'error');
            return;
        }
        
        // Prepare user data
        const userData = {
            nama: name,
            email: email,
            password: password,
            jabatan: position,
            regional: regional,
            sekolah: school,
            telepon: phone || '',
            role: 'anggota'
        };
        
        try {
            const result = await registerUser(userData);
            if (result.success) {
                showNotification('Anggota berhasil ditambahkan', 'success');
                addMemberForm.reset();
                await loadAllMembers();
                await loadDashboardData(); // Refresh stats
            }
        } catch (error) {
            console.error('Add member error:', error);
        }
    });
    
    // Attendance settings form
    const attendanceSettingsForm = document.getElementById('attendanceSettingsForm');
    attendanceSettingsForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const settings = {
            namaKegiatan: document.getElementById('attendanceName').value,
            tanggal: document.getElementById('attendanceDate').value,
            jamBuka: document.getElementById('openTime').value,
            jamTutup: document.getElementById('closeTime').value,
            isActive: document.getElementById('attendanceActive').checked
        };
        
        const result = await saveAttendanceSettings(settings);
        if (result.success) {
            showNotification('Pengaturan absensi berhasil disimpan', 'success');
            await loadDashboardData(); // Refresh dashboard
        }
    });
    
    // System settings form
    const systemSettingsForm = document.getElementById('systemSettingsForm');
    systemSettingsForm.addEventListener('submit', function(e) {
        e.preventDefault();
        showNotification('Pengaturan sistem berhasil disimpan', 'success');
    });
    
    // Email settings form
    const emailSettingsForm = document.getElementById('emailSettingsForm');
    emailSettingsForm.addEventListener('submit', function(e) {
        e.preventDefault();
        showNotification('Pengaturan email berhasil disimpan', 'success');
    });
    
    // Export data button
    document.getElementById('exportDataBtn').addEventListener('click', exportToExcel);
    
    // Print data button
    document.getElementById('printDataBtn').addEventListener('click', function() {
        window.print();
    });
    
    // Filter attendance data
    document.getElementById('applyFilter').addEventListener('click', async function() {
        const filterDate = document.getElementById('filterDate').value;
        const filterStatus = document.getElementById('filterStatus').value;
        
        let filtered = allAttendances;
        
        if (filterDate) {
            filtered = filtered.filter(att => att.tanggal === filterDate);
        }
        
        if (filterStatus) {
            filtered = filtered.filter(att => att.status === filterStatus);
        }
        
        renderAttendanceTable(filtered);
    });
    
    document.getElementById('resetFilter').addEventListener('click', function() {
        document.getElementById('filterDate').value = '';
        document.getElementById('filterStatus').value = '';
        renderAttendanceTable(allAttendances);
    });
    
    // Search members
    document.getElementById('searchMember').addEventListener('input', function(e) {
        const searchTerm = e.target.value.toLowerCase();
        
        if (allMembers.length === 0) return;
        
        const filtered = allMembers.filter(member =>
            member.nama.toLowerCase().includes(searchTerm) ||
            member.email.toLowerCase().includes(searchTerm) ||
            (member.jabatan && member.jabatan.toLowerCase().includes(searchTerm)) ||
            (member.regional && member.regional.toLowerCase().includes(searchTerm))
        );
        
        renderMembersTable(filtered);
    });
    
    // Generate report
    document.getElementById('generateReport').addEventListener('click', async function() {
        const reportType = document.getElementById('reportType').value;
        const startDate = document.getElementById('reportStartDate').value;
        const endDate = document.getElementById('reportEndDate').value;
        
        showNotification('Membuat laporan...', 'info');
        
        // In a real implementation, this would fetch report data from the server
        setTimeout(() => {
            showNotification('Laporan berhasil dibuat', 'success');
            displaySampleReport();
        }, 1000);
    });
}

function renderMembersTable(members) {
    const tableBody = document.getElementById('membersTableBody');
    
    if (members.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; padding: 30px;">
                    <i class="fas fa-search" style="font-size: 2rem; color: #ddd; margin-bottom: 10px;"></i>
                    <p>Tidak ada anggota yang ditemukan</p>
                </td>
            </tr>
        `;
        return;
    }
    
    let html = '';
    members.forEach((member, index) => {
        const joinDate = member.createdAt ? 
            new Date(member.createdAt.seconds * 1000).toLocaleDateString('id-ID') : 
            '-';
            
        html += `
            <tr>
                <td>${index + 1}</td>
                <td>${member.nama}</td>
                <td>${member.email}</td>
                <td>${member.jabatan || '-'}</td>
                <td>${member.regional || '-'}</td>
                <td>${member.sekolah || '-'}</td>
                <td>${joinDate}</td>
                <td>
                    <button class="btn btn-sm btn-info" onclick="viewMember('${member.id}')">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-warning" onclick="editMember('${member.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteMember('${member.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    });
    
    tableBody.innerHTML = html;
}

function displaySampleReport() {
    const reportContent = document.getElementById('reportContent');
    
    reportContent.innerHTML = `
        <div class="report-summary">
            <h4>Ringkasan Laporan</h4>
            <div class="stats-grid" style="margin-top: 20px;">
                <div class="stat-box">
                    <div class="stat-icon" style="background-color: #4caf50;">
                        <i class="fas fa-check-circle"></i>
                    </div>
                    <div class="stat-content">
                        <h3>75%</h3>
                        <p>Rate Kehadiran</p>
                    </div>
                </div>
                <div class="stat-box">
                    <div class="stat-icon" style="background-color: #ff9800;">
                        <i class="fas fa-user-times"></i>
                    </div>
                    <div class="stat-content">
                        <h3>15%</h3>
                        <p>Rate Izin</p>
                    </div>
                </div>
                <div class="stat-box">
                    <div class="stat-icon" style="background-color: #2196f3;">
                        <i class="fas fa-procedures"></i>
                    </div>
                    <div class="stat-content">
                        <h3>8%</h3>
                        <p>Rate Sakit</p>
                    </div>
                </div>
                <div class="stat-box">
                    <div class="stat-icon" style="background-color: #f44336;">
                        <i class="fas fa-times-circle"></i>
                    </div>
                    <div class="stat-content">
                        <h3>2%</h3>
                        <p>Rate Alpa</p>
                    </div>
                </div>
            </div>
            
            <div style="margin-top: 30px;">
                <h4>Chart Kehadiran</h4>
                <div style="background: #f5f5f5; border-radius: 10px; padding: 20px; margin-top: 15px;">
                    <div style="display: flex; align-items: flex-end; height: 200px; gap: 20px;">
                        <div style="flex: 1; text-align: center;">
                            <div style="background: #4caf50; height: 150px; border-radius: 5px;"></div>
                            <div style="margin-top: 10px;">Hadir (75%)</div>
                        </div>
                        <div style="flex: 1; text-align: center;">
                            <div style="background: #ff9800; height: 30px; border-radius: 5px;"></div>
                            <div style="margin-top: 10px;">Izin (15%)</div>
                        </div>
                        <div style="flex: 1; text-align: center;">
                            <div style="background: #2196f3; height: 16px; border-radius: 5px;"></div>
                            <div style="margin-top: 10px;">Sakit (8%)</div>
                        </div>
                        <div style="flex: 1; text-align: center;">
                            <div style="background: #f44336; height: 4px; border-radius: 5px;"></div>
                            <div style="margin-top: 10px;">Alpa (2%)</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function exportToExcel() {
    if (allAttendances.length === 0) {
        showNotification('Tidak ada data untuk diexport', 'warning');
        return;
    }
    
    // Create CSV content
    let csv = 'No,Nama,Jabatan,Regional,Sekolah,Status,Keterangan,Tanggal,Jam Isi\n';
    
    allAttendances.forEach((att, index) => {
        csv += `${index + 1},"${att.nama}","${att.jabatan}","${att.regional}","${att.sekolah}","${att.status}","${att.keterangan || ''}","${att.tanggal}","${att.jamIsi}"\n`;
    });
    
    // Create download link
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `absensi-foksi-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showNotification('Data berhasil diexport ke CSV', 'success');
}

// Global functions for member actions
window.viewMember = async function(memberId) {
    try {
        // Find member data
        const member = allMembers.find(m => m.id === memberId);
        if (!member) return;
        
        // Get member's attendance history
        const attendanceResult = await getAttendanceHistory(memberId);
        
        // Show modal
        const modalTitle = document.getElementById('modalTitle');
        const modalBody = document.getElementById('modalBody');
        const memberModal = document.getElementById('memberModal');
        
        modalTitle.textContent = 'Detail Anggota';
        
        let attendanceHtml = '<p>Belum ada riwayat absensi</p>';
        if (attendanceResult.success && attendanceResult.data.length > 0) {
            attendanceHtml = '<ul style="padding-left: 20px;">';
            attendanceResult.data.slice(0, 5).forEach(att => {
                attendanceHtml += `<li>${att.tanggal} - ${att.status} - ${att.jamIsi}</li>`;
            });
            attendanceHtml += '</ul>';
        }
        
        modalBody.innerHTML = `
            <div class="member-details">
                <div style="display: flex; align-items: center; margin-bottom: 20px;">
                    <div class="user-avatar" style="width: 60px; height: 60px; font-size: 1.5rem;">
                        ${member.nama.charAt(0).toUpperCase()}
                    </div>
                    <div style="margin-left: 15px;">
                        <h4 style="margin: 0;">${member.nama}</h4>
                        <p style="margin: 5px 0; color: #666;">${member.email}</p>
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label>Jabatan:</label>
                        <p style="margin: 5px 0;">${member.jabatan || '-'}</p>
                    </div>
                    <div class="form-group">
                        <label>Regional:</label>
                        <p style="margin: 5px 0;">${member.regional || '-'}</p>
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label>Sekolah/Instansi:</label>
                        <p style="margin: 5px 0;">${member.sekolah || '-'}</p>
                    </div>
                    <div class="form-group">
                        <label>Telepon:</label>
                        <p style="margin: 5px 0;">${member.telepon || '-'}</p>
                    </div>
                </div>
                
                <div style="margin-top: 20px;">
                    <h5>Riwayat Absensi Terbaru</h5>
                    ${attendanceHtml}
                </div>
            </div>
        `;
        
        memberModal.style.display = 'block';
        
    } catch (error) {
        console.error('View member error:', error);
        showNotification('Gagal memuat detail anggota', 'error');
    }
};

window.editMember = function(memberId) {
    // Find member data
    const member = allMembers.find(m => m.id === memberId);
    if (!member) return;
    
    // Show edit modal (simplified for this example)
    showNotification('Fitur edit anggota dalam pengembangan', 'info');
};

window.deleteMember = async function(memberId) {
    if (!confirm('Apakah Anda yakin ingin menghapus anggota ini?')) {
        return;
    }
    
    try {
        const result = await deleteUser(memberId);
        if (result.success) {
            showNotification('Anggota berhasil dihapus', 'success');
            await loadMembersTable();
            await loadDashboardData(); // Refresh stats
        }
    } catch (error) {
        console.error('Delete member error:', error);
        showNotification('Gagal menghapus anggota', 'error');
    }
};

// Helper function to get time ago
function getTimeAgo(timestamp) {
    if (!timestamp) return 'Beberapa saat yang lalu';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    
    let interval = Math.floor(seconds / 31536000);
    if (interval >= 1) return interval + ' tahun yang lalu';
    
    interval = Math.floor(seconds / 2592000);
    if (interval >= 1) return interval + ' bulan yang lalu';
    
    interval = Math.floor(seconds / 86400);
    if (interval >= 1) return interval + ' hari yang lalu';
    
    interval = Math.floor(seconds / 3600);
    if (interval >= 1) return interval + ' jam yang lalu';
    
    interval = Math.floor(seconds / 60);
    if (interval >= 1) return interval + ' menit yang lalu';
    
    return 'Beberapa detik yang lalu';
}