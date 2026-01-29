// auth.js
import { auth, db } from './firebase-config.js';
import { 
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    sendPasswordResetEmail,
    sendEmailVerification,
    onAuthStateChanged,
    updateProfile
} from "https://www.gstatic.com/firebasejs/12.8.0/firebase-auth.js";
import {
    doc,
    setDoc,
    getDoc,
    collection,
    addDoc,
    query,
    where,
    getDocs,
    updateDoc,
    deleteDoc,
    Timestamp,
    orderBy,
    limit,
    getCountFromServer
} from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";

// Show notification function
function showNotification(message, type = 'info') {
    // Check if notification container exists
    let notificationContainer = document.getElementById('notification-container');
    
    if (!notificationContainer) {
        notificationContainer = document.createElement('div');
        notificationContainer.id = 'notification-container';
        notificationContainer.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
            max-width: 400px;
        `;
        document.body.appendChild(notificationContainer);
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.style.cssText = `
        background: ${type === 'success' ? '#4caf50' : type === 'error' ? '#f44336' : type === 'warning' ? '#ff9800' : '#2196f3'};
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        margin-bottom: 10px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        display: flex;
        align-items: center;
        gap: 10px;
        animation: slideIn 0.3s ease;
        min-width: 300px;
    `;
    
    // Add icon based on type
    let icon = 'info-circle';
    if (type === 'success') icon = 'check-circle';
    if (type === 'error') icon = 'exclamation-circle';
    if (type === 'warning') icon = 'exclamation-triangle';
    
    notification.innerHTML = `
        <i class="fas fa-${icon}" style="font-size: 1.2rem;"></i>
        <div style="flex: 1;">${message}</div>
        <button class="close-notification" style="background: none; border: none; color: white; cursor: pointer;">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    // Add to container
    notificationContainer.appendChild(notification);
    
    // Add close functionality
    const closeBtn = notification.querySelector('.close-notification');
    closeBtn.addEventListener('click', () => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    });
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }
    }, 5000);
}

// Add CSS for notifications
if (!document.getElementById('notification-styles')) {
    const style = document.createElement('style');
    style.id = 'notification-styles';
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        @keyframes slideOut {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(100%);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
}

// User Authentication Functions
export async function loginUser(email, password, role) {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Get user data from Firestore
        const userDoc = await getDoc(doc(db, "users", user.uid));
        
        if (!userDoc.exists()) {
            throw new Error('User data not found in database');
        }
        
        const userData = userDoc.data();
        
        // Check if role matches
        if (role && userData.role !== role) {
            await signOut(auth);
            throw new Error(`You are registered as ${userData.role}, not ${role}`);
        }
        
        // Store user data in sessionStorage
        sessionStorage.setItem('currentUser', JSON.stringify({
            uid: user.uid,
            email: user.email,
            ...userData
        }));
        
        showNotification('Login successful!', 'success');
        return { success: true, user: userData };
        
    } catch (error) {
        console.error('Login error:', error);
        const errorMessage = getErrorMessage(error.code) || error.message;
        showNotification(errorMessage, 'error');
        return { success: false, error: errorMessage };
    }
}

export async function registerUser(userData) {
    try {
        // Create user in Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(
            auth,
            userData.email,
            userData.password
        );
        
        const user = userCredential.user;
        
        // Send email verification
        await sendEmailVerification(user);
        
        // Save user data to Firestore
        await setDoc(doc(db, "users", user.uid), {
            nama: userData.nama,
            email: userData.email,
            jabatan: userData.jabatan || 'Anggota',
            regional: userData.regional || '-',
            sekolah: userData.sekolah || '-',
            role: userData.role || 'anggota',
            createdAt: Timestamp.now(),
            emailVerified: false
        });
        
        showNotification('User registered successfully! Please verify your email.', 'success');
        return { success: true, uid: user.uid };
        
    } catch (error) {
        console.error('Register error:', error);
        const errorMessage = getErrorMessage(error.code) || error.message;
        showNotification(errorMessage, 'error');
        return { success: false, error: errorMessage };
    }
}

export async function logoutUser() {
    try {
        await signOut(auth);
        sessionStorage.removeItem('currentUser');
        showNotification('Logged out successfully', 'success');
        return true;
    } catch (error) {
        console.error('Logout error:', error);
        showNotification('Logout failed', 'error');
        return false;
    }
}

export function checkAuthState(callback) {
    return onAuthStateChanged(auth, async (user) => {
        if (user) {
            try {
                const userDoc = await getDoc(doc(db, "users", user.uid));
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    callback({
                        loggedIn: true,
                        user: {
                            uid: user.uid,
                            email: user.email,
                            ...userData
                        }
                    });
                } else {
                    callback({ loggedIn: false });
                }
            } catch (error) {
                console.error('Auth state check error:', error);
                callback({ loggedIn: false });
            }
        } else {
            callback({ loggedIn: false });
        }
    });
}

export async function resetPassword(email) {
    try {
        await sendPasswordResetEmail(auth, email, {
            url: window.location.origin + '/reset-password.html',
            handleCodeInApp: true
        });
        showNotification('Password reset email sent!', 'success');
        return { success: true };
    } catch (error) {
        console.error('Reset password error:', error);
        const errorMessage = getErrorMessage(error.code) || error.message;
        showNotification(errorMessage, 'error');
        return { success: false, error: errorMessage };
    }
}

// Attendance Functions
export async function submitAttendance(attendanceData) {
    try {
        const user = JSON.parse(sessionStorage.getItem('currentUser'));
        
        // Check if already attended today
        const today = new Date().toISOString().split('T')[0];
        const attendanceQuery = query(
            collection(db, "attendances"),
            where("userId", "==", user.uid),
            where("tanggal", "==", today)
        );
        
        const existingAttendance = await getDocs(attendanceQuery);
        
        if (!existingAttendance.empty) {
            throw new Error('You have already submitted attendance today');
        }
        
        // Check attendance settings
        const settingsDoc = await getDoc(doc(db, "settings", "attendance"));
        if (!settingsDoc.exists() || !settingsDoc.data().isActive) {
            throw new Error('Attendance is currently closed');
        }
        
        const settings = settingsDoc.data();
        const now = new Date();
        const currentTime = now.getHours().toString().padStart(2, '0') + ':' + 
                          now.getMinutes().toString().padStart(2, '0');
        
        // Check if within time range
        if (currentTime < settings.jamBuka || currentTime > settings.jamTutup) {
            throw new Error('Attendance is only allowed between ' + settings.jamBuka + ' and ' + settings.jamTutup);
        }
        
        // Submit attendance
        const docRef = await addDoc(collection(db, "attendances"), {
            userId: user.uid,
            nama: user.nama,
            jabatan: user.jabatan,
            regional: user.regional,
            sekolah: user.sekolah,
            status: attendanceData.status,
            keterangan: attendanceData.keterangan || '',
            tanggal: today,
            jamIsi: currentTime,
            createdAt: Timestamp.now()
        });
        
        showNotification('Attendance submitted successfully!', 'success');
        return { success: true, id: docRef.id };
        
    } catch (error) {
        console.error('Submit attendance error:', error);
        showNotification(error.message, 'error');
        return { success: false, error: error.message };
    }
}

export async function getAttendanceHistory(userId = null, filters = {}) {
    try {
        let attendanceQuery = collection(db, "attendances");
        
        // Apply filters
        if (userId) {
            attendanceQuery = query(attendanceQuery, where("userId", "==", userId));
        }
        
        if (filters.tanggal) {
            attendanceQuery = query(attendanceQuery, where("tanggal", "==", filters.tanggal));
        }
        
        if (filters.status) {
            attendanceQuery = query(attendanceQuery, where("status", "==", filters.status));
        }
        
        // Order by date descending
        attendanceQuery = query(attendanceQuery, orderBy("createdAt", "desc"));
        
        const querySnapshot = await getDocs(attendanceQuery);
        const attendances = [];
        
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            attendances.push({
                id: doc.id,
                ...data,
                tanggal: data.tanggal,
                jamIsi: data.jamIsi,
                createdAt: data.createdAt?.toDate() || new Date()
            });
        });
        
        return { success: true, data: attendances };
        
    } catch (error) {
        console.error('Get attendance history error:', error);
        return { success: false, error: error.message };
    }
}

export async function getAttendanceStats() {
    try {
        const today = new Date().toISOString().split('T')[0];
        
        // Get today's attendance
        const todayQuery = query(
            collection(db, "attendances"),
            where("tanggal", "==", today)
        );
        
        const todaySnapshot = await getDocs(todayQuery);
        const todayCount = todaySnapshot.size;
        
        // Get total attendance count
        const totalSnapshot = await getCountFromServer(collection(db, "attendances"));
        const totalCount = totalSnapshot.data().count;
        
        // Get user count
        const usersQuery = query(collection(db, "users"), where("role", "==", "anggota"));
        const usersSnapshot = await getCountFromServer(usersQuery);
        const userCount = usersSnapshot.data().count;
        
        // Get attendance rate for today
        const attendanceRate = userCount > 0 ? Math.round((todayCount / userCount) * 100) : 0;
        
        return {
            success: true,
            data: {
                todayCount,
                totalCount,
                userCount,
                attendanceRate
            }
        };
        
    } catch (error) {
        console.error('Get attendance stats error:', error);
        return { success: false, error: error.message };
    }
}

// Admin Functions
export async function getAllUsers(role = null) {
    try {
        let usersQuery = collection(db, "users");
        
        if (role) {
            usersQuery = query(usersQuery, where("role", "==", role));
        }
        
        const querySnapshot = await getDocs(usersQuery);
        const users = [];
        
        querySnapshot.forEach((doc) => {
            users.push({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate() || new Date()
            });
        });
        
        return { success: true, data: users };
        
    } catch (error) {
        console.error('Get all users error:', error);
        return { success: false, error: error.message };
    }
}

export async function updateUser(userId, userData) {
    try {
        await updateDoc(doc(db, "users", userId), userData);
        showNotification('User updated successfully!', 'success');
        return { success: true };
    } catch (error) {
        console.error('Update user error:', error);
        showNotification('Failed to update user', 'error');
        return { success: false, error: error.message };
    }
}

export async function deleteUser(userId) {
    try {
        await deleteDoc(doc(db, "users", userId));
        showNotification('User deleted successfully!', 'success');
        return { success: true };
    } catch (error) {
        console.error('Delete user error:', error);
        showNotification('Failed to delete user', 'error');
        return { success: false, error: error.message };
    }
}

export async function saveAttendanceSettings(settings) {
    try {
        await setDoc(doc(db, "settings", "attendance"), {
            ...settings,
            updatedAt: Timestamp.now()
        });
        showNotification('Attendance settings saved!', 'success');
        return { success: true };
    } catch (error) {
        console.error('Save settings error:', error);
        showNotification('Failed to save settings', 'error');
        return { success: false, error: error.message };
    }
}

export async function getAttendanceSettings() {
    try {
        const docSnap = await getDoc(doc(db, "settings", "attendance"));
        
        if (docSnap.exists()) {
            return { success: true, data: docSnap.data() };
        } else {
            // Default settings
            const defaultSettings = {
                namaKegiatan: "Rapat Rutin FOKSI",
                tanggal: new Date().toISOString().split('T')[0],
                jamBuka: "08:00",
                jamTutup: "17:00",
                isActive: false,
                updatedAt: Timestamp.now()
            };
            
            await saveAttendanceSettings(defaultSettings);
            return { success: true, data: defaultSettings };
        }
        
    } catch (error) {
        console.error('Get settings error:', error);
        return { success: false, error: error.message };
    }
}

export async function checkAttendanceStatus() {
    try {
        const settings = await getAttendanceSettings();
        
        if (!settings.success || !settings.data.isActive) {
            return 'closed';
        }
        
        const now = new Date();
        const today = now.toISOString().split('T')[0];
        const currentTime = now.getHours().toString().padStart(2, '0') + ':' + 
                           now.getMinutes().toString().padStart(2, '0');
        
        // Check date
        if (settings.data.tanggal !== today) {
            return 'closed';
        }
        
        // Check time range
        if (currentTime >= settings.data.jamBuka && currentTime <= settings.data.jamTutup) {
            return 'open';
        }
        
        return 'closed';
        
    } catch (error) {
        console.error('Check attendance status error:', error);
        return 'closed';
    }
}

export async function hasUserAttendedToday(userId) {
    try {
        const today = new Date().toISOString().split('T')[0];
        const attendanceQuery = query(
            collection(db, "attendances"),
            where("userId", "==", userId),
            where("tanggal", "==", today)
        );
        
        const querySnapshot = await getDocs(attendanceQuery);
        return !querySnapshot.empty;
        
    } catch (error) {
        console.error('Check user attendance error:', error);
        return false;
    }
}

// Helper Functions
function getErrorMessage(errorCode) {
    const errorMessages = {
        // Authentication errors
        'auth/invalid-email': 'Email tidak valid',
        'auth/user-disabled': 'Akun dinonaktifkan',
        'auth/user-not-found': 'Pengguna tidak ditemukan',
        'auth/wrong-password': 'Password salah',
        'auth/email-already-in-use': 'Email sudah digunakan',
        'auth/weak-password': 'Password terlalu lemah (minimal 6 karakter)',
        'auth/operation-not-allowed': 'Operasi tidak diizinkan',
        'auth/too-many-requests': 'Terlalu banyak percobaan, coba lagi nanti',
        'auth/network-request-failed': 'Koneksi jaringan bermasalah',
        
        // Firestore errors
        'permission-denied': 'Akses ditolak',
        'not-found': 'Data tidak ditemukan',
        'already-exists': 'Data sudah ada',
        'resource-exhausted': 'Quota terlampaui',
        'failed-precondition': 'Kondisi tidak terpenuhi',
        'aborted': 'Operasi dibatalkan',
        'out-of-range': 'Nilai di luar range',
        'unimplemented': 'Fitur belum diimplementasi',
        'internal': 'Kesalahan internal',
        'unavailable': 'Layanan tidak tersedia',
        'data-loss': 'Data hilang'
    };
    
    return errorMessages[errorCode] || errorCode;
}

// Export all functions
export {
    showNotification,
    getErrorMessage
};