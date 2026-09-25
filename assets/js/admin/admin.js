/* =========================================================
   SMILECARE — ADMIN CONTROL CENTER
   Administration Dashboard
   ========================================================= */

const API_BASE = "https://smilecare-r68s.onrender.com/api";
/* =========================================================
   ELEMENTS
   ========================================================= */

const todayDate = document.getElementById("todayDate");
const adminName = document.getElementById("adminName");

const doctorsPresent = document.getElementById("doctorsPresent");
const receptionPresent = document.getElementById("receptionPresent");
const patientsToday = document.getElementById("patientsToday");
const waitingPatients = document.getElementById("waitingPatients");
const upcomingAppointments = document.getElementById("upcomingAppointments");
const todayRevenue = document.getElementById("todayRevenue");

const staffList = document.getElementById("staffList");
const queueList = document.getElementById("queueList");
const queueBadge = document.getElementById("queueBadge");
const appointmentsList = document.getElementById("appointmentsList");

const recordedRevenue = document.getElementById("recordedRevenue");
const receivedAmount = document.getElementById("receivedAmount");
const financeDifference = document.getElementById("financeDifference");

const doctorReports = document.getElementById("doctorReports");
const receptionReport = document.getElementById("receptionReport");
const financialHandover = document.getElementById("financialHandover");

const criticalAlert = document.getElementById("criticalAlert");
const alertTitle = document.getElementById("alertTitle");
const alertMessage = document.getElementById("alertMessage");

const closeDayMessage = document.getElementById("closeDayMessage");
const closeClinicDayBtn = document.getElementById("closeClinicDayBtn");

const toast = document.getElementById("toast");
const toastIcon = document.getElementById("toastIcon");
const toastTitle = document.getElementById("toastTitle");
const toastMessage = document.getElementById("toastMessage");

const logoutBtn = document.getElementById("logoutBtn");

const moduleView = document.getElementById("moduleView");
const moduleKicker = document.getElementById("moduleKicker");
const moduleTitle = document.getElementById("moduleTitle");
const moduleDescription = document.getElementById("moduleDescription");
const moduleContent = document.getElementById("moduleContent");

/* =========================================================
   ADMIN DATA
   ========================================================= */

let adminDashboardData = null;

let adminOperationsData = [];

/* =========================================================
   SESSION
   ========================================================= */

function getCurrentUser() {
    try {
        const savedUser =
            sessionStorage.getItem("smilecare_user") ||
            localStorage.getItem("smilecare_user");

        if (!savedUser) {
            return null;
        }

        return JSON.parse(savedUser);

    } catch (error) {
        console.error("SESSION ERROR:", error);
        return null;
    }
}

function checkAdminAccess() {
    const user = getCurrentUser();

    if (!user) {
        window.location.href = "../../index.html";
        return null;
    }

    const role = String(user.role || "").toLowerCase();

    if (role !== "admin") {
        showToast(
            "error",
            "تم رفض الدخول",
            "هذه الصفحة مخصصة لحساب المدير."
        );

        setTimeout(() => {
            window.location.href = "../../index.html";
        }, 700);

        return null;
    }

    return user;
}

/* =========================================================
   DATE
   ========================================================= */

function updateDate() {
    if (!todayDate) {
        return;
    }

    const now = new Date();

    todayDate.textContent =
        now.toLocaleDateString("ar-DZ", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric"
        });
}

/* =========================================================
   FORMATTERS
   ========================================================= */

function formatMoney(value) {
    const number = Number(value || 0);

    return (
        number.toLocaleString("ar-DZ", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }) + " دج"
    );
}

function formatTime(value) {
    if (!value) {
        return "--:--";
    }

    const text = String(value);

    return text.length >= 5
        ? text.substring(0, 5)
        : text;
}

function fullName(first, last) {
    return `${first || ""} ${last || ""}`.trim();
}

/* =========================================================
   API
   ========================================================= */
async function apiRequest(url, options = {}) {

    const response = await fetch(
        url,
        options
    );

    if (!response.ok) {

        let message =
            "تعذر تحميل بيانات الإدارة.";

        try {

            const data =
                await response.json();

            message =
                data.error ||
                data.message ||
                message;

        } catch (_) {}

        throw new Error(message);
    }

    return response.json();
}

/* =========================================================
   DASHBOARD
   ========================================================= */

async function loadDashboard() {
    try {
        const data = await apiRequest(
            `${API_BASE}/admin/overview`
        );

        adminDashboardData = data;

        renderDashboard(data);

    } catch (error) {
        console.error(
            "ADMIN DASHBOARD ERROR:",
            error
        );

        showToast(
            "error",
            "مشكلة في الاتصال",
            error.message ||
            "تعذر الاتصال بخادم SmileCare."
        );
    }
}

/* =========================================================
   DASHBOARD RENDER
   ========================================================= */

function renderDashboard(data) {
    if (!data) {
        return;
    }

    renderStats(data.stats || {});
    renderStaff(data.staff || []);
    renderQueue(data.queue || []);
    renderAppointments(data.appointments || []);
    renderFinance(data.finance || {});
    renderReports(data.reports || {});
    renderAlerts(data.alerts || []);
    renderCloseDay(data.closeDay || {});
}

/* =========================================================
   STATS
   ========================================================= */

function renderStats(stats) {

    if (doctorsPresent) {
        doctorsPresent.textContent =
            stats.doctorsPresent ?? 0;
    }

    if (receptionPresent) {
        receptionPresent.textContent =
            stats.receptionPresent ?? 0;
    }

    if (patientsToday) {
        patientsToday.textContent =
            stats.patientsToday ?? 0;
    }

    if (waitingPatients) {
        waitingPatients.textContent =
            stats.waitingPatients ?? 0;
    }

    if (upcomingAppointments) {
        upcomingAppointments.textContent =
            stats.upcomingAppointments ?? 0;
    }

    if (todayRevenue) {
        todayRevenue.textContent =
            formatMoney(stats.todayRevenue);
    }
}

/* =========================================================
   STAFF
   ========================================================= */

function renderStaff(staff) {

    if (!staffList) {
        return;
    }

    if (!staff.length) {
        staffList.innerHTML =
            emptyState(
                "♙",
                "لا يوجد نشاط",
                "لم يتم تسجيل نشاط للموظفين اليوم."
            );

        return;
    }

    staffList.innerHTML =
        staff.map(person => {

            const isDoctor =
                String(person.type || "").toLowerCase() === "doctor";

            const name =
                person.name ||
                "غير معروف";

            const role =
                person.role ||
                (
                    isDoctor
                        ? "طبيب"
                        : "موظف استقبال"
                );

            const status =
                String(
                    person.work_status ||
                    "not_started"
                ).toLowerCase();

            const statusData =
                getStatusData(status);

            return `
                <div class="staff-row">

                    <div class="staff-person">

                        <div class="staff-avatar">
                            ♙
                        </div>

                        <div class="staff-name">

                            <strong>
                                ${escapeHTML(name)}
                            </strong>

                            <span>
                                ${escapeHTML(role)}
                            </span>

                        </div>

                    </div>

                    <span class="status ${statusData.className}">
                        ${statusData.text}
                    </span>

                </div>
            `;

        }).join("");
}

/* =========================================================
   QUEUE
   ========================================================= */

function renderQueue(queue) {

    if (!queueList) {
        return;
    }

    const activeQueue =
        queue.filter(item => {

            return [
                "waiting",
                "called",
                "in_visit"
            ].includes(
                String(
                    item.queue_status || ""
                ).toLowerCase()
            );

        });

    if (queueBadge) {
        queueBadge.textContent =
            activeQueue.length;
    }

    if (!activeQueue.length) {

        queueList.innerHTML =
            emptyState(
                "✓",
                "الطابور فارغ",
                "لا يوجد مرضى ينتظرون حاليًا."
            );

        return;
    }

    queueList.innerHTML =
        activeQueue.map(item => {

            const status =
                String(
                    item.queue_status || ""
                ).toLowerCase();

            let stateText = "في الانتظار";

            if (status === "called") {
                stateText = "تم الاستدعاء";
            }

            if (status === "in_visit") {
                stateText = "داخل العيادة";
            }

            const priority =
                String(
                    item.priority || "normal"
                ).toLowerCase();

            const priorityMark =
                priority === "emergency"
                    ? "🚨 "
                    : priority === "follow_up"
                        ? "↻ "
                        : "";

            const patientName =
                fullName(
                    item.first_name,
                    item.last_name
                ) ||
                "مريض غير معروف";

            const doctorName =
                fullName(
                    item.dentist_first_name,
                    item.dentist_last_name
                ) ||
                "غير معروف";

            return `
                <div class="queue-item">

                    <div class="queue-number">
                        ${item.queue_number ?? "--"}
                    </div>

                    <div class="queue-details">

                        <strong>
                            ${priorityMark}
                            ${escapeHTML(patientName)}
                        </strong>

                        <span>
                            د. ${escapeHTML(doctorName)}
                            ·
                            ${formatTime(item.appointment_time)}
                        </span>

                    </div>

                    <div class="queue-state">
                        ${escapeHTML(stateText)}
                    </div>

                </div>
            `;

        }).join("");
}

/* =========================================================
   APPOINTMENTS
   ========================================================= */

function renderAppointments(appointments) {

    if (!appointmentsList) {
        return;
    }

    if (!appointments.length) {

        appointmentsList.innerHTML =
            emptyState(
                "▣",
                "لا توجد مواعيد قادمة",
                "لا توجد مواعيد مجدولة حاليًا."
            );

        return;
    }

    appointmentsList.innerHTML =
        appointments.map(item => {

            const patient =
                item.patient_name ||
                fullName(
                    item.first_name,
                    item.last_name
                ) ||
                item.booking_name ||
                "مريض غير معروف";

            const doctor =
                fullName(
                    item.dentist_first_name,
                    item.dentist_last_name
                ) ||
                "غير معروف";

            const status =
                String(
                    item.status ||
                    item.booking_status ||
                    "scheduled"
                ).toLowerCase();

            const appointmentDate =
                item.appointment_date
                    ? formatDate(item.appointment_date)
                    : "";

            return `
                <div class="appointment-item">

                    <div class="appointment-time">
                        ${formatTime(item.appointment_time)}
                    </div>

                    <div class="appointment-info">

                        <strong>
                            ${escapeHTML(patient)}
                        </strong>

                        <span>
                            د. ${escapeHTML(doctor)}

                            ${
                                appointmentDate
                                    ? " · " +
                                      escapeHTML(appointmentDate)
                                    : ""
                            }

                            ${
                                item.reason
                                    ? " · " +
                                      escapeHTML(item.reason)
                                    : ""
                            }

                        </span>

                    </div>

                    <div class="appointment-status">
                        ${escapeHTML(
                            formatAppointmentStatus(status)
                        )}
                    </div>

                </div>
            `;

        }).join("");
}

/* =========================================================
   FINANCE
   ========================================================= */

function renderFinance(finance) {

    if (recordedRevenue) {
        recordedRevenue.textContent =
            formatMoney(finance.recordedRevenue);
    }

    if (receivedAmount) {
        receivedAmount.textContent =
            formatMoney(finance.receivedAmount);
    }

    if (financeDifference) {

        const difference =
            Number(finance.difference || 0);

        financeDifference.textContent =
            formatMoney(difference);

        financeDifference.className =
            difference === 0
                ? "success-text"
                : "warning-text";
    }
}

/* =========================================================
   REPORTS
   ========================================================= */

function renderReports(reports) {

    if (doctorReports) {
        doctorReports.textContent =
            formatReportStatus(
                reports.doctorReports
            );
    }

    if (receptionReport) {
        receptionReport.textContent =
            formatReportStatus(
                reports.receptionReport
            );
    }

    if (financialHandover) {
        financialHandover.textContent =
            formatReportStatus(
                reports.financialHandover
            );
    }
}

function formatReportStatus(status) {

    const value =
        String(
            status || "pending"
        ).toLowerCase();

    if (
        value === "done" ||
        value === "completed" ||
        value === "approved"
    ) {
        return "✓ مكتمل";
    }

    return "قيد الانتظار";
}

/* =========================================================
   ALERTS
   ========================================================= */

function renderAlerts(alerts) {

    if (!criticalAlert) {
        return;
    }

    if (!alerts || !alerts.length) {

        criticalAlert.classList.remove("show");
        criticalAlert.classList.add("hidden");

        return;
    }

    criticalAlert.classList.remove("hidden");
    criticalAlert.classList.add("show");

    const first = alerts[0];

    if (alertTitle) {
        alertTitle.textContent =
            first.title ||
            "تنبيه يحتاج إلى انتباه";
    }

    if (alertMessage) {
        alertMessage.textContent =
            first.message ||
            "هناك مشكلة تحتاج إلى معالجة.";
    }
}

/* =========================================================
   CLOSE DAY
   ========================================================= */

function renderCloseDay(closeDay) {

    if (!closeDayMessage) {
        return;
    }

    const ready =
        closeDay.ready === true;

    if (ready) {

        closeDayMessage.textContent =
            "جميع الفحوصات والتقارير المطلوبة مكتملة. يمكن إغلاق يوم العيادة.";

        if (closeClinicDayBtn) {

            closeClinicDayBtn.disabled =
                false;

            closeClinicDayBtn.innerHTML =
                "✓ إغلاق يوم العيادة";
        }

    } else {

        closeDayMessage.textContent =
            closeDay.message ||
            "لا تزال بعض التقارير أو عمليات التسليم مطلوبة.";

        if (closeClinicDayBtn) {

            closeClinicDayBtn.disabled =
                true;

            closeClinicDayBtn.innerHTML =
                "🔒 إغلاق يوم العيادة";
        }
    }
}

/* =========================================================
   STATUS
   ========================================================= */

function getStatusData(status) {

    switch (String(status || "").toLowerCase()) {

        case "working":
        case "present":

            return {
                className: "working",
                text: "يعمل الآن"
            };

        case "closed":

            return {
                className: "not-started",
                text: "أنهى الدوام"
            };

        case "absent":

            return {
                className: "absent",
                text: "غائب"
            };

        case "not_started":
        default:

            return {
                className: "not-started",
                text: "لم يبدأ الدوام"
            };
    }
}

/* =========================================================
   APPOINTMENT STATUS
   ========================================================= */

function formatAppointmentStatus(status) {

    switch (String(status || "").toLowerCase()) {

        case "confirmed":
            return "مؤكد";

        case "completed":
            return "مكتمل";

        case "cancelled":
            return "ملغى";

        case "pending":
            return "قيد الانتظار";

        case "scheduled":
        default:
            return "مجدول";
    }
}

/* =========================================================
   DATE FORMAT
   ========================================================= */

function formatDate(value) {

    if (!value) {
        return "";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return String(value);
    }

    return date.toLocaleDateString(
        "ar-DZ",
        {
            month: "short",
            day: "numeric"
        }
    );
}

/* =========================================================
   EMPTY STATE
   ========================================================= */

function emptyState(icon, title, message) {

    return `
        <div class="empty-state">

            <div class="empty-state-icon">
                ${icon}
            </div>

            <strong>
                ${escapeHTML(title)}
            </strong>

            <span>
                ${escapeHTML(message)}
            </span>

        </div>
    `;
}

/* =========================================================
   ESCAPE HTML
   ========================================================= */

function escapeHTML(value) {

    if (
        value === null ||
        value === undefined
    ) {
        return "";
    }

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

/* =========================================================
   TOAST
   ========================================================= */

function showToast(type, title, message) {

    if (!toast) {
        return;
    }

    toast.classList.add("show");

    if (toastTitle) {
        toastTitle.textContent = title;
    }

    if (toastMessage) {
        toastMessage.textContent = message;
    }

    if (toastIcon) {

        toastIcon.textContent =
            type === "error"
                ? "!"
                : type === "info"
                    ? "i"
                    : "✓";
    }

    clearTimeout(window.adminToastTimer);

    window.adminToastTimer =
        setTimeout(() => {

            toast.classList.remove("show");

        }, 4000);
}

/* =========================================================
   ADMIN MODULES
   ========================================================= */

const adminModules = {

    doctors: {
        title: "الأطباء",
        kicker: "الفريق الطبي",
        description:
            "إدارة الأطباء والحضور والتخصصات وحالة التوفر."
    },


    doctorLeaves: {
    title: "إجازات الأطباء",
    kicker: "إدارة الإجازات",
    description:
        "مراجعة طلبات إجازات الأطباء والموافقة عليها أو رفضها."
},

    staff: {
        title: "الموظفون",
        kicker: "موظفو العيادة",
        description:
            "إدارة موظفي الاستقبال والحسابات والحضور اليومي."
    },

    patients: {
        title: "المرضى",
        kicker: "إدارة المرضى",
        description:
            "إدارة معلومات المرضى والبيانات الإدارية."
    },

    appointments: {
        title: "المواعيد",
        kicker: "إدارة المواعيد",
        description:
            "متابعة وإدارة جدول مواعيد العيادة."
    },

    operations: {
        title: "العمليات",
        kicker: "التشغيل المباشر",
        description:
            "متابعة حركة المرضى والطابور وحالة تشغيل العيادة."
    },

    rooms: {
        title: "الغرف",
        kicker: "مرافق العيادة",
        description:
            "متابعة غرف العلاج وحالة توفرها."
    },

    finance: {
        title: "المالية",
        kicker: "التحكم المالي",
        description:
            "متابعة الإيرادات والمدفوعات والوضع المالي للعيادة."
    },

    reports: {
        title: "التقارير",
        kicker: "التقارير الإدارية",
        description:
            "مراجعة تقارير العيادة والملخصات الإدارية اليومية."
    },

    settings: {
        title: "الإعدادات",
        kicker: "إعدادات النظام",
        description:
            "إدارة إعدادات SmileCare وخيارات النظام."
    }
};

/* =========================================================
   OVERVIEW VISIBILITY
   ========================================================= */

const overviewSelectors =
    ".stats-grid, .dashboard-grid, .appointments-panel, .close-day-panel";

function setOverviewVisibility(show) {
    document
        .querySelectorAll(overviewSelectors)
        .forEach(section => {
            section.style.display = show ? "" : "none";
        });

    if (criticalAlert) {
        criticalAlert.style.display = show ? "" : "none";
    }

    const topHeader = document.querySelector(".top-header");

    if (topHeader) {
        topHeader.style.display = show ? "" : "none";
    }
}

function showAdminOverview() {

    setOverviewVisibility(true);

    if (moduleView) {

        moduleView.classList.add("hidden");
        moduleView.style.display = "none";
    }

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}

/* =========================================================
   DOCTORS MODULE
   ========================================================= */
async function renderDoctorsModule() {

    if (!moduleContent) {
        return;
    }

    moduleContent.innerHTML = `
        <div
            dir="rtl"
            style="
                width:100%;
                background:#ffffff;
                border:1px solid #e5e7eb;
                border-radius:20px;
                padding:28px;
                box-sizing:border-box;
            "
        >
            <div style="
                display:flex;
                justify-content:space-between;
                align-items:center;
                gap:20px;
                margin-bottom:28px;
                flex-wrap:wrap;
            ">

                <div>
                    <h2 style="
                        margin:0 0 7px;
                        color:#1f2937;
                        font-size:25px;
                        font-weight:800;
                    ">
                        إدارة الأطباء
                    </h2>

                    <p style="
                        margin:0;
                        color:#6b7280;
                        font-size:14px;
                    ">
                        متابعة بيانات الأطباء وحساباتهم وحالة دوامهم اليومية.
                    </p>
                </div>

                <button
                    type="button"
                    id="refreshDoctorsBtn"
                    style="
                        border:0;
                        background:#eff6ff;
                        color:#2563eb;
                        padding:11px 18px;
                        border-radius:10px;
                        cursor:pointer;
                        font-weight:700;
                    "
                >
                    ↻ تحديث
                </button>

            </div>

            <div
                id="doctorsLoading"
                style="
                    padding:60px 20px;
                    text-align:center;
                    color:#6b7280;
                    font-size:15px;
                "
            >
                جاري تحميل بيانات الأطباء...
            </div>

            <div id="doctorsContent"></div>

        </div>
    `;

    const refreshButton =
        document.getElementById("refreshDoctorsBtn");

    if (refreshButton) {
        refreshButton.addEventListener(
            "click",
            () => {
                renderDoctorsModule();
            }
        );
    }

    try {

        const doctors =
            await apiRequest(
                `${API_BASE}/admin/doctors`
            );


            window.adminDoctorsList = doctors;


        renderDoctorsList(doctors);

    } catch (error) {

        console.error(
            "ADMIN DOCTORS MODULE ERROR:",
            error
        );

        const loading =
            document.getElementById(
                "doctorsLoading"
            );

        if (loading) {

            loading.innerHTML = `
                <div style="
                    color:#dc2626;
                    background:#fef2f2;
                    padding:20px;
                    border-radius:12px;
                ">
                    تعذر تحميل بيانات الأطباء.
                    <br>
                    ${escapeHTML(error.message || "")}
                </div>
            `;
        }
    }
}

async function renderDoctorLeavesModule() {

    if (!moduleContent) {
        return;
    }

    moduleContent.innerHTML = `
        <div
            dir="rtl"
            style="
                width:100%;
                background:#ffffff;
                border:1px solid #e5e7eb;
                border-radius:20px;
                padding:28px;
                box-sizing:border-box;
            "
        >

            <div style="
                display:flex;
                justify-content:space-between;
                align-items:center;
                gap:20px;
                margin-bottom:28px;
                flex-wrap:wrap;
            ">

                <div>
                    <h2 style="
                        margin:0 0 7px;
                        color:#1f2937;
                        font-size:25px;
                        font-weight:800;
                    ">
                        🗓️ إجازات الأطباء
                    </h2>

                    <p style="
                        margin:0;
                        color:#6b7280;
                        font-size:14px;
                    ">
                        مراجعة طلبات الإجازات واتخاذ القرار الإداري المناسب.
                    </p>
                </div>

                <button
                    type="button"
                    id="refreshDoctorLeavesBtn"
                    style="
                        border:0;
                        background:#eff6ff;
                        color:#2563eb;
                        padding:11px 18px;
                        border-radius:10px;
                        cursor:pointer;
                        font-weight:700;
                    "
                >
                    ↻ تحديث
                </button>

            </div>

            <div
                id="doctorLeavesLoading"
                style="
                    padding:60px 20px;
                    text-align:center;
                    color:#6b7280;
                    font-size:15px;
                "
            >
                جاري تحميل طلبات الإجازات...
            </div>

            <div id="doctorLeavesContent"></div>

        </div>
    `;

    const refreshButton =
        document.getElementById(
            "refreshDoctorLeavesBtn"
        );

    if (refreshButton) {

        refreshButton.addEventListener(
            "click",
            () => {
                renderDoctorLeavesModule();
            }
        );

    }

    try {

        const data =
            await apiRequest(
                `${API_BASE}/admin/doctor-leaves`
            );

        renderDoctorLeavesList(
            data
        );

    } catch (error) {

        console.error(
            "ADMIN DOCTOR LEAVES MODULE ERROR:",
            error
        );

        const loading =
            document.getElementById(
                "doctorLeavesLoading"
            );

        if (loading) {

            loading.innerHTML = `
                <div style="
                    color:#dc2626;
                    background:#fef2f2;
                    padding:20px;
                    border-radius:12px;
                ">
                    تعذر تحميل طلبات الإجازات.
                    <br>
                    ${escapeHTML(
                        error.message || ""
                    )}
                </div>
            `;

        }

    }

}

function renderDoctorLeavesList(data) {

    const loading =
        document.getElementById(
            "doctorLeavesLoading"
        );

    const content =
        document.getElementById(
            "doctorLeavesContent"
        );

    if (loading) {
        loading.style.display = "none";
    }

    if (!content) {
        return;
    }

    const summary =
        data?.summary || {};

    const requests =
        Array.isArray(data?.requests)
            ? data.requests
            : [];

    content.innerHTML = `

        <!-- SUMMARY -->

        <div
            style="
                display:grid;
                grid-template-columns:
                    repeat(auto-fit,minmax(180px,1fr));
                gap:15px;
                margin-bottom:25px;
            "
        >

            <div style="
                background:#f8fafc;
                border:1px solid #e5e7eb;
                border-radius:15px;
                padding:20px;
            ">

                <div style="
                    color:#6b7280;
                    font-size:13px;
                    margin-bottom:8px;
                ">
                    إجمالي الطلبات
                </div>

                <strong style="
                    font-size:28px;
                    color:#1f2937;
                ">
                    ${summary.total || 0}
                </strong>

            </div>


            <div style="
                background:#fff7ed;
                border:1px solid #fed7aa;
                border-radius:15px;
                padding:20px;
            ">

                <div style="
                    color:#c2410c;
                    font-size:13px;
                    margin-bottom:8px;
                ">
                    قيد الانتظار
                </div>

                <strong style="
                    font-size:28px;
                    color:#c2410c;
                ">
                    ${summary.pending || 0}
                </strong>

            </div>


            <div style="
                background:#ecfdf5;
                border:1px solid #a7f3d0;
                border-radius:15px;
                padding:20px;
            ">

                <div style="
                    color:#047857;
                    font-size:13px;
                    margin-bottom:8px;
                ">
                    مقبولة
                </div>

                <strong style="
                    font-size:28px;
                    color:#047857;
                ">
                    ${summary.approved || 0}
                </strong>

            </div>


            <div style="
                background:#fef2f2;
                border:1px solid #fecaca;
                border-radius:15px;
                padding:20px;
            ">

                <div style="
                    color:#b91c1c;
                    font-size:13px;
                    margin-bottom:8px;
                ">
                    مرفوضة
                </div>

                <strong style="
                    font-size:28px;
                    color:#b91c1c;
                ">
                    ${summary.rejected || 0}
                </strong>

            </div>

        </div>


        ${
            requests.length === 0

                ? `

                    <div style="
                        padding:45px 20px;
                        text-align:center;
                        background:#f8fafc;
                        border-radius:15px;
                        color:#6b7280;
                    ">
                        لا توجد طلبات إجازة.
                    </div>

                  `

                : `

                    <div style="
                        overflow-x:auto;
                        border:1px solid #e5e7eb;
                        border-radius:15px;
                    ">

                        <table style="
                            width:100%;
                            border-collapse:collapse;
                            min-width:900px;
                        ">

                            <thead>

                                <tr style="
                                    background:#f8fafc;
                                ">

                                    <th style="
                                        padding:15px;
                                        text-align:right;
                                        color:#374151;
                                    ">
                                        الطبيب
                                    </th>

                                    <th style="
                                        padding:15px;
                                        text-align:right;
                                        color:#374151;
                                    ">
                                        التخصص
                                    </th>

                                    <th style="
                                        padding:15px;
                                        text-align:right;
                                        color:#374151;
                                    ">
                                        بداية الإجازة
                                    </th>

                                    <th style="
                                        padding:15px;
                                        text-align:right;
                                        color:#374151;
                                    ">
                                        نهاية الإجازة
                                    </th>

                                    <th style="
                                        padding:15px;
                                        text-align:right;
                                        color:#374151;
                                    ">
                                        السبب
                                    </th>

                                    <th style="
                                        padding:15px;
                                        text-align:right;
                                        color:#374151;
                                    ">
                                        الحالة
                                    </th>

                                    <th style="
                                        padding:15px;
                                        text-align:right;
                                        color:#374151;
                                    ">
                                        الإجراء
                                    </th>

                                </tr>

                            </thead>


                            <tbody>

                                ${requests.map(request => {

                                    const statusColor =
                                        request.status === "pending"
                                            ? "#c2410c"
                                            : request.status === "approved"
                                            ? "#047857"
                                            : "#b91c1c";

                                    const statusBackground =
                                        request.status === "pending"
                                            ? "#fff7ed"
                                            : request.status === "approved"
                                            ? "#ecfdf5"
                                            : "#fef2f2";


                                    return `

                                        <tr style="
    border-top:1px solid #e5e7eb;
">

                                            <td style="
                                                padding:15px;
                                                font-weight:700;
                                                color:#1f2937;
                                            ">
                                                ${escapeHTML(
                                                    request.doctor_name ||
                                                    "غير معروف"
                                                )}
                                            </td>


                                            <td style="
                                                padding:15px;
                                                color:#6b7280;
                                            ">
                                                ${escapeHTML(
                                                    request.specialty ||
                                                    "غير محدد"
                                                )}
                                            </td>


                                            <td style="
                                                padding:15px;
                                                color:#374151;
                                            ">
                                                ${formatArabicDate(
                                                    request.start_date
                                                )}
                                            </td>


                                            <td style="
                                                padding:15px;
                                                color:#374151;
                                            ">
                                                ${formatArabicDate(
                                                    request.end_date
                                                )}
                                            </td>


                                            <td style="
                                                padding:15px;
                                                color:#374151;
                                            ">
                                                ${escapeHTML(
                                                    request.reason ||
                                                    "بدون سبب"
                                                )}
                                            </td>


                                            <td style="
                                                padding:15px;
                                            ">

                                                <span style="
                                                    display:inline-block;
                                                    padding:6px 11px;
                                                    border-radius:999px;
                                                    background:${statusBackground};
                                                    color:${statusColor};
                                                    font-size:12px;
                                                    font-weight:700;
                                                ">

                                                    ${escapeHTML(
                                                        request.status_label ||
                                                        "غير معروف"
                                                    )}

                                                </span>

                                            </td>


                                            <td style="
                                                padding:15px;
                                            ">

                                                ${
                                                    request.status === "pending"

                                                        ? `

                                                            <div style="
                                                                display:flex;
                                                                gap:8px;
                                                                flex-wrap:wrap;
                                                            ">

                                                                <button
                                                                    type="button"
                                                                    class="approve-leave-btn"
                                                                    data-leave-id="request.id"
                                                                    style="
                                                                        border:0;
                                                                        background:#10b981;
                                                                        color:white;
                                                                        padding:8px 13px;
                                                                        border-radius:8px;
                                                                        cursor:pointer;
                                                                        font-weight:700;
                                                                    "
                                                                >
                                                                    ✓ موافقة
                                                                </button>


                                                                <button
                                                                    type="button"
                                                                    class="reject-leave-btn"
                                                                    data-leave-id="${request.id}"
                                                                    style="
                                                                        border:0;
                                                                        background:#ef4444;
                                                                        color:white;
                                                                        padding:8px 13px;
                                                                        border-radius:8px;
                                                                        cursor:pointer;
                                                                        font-weight:700;
                                                                    "
                                                                >
                                                                    ✕ رفض
                                                                </button>

                                                            </div>

                                                          `

                                                        : request.status === "approved"

                                                        ? `

                                                            <div style="
                                                                display:flex;
                                                                flex-direction:column;
                                                                gap:8px;
                                                                align-items:flex-start;
                                                            ">

                                                                <span style="
                                                                    color:#047857;
                                                                    font-size:13px;
                                                                    font-weight:700;
                                                                ">
                                                                    ✓ تم قبول الإجازة
                                                                </span>
                                                                  
                                                                <button
    type="button"
    class="show-leave-actions-btn"
    data-leave-id="${request.id}"
    style="
        border:0;
        background:#64748b;
        color:white;
        padding:8px 12px;
        border-radius:8px;
        cursor:pointer;
        font-weight:700;
    "
>
    📋 سجل الإجراءات
</button>  




                                                                <button
                                                                    type="button"
                                                                    class="show-leave-conflicts-btn"
                                                                    data-leave-id="${request.id}"
                                                                    style="
                                                                        border:0;
                                                                        background:#f59e0b;
                                                                        color:white;
                                                                        padding:8px 12px;
                                                                        border-radius:8px;
                                                                        cursor:pointer;
                                                                        font-weight:700;
                                                                    "
                                                                >
                                                                    ⚠️ فحص التعارضات
                                                                </button>

                                                            </div>

                                                          `

                                                        : `

                                                            <span style="
                                                                color:#9ca3af;
                                                                font-size:13px;
                                                            ">
                                                                تم اتخاذ القرار
                                                            </span>

                                                          `
                                                }

                                            </td>

                                        </tr>

                                    `;

                                }).join("")}

                            </tbody>

                        </table>

                    </div>

                  `
        }

    `;


    /*
     * APPROVE BUTTONS
     */

    document
        .querySelectorAll(
            ".approve-leave-btn"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    decideDoctorLeave(
                        button.dataset.leaveId,
                        "approved"
                    );

                }
            );

        });


    /*
     * REJECT BUTTONS
     */

    document
        .querySelectorAll(
            ".reject-leave-btn"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    decideDoctorLeave(
                        button.dataset.leaveId,
                        "rejected"
                    );

                }
            );

        });


    /*
     * CONFLICT BUTTONS
     */

        /*
     * CONFLICT BUTTONS
     */

    document
        .querySelectorAll(
            ".show-leave-conflicts-btn"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    showDoctorLeaveConflicts(
                        button.dataset.leaveId
                    );

                }
            );

        });


    /*
     * ACTION HISTORY BUTTONS
     */

    document
        .querySelectorAll(
            ".show-leave-actions-btn"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    showDoctorLeaveActions(
                        button.dataset.leaveId
                    );

                }
            );

        });



}




async function loadDoctorLeaveConflicts(leaveId) {

    try {

        const data =
            await apiRequest(
                `${API_BASE}/admin/doctor-leaves/${leaveId}/conflicts`
            );

        return data || {
            summary: {
                totalConflicts: 0
            },
            appointments: []
        };

    } catch (error) {

        console.error(
            "DOCTOR LEAVE CONFLICTS ERROR:",
            error
        );

        showToast(
            error.message ||
            "تعذر تحميل المواعيد المتعارضة.",
            "error"
        );

        return {
            summary: {
                totalConflicts: 0
            },
            appointments: []
        };
    }
}


async function loadDoctorLeaveActions(leaveId) {

    try {

        const data = await apiRequest(
            `${API_BASE}/admin/doctor-leaves/${leaveId}/actions`
        );

        return data || {
            summary: {
                total: 0,
                contactedPatients: 0
            },
            actions: []
        };

    } catch (error) {

        console.error(
            "DOCTOR LEAVE ACTIONS ERROR:",
            error
        );

        showToast(
            error.message ||
            "تعذر تحميل سجل الإجراءات.",
            "error"
        );

        return {
            summary: {
                total: 0,
                contactedPatients: 0
            },
            actions: []
        };

    }

}



async function showDoctorLeaveActions(leaveId) {

    const existing =
        document.getElementById(
            `leave-actions-${leaveId}`
        );

    if (existing) {
        existing.remove();
        return;
    }

    const data =
        await loadDoctorLeaveActions(
            leaveId
        );

    const actions =
        Array.isArray(data?.actions)
            ? data.actions
            : [];

    const requestRow =
        document.querySelector(
            `.leave-request-row[data-leave-id="${leaveId}"]`
        );

    if (!requestRow) {
        return;
    }

    const box =
        document.createElement("div");

    box.id =
        `leave-actions-${leaveId}`;

    box.style.cssText = `
        margin:0 15px 15px;
        padding:18px;
        background:#f8fafc;
        border:1px solid #e5e7eb;
        border-radius:12px;
    `;

    if (actions.length === 0) {

        box.innerHTML = `
            <div style="
                color:#6b7280;
                font-size:13px;
            ">
                لا توجد إجراءات مسجلة لهذه الإجازة حتى الآن.
            </div>
        `;

    } else {

        box.innerHTML = `

            <div style="
                font-size:16px;
                font-weight:800;
                color:#1f2937;
                margin-bottom:15px;
            ">
                📋 سجل إجراءات الإجازة
            </div>

            <div style="
                display:grid;
                gap:12px;
            ">

                ${actions.map(action => {

                    const actionColor =
                        action.action_type === "cancel"
                            ? "#b91c1c"
                            : action.action_type === "transfer"
                            ? "#4338ca"
                            : action.action_type === "reschedule"
                            ? "#1d4ed8"
                            : "#047857";

                    const actionBackground =
                        action.action_type === "cancel"
                            ? "#fef2f2"
                            : action.action_type === "transfer"
                            ? "#eef2ff"
                            : action.action_type === "reschedule"
                            ? "#eff6ff"
                            : "#ecfdf5";

                    return `

                        <div style="
                            background:#fff;
                            border:1px solid #e5e7eb;
                            border-radius:10px;
                            padding:15px;
                        ">

                            <div style="
                                display:flex;
                                justify-content:space-between;
                                align-items:center;
                                gap:10px;
                                flex-wrap:wrap;
                                margin-bottom:10px;
                            ">

                                <strong style="
                                    color:#1f2937;
                                ">
                                    ${escapeHTML(
                                        action.action_label ||
                                        "إجراء"
                                    )}
                                </strong>

                                <span style="
                                    background:${actionBackground};
                                    color:${actionColor};
                                    padding:5px 9px;
                                    border-radius:999px;
                                    font-size:12px;
                                    font-weight:700;
                                ">
                                    ${escapeHTML(
                                        action.action_label ||
                                        "إجراء"
                                    )}
                                </span>

                            </div>


                            <div style="
                                display:grid;
                                grid-template-columns:
                                    repeat(auto-fit,minmax(180px,1fr));
                                gap:8px;
                                color:#4b5563;
                                font-size:13px;
                            ">

                                <div>
                                    👤
                                    <strong>المريض:</strong>
                                    ${escapeHTML(
                                        action.patient_name ||
                                        "غير معروف"
                                    )}
                                </div>


                                <div>
                                    📞
                                    <strong>الهاتف:</strong>
                                    ${escapeHTML(
                                        action.patient_phone ||
                                        "غير متوفر"
                                    )}
                                </div>


                                ${
                                    action.new_dentist_name
                                        ? `
                                            <div>
                                                👨‍⚕️
                                                <strong>
                                                    الطبيب الجديد:
                                                </strong>
                                                ${escapeHTML(
                                                    action.new_dentist_name
                                                )}
                                            </div>
                                          `
                                        : ""
                                }


                                ${
                                    Number(
                                        action.patient_contacted
                                    ) === 1
                                        ? `
                                            <div style="
                                                color:#047857;
                                                font-weight:700;
                                            ">
                                                ✓ تم التواصل مع المريض
                                            </div>
                                          `
                                        : ""
                                }

                            </div>


                            ${
                                action.notes
                                    ? `
                                        <div style="
                                            margin-top:10px;
                                            color:#6b7280;
                                        ">
                                            <strong>
                                                الملاحظات:
                                            </strong>

                                            ${escapeHTML(
                                                action.notes
                                            )}
                                        </div>
                                      `
                                    : ""
                            }

                        </div>

                    `;

                }).join("")}

            </div>

        `;

    }

    requestRow.after(box);

}


async function showDoctorLeaveConflicts(leaveId) {

    const requestId =
        Number(leaveId);

    if (!requestId) {
        return;
    }


    const existingBox =
        document.getElementById(
            `leave-conflicts-${requestId}`
        );


    /*
     * إذا كان القسم مفتوحًا بالفعل
     * نغلقه
     */

    if (existingBox) {

        existingBox.remove();

        return;
    }


    const button =
        document.querySelector(
            `.show-leave-conflicts-btn[data-leave-id="${requestId}"]`
        );


    if (button) {

        button.disabled = true;

        button.textContent =
            "جاري الفحص...";

    }


    const data =
        await loadDoctorLeaveConflicts(
            requestId
        );


    if (button) {

        button.disabled = false;

        button.textContent =
            "⚠️ فحص التعارضات";

    }


    const appointments =
        Array.isArray(
            data?.appointments
        )
            ? data.appointments
            : [];


    const totalConflicts =
        Number(
            data?.summary?.totalConflicts || 0
        );


    const requestRow =
        document.querySelector(
            `.leave-request-row[data-leave-id="${requestId}"]`
        );


    if (!requestRow) {

        return;
    }


    const box =
        document.createElement("div");


    box.id =
        `leave-conflicts-${requestId}`;


    box.style.cssText = `
        margin: 0 15px 15px;
        padding: 18px;
        background: #fff7ed;
        border: 1px solid #fed7aa;
        border-radius: 12px;
    `;


    /*
     * لا توجد تعارضات
     */

    if (totalConflicts === 0) {

        box.innerHTML = `

            <div style="
                color:#047857;
                font-weight:700;
            ">

                ✓ لا توجد مواعيد متعارضة
                مع هذه الإجازة.

            </div>

        `;

    }

    /*
     * توجد تعارضات
     */

    else {

        box.innerHTML = `

            <div style="
                margin-bottom:15px;
                color:#c2410c;
                font-weight:800;
                font-size:15px;
            ">

                ⚠️ يوجد
                ${totalConflicts}
                ${totalConflicts === 1
                    ? "موعد متعارض"
                    : "مواعيد متعارضة"}
                مع هذه الإجازة

            </div>


            <div style="
                display:grid;
                gap:12px;
            ">

                ${appointments.map(appointment => `

                    <div style="
                        background:#ffffff;
                        border:1px solid #fed7aa;
                        border-radius:10px;
                        padding:15px;
                    ">

                        <div style="
                            display:flex;
                            justify-content:space-between;
                            align-items:center;
                            gap:10px;
                            flex-wrap:wrap;
                            margin-bottom:10px;
                        ">

                            <strong style="
                                color:#1f2937;
                            ">

                                الموعد #${appointment.id}

                            </strong>


                            <span style="
                                background:#fef2f2;
                                color:#b91c1c;
                                padding:5px 9px;
                                border-radius:999px;
                                font-size:12px;
                                font-weight:700;
                            ">

                                متعارض

                            </span>

                        </div>


                        <div style="
                            display:grid;
                            grid-template-columns:
                                repeat(auto-fit,minmax(180px,1fr));
                            gap:8px;
                            color:#4b5563;
                            font-size:13px;
                        ">

                            <div>

                                👤
                                <strong>المريض:</strong>

                                ${escapeHTML(
                                    appointment.patient_name ||
                                    "غير معروف"
                                )}

                            </div>


                            <div>

                                📞
                                <strong>الهاتف:</strong>

                                ${escapeHTML(
                                    appointment.patient_phone ||
                                    "غير متوفر"
                                )}

                            </div>


                            <div>

                                📅
                                <strong>التاريخ:</strong>

                                ${formatArabicDate(
                                    appointment.appointment_date
                                )}

                            </div>


                            <div>

                                🕐
                                <strong>الوقت:</strong>

                                ${escapeHTML(
                                    String(
                                        appointment.appointment_time ||
                                        ""
                                    ).substring(0, 5)
                                )}

                            </div>

                        </div>


                        ${
                            appointment.reason
                                ? `

                                    <div style="
                                        margin-top:10px;
                                        color:#6b7280;
                                    ">

                                        <strong>
                                            السبب:
                                        </strong>

                                        ${escapeHTML(
                                            appointment.reason
                                        )}

                                    </div>

                                  `
                                : ""
                        }


                        <div style="
                            display:flex;
                            gap:8px;
                            flex-wrap:wrap;
                            margin-top:15px;
                        ">

                            <button
                                type="button"
                                class="manage-leave-appointment-btn"
                                data-appointment-id="${appointment.id}"
                                data-leave-id="${requestId}"
                                style="
                                    border:0;
                                    background:#2563eb;
                                    color:#fff;
                                    padding:9px 14px;
                                    border-radius:8px;
                                    cursor:pointer;
                                    font-weight:700;
                                "
                            >

                                إدارة الموعد

                            </button>

                        </div>

                    </div>

                `).join("")}

            </div>

        `;

    }


    /*
     * نضع صندوق التعارض
     * تحت صف الإجازة مباشرة
     */

    requestRow.after(box);


    /*
     * زر إدارة الموعد
     */

    box
        .querySelectorAll(
            ".manage-leave-appointment-btn"
        )
        .forEach(actionButton => {

            actionButton.addEventListener(
                "click",
                () => {

                    showToast(
                        "سيتم فتح إدارة الموعد في الخطوة التالية.",
                        "info"
                    );

                }
            );

        });

}

async function loadDoctorLeaveConflicts(leaveId) {
    try {
        const data = await apiRequest(
            `${API_BASE}/admin/doctor-leaves/${leaveId}/conflicts`
        );

        return data || {
            summary: {
                totalConflicts: 0
            },
            appointments: []
        };
    } catch (error) {
        console.error(
            "DOCTOR LEAVE CONFLICTS ERROR:",
            error
        );

        showToast(
            error.message ||
            "تعذر تحميل المواعيد المتعارضة.",
            "error"
        );

        return {
            summary: {
                totalConflicts: 0
            },
            appointments: []
        };
    }
}


async function showDoctorLeaveConflicts(leaveId) {
    const requestId = Number(leaveId);

    if (!requestId) {
        return;
    }

    const existingBox =
        document.getElementById(
            `leave-conflicts-${requestId}`
        );

    if (existingBox) {
        existingBox.remove();
        return;
    }

    const button =
        document.querySelector(
            `.show-leave-conflicts-btn[data-leave-id="${requestId}"]`
        );

    if (button) {
        button.disabled = true;
        button.textContent = "جاري التحميل...";
    }

    const data =
        await loadDoctorLeaveConflicts(
            requestId
        );

    if (button) {
        button.disabled = false;
        button.textContent =
            "إدارة التعارضات";
    }

    const appointments =
        Array.isArray(data?.appointments)
            ? data.appointments
            : [];

    const totalConflicts =
        Number(
            data?.summary?.totalConflicts || 0
        );

    const requestRow =
        document.querySelector(
            `.leave-request-row[data-leave-id="${requestId}"]`
        );

    if (!requestRow) {
        return;
    }

    const box =
        document.createElement("div");

    box.id =
        `leave-conflicts-${requestId}`;

    box.style.cssText = `
        margin: 0 15px 15px;
        padding: 18px;
        background: #fff7ed;
        border: 1px solid #fed7aa;
        border-radius: 12px;
    `;

    if (totalConflicts === 0) {
        box.innerHTML = `
            <div style="
                color:#047857;
                font-weight:700;
            ">
                ✓ لا توجد مواعيد متعارضة مع هذه الإجازة.
            </div>
        `;
    } else {
        box.innerHTML = `
            <div style="
                margin-bottom:15px;
                color:#c2410c;
                font-weight:800;
                font-size:15px;
            ">
                ⚠️ يوجد ${totalConflicts}
                ${totalConflicts === 1 ? "موعد متعارض" : "مواعيد متعارضة"}
                مع هذه الإجازة
            </div>

            <div style="
                display:grid;
                gap:12px;
            ">
                ${appointments.map(appointment => `
                    <div style="
                        background:#ffffff;
                        border:1px solid #fed7aa;
                        border-radius:10px;
                        padding:15px;
                    ">
                        <div style="
                            display:flex;
                            justify-content:space-between;
                            align-items:center;
                            gap:10px;
                            flex-wrap:wrap;
                            margin-bottom:10px;
                        ">
                            <strong style="
                                color:#1f2937;
                            ">
                                الموعد #${appointment.id}
                            </strong>

                            <span style="
                                background:#fef2f2;
                                color:#b91c1c;
                                padding:5px 9px;
                                border-radius:999px;
                                font-size:12px;
                                font-weight:700;
                            ">
                                متعارض
                            </span>
                        </div>

                        <div style="
                            display:grid;
                            grid-template-columns:
                                repeat(auto-fit,minmax(180px,1fr));
                            gap:8px;
                            color:#4b5563;
                            font-size:13px;
                        ">
                            <div>
                                👤
                                <strong>المريض:</strong>
                                ${escapeHTML(
                                    appointment.patient_name ||
                                    "غير معروف"
                                )}
                            </div>

                            <div>
                                📞
                                <strong>الهاتف:</strong>
                                ${escapeHTML(
                                    appointment.patient_phone ||
                                    "غير متوفر"
                                )}
                            </div>

                            <div>
                                📅
                                <strong>التاريخ:</strong>
                                ${formatArabicDate(
                                    appointment.appointment_date
                                )}
                            </div>

                            <div>
                                🕐
                                <strong>الوقت:</strong>
                                ${escapeHTML(
                                    String(
                                        appointment.appointment_time ||
                                        ""
                                    ).substring(0, 5)
                                )}
                            </div>
                        </div>

                        ${
                            appointment.reason
                                ? `
                                    <div style="
                                        margin-top:10px;
                                        color:#6b7280;
                                    ">
                                        <strong>السبب:</strong>
                                        ${escapeHTML(
                                            appointment.reason
                                        )}
                                    </div>
                                  `
                                : ""
                        }

                        <div style="
                            display:flex;
                            gap:8px;
                            flex-wrap:wrap;
                            margin-top:15px;
                        ">
                            <button
                                type="button"
                                class="manage-leave-appointment-btn"
                                data-appointment-id="${appointment.id}"
                                data-leave-id="${requestId}"
                                style="
                                    border:0;
                                    background:#2563eb;
                                    color:#fff;
                                    padding:9px 14px;
                                    border-radius:8px;
                                    cursor:pointer;
                                    font-weight:700;
                                "
                            >
                                إدارة الموعد
                            </button>
                        </div>
                    </div>
                `).join("")}
            </div>
        `;
    }

    requestRow.after(box);

   box
    .querySelectorAll(
        ".manage-leave-appointment-btn"
    )
    .forEach(actionButton => {

        actionButton.addEventListener(
            "click",
            () => {

                showLeaveConflictAppointmentManager(
                    requestId,
                    actionButton.dataset.appointmentId
                );

            }
        );

    });
    
}




function showLeaveConflictAppointmentManager(
    leaveId,
    appointmentId
) {

    const existingManager =
        document.getElementById(
            `leave-appointment-manager-${appointmentId}`
        );

    if (existingManager) {
        existingManager.remove();
        return;
    }

    const conflictBox =
        document.getElementById(
            `leave-conflicts-${leaveId}`
        );

    if (!conflictBox) {
        return;
    }

    const appointment =
        conflictBox.querySelector(
            `.manage-leave-appointment-btn[data-appointment-id="${appointmentId}"]`
        );

    if (!appointment) {
        return;
    }

    const manager =
        document.createElement("div");

    manager.id =
        `leave-appointment-manager-${appointmentId}`;

    manager.style.cssText = `
        margin-top:15px;
        padding:18px;
        background:#f8fafc;
        border:1px solid #dbeafe;
        border-radius:12px;
    `;

    manager.innerHTML = `

        <div style="
            font-size:16px;
            font-weight:800;
            color:#1f2937;
            margin-bottom:15px;
        ">
            ⚙️ إدارة الموعد المتعارض
        </div>


        <div style="
            display:grid;
            grid-template-columns:
                repeat(auto-fit,minmax(180px,1fr));
            gap:12px;
            margin-bottom:18px;
        ">

            <button
                type="button"
                class="leave-action-choice"
                data-action="reschedule"
                style="
                    border:1px solid #bfdbfe;
                    background:#eff6ff;
                    color:#1d4ed8;
                    padding:13px;
                    border-radius:10px;
                    cursor:pointer;
                    font-weight:700;
                "
            >
                🔄 إعادة جدولة
            </button>


            <button
                type="button"
                class="leave-action-choice"
                data-action="transfer"
                style="
                    border:1px solid #c7d2fe;
                    background:#eef2ff;
                    color:#4338ca;
                    padding:13px;
                    border-radius:10px;
                    cursor:pointer;
                    font-weight:700;
                "
            >
                👨‍⚕️ تحويل لطبيب آخر
            </button>


            <button
                type="button"
                class="leave-action-choice"
                data-action="cancel"
                style="
                    border:1px solid #fecaca;
                    background:#fef2f2;
                    color:#b91c1c;
                    padding:13px;
                    border-radius:10px;
                    cursor:pointer;
                    font-weight:700;
                "
            >
                ❌ إلغاء الموعد
            </button>


            <button
                type="button"
                class="leave-action-choice"
                data-action="contact_patient"
                style="
                    border:1px solid #a7f3d0;
                    background:#ecfdf5;
                    color:#047857;
                    padding:13px;
                    border-radius:10px;
                    cursor:pointer;
                    font-weight:700;
                "
            >
                📞 التواصل مع المريض
            </button>

        </div>


        <div
            id="leave-action-form-${appointmentId}"
            style="
                display:none;
            "
        >
        </div>

    `;


    /*
     * نضيف المدير أسفل بطاقة الموعد
     */

    const appointmentCard =
        appointment.closest("div[style*='background:#ffffff']");

    if (appointmentCard) {
        appointmentCard.appendChild(manager);
    } else {
        conflictBox.appendChild(manager);
    }


    /*
     * أزرار الإجراءات
     */

    manager
        .querySelectorAll(
            ".leave-action-choice"
        )
        .forEach(actionButton => {

            actionButton.addEventListener(
                "click",
                () => {

                    renderLeaveConflictActionForm(
                        leaveId,
                        appointmentId,
                        actionButton.dataset.action,
                        manager
                    );

                }
            );

        });

}


function renderLeaveConflictActionForm(
    leaveId,
    appointmentId,
    action,
    manager
) {

    const formContainer =
        manager.querySelector(
            `#leave-action-form-${appointmentId}`
        );

    if (!formContainer) {
        return;
    }

    formContainer.style.display =
        "block";


    let title = "";

    if (action === "reschedule") {
        title = "🔄 إعادة جدولة الموعد";
    } else if (action === "transfer") {
        title = "👨‍⚕️ تحويل الموعد لطبيب آخر";
    } else if (action === "cancel") {
        title = "❌ إلغاء الموعد";
    } else {
        title = "📞 تسجيل التواصل مع المريض";
    }


    formContainer.innerHTML = `

        <div style="
            border-top:1px solid #e5e7eb;
            padding-top:18px;
        ">

            <div style="
                font-weight:800;
                color:#1f2937;
                margin-bottom:15px;
            ">
                ${title}
            </div>


            ${
                action === "reschedule"
                    ? `

                        <div style="
                            display:grid;
                            grid-template-columns:
                                repeat(auto-fit,minmax(180px,1fr));
                            gap:12px;
                        ">

                            <div>

                                <label style="
                                    display:block;
                                    margin-bottom:6px;
                                    font-size:13px;
                                    font-weight:700;
                                ">
                                    التاريخ الجديد
                                </label>

                                <input
                                    type="date"
                                    id="leave-new-date-${appointmentId}"
                                    style="
                                        width:100%;
                                        padding:10px;
                                        border:1px solid #d1d5db;
                                        border-radius:8px;
                                        box-sizing:border-box;
                                    "
                                >

                            </div>


                            <div>

                                <label style="
                                    display:block;
                                    margin-bottom:6px;
                                    font-size:13px;
                                    font-weight:700;
                                ">
                                    الوقت الجديد
                                </label>

                                <input
                                    type="time"
                                    id="leave-new-time-${appointmentId}"
                                    style="
                                        width:100%;
                                        padding:10px;
                                        border:1px solid #d1d5db;
                                        border-radius:8px;
                                        box-sizing:border-box;
                                    "
                                >

                            </div>

                        </div>

                      `

                    : ""
            }


            ${
                action === "transfer"
                    ? `

                        <div>

                            <label style="
                                display:block;
                                margin-bottom:6px;
                                font-size:13px;
                                font-weight:700;
                            ">
                                الطبيب البديل
                            </label>

                            <select
                                id="leave-new-doctor-${appointmentId}"
                                style="
                                    width:100%;
                                    padding:10px;
                                    border:1px solid #d1d5db;
                                    border-radius:8px;
                                    box-sizing:border-box;
                                    background:#fff;
                                "
                            >

                                <option value="">
                                    جاري تحميل الأطباء...
                                </option>

                            </select>

                        </div>

                      `

                    : ""
            }


            ${
                action === "cancel"
                    ? `

                        <div style="
                            color:#b91c1c;
                            background:#fef2f2;
                            padding:12px;
                            border-radius:8px;
                            margin-bottom:12px;
                            font-size:13px;
                        ">

                            ⚠️ سيتم إلغاء الموعد
                            بعد تأكيد العملية.

                        </div>

                      `
                    : ""
            }


            ${
                action === "contact_patient"
                    ? `

                        <div style="
                            color:#047857;
                            background:#ecfdf5;
                            padding:12px;
                            border-radius:8px;
                            font-size:13px;
                        ">

                            سيتم تسجيل أن الإدارة
                            تواصلت مع المريض بشأن الموعد.

                        </div>

                      `
                    : ""
            }


            <div style="
                margin-top:14px;
            ">

                <label style="
                    display:block;
                    margin-bottom:6px;
                    font-size:13px;
                    font-weight:700;
                ">
                    ملاحظات
                </label>

                <textarea
                    id="leave-action-notes-${appointmentId}"
                    rows="3"
                    placeholder="أضف ملاحظات حول الإجراء..."
                    style="
                        width:100%;
                        padding:10px;
                        border:1px solid #d1d5db;
                        border-radius:8px;
                        resize:vertical;
                        box-sizing:border-box;
                    "
                ></textarea>

            </div>


            <div style="
                display:flex;
                gap:8px;
                margin-top:15px;
                flex-wrap:wrap;
            ">

                <button
                    type="button"
                    id="confirm-leave-action-${appointmentId}"
                    style="
                        border:0;
                        background:#2563eb;
                        color:#fff;
                        padding:10px 16px;
                        border-radius:8px;
                        cursor:pointer;
                        font-weight:700;
                    "
                >
                    ✓ تأكيد الإجراء
                </button>


                <button
                    type="button"
                    id="cancel-leave-action-${appointmentId}"
                    style="
                        border:1px solid #d1d5db;
                        background:#fff;
                        color:#374151;
                        padding:10px 16px;
                        border-radius:8px;
                        cursor:pointer;
                        font-weight:700;
                    "
                >
                    إلغاء
                </button>

            </div>

        </div>

    `;


    /*
     * تحميل الأطباء عند اختيار التحويل
     */

    if (action === "transfer") {

        loadDoctorsForLeaveTransfer(
            appointmentId
        );

    }


    /*
     * تأكيد العملية
     */

    const confirmButton =
        document.getElementById(
            `confirm-leave-action-${appointmentId}`
        );

    if (confirmButton) {

        confirmButton.addEventListener(
            "click",
            () => {

                submitLeaveConflictAction(
                    leaveId,
                    appointmentId,
                    action
                );

            }
        );

    }


    /*
     * إلغاء النموذج
     */

    const cancelButton =
        document.getElementById(
            `cancel-leave-action-${appointmentId}`
        );

    if (cancelButton) {

        cancelButton.addEventListener(
            "click",
            () => {

                formContainer.style.display =
                    "none";

                formContainer.innerHTML =
                    "";

            }
        );

    }

}

async function submitLeaveConflictAction(
    leaveId,
    appointmentId,
    action
) {

    const notesElement =
        document.getElementById(
            `leave-action-notes-${appointmentId}`
        );

    const notes =
        notesElement
            ? notesElement.value.trim()
            : "";


    let newDentistId = null;
    let newAppointmentDate = null;
    let newAppointmentTime = null;


    /*
     * TRANSFER
     */

    if (action === "transfer") {

        const doctorElement =
            document.getElementById(
                `leave-new-doctor-${appointmentId}`
            );

        newDentistId =
            doctorElement
                ? Number(doctorElement.value)
                : null;


        if (!newDentistId) {

            showToast(
                "يرجى اختيار الطبيب البديل.",
                "error"
            );

            return;
        }

    }


    /*
     * RESCHEDULE
     */

    if (action === "reschedule") {

        const dateElement =
            document.getElementById(
                `leave-new-date-${appointmentId}`
            );

        const timeElement =
            document.getElementById(
                `leave-new-time-${appointmentId}`
            );


        newAppointmentDate =
            dateElement
                ? dateElement.value
                : "";


        newAppointmentTime =
            timeElement
                ? timeElement.value
                : "";


        if (
            !newAppointmentDate ||
            !newAppointmentTime
        ) {

            showToast(
                "يرجى تحديد التاريخ والوقت الجديدين.",
                "error"
            );

            return;
        }

    }


    /*
     * CONFIRMATION FOR CANCEL
     */

    if (action === "cancel") {

        const confirmed =
            confirm(
                "هل أنت متأكد من إلغاء هذا الموعد؟"
            );

        if (!confirmed) {
            return;
        }

    }


    /*
     * CURRENT ADMIN
     */

    const currentUser =
        getCurrentUser();


    const createdBy =
        currentUser?.id
            ? Number(currentUser.id)
            : null;


    /*
     * DISABLE BUTTON
     */

    const confirmButton =
        document.getElementById(
            `confirm-leave-action-${appointmentId}`
        );


    if (confirmButton) {

        confirmButton.disabled =
            true;

        confirmButton.textContent =
            "جاري التنفيذ...";

    }


    try {

        const result =
            await apiRequest(
                `${API_BASE}/admin/doctor-leaves/${leaveId}/conflicts/${appointmentId}/action`,
                {
                    method: "PUT",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        action_type:
                            action,

                        new_dentist_id:
                            newDentistId,

                        new_appointment_date:
                            newAppointmentDate,

                        new_appointment_time:
                            newAppointmentTime,

                        patient_contacted:
                            false,

                        notes:
                            notes || null,

                        created_by:
                            createdBy

                    })

                }
            );


        showToast(
            result?.message ||
            "تم تنفيذ الإجراء بنجاح.",
            "success"
        );


        /*
         * REFRESH CONFLICTS
         */

        const existingBox =
            document.getElementById(
                `leave-conflicts-${leaveId}`
            );


        if (existingBox) {
            existingBox.remove();
        }


        await showDoctorLeaveConflicts(
            leaveId
        );


    } catch (error) {

        console.error(
            "SUBMIT LEAVE CONFLICT ACTION ERROR:",
            error
        );


        showToast(
            error.message ||
            "تعذر تنفيذ الإجراء.",
            "error"
        );


        if (confirmButton) {

            confirmButton.disabled =
                false;

            confirmButton.textContent =
                "✓ تأكيد الإجراء";

        }

    }

}


async function loadDoctorsForLeaveTransfer(
    appointmentId
) {

    const select =
        document.getElementById(
            `leave-new-doctor-${appointmentId}`
        );


    if (!select) {
        return;
    }


    try {

        const doctors =
            await apiRequest(
                `${API_BASE}/admin/doctors`
            );


        const doctorList =
            Array.isArray(doctors)
                ? doctors
                : [];


        select.innerHTML = `

            <option value="">
                اختر الطبيب البديل
            </option>

            ${
                doctorList
                    .map(doctor => `

                        <option
                            value="${doctor.id}"
                        >
                            ${escapeHTML(
                                doctor.name ||
                                `${doctor.first_name || ""} ${doctor.last_name || ""}`.trim()
                            )}
                        </option>

                    `)
                    .join("")
            }

        `;

    } catch (error) {

        console.error(
            "LOAD LEAVE TRANSFER DOCTORS ERROR:",
            error
        );


        select.innerHTML = `

            <option value="">
                تعذر تحميل الأطباء
            </option>

        `;


        showToast(
            error.message ||
            "تعذر تحميل الأطباء.",
            "error"
        );

    }

}


async function decideDoctorLeave(
    leaveId,
    status
) {

    const actionLabel =
        status === "approved"
            ? "الموافقة على"
            : "رفض";

    const confirmed =
        confirm(
            `هل تريد ${actionLabel} طلب الإجازة رقم ${leaveId}؟`
        );

    if (!confirmed) {
        return;
    }

    let adminNotes = "";

    if (status === "rejected") {

        adminNotes =
            prompt(
                "اكتب سبب رفض طلب الإجازة:"
            ) || "";

    }

    try {

        const user =
            getCurrentUser();

        const adminId =
            user?.id
                ? Number(user.id)
                : null;

        const result =
            await apiRequest(
                `${API_BASE}/admin/doctor-leaves/${leaveId}/decision`,
                {
                    method: "PUT",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        status,
                        admin_notes:
                            adminNotes,
                        decided_by:
                            adminId
                    })
                }
            );

        showToast(
            result.message ||
            "تم حفظ القرار بنجاح.",
            "success"
        );

        await renderDoctorLeavesModule();

    } catch (error) {

        console.error(
            "DOCTOR LEAVE DECISION ERROR:",
            error
        );

        showToast(
            error.message ||
            "تعذر حفظ القرار.",
            "error"
        );

    }

}


// =====================================================
// ADD DOCTOR MODAL
// =====================================================

function showAddDoctorForm() {

    // منع فتح أكثر من نافذة
    const oldModal = document.getElementById("addDoctorModal");

    if (oldModal) {
        oldModal.remove();
    }

    const modal = document.createElement("div");

    modal.id = "addDoctorModal";

    modal.innerHTML = `
        <div
            style="
                position:fixed;
                inset:0;
                background:rgba(15,23,42,0.55);
                backdrop-filter:blur(4px);
                display:flex;
                align-items:center;
                justify-content:center;
                padding:20px;
                z-index:99999;
            "
            id="addDoctorOverlay"
        >

            <div
                style="
                    width:100%;
                    max-width:650px;
                    max-height:90vh;
                    overflow-y:auto;
                    background:#ffffff;
                    border-radius:20px;
                    box-shadow:0 20px 60px rgba(0,0,0,0.20);
                    direction:rtl;
                "
                onclick="event.stopPropagation()"
            >

                <!-- HEADER -->
                <div
                    style="
                        padding:24px 28px;
                        border-bottom:1px solid #e5e7eb;
                        display:flex;
                        align-items:center;
                        justify-content:space-between;
                        gap:15px;
                    "
                >

                    <div>
                        <h3
                            style="
                                margin:0 0 6px;
                                color:#1f2937;
                                font-size:21px;
                                font-weight:800;
                            "
                        >
                            إضافة طبيب
                        </h3>

                        <p
                            style="
                                margin:0;
                                color:#6b7280;
                                font-size:13px;
                            "
                        >
                            إضافة بيانات الطبيب وإنشاء حساب الدخول تلقائيًا.
                        </p>
                    </div>

                    <button
                        type="button"
                        id="closeAddDoctorModal"
                        style="
                            width:38px;
                            height:38px;
                            border:0;
                            border-radius:10px;
                            background:#f3f4f6;
                            color:#4b5563;
                            cursor:pointer;
                            font-size:20px;
                            font-weight:700;
                        "
                    >
                        ×
                    </button>

                </div>


                <!-- FORM -->
                <form id="addDoctorForm">

                    <div
                        style="
                            padding:28px;
                            display:grid;
                            grid-template-columns:1fr 1fr;
                            gap:18px;
                        "
                    >

                        <!-- الاسم الأول -->
                        <div>
                            <label
                                style="
                                    display:block;
                                    margin-bottom:7px;
                                    color:#374151;
                                    font-size:13px;
                                    font-weight:700;
                                "
                            >
                                الاسم الأول
                            </label>

                            <input
                                type="text"
                                id="addDoctorFirstName"
                                required
                                placeholder="مثال: أحمد"
                                style="
                                    width:100%;
                                    box-sizing:border-box;
                                    padding:12px 13px;
                                    border:1px solid #d1d5db;
                                    border-radius:10px;
                                    outline:none;
                                    font-size:14px;
                                "
                            >
                        </div>


                        <!-- اسم العائلة -->
                        <div>
                            <label
                                style="
                                    display:block;
                                    margin-bottom:7px;
                                    color:#374151;
                                    font-size:13px;
                                    font-weight:700;
                                "
                            >
                                اسم العائلة
                            </label>

                            <input
                                type="text"
                                id="addDoctorLastName"
                                required
                                placeholder="مثال: بن علي"
                                style="
                                    width:100%;
                                    box-sizing:border-box;
                                    padding:12px 13px;
                                    border:1px solid #d1d5db;
                                    border-radius:10px;
                                    outline:none;
                                    font-size:14px;
                                "
                            >
                        </div>


                        <!-- التخصص -->
                        <div>
                            <label
                                style="
                                    display:block;
                                    margin-bottom:7px;
                                    color:#374151;
                                    font-size:13px;
                                    font-weight:700;
                                "
                            >
                                التخصص
                            </label>

                            <input
                                type="text"
                                id="addDoctorSpecialty"
                                placeholder="مثال: تقويم الأسنان"
                                style="
                                    width:100%;
                                    box-sizing:border-box;
                                    padding:12px 13px;
                                    border:1px solid #d1d5db;
                                    border-radius:10px;
                                    outline:none;
                                    font-size:14px;
                                "
                            >
                        </div>


                        <!-- الهاتف -->
                        <div>
                            <label
                                style="
                                    display:block;
                                    margin-bottom:7px;
                                    color:#374151;
                                    font-size:13px;
                                    font-weight:700;
                                "
                            >
                                الهاتف
                            </label>

                            <input
                                type="tel"
                                id="addDoctorPhone"
                                placeholder="مثال: 0550123456"
                                style="
                                    width:100%;
                                    box-sizing:border-box;
                                    padding:12px 13px;
                                    border:1px solid #d1d5db;
                                    border-radius:10px;
                                    outline:none;
                                    font-size:14px;
                                    direction:ltr;
                                    text-align:right;
                                "
                            >
                        </div>


                        <!-- البريد الإلكتروني -->
                        <div style="grid-column:1 / -1;">

                            <label
                                style="
                                    display:block;
                                    margin-bottom:7px;
                                    color:#374151;
                                    font-size:13px;
                                    font-weight:700;
                                "
                            >
                                البريد الإلكتروني
                            </label>

                            <input
                                type="email"
                                id="addDoctorEmail"
                                placeholder="doctor@example.com"
                                style="
                                    width:100%;
                                    box-sizing:border-box;
                                    padding:12px 13px;
                                    border:1px solid #d1d5db;
                                    border-radius:10px;
                                    outline:none;
                                    font-size:14px;
                                    direction:ltr;
                                    text-align:left;
                                "
                            >

                        </div>


                        <!-- ACCOUNT SECTION -->
                        <div
                            style="
                                grid-column:1 / -1;
                                margin-top:5px;
                                padding-top:22px;
                                border-top:1px solid #e5e7eb;
                            "
                        >

                            <h4
                                style="
                                    margin:0 0 5px;
                                    color:#1f2937;
                                    font-size:16px;
                                    font-weight:800;
                                "
                            >
                                حساب الدخول
                            </h4>

                            <p
                                style="
                                    margin:0 0 18px;
                                    color:#6b7280;
                                    font-size:12px;
                                "
                            >
                                سيتم إنشاء حساب للطبيب تلقائيًا بعد إضافة بياناته.
                            </p>

                        </div>


                        <!-- اسم المستخدم -->
                        <div>

                            <label
                                style="
                                    display:block;
                                    margin-bottom:7px;
                                    color:#374151;
                                    font-size:13px;
                                    font-weight:700;
                                "
                            >
                                اسم المستخدم
                            </label>

                            <input
                                type="text"
                                id="addDoctorUsername"
                                required
                                placeholder="مثال: ahmed.doctor"
                                autocomplete="off"
                                style="
                                    width:100%;
                                    box-sizing:border-box;
                                    padding:12px 13px;
                                    border:1px solid #d1d5db;
                                    border-radius:10px;
                                    outline:none;
                                    font-size:14px;
                                    direction:ltr;
                                    text-align:left;
                                "
                            >

                        </div>


                        <!-- كلمة المرور -->
                        <div>

                            <label
                                style="
                                    display:block;
                                    margin-bottom:7px;
                                    color:#374151;
                                    font-size:13px;
                                    font-weight:700;
                                "
                            >
                                كلمة المرور
                            </label>

                            <input
                                type="password"
                                id="addDoctorPassword"
                                required
                                placeholder="كلمة المرور"
                                autocomplete="new-password"
                                style="
                                    width:100%;
                                    box-sizing:border-box;
                                    padding:12px 13px;
                                    border:1px solid #d1d5db;
                                    border-radius:10px;
                                    outline:none;
                                    font-size:14px;
                                "
                            >

                        </div>


                        <!-- تأكيد كلمة المرور -->
                        <div style="grid-column:1 / -1;">

                            <label
                                style="
                                    display:block;
                                    margin-bottom:7px;
                                    color:#374151;
                                    font-size:13px;
                                    font-weight:700;
                                "
                            >
                                تأكيد كلمة المرور
                            </label>

                            <input
                                type="password"
                                id="addDoctorConfirmPassword"
                                required
                                placeholder="أعد كتابة كلمة المرور"
                                autocomplete="new-password"
                                style="
                                    width:100%;
                                    box-sizing:border-box;
                                    padding:12px 13px;
                                    border:1px solid #d1d5db;
                                    border-radius:10px;
                                    outline:none;
                                    font-size:14px;
                                "
                            >

                        </div>


                        <!-- ERROR -->
                        <div
                            id="addDoctorError"
                            style="
                                grid-column:1 / -1;
                                display:none;
                                padding:12px 14px;
                                border-radius:10px;
                                background:#fef2f2;
                                color:#b91c1c;
                                font-size:13px;
                                font-weight:600;
                            "
                        >
                        </div>

                    </div>


                    <!-- FOOTER -->
                    <div
                        style="
                            padding:18px 28px;
                            border-top:1px solid #e5e7eb;
                            display:flex;
                            justify-content:flex-start;
                            gap:10px;
                        "
                    >

                        <button
                            type="submit"
                            id="saveAddDoctorBtn"
                            style="
                                border:0;
                                background:#2563eb;
                                color:#ffffff;
                                padding:12px 22px;
                                border-radius:10px;
                                cursor:pointer;
                                font-weight:700;
                                font-size:13px;
                            "
                        >
                            إضافة الطبيب
                        </button>

                        <button
                            type="button"
                            id="cancelAddDoctorBtn"
                            style="
                                border:1px solid #d1d5db;
                                background:#ffffff;
                                color:#374151;
                                padding:12px 20px;
                                border-radius:10px;
                                cursor:pointer;
                                font-weight:700;
                                font-size:13px;
                            "
                        >
                            إلغاء
                        </button>

                    </div>

                </form>

            </div>

        </div>
    `;

    document.body.appendChild(modal);


    // =================================================
    // CLOSE MODAL
    // =================================================

    const closeModal = () => {
        const currentModal =
            document.getElementById("addDoctorModal");

        if (currentModal) {
            currentModal.remove();
        }
    };


    document
        .getElementById("closeAddDoctorModal")
        .addEventListener("click", closeModal);

    document
        .getElementById("cancelAddDoctorBtn")
        .addEventListener("click", closeModal);

    document
        .getElementById("addDoctorOverlay")
        .addEventListener("click", closeModal);


    // =================================================
    // SUBMIT
    // =================================================

    document
        .getElementById("addDoctorForm")
        .addEventListener("submit", async event => {

            event.preventDefault();

            const errorBox =
                document.getElementById(
                    "addDoctorError"
                );

            const saveButton =
                document.getElementById(
                    "saveAddDoctorBtn"
                );

            const firstName =
                document
                    .getElementById(
                        "addDoctorFirstName"
                    )
                    .value
                    .trim();

            const lastName =
                document
                    .getElementById(
                        "addDoctorLastName"
                    )
                    .value
                    .trim();

            const specialty =
                document
                    .getElementById(
                        "addDoctorSpecialty"
                    )
                    .value
                    .trim();

            const phone =
                document
                    .getElementById(
                        "addDoctorPhone"
                    )
                    .value
                    .trim();

            const email =
                document
                    .getElementById(
                        "addDoctorEmail"
                    )
                    .value
                    .trim();

            const username =
                document
                    .getElementById(
                        "addDoctorUsername"
                    )
                    .value
                    .trim();

            const password =
                document
                    .getElementById(
                        "addDoctorPassword"
                    )
                    .value;

            const confirmPassword =
                document
                    .getElementById(
                        "addDoctorConfirmPassword"
                    )
                    .value;


            // -------------------------------
            // VALIDATION
            // -------------------------------

            if (
                !firstName ||
                !lastName ||
                !username ||
                !password ||
                !confirmPassword
            ) {

                errorBox.textContent =
                    "يرجى ملء جميع الحقول المطلوبة.";

                errorBox.style.display = "block";

                return;
            }


            if (password !== confirmPassword) {

                errorBox.textContent =
                    "كلمتا المرور غير متطابقتين.";

                errorBox.style.display = "block";

                return;
            }


            errorBox.style.display = "none";


            // -------------------------------
            // LOADING
            // -------------------------------

            saveButton.disabled = true;

            saveButton.textContent =
                "جارٍ إضافة الطبيب...";

            saveButton.style.opacity = "0.7";


            try {

                // =========================================
                // ADD DOCTOR + CREATE ACCOUNT
                // =========================================

                const result =
                    await apiRequest(
                        "/api/dentists",
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body: JSON.stringify({

                                first_name:
                                    firstName,

                                last_name:
                                    lastName,

                                phone:
                                    phone || null,

                                email:
                                    email || null,

                                specialty:
                                    specialty || null,

                                username:
                                    username,

                                password:
                                    password

                            })
                        }
                    );


                console.log(
                    "ADD DOCTOR SUCCESS:",
                    result
                );


                // =========================================
                // CLOSE
                // =========================================

                closeModal();


                // =========================================
                // REFRESH DOCTORS LIST
                // =========================================

                try {

                    const doctors =
                        await apiRequest(
                            "/api/admin/doctors"
                        );

                    renderDoctorsList(
                        Array.isArray(doctors)
                            ? doctors
                            : []
                    );

                } catch (refreshError) {

                    console.error(
                        "DOCTORS REFRESH ERROR:",
                        refreshError
                    );

                    // إذا فشل التحديث نعيد تحميل الصفحة
                    window.location.reload();

                }


                // =========================================
                // SUCCESS MESSAGE
                // =========================================

                setTimeout(() => {

                    alert(
                        "تمت إضافة الطبيب وإنشاء حساب الدخول بنجاح."
                    );

                }, 100);


            } catch (error) {

                console.error(
                    "ADD DOCTOR ERROR:",
                    error
                );

                errorBox.textContent =
                    error.message ||
                    "تعذر إضافة الطبيب.";

                errorBox.style.display =
                    "block";


                saveButton.disabled = false;

                saveButton.textContent =
                    "إضافة الطبيب";

                saveButton.style.opacity =
                    "1";
            }

        });
}


function renderDoctorsList(doctors) {

    const loading =
        document.getElementById(
            "doctorsLoading"
        );

    const content =
        document.getElementById(
            "doctorsContent"
        );

    if (!content) {
        return;
    }

    if (loading) {
        loading.style.display = "none";
    }

    doctors = Array.isArray(doctors)
        ? doctors
        : [];

    const totalDoctors =
        doctors.length;

    const workingDoctors =
        doctors.filter(
            doctor =>
                doctor.work_status === "working"
        ).length;

    const notStartedDoctors =
        doctors.filter(
            doctor =>
                doctor.work_status === "not_started"
        ).length;

    const unavailableDoctors =
        doctors.filter(
            doctor =>
                doctor.work_status ===
                "temporarily_unavailable"
        ).length;

    content.innerHTML = `

        <!-- SUMMARY -->

        <div style="
            display:grid;
            grid-template-columns:
                repeat(4,minmax(0,1fr));
            gap:18px;
            margin-bottom:28px;
        ">

            <div class="module-card">
                <div class="module-card-icon">
                    ♙
                </div>

                <strong>
                    ${totalDoctors}
                </strong>

                <span>
                    إجمالي الأطباء
                </span>
            </div>


            <div class="module-card">
                <div class="module-card-icon">
                    ●
                </div>

                <strong>
                    ${workingDoctors}
                </strong>

                <span>
                    يعملون الآن
                </span>
            </div>


            <div class="module-card">
                <div class="module-card-icon">
                    ◷
                </div>

                <strong>
                    ${notStartedDoctors}
                </strong>

                <span>
                    لم يبدأوا الدوام
                </span>
            </div>


            <div class="module-card">
                <div class="module-card-icon">
                    !
                </div>

                <strong>
                    ${unavailableDoctors}
                </strong>

                <span>
                    غير متاحين
                </span>
            </div>

        </div>


        <!-- DOCTORS TABLE -->

        <div style="
            width:100%;
            background:#ffffff;
            border:1px solid #e5e7eb;
            border-radius:20px;
            overflow:hidden;
            box-shadow:
                0 8px 25px
                rgba(0,0,0,0.05);
        ">

            <div style="
                padding:24px 28px;
                border-bottom:
                    1px solid #e5e7eb;
                display:flex;
                justify-content:
                    space-between;
                align-items:center;
                gap:20px;
                flex-wrap:wrap;
            ">

                <div>
    <h3 style="
        margin:0 0 7px;
        color:#1f2937;
        font-size:21px;
        font-weight:800;
    ">
        أطباء العيادة
    </h3>

    <p style="
        margin:0;
        color:#6b7280;
        font-size:14px;
    ">
        البيانات الحالية للأطباء وحالة الحساب والدوام.
    </p>
</div>

<div style="
    display:flex;
    align-items:center;
    gap:12px;
">

    <button
        type="button"
        id="addDoctorBtn"
        style="
            border:0;
            background:#2563eb;
            color:#ffffff;
            padding:11px 18px;
            border-radius:10px;
            cursor:pointer;
            font-weight:700;
            font-size:13px;
            box-shadow:0 4px 10px rgba(37,99,235,0.18);
        "
    >
        إضافة طبيب
    </button>

    <span style="
        padding:9px 16px;
        border-radius:20px;
        background:#eff6ff;
        color:#2563eb;
        font-size:13px;
        font-weight:700;
    ">
        ${totalDoctors} أطباء
    </span>

</div>

                

            </div>


            <div style="
                width:100%;
                overflow-x:auto;
            ">

                <table style="
                    width:100%;
                    min-width:1100px;
                    border-collapse:collapse;
                    direction:rtl;
                ">

                    <thead>

    <tr style="
        border-top:1px solid #e5e7eb;
    ">

                            <th style="
                                padding:18px 24px;
                                color:#6b7280;
                                font-size:13px;
                            ">
                                الطبيب
                            </th>

                            <th style="
                                padding:18px 24px;
                                color:#6b7280;
                                font-size:13px;
                            ">
                                التخصص
                            </th>

                            <th style="
                                padding:18px 24px;
                                color:#6b7280;
                                font-size:13px;
                            ">
                                الهاتف
                            </th>

                            <th style="
                                padding:18px 24px;
                                color:#6b7280;
                                font-size:13px;
                            ">
                                الحساب
                            </th>

                            <th style="
                                padding:18px 24px;
                                color:#6b7280;
                                font-size:13px;
                            ">
                                حالة الدوام
                            </th>

                            <th style="
                                padding:18px 24px;
                                color:#6b7280;
                                font-size:13px;
                            ">
                                الإجراء
                            </th>

                        </tr>

                    </thead>


                    <tbody>

                        ${
                            doctors.length

                            ? doctors.map(
                                (doctor, index) => {

                                    const name =
                                        doctor.name ||
                                        "طبيب غير معروف";

                                    const specialty =
                                        doctor.specialty ||
                                        "طب الأسنان";

                                    const phone =
                                        doctor.phone ||
                                        "غير متوفر";

                                    const account =
                                        doctor.account_status ===
                                        "مرتبط"
                                            ? doctor.username
                                            : "بدون حساب";

                                    const status =
                                        String(
                                            doctor.work_status ||
                                            "not_started"
                                        ).toLowerCase();

                                    const statusData =
                                        getStatusData(
                                            status
                                        );

                                    return `

                                        <tr style="
                                            border-top:
                                                1px solid #f1f5f9;
                                        ">

                                            <td style="
                                                padding:20px 24px;
                                            ">

                                                <div style="
                                                    display:flex;
                                                    align-items:center;
                                                    gap:13px;
                                                ">

                                                    <div style="
                                                        width:46px;
                                                        height:46px;
                                                        flex:0 0 46px;
                                                        border-radius:50%;
                                                        background:#eff6ff;
                                                        color:#2563eb;
                                                        display:flex;
                                                        align-items:center;
                                                        justify-content:center;
                                                        font-size:20px;
                                                    ">
                                                        ♙
                                                    </div>

                                                    <div>

                                                        <strong style="
                                                            display:block;
                                                            color:#1f2937;
                                                            font-size:15px;
                                                            margin-bottom:4px;
                                                        ">
                                                            ${escapeHTML(name)}
                                                        </strong>

                                                        <span style="
                                                            color:#9ca3af;
                                                            font-size:12px;
                                                        ">
                                                            طبيب رقم ${index + 1}
                                                        </span>

                                                    </div>

                                                </div>

                                            </td>


                                            <td style="
                                                padding:20px 24px;
                                                color:#4b5563;
                                                white-space:nowrap;
                                            ">
                                                ${escapeHTML(
                                                    specialty
                                                )}
                                            </td>


                                            <td style="
                                                padding:20px 24px;
                                                color:#4b5563;
                                                direction:ltr;
                                                text-align:right;
                                                white-space:nowrap;
                                            ">
                                                ${escapeHTML(
                                                    phone
                                                )}
                                            </td>


                                            <td style="
                                                padding:20px 24px;
                                                white-space:nowrap;
                                            ">

                                                ${
                                                    doctor.account_status ===
                                                    "مرتبط"

                                                    ? `
                                                        <span style="
                                                            display:inline-flex;
                                                            align-items:center;
                                                            gap:6px;
                                                            padding:7px 12px;
                                                            border-radius:20px;
                                                            background:#ecfdf5;
                                                            color:#059669;
                                                            font-size:12px;
                                                            font-weight:700;
                                                        ">
                                                            ✓
                                                            ${escapeHTML(account)}
                                                        </span>
                                                    `

                                                    : `
                                                        <span style="
                                                            display:inline-flex;
                                                            padding:7px 12px;
                                                            border-radius:20px;
                                                            background:#fff7ed;
                                                            color:#c2410c;
                                                            font-size:12px;
                                                            font-weight:700;
                                                        ">
                                                            بدون حساب
                                                        </span>
                                                    `
                                                }

                                            </td>


                                            <td style="
                                                padding:20px 24px;
                                                white-space:nowrap;
                                            ">

                                                <span class="
                                                    status
                                                    ${statusData.className}
                                                ">
                                                    ${statusData.text}
                                                </span>

                                            </td>


                                            <td style="
    padding:20px 24px;
    white-space:nowrap;
">

    <div style="
        display:flex;
        align-items:center;
        gap:8px;
        flex-wrap:wrap;
    ">

        <!-- عرض التفاصيل -->
        <button
            type="button"
            class="doctor-view-btn"
            data-doctor-index="${index}"
            style="
                border:0;
                background:#eff6ff;
                color:#2563eb;
                padding:9px 14px;
                border-radius:9px;
                cursor:pointer;
                font-weight:700;
                font-size:13px;
            "
        >
            👁️ التفاصيل
        </button>


        <!-- تعديل -->
        <button
            type="button"
            class="doctor-edit-btn"
            data-doctor-id="${doctor.id}"
            style="
                border:0;
                background:#ecfdf5;
                color:#047857;
                padding:9px 14px;
                border-radius:9px;
                cursor:pointer;
                font-weight:700;
                font-size:13px;
            "
        >
            ✏️ تعديل
        </button>


        <!-- حذف -->
        <button
            type="button"
            class="doctor-delete-btn"
            data-doctor-id="${doctor.id}"
            data-doctor-name="${escapeHTML(name)}"
            style="
                border:0;
                background:#fef2f2;
                color:#b91c1c;
                padding:9px 14px;
                border-radius:9px;
                cursor:pointer;
                font-weight:700;
                font-size:13px;
            "
        >
            🗑️ حذف
        </button>

    </div>

</td>

                                        </tr>
                                    `;
                                }
                            ).join("")

                            : `

                                <tr>

                                    <td
                                        colspan="6"
                                        style="
                                            padding:60px 20px;
                                            text-align:center;
                                            color:#6b7280;
                                        "
                                    >
                                        لا توجد بيانات للأطباء حاليًا.
                                    </td>

                                </tr>

                            `
                        }

                    </tbody>

                </table>

            </div>

        </div>
    `;


    /*
     * أزرار التفاصيل
     */

    document
        .querySelectorAll(".doctor-view-btn")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const index =
                        Number(
                            button.dataset.doctorIndex
                        );

                    const doctor =
                        doctors[index];

                    if (!doctor) {
                        return;
                    }

                    showDoctorDetails(
                        doctor,
                        doctors
                    );

                }
            );

        });

        /*
 * أزرار تعديل الطبيب
 */

document
    .querySelectorAll(
        ".doctor-edit-btn"
    )
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                showDoctorEditForm(
                    Number(
                        button.dataset.doctorId
                    )
                );

            }
        );

    });


/*
 * أزرار حذف الطبيب
 */

document
    .querySelectorAll(
        ".doctor-delete-btn"
    )
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                deleteDoctor(
                    Number(
                        button.dataset.doctorId
                    ),
                    button.dataset.doctorName ||
                        "الطبيب"
                );

            }
        );

    });


        /*
     * زر إضافة طبيب
     */
    const addDoctorBtn =
        document.getElementById(
            "addDoctorBtn"
        );

    if (addDoctorBtn) {

        addDoctorBtn.addEventListener(
            "click",
            () => {
                showAddDoctorForm();
            }
        );

    }

}

/* =========================================================
   DOCTOR DETAILS
   ========================================================= */

// =========================================================
// DOCTOR DETAILS
// =========================================================
async function showDoctorDetails(
    doctor,
    doctors = []
) {
    if (!moduleContent) {
        return;
    }

    const name =
        doctor.name ||
        "طبيب غير معروف";

    const specialty =
        doctor.specialty ||
        "طب الأسنان";

    const phone =
        doctor.phone ||
        "غير متوفر";

    const email =
        doctor.email ||
        "غير متوفر";

    const username =
        doctor.username ||
        "لا يوجد حساب";

    const status =
        String(
            doctor.work_status ||
            "not_started"
        ).toLowerCase();

    const statusData =
        getStatusData(status);

    const accountStatus =
        doctor.account_status ||
        "بدون حساب";

    const startTime =
        doctor.start_time
            ? formatDateTime(
                doctor.start_time
            )
            : "لم يبدأ بعد";

    const endTime =
        doctor.end_time
            ? formatDateTime(
                doctor.end_time
            )
            : "لم ينته بعد";

    const hasAccount =
        doctor.account_status === "مرتبط";


    // =====================================================
    // INITIAL VIEW
    // =====================================================

    moduleContent.innerHTML = `

        <div
            dir="rtl"
            style="
                width:100%;
                background:#ffffff;
                border:1px solid #e5e7eb;
                border-radius:20px;
                padding:32px;
                box-sizing:border-box;
            "
        >

            <button
                type="button"
                id="backToDoctorsBtn"
                style="
                    border:0;
                    background:#f1f5f9;
                    color:#374151;
                    padding:10px 17px;
                    border-radius:9px;
                    cursor:pointer;
                    margin-bottom:28px;
                    font-weight:700;
                "
            >
                ← العودة إلى قائمة الأطباء
            </button>


            <!-- HEADER -->

            <div
                style="
                    display:flex;
                    align-items:center;
                    gap:20px;
                    padding-bottom:28px;
                    border-bottom:1px solid #e5e7eb;
                "
            >

                <div
                    style="
                        width:82px;
                        height:82px;
                        flex:0 0 82px;
                        border-radius:50%;
                        background:#eff6ff;
                        color:#2563eb;
                        display:flex;
                        align-items:center;
                        justify-content:center;
                        font-size:35px;
                    "
                >
                    ♙
                </div>

                <div>

                    <h2
                        style="
                            margin:0 0 7px;
                            color:#1f2937;
                            font-size:27px;
                            font-weight:800;
                        "
                    >
                        ${escapeHTML(name)}
                    </h2>

                    <p
                        style="
                            margin:0 0 10px;
                            color:#6b7280;
                            font-size:15px;
                        "
                    >
                        ${escapeHTML(specialty)}
                    </p>

                    <span
                        class="
                            status
                            ${statusData.className}
                        "
                    >
                        ${statusData.text}
                    </span>

                </div>

            </div>


            <!-- BASIC INFORMATION -->

            <h3
                style="
                    margin:28px 0 16px;
                    color:#1f2937;
                    font-size:19px;
                "
            >
                البيانات الأساسية
            </h3>

            <div
                style="
                    display:grid;
                    grid-template-columns:
                        repeat(2,minmax(0,1fr));
                    gap:16px;
                "
            >

                <div class="doctor-detail-box">
                    <span>الاسم</span>
                    <strong>
                        ${escapeHTML(name)}
                    </strong>
                </div>

                <div class="doctor-detail-box">
                    <span>التخصص</span>
                    <strong>
                        ${escapeHTML(specialty)}
                    </strong>
                </div>

                <div class="doctor-detail-box">
                    <span>الهاتف</span>
                    <strong dir="ltr">
                        ${escapeHTML(phone)}
                    </strong>
                </div>

                <div class="doctor-detail-box">
                    <span>البريد الإلكتروني</span>
                    <strong>
                        ${escapeHTML(email)}
                    </strong>
                </div>

            </div>


            <!-- ACCOUNT -->

            <h3
                style="
                    margin:30px 0 16px;
                    color:#1f2937;
                    font-size:19px;
                "
            >
                حساب النظام
            </h3>

            <div
                style="
                    display:grid;
                    grid-template-columns:
                        repeat(3,minmax(0,1fr));
                    gap:16px;
                "
            >

                <div class="doctor-detail-box">
                    <span>حالة الحساب</span>
                    <strong>
                        ${escapeHTML(accountStatus)}
                    </strong>
                </div>

                <div class="doctor-detail-box">
                    <span>اسم المستخدم</span>
                    <strong dir="ltr">
                        ${escapeHTML(username)}
                    </strong>
                </div>

                <div class="doctor-detail-box">
                    <span>الصلاحية</span>
                    <strong>
                        طبيب
                    </strong>
                </div>

            </div>


            <!-- WORK DAY -->

            <h3
                style="
                    margin:30px 0 16px;
                    color:#1f2937;
                    font-size:19px;
                "
            >
                دوام اليوم
            </h3>

            <div
                style="
                    display:grid;
                    grid-template-columns:
                        repeat(3,minmax(0,1fr));
                    gap:16px;
                "
            >

                <div class="doctor-detail-box">
                    <span>حالة الدوام</span>
                    <strong>
                        ${statusData.text}
                    </strong>
                </div>

                <div class="doctor-detail-box">
                    <span>وقت بداية الدوام</span>
                    <strong>
                        ${escapeHTML(startTime)}
                    </strong>
                </div>

                <div class="doctor-detail-box">
                    <span>وقت نهاية الدوام</span>
                    <strong>
                        ${escapeHTML(endTime)}
                    </strong>
                </div>

            </div>


            <!-- ABSENCE SECTION -->

            <div
                id="doctorAbsenceSection"
                style="
                    margin-top:30px;
                    padding:22px;
                    border-radius:16px;
                    background:#f8fafc;
                    border:1px solid #e5e7eb;
                "
            >

                <div
                    style="
                        text-align:center;
                        color:#6b7280;
                    "
                >
                    جاري التحقق من مواعيد الطبيب اليوم...
                </div>

            </div>


            <!-- ADMIN ACTIONS -->

            <div
                style="
                    margin-top:30px;
                    padding-top:25px;
                    border-top:1px solid #e5e7eb;
                "
            >

                <h3
                    style="
                        margin:0 0 8px;
                        color:#1f2937;
                        font-size:19px;
                    "
                >
                    إدارة الطبيب
                </h3>

                <p
                    style="
                        margin:0 0 18px;
                        color:#6b7280;
                        font-size:14px;
                    "
                >
                    الإجراءات الإدارية المتاحة لهذا الطبيب.
                </p>

                <div
                    style="
                        display:flex;
                        gap:12px;
                        flex-wrap:wrap;
                    "
                >

                    ${
                        !hasAccount
                            ? `
                                <button
                                    type="button"
                                    id="createDoctorAccountBtn"
                                    style="
                                        border:0;
                                        background:#2563eb;
                                        color:#ffffff;
                                        padding:12px 20px;
                                        border-radius:10px;
                                        cursor:pointer;
                                        font-weight:700;
                                        font-size:14px;
                                    "
                                >
                                    🔐 إنشاء حساب للطبيب
                                </button>
                            `
                            : `
                                <span
                                    style="
                                        display:inline-flex;
                                        align-items:center;
                                        padding:11px 16px;
                                        border-radius:10px;
                                        background:#ecfdf5;
                                        color:#047857;
                                        font-weight:700;
                                        font-size:13px;
                                    "
                                >
                                    ✓ حساب الطبيب مرتبط بالفعل
                                </span>
                            `
                    }

                </div>

            </div>

        </div>


        <!-- CREATE ACCOUNT MODAL -->

        <div
            id="doctorAccountModal"
            style="
                display:none;
                position:fixed;
                inset:0;
                background:rgba(15,23,42,0.55);
                z-index:9999;
                align-items:center;
                justify-content:center;
                padding:20px;
                box-sizing:border-box;
            "
        >

            <div
                dir="rtl"
                style="
                    width:100%;
                    max-width:480px;
                    background:#ffffff;
                    border-radius:20px;
                    padding:28px;
                    box-sizing:border-box;
                    box-shadow:0 20px 50px rgba(0,0,0,0.18);
                "
            >

                <div
                    style="
                        display:flex;
                        justify-content:space-between;
                        align-items:center;
                        gap:15px;
                        margin-bottom:22px;
                    "
                >

                    <div>

                        <h3
                            style="
                                margin:0 0 6px;
                                color:#1f2937;
                                font-size:21px;
                            "
                        >
                            إنشاء حساب للطبيب
                        </h3>

                        <p
                            style="
                                margin:0;
                                color:#6b7280;
                                font-size:13px;
                            "
                        >
                            ${escapeHTML(name)}
                        </p>

                    </div>

                    <button
                        type="button"
                        id="closeDoctorAccountModal"
                        style="
                            width:36px;
                            height:36px;
                            border:0;
                            border-radius:50%;
                            background:#f1f5f9;
                            color:#475569;
                            cursor:pointer;
                            font-size:18px;
                        "
                    >
                        ×
                    </button>

                </div>


                <label
                    style="
                        display:block;
                        margin-bottom:7px;
                        color:#374151;
                        font-size:13px;
                        font-weight:700;
                    "
                >
                    اسم المستخدم
                </label>

                <input
                    type="text"
                    id="doctorAccountUsername"
                    placeholder="مثال: doctor.omar"
                    autocomplete="off"
                    style="
                        width:100%;
                        box-sizing:border-box;
                        padding:12px 14px;
                        border:1px solid #d1d5db;
                        border-radius:10px;
                        outline:none;
                        margin-bottom:18px;
                        font-size:14px;
                    "
                />


                <label
                    style="
                        display:block;
                        margin-bottom:7px;
                        color:#374151;
                        font-size:13px;
                        font-weight:700;
                    "
                >
                    كلمة المرور
                </label>

                <input
                    type="password"
                    id="doctorAccountPassword"
                    placeholder="أدخل كلمة المرور"
                    autocomplete="new-password"
                    style="
                        width:100%;
                        box-sizing:border-box;
                        padding:12px 14px;
                        border:1px solid #d1d5db;
                        border-radius:10px;
                        outline:none;
                        margin-bottom:10px;
                        font-size:14px;
                    "
                />

                <p
                    style="
                        margin:0 0 20px;
                        color:#9ca3af;
                        font-size:12px;
                    "
                >
                    سيستخدم الطبيب هذه البيانات لتسجيل الدخول إلى حسابه.
                </p>


                <div
                    id="doctorAccountError"
                    style="
                        display:none;
                        margin-bottom:15px;
                        padding:11px 13px;
                        border-radius:9px;
                        background:#fef2f2;
                        color:#b91c1c;
                        font-size:13px;
                    "
                ></div>


                <div
                    style="
                        display:flex;
                        gap:10px;
                        justify-content:flex-start;
                    "
                >

                    <button
                        type="button"
                        id="saveDoctorAccountBtn"
                        style="
                            border:0;
                            background:#2563eb;
                            color:#ffffff;
                            padding:12px 20px;
                            border-radius:10px;
                            cursor:pointer;
                            font-weight:700;
                        "
                    >
                        إنشاء الحساب
                    </button>

                    <button
                        type="button"
                        id="cancelDoctorAccountBtn"
                        style="
                            border:0;
                            background:#f1f5f9;
                            color:#374151;
                            padding:12px 20px;
                            border-radius:10px;
                            cursor:pointer;
                            font-weight:700;
                        "
                    >
                        إلغاء
                    </button>

                </div>

            </div>

        </div>
    `;


    // =====================================================
    // BACK BUTTON
    // =====================================================

    const backButton =
        document.getElementById(
            "backToDoctorsBtn"
        );

    if (backButton) {

        backButton.addEventListener(
            "click",
            () => {
                renderDoctorsModule();
            }
        );

    }


    // =====================================================
    // LOAD ABSENCE DATA
    // =====================================================

    const absenceSection =
        document.getElementById(
            "doctorAbsenceSection"
        );

    try {

        const absenceData =
            await apiRequest(
                `${API_BASE}/admin/doctors/${doctor.id}/absence`
            );

        const appointments =
            absenceData.appointments || [];

        const workStatus =
            absenceData.doctor?.work_status ||
            status;

        if (
            workStatus === "not_started" &&
            appointments.length > 0
        ) {

            absenceSection.innerHTML = `

                <div
                    style="
                        background:#fff7ed;
                        border:1px solid #fed7aa;
                        border-radius:14px;
                        padding:20px;
                    "
                >

                    <div
                        style="
                            display:flex;
                            align-items:center;
                            gap:12px;
                            margin-bottom:10px;
                        "
                    >

                        <span
                            style="
                                font-size:28px;
                            "
                        >
                            ⚠️
                        </span>

                        <strong
                            style="
                                color:#c2410c;
                                font-size:17px;
                            "
                        >
                            تنبيه إداري
                        </strong>

                    </div>

                    <p
                        style="
                            margin:0 0 8px;
                            color:#7c2d12;
                            font-size:14px;
                            line-height:1.8;
                        "
                    >
                        الطبيب
                        <strong>
                            ${escapeHTML(name)}
                        </strong>
                        لم يبدأ دوامه حتى الآن،
                        ولديه
                        <strong>
                            ${appointments.length}
                        </strong>
                        موعدًا مجدولًا اليوم.
                    </p>

                    <button
                        type="button"
                        id="manageDoctorAbsenceBtn"
                        style="
                            margin-top:12px;
                            border:0;
                            background:#ea580c;
                            color:#ffffff;
                            padding:11px 18px;
                            border-radius:9px;
                            cursor:pointer;
                            font-weight:700;
                        "
                    >
                        ⚠️ إدارة حالة الغياب
                    </button>

                </div>

            `;

            const absenceButton =
                document.getElementById(
                    "manageDoctorAbsenceBtn"
                );

            if (absenceButton) {

               
                absenceButton.addEventListener(
    "click",
    () => {
        showDoctorAbsenceManager(
            doctor,
            appointments
        );
    }
);

            }

        } else {

            absenceSection.innerHTML = `

                <div
                    style="
                        display:flex;
                        align-items:center;
                        gap:12px;
                        background:#f0fdf4;
                        border:1px solid #bbf7d0;
                        color:#166534;
                        border-radius:14px;
                        padding:17px 20px;
                    "
                >

                    <span
                        style="font-size:23px;"
                    >
                        ✓
                    </span>

                    <div>

                        <strong
                            style="
                                display:block;
                                margin-bottom:4px;
                            "
                        >
                            لا توجد حالة غياب تستدعي التدخل الآن
                        </strong>

                        <span
                            style="
                                font-size:13px;
                            "
                        >
                            لا توجد مواعيد اليوم تتطلب إجراءً إداريًا.
                        </span>

                    </div>

                </div>

            `;

        }

    } catch (error) {

        console.error(
            "DOCTOR ABSENCE LOAD ERROR:",
            error
        );

        absenceSection.innerHTML = `

            <div
                style="
                    background:#fef2f2;
                    border:1px solid #fecaca;
                    color:#b91c1c;
                    border-radius:14px;
                    padding:16px;
                "
            >
                تعذر التحقق من مواعيد الطبيب اليوم.
            </div>

        `;

    }


    // =====================================================
    // CREATE ACCOUNT ELEMENTS
    // =====================================================

    const createAccountButton =
        document.getElementById(
            "createDoctorAccountBtn"
        );

    const modal =
        document.getElementById(
            "doctorAccountModal"
        );

    const closeModalButton =
        document.getElementById(
            "closeDoctorAccountModal"
        );

    const cancelModalButton =
        document.getElementById(
            "cancelDoctorAccountBtn"
        );

    const saveAccountButton =
        document.getElementById(
            "saveDoctorAccountBtn"
        );

    const usernameInput =
        document.getElementById(
            "doctorAccountUsername"
        );

    const passwordInput =
        document.getElementById(
            "doctorAccountPassword"
        );

    const errorBox =
        document.getElementById(
            "doctorAccountError"
        );


    // =====================================================
    // OPEN MODAL
    // =====================================================

    if (createAccountButton) {

        createAccountButton.addEventListener(
            "click",
            () => {

                if (!modal) {
                    return;
                }

                modal.style.display =
                    "flex";

                if (usernameInput) {

                    usernameInput.value = "";

                    setTimeout(
                        () => {
                            usernameInput.focus();
                        },
                        100
                    );

                }

                if (passwordInput) {
                    passwordInput.value = "";
                }

                if (errorBox) {

                    errorBox.style.display =
                        "none";

                    errorBox.textContent =
                        "";

                }

            }
        );

    }


    // =====================================================
    // CLOSE MODAL
    // =====================================================

    const closeModal = () => {

        if (modal) {

            modal.style.display =
                "none";

        }

    };


    if (closeModalButton) {

        closeModalButton.addEventListener(
            "click",
            closeModal
        );

    }

    if (cancelModalButton) {

        cancelModalButton.addEventListener(
            "click",
            closeModal
        );

    }


    if (modal) {

        modal.addEventListener(
            "click",
            event => {

                if (
                    event.target === modal
                ) {

                    closeModal();

                }

            }
        );

    }


    // =====================================================
    // SAVE DOCTOR ACCOUNT
    // =====================================================

    if (saveAccountButton) {

        saveAccountButton.addEventListener(
            "click",
            async () => {

                const newUsername =
                    usernameInput
                        ? usernameInput.value.trim()
                        : "";

                const newPassword =
                    passwordInput
                        ? passwordInput.value.trim()
                        : "";


                if (!newUsername) {

                    if (errorBox) {

                        errorBox.style.display =
                            "block";

                        errorBox.textContent =
                            "أدخل اسم المستخدم.";

                    }

                    if (usernameInput) {
                        usernameInput.focus();
                    }

                    return;

                }


                if (!newPassword) {

                    if (errorBox) {

                        errorBox.style.display =
                            "block";

                        errorBox.textContent =
                            "أدخل كلمة المرور.";

                    }

                    if (passwordInput) {
                        passwordInput.focus();
                    }

                    return;

                }


                saveAccountButton.disabled =
                    true;

                saveAccountButton.textContent =
                    "جاري إنشاء الحساب...";


                if (errorBox) {

                    errorBox.style.display =
                        "none";

                    errorBox.textContent =
                        "";

                }


                try {

                    const result =
                        await apiRequest(
                            `${API_BASE}/admin/doctors/${doctor.id}/account`,
                            {
                                method: "POST",

                                headers: {
                                    "Content-Type":
                                        "application/json"
                                },

                                body:
                                    JSON.stringify({
                                        username:
                                            newUsername,

                                        password:
                                            newPassword
                                    })
                            }
                        );


                    console.log(
                        "DOCTOR ACCOUNT CREATED:",
                        result
                    );


                    closeModal();

                    showToast(
                        "تم إنشاء حساب الطبيب وربطه بنجاح.",
                        "success"
                    );


                    await renderDoctorsModule();


                } catch (error) {

                    console.error(
                        "CREATE DOCTOR ACCOUNT ERROR:",
                        error
                    );

                    if (errorBox) {

                        errorBox.style.display =
                            "block";

                        errorBox.textContent =
                            error.message ||
                            "تعذر إنشاء الحساب.";

                    }

                } finally {

                    saveAccountButton.disabled =
                        false;

                    saveAccountButton.textContent =
                        "إنشاء الحساب";

                }

            }
        );

    }

}


async function showDoctorAbsenceManager(
    doctor,
    appointments
) {
    if (!moduleContent) {
        return;
    }

    const safeAppointments =
        Array.isArray(appointments)
            ? appointments
            : [];

    setOverviewVisibility(false);

    if (moduleView) {
        moduleView.classList.remove("hidden");
        moduleView.style.display = "";
    }

    moduleContent.innerHTML = `
        <div
            dir="rtl"
            style="
                width:100%;
                background:#ffffff;
                border:1px solid #e5e7eb;
                border-radius:20px;
                padding:28px;
                box-sizing:border-box;
            "
        >

            <!-- HEADER -->
            <div
                style="
                    display:flex;
                    justify-content:space-between;
                    align-items:center;
                    gap:15px;
                    flex-wrap:wrap;
                    margin-bottom:25px;
                "
            >

                <div>
                    <div
                        style="
                            color:#ea580c;
                            font-size:13px;
                            font-weight:800;
                            margin-bottom:6px;
                        "
                    >
                        الإدارة الطبية
                    </div>

                    <h2
                        style="
                            margin:0 0 7px;
                            color:#111827;
                            font-size:26px;
                            font-weight:800;
                        "
                    >
                        ⚠️ إدارة غياب الطبيب
                    </h2>

                    <p
                        style="
                            margin:0;
                            color:#6b7280;
                            font-size:14px;
                        "
                    >
                        إدارة المواعيد المتأثرة بغياب الطبيب واتخاذ الإجراء الإداري المناسب.
                    </p>
                </div>

                <button
                    type="button"
                    id="backFromAbsenceBtn"
                    style="
                        border:0;
                        background:#f3f4f6;
                        color:#374151;
                        padding:11px 18px;
                        border-radius:10px;
                        cursor:pointer;
                        font-weight:700;
                    "
                >
                    ← العودة إلى الطبيب
                </button>

            </div>


            <!-- DOCTOR INFO -->
            <div
                style="
                    background:#fff7ed;
                    border:1px solid #fed7aa;
                    border-radius:16px;
                    padding:20px;
                    margin-bottom:25px;
                "
            >

                <div
                    style="
                        display:flex;
                        justify-content:space-between;
                        align-items:center;
                        gap:20px;
                        flex-wrap:wrap;
                    "
                >

                    <div>

                        <div
                            style="
                                color:#9a3412;
                                font-size:13px;
                                font-weight:700;
                                margin-bottom:5px;
                            "
                        >
                            الطبيب
                        </div>

                        <div
                            style="
                                color:#111827;
                                font-size:21px;
                                font-weight:800;
                            "
                        >
                            ${escapeHTML(
                                doctor.name ||
                                "غير معروف"
                            )}
                        </div>

                        <div
                            style="
                                color:#6b7280;
                                font-size:13px;
                                margin-top:5px;
                            "
                        >
                            ${escapeHTML(
                                doctor.specialty ||
                                "بدون تخصص محدد"
                            )}
                        </div>

                    </div>

                    <div
                        style="
                            background:#ffffff;
                            border:1px solid #fed7aa;
                            border-radius:12px;
                            padding:12px 18px;
                            min-width:170px;
                        "
                    >

                        <div
                            style="
                                color:#9a3412;
                                font-size:12px;
                                font-weight:700;
                                margin-bottom:5px;
                            "
                        >
                            حالة الدوام
                        </div>

                        <div
                            style="
                                color:#c2410c;
                                font-size:15px;
                                font-weight:800;
                            "
                        >
                            ${
                                doctor.work_status ===
                                "working"
                                    ? "يعمل الآن"
                                    : doctor.work_status ===
                                      "temporarily_unavailable"
                                    ? "غير متاح مؤقتًا"
                                    : doctor.work_status ===
                                      "closed"
                                    ? "أنهى الدوام"
                                    : "لم يبدأ الدوام"
                            }
                        </div>

                    </div>

                </div>

            </div>


            <!-- LOADING -->
            <div
                id="absenceManagerLoading"
                style="
                    padding:40px 20px;
                    text-align:center;
                    color:#6b7280;
                "
            >
                جاري تحميل آخر بيانات الغياب...
            </div>

            <div id="absenceManagerContent"></div>

        </div>
    `;


    /* =====================================================
       BACK BUTTON
    ===================================================== */

    const backButton =
        document.getElementById(
            "backFromAbsenceBtn"
        );

    if (backButton) {

        backButton.addEventListener(
            "click",
            () => {

                showDoctorDetails(
                    doctor,
                    safeAppointments
                );

            }
        );

    }


    try {

        /*
         * تحميل أحدث البيانات من السيرفر
         */
        const data =
            await apiRequest(
                `${API_BASE}/admin/doctors/${doctor.id}/absence`
            );


        const currentDoctor =
            data.doctor ||
            doctor;

        const allAppointments =
            Array.isArray(
                data.appointments
            )
                ? data.appointments
                : [];

        const affectedAppointments =
            Array.isArray(
                data.affectedAppointments
            )
                ? data.affectedAppointments
                : [];

        const actions =
            Array.isArray(
                data.actions
            )
                ? data.actions
                : [];


        const loading =
            document.getElementById(
                "absenceManagerLoading"
            );

        const content =
            document.getElementById(
                "absenceManagerContent"
            );


        if (loading) {
            loading.style.display =
                "none";
        }


        if (!content) {
            return;
        }


        /*
         * =================================================
         * HELPER
         * =================================================
         */

        function formatAppointmentDate(
            value
        ) {

            if (!value) {
                return "غير محدد";
            }

            const date =
                new Date(value);

            if (
                Number.isNaN(
                    date.getTime()
                )
            ) {
                return value;
            }

            return date.toLocaleDateString(
                "ar-DZ",
                {
                    year: "numeric",
                    month: "long",
                    day: "numeric"
                }
            );
        }


        function formatAppointmentTime(
            value
        ) {

            if (!value) {
                return "غير محدد";
            }

            return String(value)
                .slice(0, 5);
        }


        function getActionLabel(
            action
        ) {

            const labels = {

                reschedule:
                    "إعادة جدولة",

                transfer:
                    "تحويل لطبيب آخر",

                cancel:
                    "إلغاء الموعد",

                contact_patient:
                    "التواصل مع المريض",

                other:
                    "إجراء آخر"

            };

            return (
                labels[action] ||
                "إجراء إداري"
            );
        }


        /*
         * =================================================
         * AFFECTED APPOINTMENTS
         * =================================================
         */

        let affectedHTML = "";

        if (
            affectedAppointments.length
        ) {

            affectedHTML = `
                <div
                    style="
                        background:#fef2f2;
                        border:1px solid #fecaca;
                        border-radius:16px;
                        padding:20px;
                        margin-bottom:25px;
                    "
                >

                    <div
                        style="
                            display:flex;
                            justify-content:space-between;
                            align-items:center;
                            gap:15px;
                            flex-wrap:wrap;
                            margin-bottom:15px;
                        "
                    >

                        <div>

                            <h3
                                style="
                                    margin:0 0 5px;
                                    color:#991b1b;
                                    font-size:18px;
                                "
                            >
                                🚨 مواعيد تحتاج إلى إجراء
                            </h3>

                            <p
                                style="
                                    margin:0;
                                    color:#7f1d1d;
                                    font-size:13px;
                                "
                            >
                                هذه المواعيد لم تتم معالجتها بعد.
                            </p>

                        </div>

                        <span
                            style="
                                background:#dc2626;
                                color:#ffffff;
                                padding:6px 11px;
                                border-radius:20px;
                                font-size:12px;
                                font-weight:800;
                            "
                        >
                            ${affectedAppointments.length}
                        </span>

                    </div>

                    <div
                        style="
                            display:grid;
                            gap:12px;
                        "
                    >

                        ${affectedAppointments.map(
                            item => `
                                <div
                                    class="absence-appointment-card"
                                    data-appointment-id="${item.id}"
                                    style="
                                        background:#ffffff;
                                        border:1px solid #fecaca;
                                        border-radius:12px;
                                        padding:16px;
                                    "
                                >

                                    <div
                                        style="
                                            display:flex;
                                            justify-content:space-between;
                                            align-items:center;
                                            gap:15px;
                                            flex-wrap:wrap;
                                        "
                                    >

                                        <div>

                                            <div
                                                style="
                                                    color:#111827;
                                                    font-weight:800;
                                                    font-size:16px;
                                                "
                                            >
                                                #${item.id}
                                                —
                                                ${escapeHTML(
                                                    item.patient_name
                                                )}
                                            </div>

                                            <div
                                                style="
                                                    color:#6b7280;
                                                    font-size:13px;
                                                    margin-top:6px;
                                                "
                                            >
                                                📅
                                                ${formatAppointmentDate(
                                                    item.appointment_date
                                                )}
                                                &nbsp;&nbsp;
                                                🕐
                                                ${formatAppointmentTime(
                                                    item.appointment_time
                                                )}
                                            </div>

                                            <div
                                                style="
                                                    color:#6b7280;
                                                    font-size:13px;
                                                    margin-top:5px;
                                                "
                                            >
                                                📞
                                                ${
                                                    item.patient_phone
                                                        ? escapeHTML(
                                                            item.patient_phone
                                                        )
                                                        : "رقم الهاتف غير مسجل"
                                                }
                                            </div>

                                        </div>

                                        <button
                                            type="button"
                                            class="selectAbsenceAppointmentBtn"
                                            data-appointment-id="${item.id}"
                                            style="
                                                border:0;
                                                background:#dc2626;
                                                color:#ffffff;
                                                padding:10px 15px;
                                                border-radius:9px;
                                                cursor:pointer;
                                                font-weight:700;
                                            "
                                        >
                                            إدارة الموعد
                                        </button>

                                    </div>

                                </div>
                            `
                        ).join("")}

                    </div>

                </div>
            `;

        } else {

            affectedHTML = `
                <div
                    style="
                        background:#ecfdf5;
                        border:1px solid #a7f3d0;
                        border-radius:16px;
                        padding:20px;
                        margin-bottom:25px;
                    "
                >

                    <div
                        style="
                            color:#047857;
                            font-weight:800;
                            font-size:17px;
                            margin-bottom:6px;
                        "
                    >
                        ✓ لا توجد مواعيد تحتاج إلى إجراء الآن
                    </div>

                    <div
                        style="
                            color:#065f46;
                            font-size:13px;
                        "
                    >
                        تمت معالجة المواعيد الحالية أو لا توجد مواعيد اليوم مرتبطة بحالة الغياب.
                    </div>

                </div>
            `;

        }


        /*
         * =================================================
         * PROCESSED APPOINTMENTS
         * =================================================
         */

        const processedAppointments =
            allAppointments.filter(
                item =>
                    item.has_absence_action
            );


        let processedHTML = "";

        if (
            processedAppointments.length
        ) {

            processedHTML = `
                <div
                    style="
                        background:#f9fafb;
                        border:1px solid #e5e7eb;
                        border-radius:16px;
                        padding:20px;
                        margin-bottom:25px;
                    "
                >

                    <h3
                        style="
                            margin:0 0 5px;
                            color:#111827;
                            font-size:18px;
                        "
                    >
                        📋 المواعيد التي تمت معالجتها
                    </h3>

                    <p
                        style="
                            margin:0 0 16px;
                            color:#6b7280;
                            font-size:13px;
                        "
                    >
                        هذه المواعيد لديها إجراء إداري مسجل ولا تحتاج إلى معالجة مرة أخرى.
                    </p>

                    <div
                        style="
                            display:grid;
                            gap:12px;
                        "
                    >

                        ${processedAppointments.map(
                            item => `
                                <div
                                    style="
                                        background:#ffffff;
                                        border:1px solid #e5e7eb;
                                        border-radius:12px;
                                        padding:16px;
                                    "
                                >

                                    <div
                                        style="
                                            display:flex;
                                            justify-content:space-between;
                                            gap:15px;
                                            flex-wrap:wrap;
                                        "
                                    >

                                        <div>

                                            <div
                                                style="
                                                    font-weight:800;
                                                    color:#111827;
                                                "
                                            >
                                                #${item.id}
                                                —
                                                ${escapeHTML(
                                                    item.patient_name
                                                )}
                                            </div>

                                            <div
                                                style="
                                                    color:#6b7280;
                                                    font-size:13px;
                                                    margin-top:6px;
                                                "
                                            >
                                                📞
                                                ${
                                                    item.patient_phone
                                                        ? escapeHTML(
                                                            item.patient_phone
                                                        )
                                                        : "لا يوجد رقم"
                                                }
                                            </div>

                                            <div
                                                style="
                                                    color:#6b7280;
                                                    font-size:13px;
                                                    margin-top:5px;
                                                "
                                            >
                                                📅
                                                ${formatAppointmentDate(
                                                    item.appointment_date
                                                )}
                                                &nbsp;&nbsp;
                                                🕐
                                                ${formatAppointmentTime(
                                                    item.appointment_time
                                                )}
                                            </div>

                                        </div>

                                        <div
                                            style="
                                                text-align:right;
                                            "
                                        >

                                            <div
                                                style="
                                                    display:inline-block;
                                                    background:#eff6ff;
                                                    color:#1d4ed8;
                                                    padding:7px 11px;
                                                    border-radius:20px;
                                                    font-size:12px;
                                                    font-weight:800;
                                                "
                                            >
                                                ${getActionLabel(
                                                    item.action_type
                                                )}
                                            </div>

                                            <div
                                                style="
                                                    margin-top:7px;
                                                    font-size:12px;
                                                    color:${
                                                        item.patient_contacted
                                                            ? "#047857"
                                                            : "#b45309"
                                                    };
                                                    font-weight:700;
                                                "
                                            >
                                                ${
                                                    item.patient_contacted
                                                        ? "✓ تم التواصل مع المريض"
                                                        : "⚠ لم يتم تسجيل التواصل مع المريض"
                                                }
                                            </div>

                                        </div>

                                    </div>

                                </div>
                            `
                        ).join("")}

                    </div>

                </div>
            `;

        }


        /*
         * =================================================
         * ACTION HISTORY
         * =================================================
         */

        let actionsHTML = "";

        if (actions.length) {

            actionsHTML = `
                <div
                    style="
                        background:#ffffff;
                        border:1px solid #e5e7eb;
                        border-radius:16px;
                        padding:20px;
                        margin-bottom:25px;
                    "
                >

                    <h3
                        style="
                            margin:0 0 5px;
                            color:#111827;
                            font-size:18px;
                        "
                    >
                        📝 سجل إجراءات الغياب
                    </h3>

                    <p
                        style="
                            margin:0 0 16px;
                            color:#6b7280;
                            font-size:13px;
                        "
                    >
                        سجل القرارات التي اتخذتها الإدارة بخصوص غياب الطبيب.
                    </p>

                    <div
                        style="
                            display:grid;
                            gap:10px;
                        "
                    >

                        ${actions.map(
                            action => `
                                <div
                                    style="
                                        background:#f9fafb;
                                        border:1px solid #e5e7eb;
                                        border-radius:10px;
                                        padding:14px;
                                    "
                                >

                                    <div
                                        style="
                                            display:flex;
                                            justify-content:space-between;
                                            gap:15px;
                                            flex-wrap:wrap;
                                        "
                                    >

                                        <div>

                                            <strong
                                                style="
                                                    color:#111827;
                                                "
                                            >
                                                ${getActionLabel(
                                                    action.action_type
                                                )}
                                            </strong>

                                            <div
                                                style="
                                                    color:#6b7280;
                                                    font-size:12px;
                                                    margin-top:5px;
                                                "
                                            >
                                                الموعد:
                                                ${
                                                    action.appointment_id
                                                        ? "#" +
                                                          action.appointment_id
                                                        : "غير مرتبط"
                                                }
                                            </div>

                                        </div>

                                        <div
                                            style="
                                                font-size:12px;
                                                color:#6b7280;
                                            "
                                        >
                                            ${formatAppointmentDate(
                                                action.absence_date
                                            )}
                                        </div>

                                    </div>

                                    ${
                                        action.new_dentist_name
                                            ? `
                                                <div
                                                    style="
                                                        margin-top:8px;
                                                        color:#374151;
                                                        font-size:13px;
                                                    "
                                                >
                                                    👨‍⚕️ الطبيب البديل:
                                                    <strong>
                                                        ${escapeHTML(
                                                            action.new_dentist_name
                                                        )}
                                                    </strong>
                                                </div>
                                            `
                                            : ""
                                    }

                                    ${
                                        action.new_appointment_date
                                            ? `
                                                <div
                                                    style="
                                                        margin-top:6px;
                                                        color:#374151;
                                                        font-size:13px;
                                                    "
                                                >
                                                    📅 الموعد الجديد:
                                                    ${formatAppointmentDate(
                                                        action.new_appointment_date
                                                    )}
                                                    ${
                                                        action.new_appointment_time
                                                            ? " — " +
                                                              formatAppointmentTime(
                                                                  action.new_appointment_time
                                                              )
                                                            : ""
                                                    }
                                                </div>
                                            `
                                            : ""
                                    }

                                    <div
                                        style="
                                            margin-top:7px;
                                            font-size:12px;
                                            font-weight:700;
                                            color:${
                                                action.patient_contacted
                                                    ? "#047857"
                                                    : "#b45309"
                                            };
                                        "
                                    >
                                        ${
                                            action.patient_contacted
                                                ? "✓ تم التواصل مع المريض"
                                                : "⚠ لم يتم تسجيل التواصل مع المريض"
                                        }
                                    </div>

                                    ${
                                        action.notes
                                            ? `
                                                <div
                                                    style="
                                                        margin-top:7px;
                                                        color:#6b7280;
                                                        font-size:12px;
                                                    "
                                                >
                                                    📝
                                                    ${escapeHTML(
                                                        action.notes
                                                    )}
                                                </div>
                                            `
                                            : ""
                                    }

                                </div>
                            `
                        ).join("")}

                    </div>

                </div>
            `;

        }


        /*
         * =================================================
         * ACTION FORM
         * =================================================
         */

        let actionFormHTML = "";

        if (
            affectedAppointments.length
        ) {

            actionFormHTML = `
                <div
                    id="absenceActionPanel"
                    style="
                        background:#f8fafc;
                        border:1px solid #e2e8f0;
                        border-radius:16px;
                        padding:22px;
                        margin-bottom:25px;
                    "
                >

                    <h3
                        style="
                            margin:0 0 5px;
                            color:#111827;
                            font-size:18px;
                        "
                    >
                        ⚙️ تنفيذ إجراء إداري
                    </h3>

                    <p
                        style="
                            margin:0 0 20px;
                            color:#6b7280;
                            font-size:13px;
                        "
                    >
                        اختر الموعد ثم حدد الإجراء المطلوب.
                    </p>


                    <!-- APPOINTMENT -->
                    <div style="margin-bottom:15px;">

                        <label
                            style="
                                display:block;
                                margin-bottom:7px;
                                color:#374151;
                                font-weight:700;
                                font-size:13px;
                            "
                        >
                            الموعد المتأثر
                        </label>

                        <select
                            id="absenceAppointmentSelect"
                            style="
                                width:100%;
                                box-sizing:border-box;
                                padding:12px;
                                border:1px solid #d1d5db;
                                border-radius:10px;
                                background:#ffffff;
                                color:#111827;
                            "
                        >

                            <option value="">
                                اختر الموعد
                            </option>

                            ${affectedAppointments.map(
                                item => `
                                    <option
                                        value="${item.id}"
                                    >
                                        #${item.id} —
                                        ${escapeHTML(
                                            item.patient_name
                                        )}
                                        —
                                        ${formatAppointmentTime(
                                            item.appointment_time
                                        )}
                                    </option>
                                `
                            ).join("")}

                        </select>

                    </div>


                    <!-- PATIENT INFO -->
                    <div
                        id="selectedPatientInfo"
                        style="
                            display:none;
                            background:#ffffff;
                            border:1px solid #dbeafe;
                            border-radius:12px;
                            padding:15px;
                            margin-bottom:15px;
                        "
                    ></div>


                    <!-- ACTION -->
                    <div style="margin-bottom:15px;">

                        <label
                            style="
                                display:block;
                                margin-bottom:7px;
                                color:#374151;
                                font-weight:700;
                                font-size:13px;
                            "
                        >
                            الإجراء
                        </label>

                        <select
                            id="absenceActionSelect"
                            style="
                                width:100%;
                                box-sizing:border-box;
                                padding:12px;
                                border:1px solid #d1d5db;
                                border-radius:10px;
                                background:#ffffff;
                            "
                        >

                            <option value="">
                                اختر الإجراء
                            </option>

                            <option value="reschedule">
                                🔄 إعادة جدولة
                            </option>

                            <option value="transfer">
                                👨‍⚕️ تحويل لطبيب آخر
                            </option>

                            <option value="cancel">
                                ❌ إلغاء الموعد
                            </option>

                            <option value="contact_patient">
                                📞 تسجيل التواصل مع المريض
                            </option>

                        </select>

                    </div>


                    <!-- NEW DENTIST -->
                    <div
                        id="newDentistGroup"
                        style="
                            display:none;
                            margin-bottom:15px;
                        "
                    >

                        <label
                            style="
                                display:block;
                                margin-bottom:7px;
                                color:#374151;
                                font-weight:700;
                                font-size:13px;
                            "
                        >
                            الطبيب البديل
                        </label>

                        <select
                            id="newDentistSelect"
                            style="
                                width:100%;
                                box-sizing:border-box;
                                padding:12px;
                                border:1px solid #d1d5db;
                                border-radius:10px;
                                background:#ffffff;
                            "
                        >

                            <option value="">
                                جاري تحميل الأطباء...
                            </option>

                        </select>

                    </div>


                    <!-- NEW DATE/TIME -->
                    <div
                        id="rescheduleGroup"
                        style="
                            display:none;
                            margin-bottom:15px;
                        "
                    >

                        <div
                            style="
                                display:grid;
                                grid-template-columns:
                                    repeat(
                                        auto-fit,
                                        minmax(180px,1fr)
                                    );
                                gap:12px;
                            "
                        >

                            <div>

                                <label
                                    style="
                                        display:block;
                                        margin-bottom:7px;
                                        color:#374151;
                                        font-weight:700;
                                        font-size:13px;
                                    "
                                >
                                    التاريخ الجديد
                                </label>

                                <input
                                    type="date"
                                    id="newAppointmentDate"
                                    style="
                                        width:100%;
                                        box-sizing:border-box;
                                        padding:12px;
                                        border:1px solid #d1d5db;
                                        border-radius:10px;
                                    "
                                >

                            </div>

                            <div>

                                <label
                                    style="
                                        display:block;
                                        margin-bottom:7px;
                                        color:#374151;
                                        font-weight:700;
                                        font-size:13px;
                                    "
                                >
                                    الوقت الجديد
                                </label>

                                <input
                                    type="time"
                                    id="newAppointmentTime"
                                    style="
                                        width:100%;
                                        box-sizing:border-box;
                                        padding:12px;
                                        border:1px solid #d1d5db;
                                        border-radius:10px;
                                    "
                                >

                            </div>

                        </div>

                    </div>


                    <!-- REASON -->
                    <div style="margin-bottom:15px;">

                        <label
                            style="
                                display:block;
                                margin-bottom:7px;
                                color:#374151;
                                font-weight:700;
                                font-size:13px;
                            "
                        >
                            سبب الإجراء
                        </label>

                        <input
                            type="text"
                            id="absenceReasonInput"
                            placeholder="مثال: غياب الطبيب"
                            style="
                                width:100%;
                                box-sizing:border-box;
                                padding:12px;
                                border:1px solid #d1d5db;
                                border-radius:10px;
                            "
                        >

                    </div>


                    <!-- CONTACT -->
                    <label
                        style="
                            display:flex;
                            align-items:center;
                            gap:9px;
                            margin-bottom:15px;
                            color:#374151;
                            font-size:13px;
                            font-weight:700;
                            cursor:pointer;
                        "
                    >

                        <input
                            type="checkbox"
                            id="patientContactedCheckbox"
                        >

                        تم التواصل مع المريض

                    </label>


                    <!-- NOTES -->
                    <div style="margin-bottom:18px;">

                        <label
                            style="
                                display:block;
                                margin-bottom:7px;
                                color:#374151;
                                font-weight:700;
                                font-size:13px;
                            "
                        >
                            ملاحظات
                        </label>

                        <textarea
                            id="absenceNotesInput"
                            rows="4"
                            placeholder="أضف أي ملاحظات إدارية..."
                            style="
                                width:100%;
                                box-sizing:border-box;
                                padding:12px;
                                border:1px solid #d1d5db;
                                border-radius:10px;
                                resize:vertical;
                            "
                        ></textarea>

                    </div>


                    <button
                        type="button"
                        id="saveAbsenceActionBtn"
                        style="
                            width:100%;
                            border:0;
                            background:#2563eb;
                            color:#ffffff;
                            padding:13px;
                            border-radius:10px;
                            cursor:pointer;
                            font-weight:800;
                            font-size:14px;
                        "
                    >
                        حفظ الإجراء الإداري
                    </button>

                </div>
            `;

        }


        content.innerHTML =
            affectedHTML +
            processedHTML +
            actionFormHTML +
            actionsHTML;


        /*
         * =================================================
         * SELECT APPOINTMENT
         * =================================================
         */

        const appointmentSelect =
            document.getElementById(
                "absenceAppointmentSelect"
            );

        const patientInfo =
            document.getElementById(
                "selectedPatientInfo"
            );


        if (appointmentSelect) {

            appointmentSelect.addEventListener(
                "change",
                () => {

                    const selected =
                        affectedAppointments.find(
                            item =>
                                Number(item.id) ===
                                Number(
                                    appointmentSelect.value
                                )
                        );

                    if (!selected) {

                        if (patientInfo) {
                            patientInfo.style.display =
                                "none";
                            patientInfo.innerHTML =
                                "";
                        }

                        return;
                    }


                    if (patientInfo) {

                        patientInfo.style.display =
                            "block";

                        patientInfo.innerHTML = `

                            <div
                                style="
                                    color:#1d4ed8;
                                    font-size:12px;
                                    font-weight:800;
                                    margin-bottom:8px;
                                "
                            >
                                بيانات المريض
                            </div>

                            <div
                                style="
                                    display:grid;
                                    grid-template-columns:
                                        repeat(
                                            auto-fit,
                                            minmax(180px,1fr)
                                        );
                                    gap:10px;
                                "
                            >

                                <div>
                                    <strong>
                                        المريض:
                                    </strong>
                                    ${escapeHTML(
                                        selected.patient_name
                                    )}
                                </div>

                                <div>
                                    <strong>
                                        الهاتف:
                                    </strong>
                                    ${
                                        selected.patient_phone
                                            ? escapeHTML(
                                                selected.patient_phone
                                            )
                                            : "غير مسجل"
                                    }
                                </div>

                                <div>
                                    <strong>
                                        الموعد:
                                    </strong>
                                    ${formatAppointmentDate(
                                        selected.appointment_date
                                    )}
                                    —
                                    ${formatAppointmentTime(
                                        selected.appointment_time
                                    )}
                                </div>

                                <div>
                                    <strong>
                                        السبب:
                                    </strong>
                                    ${escapeHTML(
                                        selected.reason
                                    )}
                                </div>

                            </div>

                        `;

                    }

                }
            );

        }


        /*
         * =================================================
         * QUICK SELECT BUTTONS
         * =================================================
         */

        document
            .querySelectorAll(
                ".selectAbsenceAppointmentBtn"
            )
            .forEach(button => {

                button.addEventListener(
                    "click",
                    () => {

                        const appointmentId =
                            button.dataset
                                .appointmentId;

                        if (
                            appointmentSelect
                        ) {

                            appointmentSelect.value =
                                appointmentId;

                            appointmentSelect.dispatchEvent(
                                new Event(
                                    "change"
                                )
                            );

                            document
                                .getElementById(
                                    "absenceActionPanel"
                                )
                                ?.scrollIntoView({
                                    behavior:
                                        "smooth",
                                    block:
                                        "start"
                                });

                        }

                    }
                );

            });


        /*
         * =================================================
         * ACTION CHANGE
         * =================================================
         */

        const actionSelect =
            document.getElementById(
                "absenceActionSelect"
            );

        const dentistGroup =
            document.getElementById(
                "newDentistGroup"
            );

        const rescheduleGroup =
            document.getElementById(
                "rescheduleGroup"
            );


        function updateActionFields() {

            const action =
                actionSelect
                    ? actionSelect.value
                    : "";

            if (dentistGroup) {

                dentistGroup.style.display =
                    action === "transfer"
                        ? "block"
                        : "none";

            }

            if (rescheduleGroup) {

                rescheduleGroup.style.display =
                    action === "reschedule"
                        ? "block"
                        : "none";

            }

        }


        if (actionSelect) {

            actionSelect.addEventListener(
                "change",
                updateActionFields
            );

        }


        /*
         * =================================================
         * LOAD OTHER DOCTORS
         * =================================================
         */

        const newDentistSelect =
            document.getElementById(
                "newDentistSelect"
            );


        if (newDentistSelect) {

            try {

                const doctors =
                    await apiRequest(
                        `${API_BASE}/admin/doctors`
                    );

                const availableDoctors =
                    Array.isArray(doctors)
                        ? doctors.filter(
                            item =>
                                Number(
                                    item.id
                                ) !==
                                Number(
                                    doctor.id
                                )
                        )
                        : [];


                if (
                    !availableDoctors.length
                ) {

                    newDentistSelect.innerHTML = `
                        <option value="">
                            لا يوجد طبيب بديل
                        </option>
                    `;

                } else {

                    newDentistSelect.innerHTML = `
                        <option value="">
                            اختر الطبيب البديل
                        </option>

                        ${availableDoctors.map(
                            item => `
                                <option
                                    value="${item.id}"
                                >
                                    ${escapeHTML(
                                        item.name ||
                                        `${item.first_name || ""} ${item.last_name || ""}`
                                    )}
                                    ${
                                        item.specialty
                                            ? " — " +
                                              escapeHTML(
                                                  item.specialty
                                              )
                                            : ""
                                    }
                                </option>
                            `
                        ).join("")}
                    `;

                }

            } catch (error) {

                console.error(
                    "LOAD ALTERNATIVE DOCTORS ERROR:",
                    error
                );

                newDentistSelect.innerHTML = `
                    <option value="">
                        تعذر تحميل الأطباء
                    </option>
                `;

            }

        }


        /*
         * =================================================
         * SAVE ACTION
         * =================================================
         */

        const saveButton =
            document.getElementById(
                "saveAbsenceActionBtn"
            );


        if (saveButton) {

            saveButton.addEventListener(
                "click",
                async () => {

                    const appointmentId =
                        appointmentSelect
                            ? appointmentSelect.value
                            : "";

                    const action =
                        actionSelect
                            ? actionSelect.value
                            : "";

                    const newDentist =
                        newDentistSelect
                            ? newDentistSelect.value
                            : "";

                    const newDate =
                        document.getElementById(
                            "newAppointmentDate"
                        )?.value || "";

                    const newTime =
                        document.getElementById(
                            "newAppointmentTime"
                        )?.value || "";

                    const reason =
                        document.getElementById(
                            "absenceReasonInput"
                        )?.value
                            ?.trim() ||
                        "غياب الطبيب";

                    const contacted =
                        document.getElementById(
                            "patientContactedCheckbox"
                        )?.checked ||
                        false;

                    const notes =
                        document.getElementById(
                            "absenceNotesInput"
                        )?.value
                            ?.trim() ||
                        "";


                    if (!appointmentId) {

                        showToast(
                            "اختر الموعد أولًا.",
                            "error"
                        );

                        return;

                    }


                    if (!action) {

                        showToast(
                            "اختر الإجراء الإداري.",
                            "error"
                        );

                        return;

                    }


                    if (
                        action === "transfer" &&
                        !newDentist
                    ) {

                        showToast(
                            "اختر الطبيب البديل.",
                            "error"
                        );

                        return;

                    }


                    if (
                        action === "reschedule" &&
                        (!newDate || !newTime)
                    ) {

                        showToast(
                            "حدد التاريخ والوقت الجديدين.",
                            "error"
                        );

                        return;

                    }


                    if (
                        action === "contact_patient" &&
                        !contacted
                    ) {

                        showToast(
                            "فعّل خيار تم التواصل مع المريض.",
                            "error"
                        );

                        return;

                    }


                    const selectedAppointment =
                        affectedAppointments.find(
                            item =>
                                Number(
                                    item.id
                                ) ===
                                Number(
                                    appointmentId
                                )
                        );


                    if (!selectedAppointment) {

                        showToast(
                            "تعذر العثور على الموعد المحدد.",
                            "error"
                        );

                        return;

                    }


                    const confirmed =
                        window.confirm(
                            `هل تريد تنفيذ الإجراء التالي؟

المريض: ${selectedAppointment.patient_name}
الموعد: #${selectedAppointment.id}
الإجراء: ${getActionLabel(action)}`
                        );


                    if (!confirmed) {
                        return;
                    }


                    saveButton.disabled =
                        true;

                    saveButton.textContent =
                        "جاري حفظ الإجراء...";


                    try {

                        const result =
                            await apiRequest(
                                `${API_BASE}/admin/doctors/${doctor.id}/absence/action`,
                                {
                                    method:
                                        "POST",

                                    headers: {
                                        "Content-Type":
                                            "application/json"
                                    },

                                    body:
                                        JSON.stringify({

                                            absence_date:
                                                new Date()
                                                    .toISOString()
                                                    .split(
                                                        "T"
                                                    )[0],

                                            reason,

                                            action_type:
                                                action,

                                            appointment_id:
                                                Number(
                                                    appointmentId
                                                ),

                                            new_dentist_id:
                                                newDentist
                                                    ? Number(
                                                        newDentist
                                                    )
                                                    : null,

                                            new_appointment_date:
                                                newDate ||
                                                null,

                                            new_appointment_time:
                                                newTime ||
                                                null,

                                            patient_contacted:
                                                contacted,

                                            notes:
                                                notes ||
                                                null

                                        })

                                }
                            );


                        showToast(
                            result.message ||
                                "تم حفظ الإجراء بنجاح.",
                            "success"
                        );


                        /*
                         * إعادة تحميل الصفحة نفسها
                         * بدل فقدان البيانات
                         */
                        setTimeout(
                            () => {

                                showDoctorAbsenceManager(
                                    doctor,
                                    []
                                );

                            },
                            500
                        );


                    } catch (error) {

                        console.error(
                            "SAVE ABSENCE ACTION ERROR:",
                            error
                        );

                        showToast(
                            error.message ||
                                "تعذر حفظ الإجراء.",
                            "error"
                        );

                        saveButton.disabled =
                            false;

                        saveButton.textContent =
                            "حفظ الإجراء الإداري";

                    }

                }
            );

        }

    } catch (error) {

        console.error(
            "DOCTOR ABSENCE MANAGER ERROR:",
            error
        );

        const loading =
            document.getElementById(
                "absenceManagerLoading"
            );

        if (loading) {

            loading.style.display =
                "block";

            loading.innerHTML = `
                <div
                    style="
                        background:#fef2f2;
                        color:#991b1b;
                        border:1px solid #fecaca;
                        border-radius:12px;
                        padding:20px;
                    "
                >
                    تعذر تحميل بيانات إدارة الغياب.
                    <br>
                    ${escapeHTML(
                        error.message || ""
                    )}
                </div>
            `;

        }

    }
}




// =====================================================
// STAFF STATUS
// =====================================================

function getReceptionStaffStatus(status) {

    switch (
        String(status || "").toLowerCase()
    ) {

        case "working":
        case "present":

            return {
                text: "يعمل الآن",
                className: "working"
            };


        case "closed":

            return {
                text: "أنهى الدوام",
                className: "not-started"
            };


        case "absent":

            return {
                text: "غائب",
                className: "absent"
            };


        default:

            return {
                text: "لم يبدأ الدوام",
                className: "not-started"
            };

    }

}



// =====================================================
// STAFF FORM
// ADD + EDIT
// =====================================================

function showReceptionStaffForm(
    mode = "add",
    person = null
) {

    const oldModal =
        document.getElementById(
            "receptionStaffModal"
        );

    if (oldModal) {
        oldModal.remove();
    }


    const isEdit =
        mode === "edit";


    const title =
        isEdit
            ? "تعديل موظف الاستقبال"
            : "إضافة موظف استقبال";


    const buttonText =
        isEdit
            ? "حفظ التعديلات"
            : "إضافة الموظف";


    const current =
        person || {};


    const modal =
        document.createElement("div");


    modal.id =
        "receptionStaffModal";


    modal.innerHTML = `

        <div
            id="receptionStaffOverlay"
            style="
                position:fixed;
                inset:0;
                background:rgba(15,23,42,0.55);
                backdrop-filter:blur(4px);
                display:flex;
                align-items:center;
                justify-content:center;
                padding:20px;
                z-index:99999;
            "
        >

            <div
                style="
                    width:100%;
                    max-width:650px;
                    max-height:90vh;
                    overflow-y:auto;
                    background:#ffffff;
                    border-radius:20px;
                    box-shadow:0 20px 60px rgba(0,0,0,0.20);
                    direction:rtl;
                "
                onclick="event.stopPropagation()"
            >


                <!-- HEADER -->

                <div
                    style="
                        padding:24px 28px;
                        border-bottom:1px solid #e5e7eb;
                        display:flex;
                        justify-content:space-between;
                        align-items:center;
                        gap:15px;
                    "
                >

                    <div>

                        <h3
                            style="
                                margin:0 0 6px;
                                color:#1f2937;
                                font-size:21px;
                                font-weight:800;
                            "
                        >
                            ${title}
                        </h3>

                        <p
                            style="
                                margin:0;
                                color:#6b7280;
                                font-size:13px;
                            "
                        >
                            إدارة بيانات موظف الاستقبال وحساب الدخول.
                        </p>

                    </div>


                    <button
                        type="button"
                        id="closeReceptionStaffModal"
                        style="
                            width:38px;
                            height:38px;
                            border:0;
                            border-radius:10px;
                            background:#f3f4f6;
                            color:#4b5563;
                            cursor:pointer;
                            font-size:20px;
                            font-weight:700;
                        "
                    >
                        ×
                    </button>

                </div>



                <!-- FORM -->

                <form id="receptionStaffForm">

                    <div
                        style="
                            padding:28px;
                            display:grid;
                            grid-template-columns:1fr 1fr;
                            gap:18px;
                        "
                    >


                        <!-- NAME -->

                        <div
                            style="
                                grid-column:1 / -1;
                            "
                        >

                            <label
                                style="
                                    display:block;
                                    margin-bottom:7px;
                                    color:#374151;
                                    font-size:13px;
                                    font-weight:700;
                                "
                            >
                                اسم الموظف
                            </label>

                            <input
                                type="text"
                                id="receptionDisplayName"
                                required
                                value="${escapeHTML(
                                    current.display_name ||
                                    current.name ||
                                    ""
                                )}"
                                placeholder="مثال: محمد علي"
                                style="
                                    width:100%;
                                    box-sizing:border-box;
                                    padding:12px 13px;
                                    border:1px solid #d1d5db;
                                    border-radius:10px;
                                    outline:none;
                                    font-size:14px;
                                "
                            >

                        </div>



                        <!-- PHONE -->

                        <div>

                            <label
                                style="
                                    display:block;
                                    margin-bottom:7px;
                                    color:#374151;
                                    font-size:13px;
                                    font-weight:700;
                                "
                            >
                                الهاتف
                            </label>

                            <input
                                type="tel"
                                id="receptionPhone"
                                value="${escapeHTML(
                                    current.phone || ""
                                )}"
                                placeholder="0550123456"
                                style="
                                    width:100%;
                                    box-sizing:border-box;
                                    padding:12px 13px;
                                    border:1px solid #d1d5db;
                                    border-radius:10px;
                                    outline:none;
                                    font-size:14px;
                                    direction:ltr;
                                    text-align:right;
                                "
                            >

                        </div>



                        <!-- EMAIL -->

                        <div>

                            <label
                                style="
                                    display:block;
                                    margin-bottom:7px;
                                    color:#374151;
                                    font-size:13px;
                                    font-weight:700;
                                "
                            >
                                البريد الإلكتروني
                            </label>

                            <input
                                type="email"
                                id="receptionEmail"
                                value="${escapeHTML(
                                    current.email || ""
                                )}"
                                placeholder="employee@example.com"
                                style="
                                    width:100%;
                                    box-sizing:border-box;
                                    padding:12px 13px;
                                    border:1px solid #d1d5db;
                                    border-radius:10px;
                                    outline:none;
                                    font-size:14px;
                                    direction:ltr;
                                    text-align:left;
                                "
                            >

                        </div>



                        <!-- ACCOUNT TITLE -->

                        <div
                            style="
                                grid-column:1 / -1;
                                margin-top:5px;
                                padding-top:22px;
                                border-top:1px solid #e5e7eb;
                            "
                        >

                            <h4
                                style="
                                    margin:0 0 5px;
                                    color:#1f2937;
                                    font-size:16px;
                                    font-weight:800;
                                "
                            >
                                حساب الدخول
                            </h4>

                            <p
                                style="
                                    margin:0;
                                    color:#6b7280;
                                    font-size:12px;
                                "
                            >
                                ${isEdit
                                    ? "يمكنك تغيير اسم المستخدم. اترك كلمة المرور فارغة إذا كنت لا تريد تغييرها."
                                    : "سيتم إنشاء حساب موظف الاستقبال تلقائيًا."
                                }
                            </p>

                        </div>



                        <!-- USERNAME -->

                        <div>

                            <label
                                style="
                                    display:block;
                                    margin-bottom:7px;
                                    color:#374151;
                                    font-size:13px;
                                    font-weight:700;
                                "
                            >
                                اسم المستخدم
                            </label>

                            <input
                                type="text"
                                id="receptionUsername"
                                required
                                value="${escapeHTML(
                                    current.username || ""
                                )}"
                                placeholder="مثال: reception01"
                                autocomplete="off"
                                style="
                                    width:100%;
                                    box-sizing:border-box;
                                    padding:12px 13px;
                                    border:1px solid #d1d5db;
                                    border-radius:10px;
                                    outline:none;
                                    font-size:14px;
                                    direction:ltr;
                                    text-align:left;
                                "
                            >

                        </div>



                        <!-- PASSWORD -->

                        <div>

                            <label
                                style="
                                    display:block;
                                    margin-bottom:7px;
                                    color:#374151;
                                    font-size:13px;
                                    font-weight:700;
                                "
                            >
                                ${isEdit
                                    ? "كلمة المرور الجديدة"
                                    : "كلمة المرور"
                                }
                            </label>

                            <input
                                type="password"
                                id="receptionPassword"
                                ${isEdit ? "" : "required"}
                                placeholder="${isEdit
                                    ? "اتركها فارغة للإبقاء على الحالية"
                                    : "كلمة المرور"
                                }"
                                autocomplete="new-password"
                                style="
                                    width:100%;
                                    box-sizing:border-box;
                                    padding:12px 13px;
                                    border:1px solid #d1d5db;
                                    border-radius:10px;
                                    outline:none;
                                    font-size:14px;
                                "
                            >

                        </div>



                        <!-- CONFIRM PASSWORD -->

                        <div
                            style="
                                grid-column:1 / -1;
                            "
                        >

                            <label
                                style="
                                    display:block;
                                    margin-bottom:7px;
                                    color:#374151;
                                    font-size:13px;
                                    font-weight:700;
                                "
                            >
                                تأكيد كلمة المرور
                            </label>

                            <input
                                type="password"
                                id="receptionConfirmPassword"
                                ${isEdit ? "" : "required"}
                                placeholder="${isEdit
                                    ? "اتركها فارغة إذا لم تغير كلمة المرور"
                                    : "أعد كتابة كلمة المرور"
                                }"
                                autocomplete="new-password"
                                style="
                                    width:100%;
                                    box-sizing:border-box;
                                    padding:12px 13px;
                                    border:1px solid #d1d5db;
                                    border-radius:10px;
                                    outline:none;
                                    font-size:14px;
                                "
                            >

                        </div>



                        <!-- ERROR -->

                        <div
                            id="receptionStaffError"
                            style="
                                grid-column:1 / -1;
                                display:none;
                                padding:12px 14px;
                                border-radius:10px;
                                background:#fef2f2;
                                color:#b91c1c;
                                font-size:13px;
                                font-weight:600;
                            "
                        >
                        </div>

                    </div>



                    <!-- FOOTER -->

                    <div
                        style="
                            padding:18px 28px;
                            border-top:1px solid #e5e7eb;
                            display:flex;
                            gap:10px;
                        "
                    >

                        <button
                            type="submit"
                            id="saveReceptionStaffBtn"
                            style="
                                border:0;
                                background:#2563eb;
                                color:#ffffff;
                                padding:12px 22px;
                                border-radius:10px;
                                cursor:pointer;
                                font-weight:700;
                                font-size:13px;
                            "
                        >
                            ${buttonText}
                        </button>


                        <button
                            type="button"
                            id="cancelReceptionStaffBtn"
                            style="
                                border:1px solid #d1d5db;
                                background:#ffffff;
                                color:#374151;
                                padding:12px 20px;
                                border-radius:10px;
                                cursor:pointer;
                                font-weight:700;
                                font-size:13px;
                            "
                        >
                            إلغاء
                        </button>

                    </div>

                </form>

            </div>

        </div>
    `;


    document.body.appendChild(modal);



    // =================================================
    // CLOSE
    // =================================================

    const closeModal = () => {

        const currentModal =
            document.getElementById(
                "receptionStaffModal"
            );

        if (currentModal) {
            currentModal.remove();
        }

    };


    document
        .getElementById(
            "closeReceptionStaffModal"
        )
        .addEventListener(
            "click",
            closeModal
        );


    document
        .getElementById(
            "cancelReceptionStaffBtn"
        )
        .addEventListener(
            "click",
            closeModal
        );


    document
        .getElementById(
            "receptionStaffOverlay"
        )
        .addEventListener(
            "click",
            closeModal
        );



    // =================================================
    // SUBMIT
    // =================================================

    document
        .getElementById(
            "receptionStaffForm"
        )
        .addEventListener(
            "submit",
            async event => {

                event.preventDefault();


                const errorBox =
                    document.getElementById(
                        "receptionStaffError"
                    );


                const saveButton =
                    document.getElementById(
                        "saveReceptionStaffBtn"
                    );


                const displayName =
                    document
                        .getElementById(
                            "receptionDisplayName"
                        )
                        .value
                        .trim();


                const phone =
                    document
                        .getElementById(
                            "receptionPhone"
                        )
                        .value
                        .trim();


                const email =
                    document
                        .getElementById(
                            "receptionEmail"
                        )
                        .value
                        .trim();


                const username =
                    document
                        .getElementById(
                            "receptionUsername"
                        )
                        .value
                        .trim();


                const password =
                    document
                        .getElementById(
                            "receptionPassword"
                        )
                        .value;


                const confirmPassword =
                    document
                        .getElementById(
                            "receptionConfirmPassword"
                        )
                        .value;



                if (
                    !displayName ||
                    !username
                ) {

                    errorBox.textContent =
                        "يرجى إدخال اسم الموظف واسم المستخدم.";

                    errorBox.style.display =
                        "block";

                    return;

                }



                // ADD
                if (!isEdit) {

                    if (!password) {

                        errorBox.textContent =
                            "كلمة المرور مطلوبة.";

                        errorBox.style.display =
                            "block";

                        return;

                    }


                    if (
                        password !==
                        confirmPassword
                    ) {

                        errorBox.textContent =
                            "كلمتا المرور غير متطابقتين.";

                        errorBox.style.display =
                            "block";

                        return;

                    }

                }



                // EDIT
                if (
                    isEdit &&
                    password &&
                    password !== confirmPassword
                ) {

                    errorBox.textContent =
                        "كلمتا المرور غير متطابقتين.";

                    errorBox.style.display =
                        "block";

                    return;

                }



                errorBox.style.display =
                    "none";


                saveButton.disabled =
                    true;

                saveButton.style.opacity =
                    "0.7";


                saveButton.textContent =
                    isEdit
                        ? "جارٍ الحفظ..."
                        : "جارٍ الإضافة...";


                try {

                    const body = {

                        display_name:
                            displayName,

                        phone:
                            phone || null,

                        email:
                            email || null,

                        username:
                            username,

                        password:
                            password || ""

                    };


                    const url =
                        isEdit
                            ? `/api/admin/receptionists/${person.id}`
                            : "/api/admin/receptionists";


                    const result =
                        await apiRequest(
                            url,
                            {
                                method:
                                    isEdit
                                        ? "PUT"
                                        : "POST",

                                headers: {
                                    "Content-Type":
                                        "application/json"
                                },

                                body:
                                    JSON.stringify(body)
                            }
                        );


                    console.log(
                        "RECEPTION STAFF SUCCESS:",
                        result
                    );


                    closeModal();


                    showToast(
                        "success",
                        isEdit
                            ? "تم التعديل"
                            : "تمت الإضافة",
                        isEdit
                            ? "تم تعديل موظف الاستقبال بنجاح."
                            : "تمت إضافة الموظف وإنشاء حسابه بنجاح."
                    );


                    await renderStaffModule();


                } catch (error) {

                    console.error(
                        "RECEPTION STAFF SAVE ERROR:",
                        error
                    );


                    errorBox.textContent =
                        error.message ||
                        "تعذر تنفيذ العملية.";

                    errorBox.style.display =
                        "block";


                    saveButton.disabled =
                        false;

                    saveButton.style.opacity =
                        "1";

                    saveButton.textContent =
                        buttonText;

                }

            }
        );

}



// =====================================================
// STAFF DETAILS
// =====================================================

function showReceptionStaffDetails(person) {

    const statusData =
        getReceptionStaffStatus(
            person.work_status
        );


    moduleContent.innerHTML = `

        <div
            dir="rtl"
            style="
                width:100%;
                background:#ffffff;
                border:1px solid #e5e7eb;
                border-radius:20px;
                padding:32px;
                box-sizing:border-box;
            "
        >

            <button
                type="button"
                id="backToReceptionStaffBtn"
                style="
                    border:0;
                    background:#f1f5f9;
                    color:#374151;
                    padding:10px 17px;
                    border-radius:9px;
                    cursor:pointer;
                    margin-bottom:28px;
                    font-weight:700;
                "
            >
                ← العودة إلى قائمة الموظفين
            </button>



            <div
                style="
                    display:flex;
                    align-items:center;
                    gap:20px;
                    padding-bottom:28px;
                    border-bottom:1px solid #e5e7eb;
                "
            >

                <div
                    style="
                        width:80px;
                        height:80px;
                        border-radius:50%;
                        background:#eff6ff;
                        color:#2563eb;
                        display:flex;
                        align-items:center;
                        justify-content:center;
                        font-size:34px;
                    "
                >
                    ♙
                </div>


                <div>

                    <h2
                        style="
                            margin:0 0 7px;
                            color:#1f2937;
                            font-size:26px;
                        "
                    >
                        ${escapeHTML(
                            person.name ||
                            "موظف استقبال"
                        )}
                    </h2>


                    <p
                        style="
                            margin:0 0 10px;
                            color:#6b7280;
                            font-size:15px;
                        "
                    >
                        موظف استقبال
                    </p>


                    <span
                        class="
                            status
                            ${statusData.className}
                        "
                    >
                        ${statusData.text}
                    </span>

                </div>

            </div>



            <div
                style="
                    display:grid;
                    grid-template-columns:repeat(
                        2,
                        minmax(0,1fr)
                    );
                    gap:20px;
                    margin-top:28px;
                "
            >

                <div class="module-card">

                    <span>
                        اسم الموظف
                    </span>

                    <strong>
                        ${escapeHTML(
                            person.name ||
                            "—"
                        )}
                    </strong>

                </div>


                <div class="module-card">

                    <span>
                        اسم المستخدم
                    </span>

                    <strong>
                        ${escapeHTML(
                            person.username ||
                            "—"
                        )}
                    </strong>

                </div>


                <div class="module-card">

                    <span>
                        الهاتف
                    </span>

                    <strong>
                        ${escapeHTML(
                            person.phone ||
                            "—"
                        )}
                    </strong>

                </div>


                <div class="module-card">

                    <span>
                        البريد الإلكتروني
                    </span>

                    <strong>
                        ${escapeHTML(
                            person.email ||
                            "—"
                        )}
                    </strong>

                </div>


                <div class="module-card">

                    <span>
                        حالة اليوم
                    </span>

                    <strong>
                        ${statusData.text}
                    </strong>

                </div>


                <div class="module-card">

                    <span>
                        بداية الدوام
                    </span>

                    <strong>
                        ${formatTime(
                            person.start_time
                        )}
                    </strong>

                </div>


                <div class="module-card">

                    <span>
                        نهاية الدوام
                    </span>

                    <strong>
                        ${formatTime(
                            person.end_time
                        )}
                    </strong>

                </div>

            </div>

        </div>

    `;


    document
        .getElementById(
            "backToReceptionStaffBtn"
        )
        ?.addEventListener(
            "click",
            () => {

                renderStaffModule();

            }
        );

}



// =====================================================
// DELETE STAFF
// =====================================================

async function deleteReceptionStaff(person) {

    const name =
        person.name ||
        person.username ||
        "موظف الاستقبال";


    const confirmed =
        confirm(
            `هل أنت متأكد من حذف الموظف "${name}"؟\n\nسيتم حذف حساب الدخول وسجل الدوام الخاص به.`
        );


    if (!confirmed) {
        return;
    }


    try {

        await apiRequest(
            `/api/admin/receptionists/${person.id}`,
            {
                method:
                    "DELETE"
            }
        );


        showToast(
            "success",
            "تم الحذف",
            "تم حذف موظف الاستقبال وحسابه بنجاح."
        );


        await renderStaffModule();


    } catch (error) {

        console.error(
            "DELETE RECEPTION STAFF ERROR:",
            error
        );


        showToast(
            "error",
            "خطأ",
            error.message ||
                "تعذر حذف موظف الاستقبال."
        );

    }

}


// =====================================================
// LOAD RECEPTION STAFF
// =====================================================

async function loadReceptionStaff() {

    const response =
        await fetch(
            "/api/admin/receptionists"
        );

    if (!response.ok) {

        let message =
            "تعذر تحميل موظفي الاستقبال.";

        try {

            const data =
                await response.json();

            message =
                data.error ||
                data.message ||
                message;

        } catch (error) {
            // ignore JSON error
        }

        throw new Error(message);
    }


    const data =
        await response.json();


    /*
        Backend returns:

        {
            receptionists: [...]
        }
    */

    const receptionists =
        Array.isArray(data)
            ? data
            : (
                Array.isArray(
                    data.receptionists
                )
                    ? data.receptionists
                    : []
            );


    return receptionists.map(
        employee => ({

            id:
                employee.id,

            name:
                employee.display_name ||
                employee.username ||
                "موظف استقبال",

            username:
                employee.username ||
                "",

            phone:
                employee.phone ||
                "",

            email:
                employee.email ||
                "",

            role:
                "Receptionist",

            type:
                "receptionist",

            work_status:
                employee.work_status ||
                "not_started",

            start_time:
                employee.start_time ||
                null,

            end_time:
                employee.end_time ||
                null

        })
    );
}


// =====================================================
// RENDER STAFF MODULE
// =====================================================


// =====================================================
// STAFF MODULE - RECEPTIONISTS
// =====================================================

async function renderStaffModule() {

    if (!moduleContent) {
        return;
    }

    // -------------------------------------------------
    // Loading
    // -------------------------------------------------

    moduleContent.innerHTML = `
        <div
            dir="rtl"
            style="
                width:100%;
                padding:50px;
                text-align:center;
                color:#6b7280;
            "
        >
            جارٍ تحميل موظفي الاستقبال...
        </div>
    `;


    try {

        // =================================================
        // LOAD DIRECTLY FROM BACKEND
        // =================================================
const response = await fetch(
    "https://smilecare-r68s.onrender.com/api/admin/receptionists"
);

        if (!response.ok) {

            let message =
                "تعذر تحميل موظفي الاستقبال.";

            try {

                const data =
                    await response.json();

                message =
                    data.error ||
                    data.message ||
                    message;

            } catch (error) {
                // ignore
            }

            throw new Error(message);
        }


        const data =
            await response.json();


        // Backend:
        // {
        //     receptionists: [...]
        // }

        const receptionists =
            Array.isArray(data)
                ? data
                : (
                    Array.isArray(
                        data.receptionists
                    )
                        ? data.receptionists
                        : []
                );


        // =================================================
        // NORMALIZE DATA
        // =================================================

        const staff =
            receptionists.map(
                employee => ({

                    id:
                        employee.id,

                    name:
                        employee.display_name ||
                        employee.username ||
                        "موظف استقبال",

                    username:
                        employee.username ||
                        "",

                    phone:
                        employee.phone ||
                        "",

                    email:
                        employee.email ||
                        "",

                    role:
                        "Receptionist",

                    type:
                        "receptionist",

                    work_status:
                        employee.work_status ||
                        "not_started",

                    start_time:
                        employee.start_time ||
                        null,

                    end_time:
                        employee.end_time ||
                        null

                })
            );


        // =================================================
        // STATISTICS
        // =================================================

        const totalStaff =
            staff.length;


        const workingStaff =
            staff.filter(
                person => {

                    const status =
                        String(
                            person.work_status ||
                            ""
                        ).toLowerCase();

                    return (
                        status === "working" ||
                        status === "present"
                    );
                }
            ).length;


        const notStartedStaff =
            staff.filter(
                person => {

                    const status =
                        String(
                            person.work_status ||
                            "not_started"
                        ).toLowerCase();

                    return (
                        status ===
                        "not_started"
                    );
                }
            ).length;


        const closedStaff =
            staff.filter(
                person => {

                    const status =
                        String(
                            person.work_status ||
                            ""
                        ).toLowerCase();

                    return (
                        status === "closed"
                    );
                }
            ).length;


        // =================================================
        // STATUS
        // =================================================

        function receptionStatus(status) {

            switch (
                String(
                    status || ""
                ).toLowerCase()
            ) {

                case "working":
                case "present":

                    return {
                        text:
                            "يعمل الآن",

                        className:
                            "working"
                    };


                case "closed":

                    return {
                        text:
                            "أنهى الدوام",

                        className:
                            "not-started"
                    };


                case "absent":

                    return {
                        text:
                            "غائب",

                        className:
                            "absent"
                    };


                default:

                    return {
                        text:
                            "لم يبدأ الدوام",

                        className:
                            "not-started"
                    };
            }
        }


        // =================================================
        // RENDER
        // =================================================

        moduleContent.innerHTML = `

            <div
                class="staff-admin-module"
                dir="rtl"
                style="
                    width:100%;
                    box-sizing:border-box;
                "
            >

                <!-- SUMMARY -->

                <div
                    style="
                        display:grid;
                        grid-template-columns:
                            repeat(
                                4,
                                minmax(0,1fr)
                            );
                        gap:20px;
                        margin-bottom:28px;
                        width:100%;
                    "
                >

                    <div class="module-card">

                        <div class="module-card-icon">
                            ♙
                        </div>

                        <strong>
                            ${totalStaff}
                        </strong>

                        <span>
                            إجمالي الموظفين
                        </span>

                    </div>


                    <div class="module-card">

                        <div class="module-card-icon">
                            ●
                        </div>

                        <strong>
                            ${workingStaff}
                        </strong>

                        <span>
                            يعملون الآن
                        </span>

                    </div>


                    <div class="module-card">

                        <div class="module-card-icon">
                            ◷
                        </div>

                        <strong>
                            ${notStartedStaff}
                        </strong>

                        <span>
                            لم يبدأوا الدوام
                        </span>

                    </div>


                    <div class="module-card">

                        <div class="module-card-icon">
                            ✓
                        </div>

                        <strong>
                            ${closedStaff}
                        </strong>

                        <span>
                            أنهوا الدوام
                        </span>

                    </div>

                </div>


                <!-- TABLE -->

                <div
                    style="
                        width:100%;
                        background:#ffffff;
                        border:1px solid #e5e7eb;
                        border-radius:20px;
                        overflow:hidden;
                        box-shadow:
                            0 8px 25px
                            rgba(0,0,0,0.05);
                    "
                >

                    <!-- HEADER -->

                    <div
                        style="
                            padding:24px 30px;
                            border-bottom:
                                1px solid #e5e7eb;
                            display:flex;
                            justify-content:
                                space-between;
                            align-items:center;
                            gap:20px;
                            flex-wrap:wrap;
                        "
                    >

                        <div>

                            <h3
                                style="
                                    margin:
                                        0 0 7px;
                                    color:#1f2937;
                                    font-size:22px;
                                    font-weight:800;
                                "
                            >
                                موظفو الاستقبال
                            </h3>

                            <p
                                style="
                                    margin:0;
                                    color:#6b7280;
                                    font-size:14px;
                                "
                            >
                                إدارة موظفي الاستقبال وحسابات الدخول والدوام.
                            </p>

                        </div>


                        <div
                            style="
                                display:flex;
                                align-items:center;
                                gap:10px;
                            "
                        >

                            <button
                                type="button"
                                id="addReceptionStaffBtn"
                                style="
                                    border:0;
                                    background:#2563eb;
                                    color:#ffffff;
                                    padding:11px 18px;
                                    border-radius:10px;
                                    cursor:pointer;
                                    font-weight:700;
                                    font-size:13px;
                                "
                            >
                                إضافة موظف استقبال
                            </button>


                            <span
                                style="
                                    padding:9px 16px;
                                    border-radius:20px;
                                    background:#eff6ff;
                                    color:#2563eb;
                                    font-size:13px;
                                    font-weight:700;
                                "
                            >
                                ${totalStaff} موظفين
                            </span>

                        </div>

                    </div>


                    <!-- TABLE -->

                    <div
                        style="
                            width:100%;
                            overflow-x:auto;
                        "
                    >

                        <table
                            style="
                                width:100%;
                                min-width:1000px;
                                border-collapse:collapse;
                                direction:rtl;
                            "
                        >

                            <thead>

                                <tr
                                    style="
                                        background:#f8fafc;
                                        text-align:right;
                                    "
                                >

                                    <th style="padding:19px 24px;">
                                        الموظف
                                    </th>

                                    <th style="padding:19px 24px;">
                                        اسم المستخدم
                                    </th>

                                    <th style="padding:19px 24px;">
                                        الهاتف
                                    </th>

                                    <th style="padding:19px 24px;">
                                        حالة الدوام
                                    </th>

                                    <th style="padding:19px 24px;">
                                        بداية الدوام
                                    </th>

                                    <th style="padding:19px 24px;">
                                        نهاية الدوام
                                    </th>

                                    <th style="padding:19px 24px;">
                                        الإجراء
                                    </th>

                                </tr>

                            </thead>


                            <tbody>

                                ${
                                    staff.length

                                    ?

                                    staff.map(
                                        (person, index) => {

                                            const statusData =
                                                receptionStatus(
                                                    person.work_status
                                                );


                                            return `

                                                <tr
                                                    style="
                                                        border-top:
                                                            1px solid
                                                            #f1f5f9;
                                                    "
                                                >

                                                    <td
                                                        style="
                                                            padding:
                                                                20px 24px;
                                                        "
                                                    >

                                                        <strong
                                                            style="
                                                                color:#1f2937;
                                                            "
                                                        >
                                                            ${escapeHTML(
                                                                person.name
                                                            )}
                                                        </strong>

                                                        <span
                                                            style="
                                                                display:block;
                                                                color:#9ca3af;
                                                                font-size:11px;
                                                                margin-top:4px;
                                                            "
                                                        >
                                                            موظف استقبال
                                                        </span>

                                                    </td>


                                                    <td
                                                        style="
                                                            padding:
                                                                20px 24px;
                                                            direction:ltr;
                                                            text-align:right;
                                                            color:#4b5563;
                                                        "
                                                    >
                                                        ${escapeHTML(
                                                            person.username ||
                                                            "—"
                                                        )}
                                                    </td>


                                                    <td
                                                        style="
                                                            padding:
                                                                20px 24px;
                                                            color:#4b5563;
                                                        "
                                                    >
                                                        ${escapeHTML(
                                                            person.phone ||
                                                            "غير متوفر"
                                                        )}
                                                    </td>


                                                    <td
                                                        style="
                                                            padding:
                                                                20px 24px;
                                                        "
                                                    >

                                                        <span
                                                            class="
                                                                status
                                                                ${statusData.className}
                                                            "
                                                        >
                                                            ${statusData.text}
                                                        </span>

                                                    </td>


                                                    <td
                                                        style="
                                                            padding:
                                                                20px 24px;
                                                            color:#4b5563;
                                                        "
                                                    >
                                                        ${formatTime(
                                                            person.start_time
                                                        )}
                                                    </td>


                                                    <td
                                                        style="
                                                            padding:
                                                                20px 24px;
                                                            color:#4b5563;
                                                        "
                                                    >
                                                        ${formatTime(
                                                            person.end_time
                                                        )}
                                                    </td>


                                                    <td
                                                        style="
                                                            padding:
                                                                20px 24px;
                                                        "
                                                    >

                                                        <div
                                                            style="
                                                                display:flex;
                                                                gap:7px;
                                                            "
                                                        >

                                                            <button
                                                                type="button"
                                                                class="reception-view-btn"
                                                                data-staff-index="${index}"
                                                                style="
                                                                    border:0;
                                                                    background:#eff6ff;
                                                                    color:#2563eb;
                                                                    padding:9px 12px;
                                                                    border-radius:9px;
                                                                    cursor:pointer;
                                                                    font-weight:700;
                                                                "
                                                            >
                                                                التفاصيل
                                                            </button>


                                                            <button
                                                                type="button"
                                                                class="reception-edit-btn"
                                                                data-staff-index="${index}"
                                                                style="
                                                                    border:0;
                                                                    background:#ecfdf5;
                                                                    color:#047857;
                                                                    padding:9px 12px;
                                                                    border-radius:9px;
                                                                    cursor:pointer;
                                                                    font-weight:700;
                                                                "
                                                            >
                                                                تعديل
                                                            </button>


                                                            <button
                                                                type="button"
                                                                class="reception-delete-btn"
                                                                data-staff-index="${index}"
                                                                style="
                                                                    border:0;
                                                                    background:#fef2f2;
                                                                    color:#b91c1c;
                                                                    padding:9px 12px;
                                                                    border-radius:9px;
                                                                    cursor:pointer;
                                                                    font-weight:700;
                                                                "
                                                            >
                                                                حذف
                                                            </button>

                                                        </div>

                                                    </td>

                                                </tr>

                                            `;

                                        }
                                    ).join("")

                                    :

                                    `

                                        <tr>

                                            <td
                                                colspan="7"
                                                style="
                                                    padding:70px 30px;
                                                    text-align:center;
                                                    color:#6b7280;
                                                "
                                            >
                                                لا يوجد موظفو استقبال.
                                            </td>

                                        </tr>

                                    `
                                }

                            </tbody>

                        </table>

                    </div>

                </div>

            </div>

        `;


        // =================================================
        // ADD
        // =================================================

        document
            .getElementById(
                "addReceptionStaffBtn"
            )
            ?.addEventListener(
                "click",
                () => {

                    showReceptionStaffForm(
                        "add"
                    );

                }
            );


        // =================================================
        // VIEW
        // =================================================

        document
            .querySelectorAll(
                ".reception-view-btn"
            )
            .forEach(
                button => {

                    button.addEventListener(
                        "click",
                        () => {

                            const index =
                                Number(
                                    button.dataset.staffIndex
                                );

                            const person =
                                staff[index];

                            if (person) {

                                showReceptionStaffDetails(
                                    person
                                );

                            }

                        }
                    );

                }
            );


        // =================================================
        // EDIT
        // =================================================

        document
            .querySelectorAll(
                ".reception-edit-btn"
            )
            .forEach(
                button => {

                    button.addEventListener(
                        "click",
                        () => {

                            const index =
                                Number(
                                    button.dataset.staffIndex
                                );

                            const person =
                                staff[index];

                            if (person) {

                                showReceptionStaffForm(
                                    "edit",
                                    person
                                );

                            }

                        }
                    );

                }
            );


        // =================================================
        // DELETE
        // =================================================

        document
            .querySelectorAll(
                ".reception-delete-btn"
            )
            .forEach(
                button => {

                    button.addEventListener(
                        "click",
                        async () => {

                            const index =
                                Number(
                                    button.dataset.staffIndex
                                );

                            const person =
                                staff[index];

                            if (person) {

                                await deleteReceptionStaff(
                                    person
                                );

                            }

                        }
                    );

                }
            );


    } catch (error) {

        console.error(
            "LOAD RECEPTION STAFF ERROR:",
            error
        );


        moduleContent.innerHTML = `

            <div
                dir="rtl"
                style="
                    width:100%;
                    padding:50px;
                    text-align:center;
                "
            >

                <div
                    style="
                        color:#b91c1c;
                        background:#fef2f2;
                        border-radius:12px;
                        padding:18px;
                        display:inline-block;
                    "
                >

                    ${escapeHTML(
                        error.message ||
                        "تعذر تحميل موظفي الاستقبال."
                    )}

                </div>

            </div>

        `;
    }
}


async function renderPatientsModule() {
    if (!moduleContent) {
        return;
    }

    moduleContent.innerHTML = `
        <div dir="rtl" style="width:100%;">
            <div style="
                background:#ffffff;
                border:1px solid #e5e7eb;
                border-radius:20px;
                padding:24px;
            ">
                <div style="
                    display:flex;
                    justify-content:space-between;
                    align-items:center;
                    gap:20px;
                    margin-bottom:22px;
                    flex-wrap:wrap;
                ">
                    <div>
                        <h3 style="
                            margin:0 0 7px;
                            font-size:22px;
                            color:#1f2937;
                        ">
                            المرضى
                        </h3>

                        <p style="
                            margin:0;
                            color:#6b7280;
                            font-size:14px;
                        ">
                            إدارة ومتابعة بيانات مرضى العيادة.
                        </p>
                    </div>

                    <input
                        type="text"
                        id="adminPatientSearch"
                        placeholder="البحث عن مريض..."
                        style="
                            width:280px;
                            max-width:100%;
                            padding:12px 15px;
                            border:1px solid #d1d5db;
                            border-radius:10px;
                            outline:none;
                            font-family:inherit;
                        "
                    >
                </div>

                <div id="adminPatientsTable">
                    <div style="
                        text-align:center;
                        padding:50px;
                        color:#6b7280;
                    ">
                        جاري تحميل بيانات المرضى...
                    </div>
                </div>
            </div>
        </div>
    `;

    try {
        const patients = await apiRequest(
            `${API_BASE}/patients`
        );

        const tableContainer =
            document.getElementById("adminPatientsTable");

        const searchInput =
            document.getElementById("adminPatientSearch");

        if (!tableContainer) {
            return;
        }

        function renderPatientsTable(list) {

            if (!list.length) {
                tableContainer.innerHTML = `
                    <div style="
                        text-align:center;
                        padding:50px;
                        color:#6b7280;
                    ">
                        لا توجد نتائج.
                    </div>
                `;
                return;
            }

            tableContainer.innerHTML = `
                <div style="
                    width:100%;
                    overflow-x:auto;
                ">
                    <table style="
                        width:100%;
                        min-width:900px;
                        border-collapse:collapse;
                    ">
                        <thead>
                            <tr style="
                                background:#f8fafc;
                                text-align:right;
                            ">
                                <th style="padding:17px 20px;">
                                    الرقم
                                </th>

                                <th style="padding:17px 20px;">
                                    اسم المريض
                                </th>

                                <th style="padding:17px 20px;">
                                    الهاتف
                                </th>

                                <th style="padding:17px 20px;">
                                    البريد الإلكتروني
                                </th>

                                <th style="padding:17px 20px;">
                                    تاريخ الميلاد
                                </th>

                                <th style="padding:17px 20px;">
                                    الطبيب
                                </th>

                                <th style="padding:17px 20px;">
                                    الإجراء
                                </th>
                            </tr>
                        </thead>

                        <tbody>

                            ${list.map((patient, index) => {

                                const name =
                                    fullName(
                                        patient.first_name,
                                        patient.last_name
                                    ) ||
                                    patient.name ||
                                    "مريض غير معروف";

                                const doctor =
                                    patient.dentist_name ||
                                    fullName(
                                        patient.dentist_first_name,
                                        patient.dentist_last_name
                                    ) ||
                                    "غير محدد";

                                return `
                                    <tr style="
                                        border-top:1px solid #f1f5f9;
                                    ">

                                        <td style="
                                            padding:19px 20px;
                                            color:#6b7280;
                                        ">
                                            ${patient.id ?? index + 1}
                                        </td>

                                        <td style="
                                            padding:19px 20px;
                                        ">
                                            <strong style="
                                                color:#1f2937;
                                            ">
                                                ${escapeHTML(name)}
                                            </strong>
                                        </td>

                                        <td style="
                                            padding:19px 20px;
                                            direction:ltr;
                                            text-align:right;
                                        ">
                                            ${escapeHTML(
                                                patient.phone ||
                                                "غير متوفر"
                                            )}
                                        </td>

                                        <td style="
                                            padding:19px 20px;
                                            color:#4b5563;
                                        ">
                                            ${escapeHTML(
                                                patient.email ||
                                                "غير متوفر"
                                            )}
                                        </td>

                                        <td style="
                                            padding:19px 20px;
                                            color:#4b5563;
                                        ">
                                            ${escapeHTML(
                                                patient.date_of_birth ||
                                                "غير محدد"
                                            )}
                                        </td>

                                        <td style="
                                            padding:19px 20px;
                                            color:#4b5563;
                                        ">
                                            ${escapeHTML(doctor)}
                                        </td>

                                        <td style="
                                            padding:19px 20px;
                                        ">
                                            <button
                                                type="button"
                                                class="admin-patient-view-btn"
                                                data-patient-index="${index}"
                                                style="
                                                    border:0;
                                                    background:#eff6ff;
                                                    color:#2563eb;
                                                    padding:9px 15px;
                                                    border-radius:9px;
                                                    cursor:pointer;
                                                    font-weight:700;
                                                "
                                            >
                                                عرض التفاصيل
                                            </button>
                                        </td>

                                    </tr>
                                `;
                            }).join("")}

                        </tbody>
                    </table>
                </div>
            `;

            tableContainer
                .querySelectorAll(".admin-patient-view-btn")
                .forEach(button => {

                    button.addEventListener(
                        "click",
                        () => {

                            const index =
                                Number(
                                    button.dataset.patientIndex
                                );

                            const patient =
                                list[index];

                            if (patient) {
                                showAdminPatientDetails(
                                    patient
                                );
                            }
                        }
                    );

                });
        }

        renderPatientsTable(patients);

        if (searchInput) {

            searchInput.addEventListener(
                "input",
                () => {

                    const query =
                        searchInput.value
                            .trim()
                            .toLowerCase();

                    const filtered =
                        patients.filter(patient => {

                            const name =
                                fullName(
                                    patient.first_name,
                                    patient.last_name
                                );

                            return (
                                String(
                                    patient.id || ""
                                )
                                    .toLowerCase()
                                    .includes(query) ||

                                String(name)
                                    .toLowerCase()
                                    .includes(query) ||

                                String(
                                    patient.phone || ""
                                )
                                    .toLowerCase()
                                    .includes(query)
                            );
                        });

                    renderPatientsTable(filtered);
                }
            );
        }

    } catch (error) {

        console.error(
            "ADMIN PATIENTS ERROR:",
            error
        );

        moduleContent.innerHTML = `
            <div dir="rtl" style="
                background:#fff;
                border:1px solid #fecaca;
                border-radius:18px;
                padding:40px;
                text-align:center;
            ">
                <div style="
                    font-size:35px;
                    margin-bottom:12px;
                ">
                    ⚠️
                </div>

                <h3 style="
                    margin:0 0 8px;
                    color:#991b1b;
                ">
                    تعذر تحميل المرضى
                </h3>

                <p style="
                    margin:0;
                    color:#6b7280;
                ">
                    ${escapeHTML(error.message)}
                </p>
            </div>
        `;
    }
}


function showAdminPatientDetails(patient) {

    if (!moduleContent) {
        return;
    }

    const name =
        fullName(
            patient.first_name,
            patient.last_name
        ) ||
        patient.name ||
        "مريض غير معروف";

    const doctor =
        patient.dentist_name ||
        fullName(
            patient.dentist_first_name,
            patient.dentist_last_name
        ) ||
        "غير محدد";

    moduleContent.innerHTML = `
        <div dir="rtl" style="
            width:100%;
            background:#ffffff;
            border:1px solid #e5e7eb;
            border-radius:20px;
            padding:32px;
            box-sizing:border-box;
        ">

            <button
                type="button"
                id="backToPatientsBtn"
                style="
                    border:0;
                    background:#f1f5f9;
                    color:#374151;
                    padding:10px 17px;
                    border-radius:9px;
                    cursor:pointer;
                    margin-bottom:28px;
                    font-weight:700;
                "
            >
                ← العودة إلى قائمة المرضى
            </button>

            <div style="
                display:flex;
                align-items:center;
                gap:20px;
                padding-bottom:28px;
                border-bottom:1px solid #e5e7eb;
            ">

                <div style="
                    width:80px;
                    height:80px;
                    border-radius:50%;
                    background:#eff6ff;
                    color:#2563eb;
                    display:flex;
                    align-items:center;
                    justify-content:center;
                    font-size:34px;
                ">
                    👤
                </div>

                <div>

                    <h2 style="
                        margin:0 0 7px;
                        color:#1f2937;
                        font-size:26px;
                    ">
                        ${escapeHTML(name)}
                    </h2>

                    <p style="
                        margin:0;
                        color:#6b7280;
                    ">
                        ملف المريض الإداري
                    </p>

                </div>

            </div>

            <div style="
                display:grid;
                grid-template-columns:repeat(2,minmax(0,1fr));
                gap:20px;
                margin-top:28px;
            ">

                <div class="module-card">
                    <span>رقم المريض</span>
                    <strong>
                        ${patient.id ?? "—"}
                    </strong>
                </div>

                <div class="module-card">
                    <span>اسم المريض</span>
                    <strong>
                        ${escapeHTML(name)}
                    </strong>
                </div>

                <div class="module-card">
                    <span>الهاتف</span>
                    <strong dir="ltr">
                        ${escapeHTML(
                            patient.phone ||
                            "غير متوفر"
                        )}
                    </strong>
                </div>

                <div class="module-card">
                    <span>البريد الإلكتروني</span>
                    <strong>
                        ${escapeHTML(
                            patient.email ||
                            "غير متوفر"
                        )}
                    </strong>
                </div>

                <div class="module-card">
                    <span>تاريخ الميلاد</span>
                    <strong>
                        ${escapeHTML(
                            patient.date_of_birth ||
                            "غير محدد"
                        )}
                    </strong>
                </div>

                <div class="module-card">
                    <span>الطبيب المسؤول</span>
                    <strong>
                        ${escapeHTML(doctor)}
                    </strong>
                </div>

                <div class="module-card">
                    <span>العنوان</span>
                    <strong>
                        ${escapeHTML(
                            patient.address ||
                            "غير محدد"
                        )}
                    </strong>
                </div>

                <div class="module-card">
                    <span>تاريخ التسجيل</span>
                    <strong>
                        ${escapeHTML(
                            patient.created_at ||
                            "غير محدد"
                        )}
                    </strong>
                </div>

            </div>

        </div>
    `;

    document
        .getElementById("backToPatientsBtn")
        ?.addEventListener(
            "click",
            () => {
                renderPatientsModule();
            }
        );
}


/* =========================================================
   APPOINTMENTS MODULE
   ========================================================= */

async function renderAppointmentsModule() {

    if (!moduleContent) {
        return;
    }

    moduleContent.innerHTML = `
        <div
            class="appointments-admin-module"
            dir="rtl"
            style="
                width:100%;
                box-sizing:border-box;
            "
        >

            <!-- SUMMARY -->

            <div style="
                display:grid;
                grid-template-columns:repeat(4,minmax(0,1fr));
                gap:20px;
                margin-bottom:28px;
                width:100%;
            ">

                <div class="module-card">
                    <div class="module-card-icon">▣</div>
                    <strong id="adminAppointmentsTotal">0</strong>
                    <span>إجمالي المواعيد</span>
                </div>

                <div class="module-card">
                    <div class="module-card-icon">✓</div>
                    <strong id="adminAppointmentsConfirmed">0</strong>
                    <span>المواعيد المؤكدة</span>
                </div>

                <div class="module-card">
                    <div class="module-card-icon">◷</div>
                    <strong id="adminAppointmentsPending">0</strong>
                    <span>قيد الانتظار</span>
                </div>

                <div class="module-card">
                    <div class="module-card-icon">!</div>
                    <strong id="adminAppointmentsCancelled">0</strong>
                    <span>المواعيد الملغاة</span>
                </div>

            </div>


            <!-- MAIN PANEL -->

            <div style="
                width:100%;
                background:#ffffff;
                border:1px solid #e5e7eb;
                border-radius:20px;
                overflow:hidden;
                box-shadow:0 8px 25px rgba(0,0,0,0.05);
                box-sizing:border-box;
            ">

                <!-- HEADER -->

                <div style="
                    padding:24px 30px;
                    border-bottom:1px solid #e5e7eb;
                    display:flex;
                    justify-content:space-between;
                    align-items:center;
                    gap:20px;
                    flex-wrap:wrap;
                ">

                    <div>

                        <h3 style="
                            margin:0 0 7px;
                            color:#1f2937;
                            font-size:22px;
                            font-weight:800;
                        ">
                            مواعيد العيادة
                        </h3>

                        <p style="
                            margin:0;
                            color:#6b7280;
                            font-size:14px;
                        ">
                            متابعة وتنظيم جميع مواعيد المرضى.
                        </p>

                    </div>

                    <div style="
                        display:flex;
                        gap:10px;
                        flex-wrap:wrap;
                    ">

                        <input
                            type="text"
                            id="adminAppointmentSearch"
                            placeholder="البحث عن مريض..."
                            style="
                                width:240px;
                                max-width:100%;
                                padding:11px 14px;
                                border:1px solid #d1d5db;
                                border-radius:10px;
                                outline:none;
                                font-family:inherit;
                                box-sizing:border-box;
                            "
                        >

                        <select
                            id="adminAppointmentStatusFilter"
                            style="
                                padding:11px 14px;
                                border:1px solid #d1d5db;
                                border-radius:10px;
                                outline:none;
                                background:#ffffff;
                                font-family:inherit;
                                cursor:pointer;
                            "
                        >

                            <option value="all">
                                كل الحالات
                            </option>

                            <option value="scheduled">
                                مجدول
                            </option>

                            <option value="confirmed">
                                مؤكد
                            </option>

                            <option value="pending">
                                قيد الانتظار
                            </option>

                            <option value="completed">
                                مكتمل
                            </option>

                            <option value="cancelled">
                                ملغى
                            </option>

                        </select>

                    </div>

                </div>


                <!-- TABLE -->

                <div id="adminAppointmentsTable">

                    <div style="
                        text-align:center;
                        padding:60px;
                        color:#6b7280;
                    ">
                        جاري تحميل المواعيد...
                    </div>

                </div>

            </div>

        </div>
    `;


    try {

        const appointments =
            await apiRequest(
                `${API_BASE}/admin/appointments`
            );


        const tableContainer =
            document.getElementById(
                "adminAppointmentsTable"
            );

        const searchInput =
            document.getElementById(
                "adminAppointmentSearch"
            );

        const statusFilter =
            document.getElementById(
                "adminAppointmentStatusFilter"
            );


        if (!tableContainer) {
            return;
        }


        /* =====================================================
           SUMMARY
           ===================================================== */

        const total =
            appointments.length;

        const confirmed =
            appointments.filter(item =>
                String(
                    item.status ||
                    item.booking_status ||
                    ""
                ).toLowerCase() === "confirmed"
            ).length;

        const pending =
            appointments.filter(item =>
                String(
                    item.status ||
                    item.booking_status ||
                    ""
                ).toLowerCase() === "pending"
            ).length;

        const cancelled =
            appointments.filter(item =>
                String(
                    item.status ||
                    item.booking_status ||
                    ""
                ).toLowerCase() === "cancelled"
            ).length;


        const totalElement =
            document.getElementById(
                "adminAppointmentsTotal"
            );

        const confirmedElement =
            document.getElementById(
                "adminAppointmentsConfirmed"
            );

        const pendingElement =
            document.getElementById(
                "adminAppointmentsPending"
            );

        const cancelledElement =
            document.getElementById(
                "adminAppointmentsCancelled"
            );


        if (totalElement) {
            totalElement.textContent = total;
        }

        if (confirmedElement) {
            confirmedElement.textContent = confirmed;
        }

        if (pendingElement) {
            pendingElement.textContent = pending;
        }

        if (cancelledElement) {
            cancelledElement.textContent = cancelled;
        }


        /* =====================================================
           TABLE
           ===================================================== */

        function renderAppointmentsTable(list) {

            if (!list.length) {

                tableContainer.innerHTML = `
                    <div style="
                        text-align:center;
                        padding:60px;
                        color:#6b7280;
                    ">

                        <div style="
                            font-size:38px;
                            margin-bottom:12px;
                        ">
                            ▣
                        </div>

                        <strong style="
                            display:block;
                            color:#374151;
                            margin-bottom:6px;
                        ">
                            لا توجد مواعيد
                        </strong>

                        <span>
                            لا توجد نتائج مطابقة للبحث الحالي.
                        </span>

                    </div>
                `;

                return;
            }


            tableContainer.innerHTML = `

                <div style="
                    width:100%;
                    overflow-x:auto;
                ">

                    <table style="
                        width:100%;
                        min-width:1100px;
                        border-collapse:collapse;
                        direction:rtl;
                    ">

                        <thead>

                            <tr style="
                                background:#f8fafc;
                                text-align:right;
                            ">

                                <th style="padding:18px 22px;">
                                    الرقم
                                </th>

                                <th style="padding:18px 22px;">
                                    المريض
                                </th>

                                <th style="padding:18px 22px;">
                                    الهاتف
                                </th>

                                <th style="padding:18px 22px;">
                                    الطبيب
                                </th>

                                <th style="padding:18px 22px;">
                                    التاريخ
                                </th>

                                <th style="padding:18px 22px;">
                                    الوقت
                                </th>

                                <th style="padding:18px 22px;">
                                    الحالة
                                </th>

                                <th style="padding:18px 22px;">
                                    الإجراء
                                </th>

                            </tr>

                        </thead>


                        <tbody>

                            ${
                                list.map(
                                    (appointment, index) => {

                                        const patientName =
                                            fullName(
                                                appointment.patient_first_name,
                                                appointment.patient_last_name
                                            ) ||
                                            appointment.booking_name ||
                                            "مريض غير معروف";


                                        const phone =
                                            appointment.patient_phone ||
                                            appointment.booking_phone ||
                                            "غير متوفر";


                                        const doctor =
                                            appointment.dentist_name ||
                                            "غير محدد";


                                        const status =
                                            String(
                                                appointment.status ||
                                                appointment.booking_status ||
                                                "scheduled"
                                            ).toLowerCase();


                                        return `

                                            <tr style="
                                                border-top:1px solid #f1f5f9;
                                            ">

                                                <td style="
                                                    padding:20px 22px;
                                                    color:#6b7280;
                                                ">
                                                    ${appointment.id ?? index + 1}
                                                </td>


                                                <td style="
                                                    padding:20px 22px;
                                                ">

                                                    <strong style="
                                                        color:#1f2937;
                                                    ">
                                                        ${escapeHTML(
                                                            patientName
                                                        )}
                                                    </strong>

                                                </td>


                                                <td style="
                                                    padding:20px 22px;
                                                    direction:ltr;
                                                    text-align:right;
                                                    color:#4b5563;
                                                ">
                                                    ${escapeHTML(phone)}
                                                </td>


                                                <td style="
                                                    padding:20px 22px;
                                                    color:#4b5563;
                                                ">
                                                    ${escapeHTML(doctor)}
                                                </td>


                                                <td style="
                                                    padding:20px 22px;
                                                    color:#4b5563;
                                                    white-space:nowrap;
                                                ">
                                                    ${escapeHTML(
                                                        appointment.appointment_date ||
                                                        "غير محدد"
                                                    )}
                                                </td>


                                                <td style="
                                                    padding:20px 22px;
                                                    color:#4b5563;
                                                    white-space:nowrap;
                                                ">
                                                    ${formatTime(
                                                        appointment.appointment_time
                                                    )}
                                                </td>


                                                <td style="
                                                    padding:20px 22px;
                                                    white-space:nowrap;
                                                ">

                                                    <span class="
                                                        status
                                                        ${
                                                            status === "confirmed"
                                                                ? "working"
                                                                : status === "cancelled"
                                                                    ? "absent"
                                                                    : "not-started"
                                                        }
                                                    ">
                                                        ${escapeHTML(
                                                            formatAppointmentStatus(
                                                                status
                                                            )
                                                        )}
                                                    </span>

                                                </td>


                                                <td style="
                                                    padding:20px 22px;
                                                ">

                                                    <button
                                                        type="button"
                                                        class="admin-appointment-view-btn"
                                                        data-appointment-index="${index}"
                                                        style="
                                                            border:0;
                                                            background:#eff6ff;
                                                            color:#2563eb;
                                                            padding:9px 15px;
                                                            border-radius:9px;
                                                            cursor:pointer;
                                                            font-weight:700;
                                                            white-space:nowrap;
                                                        "
                                                    >
                                                        عرض التفاصيل
                                                    </button>

                                                </td>

                                            </tr>

                                        `;
                                    }
                                ).join("")
                            }

                        </tbody>

                    </table>

                </div>
            `;


            tableContainer
                .querySelectorAll(
                    ".admin-appointment-view-btn"
                )
                .forEach(button => {

                    button.addEventListener(
                        "click",
                        () => {

                            const index =
                                Number(
                                    button.dataset.appointmentIndex
                                );

                            const appointment =
                                list[index];

                            if (appointment) {

                                showAdminAppointmentDetails(
                                    appointment
                                );
                            }
                        }
                    );

                });
        }


        /* =====================================================
           FILTER
           ===================================================== */

        function applyAppointmentFilters() {

            const query =
                String(
                    searchInput?.value || ""
                )
                    .trim()
                    .toLowerCase();


            const selectedStatus =
                String(
                    statusFilter?.value || "all"
                ).toLowerCase();


            const filtered =
                appointments.filter(
                    appointment => {

                        const patientName =
                            fullName(
                                appointment.patient_first_name,
                                appointment.patient_last_name
                            ) ||
                            appointment.booking_name ||
                            "";


                        const phone =
                            appointment.patient_phone ||
                            appointment.booking_phone ||
                            "";


                        const appointmentStatus =
                            String(
                                appointment.status ||
                                appointment.booking_status ||
                                "scheduled"
                            ).toLowerCase();


                        const matchesSearch =
                            !query ||
                            String(
                                appointment.id || ""
                            )
                                .toLowerCase()
                                .includes(query) ||

                            String(
                                patientName
                            )
                                .toLowerCase()
                                .includes(query) ||

                            String(phone)
                                .toLowerCase()
                                .includes(query);


                        const matchesStatus =
                            selectedStatus === "all" ||
                            appointmentStatus === selectedStatus;


                        return (
                            matchesSearch &&
                            matchesStatus
                        );
                    }
                );


            renderAppointmentsTable(
                filtered
            );
        }


        renderAppointmentsTable(
            appointments
        );


        searchInput?.addEventListener(
            "input",
            applyAppointmentFilters
        );


        statusFilter?.addEventListener(
            "change",
            applyAppointmentFilters
        );


    } catch (error) {

        console.error(
            "ADMIN APPOINTMENTS ERROR:",
            error
        );


        moduleContent.innerHTML = `

            <div
                dir="rtl"
                style="
                    background:#ffffff;
                    border:1px solid #fecaca;
                    border-radius:20px;
                    padding:50px;
                    text-align:center;
                "
            >

                <div style="
                    font-size:38px;
                    margin-bottom:12px;
                ">
                    ⚠️
                </div>

                <h3 style="
                    margin:0 0 8px;
                    color:#991b1b;
                ">
                    تعذر تحميل المواعيد
                </h3>

                <p style="
                    margin:0;
                    color:#6b7280;
                ">
                    ${escapeHTML(error.message)}
                </p>

            </div>
        `;
    }
}


/* =========================================================
   APPOINTMENT DETAILS
   ========================================================= */

function showAdminAppointmentDetails(
    appointment
) {

    if (!moduleContent) {
        return;
    }


    const patientName =
        fullName(
            appointment.patient_first_name,
            appointment.patient_last_name
        ) ||
        appointment.booking_name ||
        "مريض غير معروف";


    const doctor =
        appointment.dentist_name ||
        "غير محدد";


    const phone =
        appointment.patient_phone ||
        appointment.booking_phone ||
        "غير متوفر";


    const email =
        appointment.booking_email ||
        "غير متوفر";


    const status =
        String(
            appointment.status ||
            appointment.booking_status ||
            "scheduled"
        ).toLowerCase();


    moduleContent.innerHTML = `

        <div
            dir="rtl"
            style="
                width:100%;
                background:#ffffff;
                border:1px solid #e5e7eb;
                border-radius:20px;
                padding:32px;
                box-sizing:border-box;
            "
        >

            <button
                type="button"
                id="backToAppointmentsBtn"
                style="
                    border:0;
                    background:#f1f5f9;
                    color:#374151;
                    padding:10px 17px;
                    border-radius:9px;
                    cursor:pointer;
                    margin-bottom:28px;
                    font-weight:700;
                "
            >
                ← العودة إلى قائمة المواعيد
            </button>


            <div style="
                display:flex;
                align-items:center;
                gap:20px;
                padding-bottom:28px;
                border-bottom:1px solid #e5e7eb;
            ">

                <div style="
                    width:80px;
                    height:80px;
                    flex:0 0 80px;
                    border-radius:50%;
                    background:#eff6ff;
                    color:#2563eb;
                    display:flex;
                    align-items:center;
                    justify-content:center;
                    font-size:34px;
                ">
                    ▣
                </div>


                <div>

                    <h2 style="
                        margin:0 0 7px;
                        color:#1f2937;
                        font-size:26px;
                    ">
                        ${escapeHTML(patientName)}
                    </h2>

                    <p style="
                        margin:0 0 10px;
                        color:#6b7280;
                        font-size:15px;
                    ">
                        تفاصيل الموعد رقم ${appointment.id ?? "—"}
                    </p>

                    <span class="
                        status
                        ${
                            status === "confirmed"
                                ? "working"
                                : status === "cancelled"
                                    ? "absent"
                                    : "not-started"
                        }
                    ">
                        ${escapeHTML(
                            formatAppointmentStatus(
                                status
                            )
                        )}
                    </span>

                </div>

            </div>


            <div style="
                display:grid;
                grid-template-columns:repeat(2,minmax(0,1fr));
                gap:20px;
                margin-top:28px;
            ">

                <div class="module-card">
                    <span>المريض</span>
                    <strong>
                        ${escapeHTML(patientName)}
                    </strong>
                </div>


                <div class="module-card">
                    <span>الطبيب</span>
                    <strong>
                        ${escapeHTML(doctor)}
                    </strong>
                </div>


                <div class="module-card">
                    <span>الهاتف</span>
                    <strong dir="ltr">
                        ${escapeHTML(phone)}
                    </strong>
                </div>


                <div class="module-card">
                    <span>البريد الإلكتروني</span>
                    <strong>
                        ${escapeHTML(email)}
                    </strong>
                </div>


                <div class="module-card">
                    <span>تاريخ الموعد</span>
                    <strong>
                        ${escapeHTML(
                            appointment.appointment_date ||
                            "غير محدد"
                        )}
                    </strong>
                </div>


                <div class="module-card">
                    <span>وقت الموعد</span>
                    <strong>
                        ${formatTime(
                            appointment.appointment_time
                        )}
                    </strong>
                </div>


                <div class="module-card">
                    <span>سبب الموعد</span>
                    <strong>
                        ${escapeHTML(
                            appointment.reason ||
                            "غير محدد"
                        )}
                    </strong>
                </div>


                <div class="module-card">
                    <span>نوع الحجز</span>
                    <strong>
                        ${
                            appointment.booking_type === "online"
                                ? "حجز إلكتروني"
                                : "حجز من العيادة"
                        }
                    </strong>
                </div>


                ${
                    appointment.booking_code
                        ? `
                            <div class="module-card">
                                <span>رمز الحجز</span>
                                <strong>
                                    ${escapeHTML(
                                        appointment.booking_code
                                    )}
                                </strong>
                            </div>
                        `
                        : ""
                }


                ${
                    appointment.notes
                        ? `
                            <div
                                class="module-card"
                                style="
                                    grid-column:1/-1;
                                "
                            >
                                <span>ملاحظات</span>
                                <strong>
                                    ${escapeHTML(
                                        appointment.notes
                                    )}
                                </strong>
                            </div>
                        `
                        : ""
                }

            </div>

        </div>
    `;


    document
        .getElementById(
            "backToAppointmentsBtn"
        )
        ?.addEventListener(
            "click",
            () => {
                renderAppointmentsModule();
            }
        );
}

/* =========================================================
   OPERATIONS MODULE
   ========================================================= */

async function renderOperationsModule() {

    if (!moduleContent) {
        return;
    }

    moduleContent.innerHTML = `
        <div class="operations-admin-module">

            <div class="operations-summary-grid">

                <div class="operations-summary-card">
                    <div class="operations-summary-icon">👥</div>
                    <div>
                        <span>إجمالي الحركة</span>
                        <strong id="operationsTotal">0</strong>
                    </div>
                </div>

                <div class="operations-summary-card waiting">
                    <div class="operations-summary-icon">⏳</div>
                    <div>
                        <span>في الانتظار</span>
                        <strong id="operationsWaiting">0</strong>
                    </div>
                </div>

                <div class="operations-summary-card called">
                    <div class="operations-summary-icon">📢</div>
                    <div>
                        <span>تم الاستدعاء</span>
                        <strong id="operationsCalled">0</strong>
                    </div>
                </div>

                <div class="operations-summary-card visit">
                    <div class="operations-summary-icon">🦷</div>
                    <div>
                        <span>داخل الزيارة</span>
                        <strong id="operationsInVisit">0</strong>
                    </div>
                </div>

                <div class="operations-summary-card completed">
                    <div class="operations-summary-icon">✓</div>
                    <div>
                        <span>مكتمل</span>
                        <strong id="operationsCompleted">0</strong>
                    </div>
                </div>

                <div class="operations-summary-card warning">
                    <div class="operations-summary-icon">⚠️</div>
                    <div>
                        <span>انتظار طويل</span>
                        <strong id="operationsLongWaiting">0</strong>
                    </div>
                </div>

            </div>

            <div class="operations-toolbar">

                <div class="operations-search">
                    <span>🔎</span>

                    <input
                        type="text"
                        id="operationsSearch"
                        placeholder="ابحث باسم المريض أو الرقم أو الهاتف..."
                    >
                </div>

                <select id="operationsStatusFilter">
                    <option value="all">كل الحالات</option>
                    <option value="waiting">منتظر</option>
                    <option value="called">تم الاستدعاء</option>
                    <option value="in_visit">داخل الزيارة</option>
                    <option value="completed">مكتمل</option>
                    <option value="absent">غائب</option>
                    <option value="cancelled">ملغى</option>
                </select>

                <select id="operationsPriorityFilter">
                    <option value="all">كل الأولويات</option>
                    <option value="emergency">طوارئ</option>
                    <option value="follow_up">متابعة</option>
                    <option value="normal">عادي</option>
                </select>

            </div>

            <div class="operations-panel">

                <div class="operations-panel-header">

                    <div>
                        <span class="operations-panel-kicker">
                            التشغيل اليومي
                        </span>

                        <h3>
                            حركة المرضى
                        </h3>
                    </div>

                    <button
                        type="button"
                        class="operations-refresh-btn"
                        id="operationsRefreshBtn"
                    >
                        ↻ تحديث
                    </button>

                </div>

                <div id="operationsTableContainer">

                    <div class="operations-loading">
                        جاري تحميل حركة المرضى...
                    </div>

                </div>

            </div>

        </div>
    `;

    await loadOperationsData();
}


/* =========================================================
   LOAD OPERATIONS DATA
   ========================================================= */

async function loadOperationsData() {

    const container =
        document.getElementById(
            "operationsTableContainer"
        );

    if (!container) {
        return;
    }

    try {

        container.innerHTML = `
            <div class="operations-loading">
                جاري تحميل حركة المرضى...
            </div>
        `;

        const data = await apiRequest(
            `${API_BASE}/admin/operations`
        );

        adminOperationsData =
            data.operations || [];

        updateOperationsSummary(
            data.summary || {}
        );

        renderOperationsTable();

        setupOperationsEvents();

    } catch (error) {

        console.error(
            "OPERATIONS LOAD ERROR:",
            error
        );

        container.innerHTML = `
            <div class="operations-empty error">
                <div class="operations-empty-icon">
                    ⚠️
                </div>

                <h3>
                    تعذر تحميل بيانات العمليات
                </h3>

                <p>
                    حدث خطأ أثناء الاتصال بالخادم.
                </p>

                <button
                    type="button"
                    class="operations-retry-btn"
                    onclick="loadOperationsData()"
                >
                    إعادة المحاولة
                </button>
            </div>
        `;
    }
}


/* =========================================================
   OPERATIONS SUMMARY
   ========================================================= */

function updateOperationsSummary(summary) {

    const total =
        document.getElementById(
            "operationsTotal"
        );

    const waiting =
        document.getElementById(
            "operationsWaiting"
        );

    const called =
        document.getElementById(
            "operationsCalled"
        );

    const inVisit =
        document.getElementById(
            "operationsInVisit"
        );

    const completed =
        document.getElementById(
            "operationsCompleted"
        );

    const longWaiting =
        document.getElementById(
            "operationsLongWaiting"
        );

    if (total) {
        total.textContent =
            summary.total || 0;
    }

    if (waiting) {
        waiting.textContent =
            summary.waiting || 0;
    }

    if (called) {
        called.textContent =
            summary.called || 0;
    }

    if (inVisit) {
        inVisit.textContent =
            summary.inVisit || 0;
    }

    if (completed) {
        completed.textContent =
            summary.completed || 0;
    }

    if (longWaiting) {
        longWaiting.textContent =
            summary.longWaiting || 0;
    }
}


/* =========================================================
   OPERATIONS TABLE
   ========================================================= */

function renderOperationsTable() {

    const container =
        document.getElementById(
            "operationsTableContainer"
        );

    if (!container) {
        return;
    }

    const searchInput =
        document.getElementById(
            "operationsSearch"
        );

    const statusFilter =
        document.getElementById(
            "operationsStatusFilter"
        );

    const priorityFilter =
        document.getElementById(
            "operationsPriorityFilter"
        );

    const search =
        searchInput
            ? searchInput.value.trim().toLowerCase()
            : "";

    const selectedStatus =
        statusFilter
            ? statusFilter.value
            : "all";

    const selectedPriority =
        priorityFilter
            ? priorityFilter.value
            : "all";


    const filtered =
        adminOperationsData.filter(item => {

            const patientName =
                item.patient_name || "";

            const patientId =
                String(
                    item.patient_id || ""
                );

            const phone =
                item.patient_phone || "";

            const matchesSearch =
                !search ||
                patientName
                    .toLowerCase()
                    .includes(search) ||
                patientId
                    .toLowerCase()
                    .includes(search) ||
                phone
                    .toLowerCase()
                    .includes(search);

            const matchesStatus =
                selectedStatus === "all" ||
                item.queue_status === selectedStatus;

            const matchesPriority =
                selectedPriority === "all" ||
                item.priority === selectedPriority;

            return (
                matchesSearch &&
                matchesStatus &&
                matchesPriority
            );
        });


    if (filtered.length === 0) {

        container.innerHTML = `
            <div class="operations-empty">

                <div class="operations-empty-icon">
                    📋
                </div>

                <h3>
                    لا توجد حركة مرضى
                </h3>

                <p>
                    لا توجد سجلات تطابق البحث أو الفلاتر الحالية.
                </p>

            </div>
        `;

        return;
    }


    const rows =
        filtered.map(item => {

            const priority =
                getOperationsPriorityLabel(
                    item.priority
                );

            const status =
                getOperationsStatusLabel(
                    item.queue_status
                );

            const date =
                item.appointment_date
                    ? formatArabicDate(
                        item.appointment_date
                    )
                    : "—";

            const time =
                item.appointment_time
                    ? String(
                        item.appointment_time
                    ).slice(0, 5)
                    : "—";

            const wait =
                item.wait_minutes || 0;

            const waitClass =
                wait >= 30 &&
                item.queue_status === "waiting"
                    ? "long"
                    : "";

            return `
                <tr>

                    <td>
                        <strong>
                            #${item.queue_number || "—"}
                        </strong>
                    </td>

                    <td>
                        <div class="operations-patient">

                            <div class="operations-avatar">
                                ${getOperationsInitials(
                                    item.patient_name
                                )}
                            </div>

                            <div>
                                <strong>
                                    ${escapeHTML(
                                        item.patient_name || "غير معروف"
                                    )}
                                </strong>

                                <small>
                                    ID: ${item.patient_id || "—"}
                                </small>
                            </div>

                        </div>
                    </td>

                    <td>
                        ${escapeHTML(
                            item.patient_phone || "—"
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            item.dentist_name || "غير محدد"
                        )}
                    </td>

                    <td>
                        <span class="operations-priority ${priority.class}">
                            ${priority.label}
                        </span>
                    </td>

                    <td>
                        <div class="operations-date">

                            <strong>
                                ${date}
                            </strong>

                            <small>
                                ${time}
                            </small>

                        </div>
                    </td>

                    <td>

                        <span class="operations-status ${status.class}">
                            ${status.label}
                        </span>

                    </td>

                    <td>

                        <span class="operations-wait ${waitClass}">
                            ${wait} دقيقة
                        </span>

                    </td>

                    <td>

                        <button
                            type="button"
                            class="operations-details-btn"
                            data-operation-id="${item.id}"
                        >
                            التفاصيل
                        </button>

                    </td>

                </tr>
            `;
        }).join("");


    container.innerHTML = `

        <div class="operations-table-wrapper">

            <table class="operations-table">

                <thead>

                    <tr>

                        <th>الدور</th>
                        <th>المريض</th>
                        <th>الهاتف</th>
                        <th>الطبيب</th>
                        <th>الأولوية</th>
                        <th>الموعد</th>
                        <th>الحالة</th>
                        <th>الانتظار</th>
                        <th>الإجراء</th>

                    </tr>

                </thead>

                <tbody>
                    ${rows}
                </tbody>

            </table>

        </div>
    `;
}


/* =========================================================
   OPERATIONS EVENTS
   ========================================================= */

function setupOperationsEvents() {

    const searchInput =
        document.getElementById(
            "operationsSearch"
        );

    const statusFilter =
        document.getElementById(
            "operationsStatusFilter"
        );

    const priorityFilter =
        document.getElementById(
            "operationsPriorityFilter"
        );

    const refreshButton =
        document.getElementById(
            "operationsRefreshBtn"
        );


    if (searchInput) {

        searchInput.oninput = () => {
            renderOperationsTable();
        };
    }


    if (statusFilter) {

        statusFilter.onchange = () => {
            renderOperationsTable();
        };
    }


    if (priorityFilter) {

        priorityFilter.onchange = () => {
            renderOperationsTable();
        };
    }


    if (refreshButton) {

        refreshButton.onclick = () => {
            loadOperationsData();
        };
    }


    document
        .querySelectorAll(
            ".operations-details-btn"
        )
        .forEach(button => {

            button.onclick = () => {

                const id =
                    Number(
                        button.dataset.operationId
                    );

                const operation =
                    adminOperationsData.find(
                        item =>
                            Number(item.id) === id
                    );

                if (operation) {
                    showAdminOperationDetails(
                        operation
                    );
                }
            };
        });
}


/* =========================================================
   OPERATIONS DETAILS
   ========================================================= */

function showAdminOperationDetails(operation) {

    if (!moduleContent) {
        return;
    }

    const status =
        getOperationsStatusLabel(
            operation.queue_status
        );

    const priority =
        getOperationsPriorityLabel(
            operation.priority
        );

    const date =
        operation.appointment_date
            ? formatArabicDate(
                operation.appointment_date
            )
            : "—";

    const time =
        operation.appointment_time
            ? String(
                operation.appointment_time
            ).slice(0, 5)
            : "—";


    moduleContent.innerHTML = `

        <div class="operation-details-page">

            <div class="operation-details-header">

                <button
                    type="button"
                    class="operations-back-btn"
                    id="operationsBackBtn"
                >
                    ← العودة إلى العمليات
                </button>

                <div>

                    <span>
                        تفاصيل حركة المريض
                    </span>

                    <h2>
                        ${escapeHTML(
                            operation.patient_name ||
                            "مريض غير معروف"
                        )}
                    </h2>

                </div>

            </div>


            <div class="operation-details-grid">


                <div class="operation-detail-card">

                    <span>رقم الدور</span>

                    <strong>
                        #${operation.queue_number || "—"}
                    </strong>

                </div>


                <div class="operation-detail-card">

                    <span>الحالة</span>

                    <strong>
                        <span class="operations-status ${status.class}">
                            ${status.label}
                        </span>
                    </strong>

                </div>


                <div class="operation-detail-card">

                    <span>الأولوية</span>

                    <strong>
                        <span class="operations-priority ${priority.class}">
                            ${priority.label}
                        </span>
                    </strong>

                </div>


                <div class="operation-detail-card">

                    <span>مدة الانتظار</span>

                    <strong>
                        ${operation.wait_minutes || 0} دقيقة
                    </strong>

                </div>


            </div>


            <div class="operation-details-section">

                <h3>
                    معلومات المريض
                </h3>

                <div class="operation-info-grid">

                    <div>
                        <span>الاسم</span>
                        <strong>
                            ${escapeHTML(
                                operation.patient_name || "—"
                            )}
                        </strong>
                    </div>

                    <div>
                        <span>رقم المريض</span>
                        <strong>
                            ${operation.patient_id || "—"}
                        </strong>
                    </div>

                    <div>
                        <span>الهاتف</span>
                        <strong>
                            ${escapeHTML(
                                operation.patient_phone || "—"
                            )}
                        </strong>
                    </div>

                </div>

            </div>


            <div class="operation-details-section">

                <h3>
                    معلومات الموعد
                </h3>

                <div class="operation-info-grid">

                    <div>
                        <span>الطبيب</span>
                        <strong>
                            ${escapeHTML(
                                operation.dentist_name ||
                                "غير محدد"
                            )}
                        </strong>
                    </div>

                    <div>
                        <span>التاريخ</span>
                        <strong>
                            ${date}
                        </strong>
                    </div>

                    <div>
                        <span>الوقت</span>
                        <strong>
                            ${time}
                        </strong>
                    </div>

                    <div>
                        <span>سبب الموعد</span>
                        <strong>
                            ${escapeHTML(
                                operation.reason ||
                                "غير محدد"
                            )}
                        </strong>
                    </div>

                </div>

            </div>


            <div class="operation-details-section">

                <h3>
                    توقيتات الحركة
                </h3>

                <div class="operation-timeline">

                    <div>
                        <span>الوصول</span>
                        <strong>
                            ${formatOperationsDateTime(
                                operation.arrived_at
                            )}
                        </strong>
                    </div>

                    <div>
                        <span>الاستدعاء</span>
                        <strong>
                            ${formatOperationsDateTime(
                                operation.called_at
                            )}
                        </strong>
                    </div>

                    <div>
                        <span>بدء الزيارة</span>
                        <strong>
                            ${formatOperationsDateTime(
                                operation.visit_started_at
                            )}
                        </strong>
                    </div>

                    <div>
                        <span>انتهاء الزيارة</span>
                        <strong>
                            ${formatOperationsDateTime(
                                operation.completed_at
                            )}
                        </strong>
                    </div>

                </div>

            </div>

        </div>
    `;


    const backButton =
        document.getElementById(
            "operationsBackBtn"
        );

    if (backButton) {

        backButton.onclick = () => {

            showAdminModule(
                "operations"
            );

        };
    }


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


/* =========================================================
   OPERATIONS HELPERS
   ========================================================= */

function getOperationsStatusLabel(status) {

    const statuses = {

        waiting: {
            label: "منتظر",
            class: "status-waiting"
        },

        called: {
            label: "تم الاستدعاء",
            class: "status-called"
        },

        in_visit: {
            label: "داخل الزيارة",
            class: "status-in-visit"
        },

        completed: {
            label: "مكتمل",
            class: "status-completed"
        },

        absent: {
            label: "غائب",
            class: "status-absent"
        },

        cancelled: {
            label: "ملغى",
            class: "status-cancelled"
        }

    };

    return statuses[status] || {
        label: status || "غير معروف",
        class: "status-unknown"
    };
}


function getOperationsPriorityLabel(priority) {

    const priorities = {

        emergency: {
            label: "طوارئ",
            class: "priority-emergency"
        },

        follow_up: {
            label: "متابعة",
            class: "priority-follow-up"
        },

        normal: {
            label: "عادي",
            class: "priority-normal"
        }

    };

    return priorities[priority] || {
        label: priority || "غير محدد",
        class: "priority-normal"
    };
}


function getOperationsInitials(name) {

    if (!name) {
        return "؟";
    }

    const parts =
        name
            .trim()
            .split(/\s+/)
            .filter(Boolean);

    if (parts.length === 1) {
        return parts[0].charAt(0);
    }

    return (
        parts[0].charAt(0) +
        parts[parts.length - 1].charAt(0)
    ).toUpperCase();
}


function formatOperationsDateTime(value) {

    if (!value) {
        return "لم يحدث بعد";
    }

    const date =
        new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "—";
    }

    return date.toLocaleString(
        "ar-DZ",
        {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        }
    );
}


/* =========================================================
   ADMIN — ROOMS MODULE
   ========================================================= */

let adminRoomsData = [];


async function renderRoomsModule() {

    moduleView.classList.remove("hidden");
    moduleView.style.display = "block";

    moduleView.innerHTML = `
        <div class="rooms-admin-module">

            <div class="module-header">

                <div>
                    <span class="module-kicker">
                        مرافق العيادة
                    </span>

                    <h2>
                        الغرف
                    </h2>

                    <p>
                        متابعة حالة غرف العيادة وتوفرها والطبيب المسؤول عنها.
                    </p>
                </div>

                <button
                    class="module-refresh-btn"
                    id="roomsRefreshBtn"
                    type="button"
                >
                    ↻ تحديث
                </button>

            </div>


            <!-- SUMMARY -->

            <div class="rooms-summary-grid">

                <div class="room-summary-card">
                    <div class="room-summary-icon">
                        🏥
                    </div>

                    <div>
                        <span>
                            إجمالي الغرف
                        </span>

                        <strong id="roomsTotal">
                            0
                        </strong>
                    </div>
                </div>


                <div class="room-summary-card available">
                    <div class="room-summary-icon">
                        ✓
                    </div>

                    <div>
                        <span>
                            متاحة
                        </span>

                        <strong id="roomsAvailable">
                            0
                        </strong>
                    </div>
                </div>


                <div class="room-summary-card occupied">
                    <div class="room-summary-icon">
                        ●
                    </div>

                    <div>
                        <span>
                            مشغولة
                        </span>

                        <strong id="roomsOccupied">
                            0
                        </strong>
                    </div>
                </div>


                <div class="room-summary-card cleaning">
                    <div class="room-summary-icon">
                        🧹
                    </div>

                    <div>
                        <span>
                            قيد التنظيف
                        </span>

                        <strong id="roomsCleaning">
                            0
                        </strong>
                    </div>
                </div>


                <div class="room-summary-card maintenance">
                    <div class="room-summary-icon">
                        🔧
                    </div>

                    <div>
                        <span>
                            صيانة
                        </span>

                        <strong id="roomsMaintenance">
                            0
                        </strong>
                    </div>
                </div>

            </div>


            <!-- TOOLBAR -->

            <div class="rooms-toolbar">

                <div class="rooms-search-box">

                    <span>
                        🔎
                    </span>

                    <input
                        type="text"
                        id="roomsSearchInput"
                        placeholder="البحث عن غرفة..."
                    >

                </div>


                <select id="roomsStatusFilter">

                    <option value="">
                        جميع الحالات
                    </option>

                    <option value="available">
                        متاحة
                    </option>

                    <option value="occupied">
                        مشغولة
                    </option>

                    <option value="cleaning">
                        قيد التنظيف
                    </option>

                    <option value="maintenance">
                        صيانة
                    </option>

                    <option value="inactive">
                        غير مفعلة
                    </option>

                </select>

            </div>


            <!-- TABLE -->

            <div class="rooms-table-panel">

                <div class="rooms-table-header">

                    <div>

                        <h3>
                            غرف العيادة
                        </h3>

                        <p>
                            الحالة الحالية لجميع الغرف.
                        </p>

                    </div>

                </div>


                <div class="table-wrapper">

                    <table>

                        <thead>

                            <tr>

                                <th>
                                    الغرفة
                                </th>

                                <th>
                                    النوع
                                </th>

                                <th>
                                    الطبيب المسؤول
                                </th>

                                <th>
                                    الحالة
                                </th>

                                <th>
                                    ملاحظات
                                </th>

                                <th>
                                    الإجراء
                                </th>

                            </tr>

                        </thead>

                        <tbody id="roomsTableBody">
                        </tbody>

                    </table>

                </div>

            </div>


            <!-- DETAILS -->

            <div
                id="roomDetails"
                class="room-details-panel"
                style="display:none;"
            >
            </div>

        </div>
    `;


    const refreshButton =
        document.getElementById("roomsRefreshBtn");

    const searchInput =
        document.getElementById("roomsSearchInput");

    const statusFilter =
        document.getElementById("roomsStatusFilter");


    refreshButton.addEventListener(
        "click",
        loadAdminRooms
    );


    searchInput.addEventListener(
        "input",
        renderRoomsTable
    );


    statusFilter.addEventListener(
        "change",
        renderRoomsTable
    );


    await loadAdminRooms();
}


async function loadAdminRooms() {

    try {

        const response =
            await apiRequest(
                `${API_BASE}/admin/rooms`
            );

        adminRoomsData =
            response.rooms || [];

        updateRoomsSummary(
            response.summary || {}
        );

        renderRoomsTable();

    } catch (error) {

        console.error(
            "LOAD ROOMS ERROR:",
            error
        );

        const tbody =
            document.getElementById(
                "roomsTableBody"
            );

        if (tbody) {

            tbody.innerHTML = `
                <tr>
                    <td colspan="6">

                        <div class="empty-state">

                            <div class="empty-state-icon">
                                ⚠️
                            </div>

                            <h3>
                                تعذر تحميل الغرف
                            </h3>

                            <p>
                                حدث خطأ أثناء الاتصال بالخادم.
                            </p>

                        </div>

                    </td>
                </tr>
            `;
        }
    }
}


function updateRoomsSummary(summary) {

    const total =
        document.getElementById("roomsTotal");

    const available =
        document.getElementById("roomsAvailable");

    const occupied =
        document.getElementById("roomsOccupied");

    const cleaning =
        document.getElementById("roomsCleaning");

    const maintenance =
        document.getElementById("roomsMaintenance");


    if (total) {
        total.textContent =
            summary.total || 0;
    }

    if (available) {
        available.textContent =
            summary.available || 0;
    }

    if (occupied) {
        occupied.textContent =
            summary.occupied || 0;
    }

    if (cleaning) {
        cleaning.textContent =
            summary.cleaning || 0;
    }

    if (maintenance) {
        maintenance.textContent =
            summary.maintenance || 0;
    }
}


function renderRoomsTable() {

    const tbody =
        document.getElementById(
            "roomsTableBody"
        );

    if (!tbody) {
        return;
    }


    const searchInput =
        document.getElementById(
            "roomsSearchInput"
        );

    const statusFilter =
        document.getElementById(
            "roomsStatusFilter"
        );


    const search =
        (searchInput?.value || "")
            .trim()
            .toLowerCase();


    const selectedStatus =
        statusFilter?.value || "";


    const filteredRooms =
        adminRoomsData.filter(room => {

            const searchableText =
                [
                    room.room_number,
                    room.room_name,
                    room.room_type_label,
                    room.dentist_name,
                    room.notes
                ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();


            const matchesSearch =
                !search ||
                searchableText.includes(search);


            const matchesStatus =
                !selectedStatus ||
                room.status === selectedStatus;


            return (
                matchesSearch &&
                matchesStatus
            );
        });


    if (!filteredRooms.length) {

        tbody.innerHTML = `
            <tr>

                <td colspan="6">

                    <div class="empty-state">

                        <div class="empty-state-icon">
                            🏥
                        </div>

                        <h3>
                            لا توجد غرف
                        </h3>

                        <p>
                            لا توجد نتائج مطابقة للبحث الحالي.
                        </p>

                    </div>

                </td>

            </tr>
        `;

        return;
    }


    tbody.innerHTML =
        filteredRooms
            .map(room => {

                const statusClass =
                    getRoomStatusClass(
                        room.status
                    );


                const dentistName =
                    room.dentist_name ||
                    "غير مرتبط";


                return `

                    <tr>

                        <td>

                            <div class="room-name-cell">

                                <div class="room-number">
                                    ${escapeHTML(
                                        room.room_number || "-"
                                    )}
                                </div>

                                <div>

                                    <strong>
                                        ${escapeHTML(
                                            room.room_name || "-"
                                        )}
                                    </strong>

                                    <span>
                                        غرفة رقم
                                        ${escapeHTML(
                                            room.room_number || "-"
                                        )}
                                    </span>

                                </div>

                            </div>

                        </td>


                        <td>
                            ${escapeHTML(
                                room.room_type_label || "-"
                            )}
                        </td>


                        <td>
                            ${escapeHTML(
                                dentistName
                            )}
                        </td>


                        <td>

                            <span
                                class="room-status ${statusClass}"
                            >
                                ${escapeHTML(
                                    room.status_label || "-"
                                )}
                            </span>

                        </td>


                        <td>

                            <span class="room-notes">

                                ${escapeHTML(
                                    room.notes || "لا توجد ملاحظات"
                                )}

                            </span>

                        </td>


                        <td>

                            <button
                                type="button"
                                class="room-view-btn"
                                onclick="showRoomDetails(${room.id})"
                            >
                                عرض
                            </button>

                        </td>

                    </tr>
                `;
            })
            .join("");
}


function getRoomStatusClass(status) {

    switch (status) {

        case "available":
            return "available";

        case "occupied":
            return "occupied";

        case "cleaning":
            return "cleaning";

        case "maintenance":
            return "maintenance";

        case "inactive":
            return "inactive";

        default:
            return "";
    }
}


function showRoomDetails(roomId) {

    const room =
        adminRoomsData.find(
            item =>
                Number(item.id) ===
                Number(roomId)
        );


    if (!room) {
        return;
    }


    const details =
        document.getElementById(
            "roomDetails"
        );


    if (!details) {
        return;
    }


    details.style.display = "block";


    details.innerHTML = `

        <div class="room-details-header">

            <div>

                <span class="module-kicker">
                    تفاصيل الغرفة
                </span>

                <h3>
                    ${escapeHTML(
                        room.room_name || "-"
                    )}
                </h3>

            </div>


            <button
                type="button"
                class="room-close-details"
                onclick="closeRoomDetails()"
            >
                إغلاق
            </button>

        </div>


        <div class="room-details-grid">

            <div class="room-detail-item">

                <span>
                    رقم الغرفة
                </span>

                <strong>
                    ${escapeHTML(
                        room.room_number || "-"
                    )}
                </strong>

            </div>


            <div class="room-detail-item">

                <span>
                    نوع الغرفة
                </span>

                <strong>
                    ${escapeHTML(
                        room.room_type_label || "-"
                    )}
                </strong>

            </div>


            <div class="room-detail-item">

                <span>
                    الطبيب المسؤول
                </span>

                <strong>
                    ${escapeHTML(
                        room.dentist_name ||
                        "غير مرتبط"
                    )}
                </strong>

            </div>


            <div class="room-detail-item">

                <span>
                    الحالة
                </span>

                <strong>

                    <span
                        class="room-status ${getRoomStatusClass(
                            room.status
                        )}"
                    >
                        ${escapeHTML(
                            room.status_label || "-"
                        )}
                    </span>

                </strong>

            </div>


            <div class="room-detail-item full">

                <span>
                    الملاحظات
                </span>

                <strong>
                    ${escapeHTML(
                        room.notes ||
                        "لا توجد ملاحظات"
                    )}
                </strong>

            </div>

        </div>
    `;


    details.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}


function closeRoomDetails() {

    const details =
        document.getElementById(
            "roomDetails"
        );

    if (details) {

        details.style.display =
            "none";

        details.innerHTML =
            "";
    }
}


/* =========================================================
   ADMIN — FINANCE MODULE
   ========================================================= */

let adminFinanceData = [];


function formatArabicDate(dateValue) {
    if (!dateValue) {
        return "غير محدد";
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
        return "غير محدد";
    }

    return date.toLocaleDateString("ar-DZ", {
        year: "numeric",
        month: "long",
        day: "numeric"
    });
}


async function renderFinanceModule() {

    moduleView.classList.remove("hidden");
    moduleView.style.display = "block";

    moduleView.innerHTML = `
        <div class="finance-admin-module">

            <div class="module-header">

                <div>
                    <span class="module-kicker">
                        التحكم المالي
                    </span>

                    <h2>
                        المالية
                    </h2>

                    <p>
                        متابعة المدفوعات والإيرادات والوضع المالي للعيادة.
                    </p>
                </div>

                <button
                    class="module-refresh-btn"
                    id="financeRefreshBtn"
                    type="button"
                >
                    ↻ تحديث
                </button>

            </div>


            <!-- SUMMARY -->

            <div class="finance-summary-grid">

                <div class="finance-summary-card">

                    <div class="finance-summary-icon">
                        💰
                    </div>

                    <div>
                        <span>
                            إجمالي الإيرادات
                        </span>

                        <strong id="financeTotalRevenue">
                            0 دج
                        </strong>
                    </div>

                </div>


                <div class="finance-summary-card paid">

                    <div class="finance-summary-icon">
                        ✓
                    </div>

                    <div>
                        <span>
                            المبالغ المدفوعة
                        </span>

                        <strong id="financePaidAmount">
                            0 دج
                        </strong>
                    </div>

                </div>


                <div class="finance-summary-card pending">

                    <div class="finance-summary-icon">
                        ⏳
                    </div>

                    <div>
                        <span>
                            المبالغ المعلقة
                        </span>

                        <strong id="financePendingAmount">
                            0 دج
                        </strong>
                    </div>

                </div>


                <div class="finance-summary-card">

                    <div class="finance-summary-icon">
                        🧾
                    </div>

                    <div>
                        <span>
                            عدد عمليات الدفع
                        </span>

                        <strong id="financeTotalPayments">
                            0
                        </strong>
                    </div>

                </div>

            </div>


            <!-- PAYMENT METHODS -->

            <div class="finance-methods-panel">

                <div class="finance-panel-heading">

                    <div>
                        <h3>
                            طرق الدفع
                        </h3>

                        <p>
                            توزيع المبالغ حسب طريقة الدفع.
                        </p>
                    </div>

                </div>


                <div class="finance-methods-grid">

                    <div class="finance-method-card">

                        <span>
                            💵 نقدًا
                        </span>

                        <strong id="financeCash">
                            0 دج
                        </strong>

                    </div>


                    <div class="finance-method-card">

                        <span>
                            💳 بطاقة
                        </span>

                        <strong id="financeCard">
                            0 دج
                        </strong>

                    </div>


                    <div class="finance-method-card">

                        <span>
                            🏦 تحويل بنكي
                        </span>

                        <strong id="financeBank">
                            0 دج
                        </strong>

                    </div>

                </div>

            </div>


            <!-- TOOLBAR -->

            <div class="finance-toolbar">

                <div class="finance-search-box">

                    <span>
                        🔎
                    </span>

                    <input
                        type="text"
                        id="financeSearchInput"
                        placeholder="البحث عن عملية دفع..."
                    >

                </div>


                <select id="financeStatusFilter">

                    <option value="">
                        جميع الحالات
                    </option>

                    <option value="paid">
                        مدفوعة
                    </option>

                    <option value="pending">
                        معلقة
                    </option>

                </select>


                <select id="financeMethodFilter">

                    <option value="">
                        جميع طرق الدفع
                    </option>

                    <option value="cash">
                        نقدًا
                    </option>

                    <option value="card">
                        بطاقة
                    </option>

                    <option value="bank_transfer">
                        تحويل بنكي
                    </option>

                </select>

            </div>


            <!-- TABLE -->

            <div class="finance-table-panel">

                <div class="finance-table-header">

                    <div>

                        <h3>
                            عمليات الدفع
                        </h3>

                        <p>
                            جميع العمليات المالية المسجلة في النظام.
                        </p>

                    </div>

                </div>


                <div class="table-wrapper">

                    <table>

                        <thead>

                            <tr>

                                <th>
                                    العملية
                                </th>

                                <th>
                                    المريض
                                </th>

                                <th>
                                    العلاج
                                </th>

                                <th>
                                    المبلغ
                                </th>

                                <th>
                                    طريقة الدفع
                                </th>

                                <th>
                                    التاريخ
                                </th>

                                <th>
                                    الحالة
                                </th>

                                <th>
                                    الإجراء
                                </th>

                            </tr>

                        </thead>

                        <tbody id="financeTableBody">
                        </tbody>

                    </table>

                </div>

            </div>


            <!-- DETAILS -->

            <div
                id="financeDetails"
                class="finance-details-panel"
                style="display:none;"
            >
            </div>

        </div>
    `;


    document
        .getElementById("financeRefreshBtn")
        ?.addEventListener(
            "click",
            loadAdminFinance
        );


    document
        .getElementById("financeSearchInput")
        ?.addEventListener(
            "input",
            renderFinanceTable
        );


    document
        .getElementById("financeStatusFilter")
        ?.addEventListener(
            "change",
            renderFinanceTable
        );


    document
        .getElementById("financeMethodFilter")
        ?.addEventListener(
            "change",
            renderFinanceTable
        );


    await loadAdminFinance();
}

async function loadAdminFinance() {
    try {
        const financeUrl = `${API_BASE}/admin/finance`;

        console.log("Finance URL:", financeUrl);

        const data = await apiRequest(financeUrl);

        console.log("Finance Data:", data);

        if (!data) {
            throw new Error("لم تصل بيانات من الخادم.");
        }

        adminFinanceData = data.payments || [];

        updateFinanceSummary(
            data.summary || {},
            data.paymentMethods || {}
        );

        renderFinanceTable();

    } catch (error) {

        console.error("FINANCE ERROR:", error);

        if (moduleView) {
            moduleView.innerHTML = `
                <div class="finance-admin-module">

                    <div class="finance-empty-state">

                        <div class="finance-empty-state-icon">
                            ⚠️
                        </div>

                        <div class="finance-empty-state-title">
                            تعذر تحميل البيانات المالية
                        </div>

                        <div class="finance-empty-state-text">
                            <strong>سبب الخطأ:</strong>
                            <br>
                            ${error.message || "خطأ غير معروف"}
                        </div>

                        <button
                            type="button"
                            class="module-refresh-btn"
                            onclick="renderFinanceModule()"
                        >
                            ↻ إعادة المحاولة
                        </button>

                    </div>

                </div>
            `;
        }
    }
}

function updateFinanceSummary(
    summary,
    paymentMethods
) {

    const formatMoney = value =>
        `${Number(value || 0).toLocaleString("ar-DZ")} دج`;


    const totalRevenue =
        document.getElementById(
            "financeTotalRevenue"
        );


    const paidAmount =
        document.getElementById(
            "financePaidAmount"
        );


    const pendingAmount =
        document.getElementById(
            "financePendingAmount"
        );


    const totalPayments =
        document.getElementById(
            "financeTotalPayments"
        );


    const cash =
        document.getElementById(
            "financeCash"
        );


    const card =
        document.getElementById(
            "financeCard"
        );


    const bank =
        document.getElementById(
            "financeBank"
        );


    if (totalRevenue) {

        totalRevenue.textContent =
            formatMoney(
                summary.totalRevenue
            );
    }


    if (paidAmount) {

        paidAmount.textContent =
            formatMoney(
                summary.paidAmount
            );
    }


    if (pendingAmount) {

        pendingAmount.textContent =
            formatMoney(
                summary.pendingAmount
            );
    }


    if (totalPayments) {

        totalPayments.textContent =
            Number(
                summary.totalPayments || 0
            ).toLocaleString("ar-DZ");
    }


    if (cash) {

        cash.textContent =
            formatMoney(
                paymentMethods.cash
            );
    }


    if (card) {

        card.textContent =
            formatMoney(
                paymentMethods.card
            );
    }


    if (bank) {

        bank.textContent =
            formatMoney(
                paymentMethods.bankTransfer
            );
    }
}


function renderFinanceTable() {

    const tbody =
        document.getElementById(
            "financeTableBody"
        );


    if (!tbody) {
        return;
    }


    const searchInput =
        document.getElementById(
            "financeSearchInput"
        );


    const statusFilter =
        document.getElementById(
            "financeStatusFilter"
        );


    const methodFilter =
        document.getElementById(
            "financeMethodFilter"
        );


    const search =
        (searchInput?.value || "")
            .trim()
            .toLowerCase();


    const selectedStatus =
        statusFilter?.value || "";


    const selectedMethod =
        methodFilter?.value || "";


    const filteredPayments =
        adminFinanceData.filter(payment => {

            const searchableText =
                [
                    payment.id,
                    payment.patient_name,
                    payment.treatment_name,
                    payment.payment_method_label,
                    payment.status_label,
                    payment.notes
                ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();


            const matchesSearch =
                !search ||
                searchableText.includes(search);


            const matchesStatus =
                !selectedStatus ||
                payment.status === selectedStatus;


            const matchesMethod =
                !selectedMethod ||
                payment.payment_method === selectedMethod;


            return (
                matchesSearch &&
                matchesStatus &&
                matchesMethod
            );
        });


    if (!filteredPayments.length) {

        tbody.innerHTML = `
            <tr>

                <td colspan="8">

                    <div class="empty-state">

                        <div class="empty-state-icon">
                            💰
                        </div>

                        <h3>
                            لا توجد عمليات دفع
                        </h3>

                        <p>
                            لا توجد عمليات مطابقة للبحث الحالي.
                        </p>

                    </div>

                </td>

            </tr>
        `;

        return;
    }


    tbody.innerHTML =
        filteredPayments
            .map(payment => {

                const statusClass =
                    payment.status === "paid"
                        ? "paid"
                        : "pending";


                const amount =
                    Number(
                        payment.amount || 0
                    ).toLocaleString("ar-DZ");


                return `

                    <tr>

                        <td>

                            <span class="finance-operation-id">
                                #${escapeHTML(
                                    String(payment.id)
                                )}
                            </span>

                        </td>


                        <td>

                            <div class="finance-patient-cell">

                                <div class="finance-patient-avatar">
                                    ${escapeHTML(
                                        (
                                            payment.patient_name ||
                                            "؟"
                                        )
                                        .trim()
                                        .charAt(0)
                                        .toUpperCase()
                                    )}
                                </div>

                                <strong>
                                    ${escapeHTML(
                                        payment.patient_name ||
                                        "غير معروف"
                                    )}
                                </strong>

                            </div>

                        </td>


                        <td>

                            ${escapeHTML(
                                payment.treatment_name ||
                                "غير مرتبط بعلاج"
                            )}

                        </td>


                        <td>

                            <strong class="finance-amount">
                                ${amount} دج
                            </strong>

                        </td>


                        <td>

                            <span class="finance-method">

                                ${escapeHTML(
                                    payment.payment_method_label ||
                                    "غير محدد"
                                )}

                            </span>

                        </td>


                        <td>

                            ${escapeHTML(
                                formatArabicDate(
                                    payment.payment_date
                                )
                            )}

                        </td>


                        <td>

                            <span
                                class="finance-status ${statusClass}"
                            >
                                ${escapeHTML(
                                    payment.status_label ||
                                    "-"
                                )}
                            </span>

                        </td>


                        <td>

                            <button
                                type="button"
                                class="finance-view-btn"
                                onclick="showFinanceDetails(${payment.id})"
                            >
                                عرض
                            </button>

                        </td>

                    </tr>

                `;
            })
            .join("");
}


function showFinanceDetails(paymentId) {

    const payment =
        adminFinanceData.find(
            item =>
                Number(item.id) ===
                Number(paymentId)
        );


    if (!payment) {
        return;
    }


    const details =
        document.getElementById(
            "financeDetails"
        );


    if (!details) {
        return;
    }


    details.style.display =
        "block";


    const amount =
        Number(
            payment.amount || 0
        ).toLocaleString("ar-DZ");


    details.innerHTML = `

        <div class="finance-details-header">

            <div>

                <span class="module-kicker">
                    تفاصيل العملية
                </span>

                <h3>
                    عملية الدفع #${escapeHTML(
                        String(payment.id)
                    )}
                </h3>

            </div>


            <button
                type="button"
                class="finance-close-details"
                onclick="closeFinanceDetails()"
            >
                إغلاق
            </button>

        </div>


        <div class="finance-details-grid">

            <div class="finance-detail-item">

                <span>
                    المريض
                </span>

                <strong>
                    ${escapeHTML(
                        payment.patient_name ||
                        "غير معروف"
                    )}
                </strong>

            </div>


            <div class="finance-detail-item">

                <span>
                    العلاج
                </span>

                <strong>
                    ${escapeHTML(
                        payment.treatment_name ||
                        "غير مرتبط بعلاج"
                    )}
                </strong>

            </div>


            <div class="finance-detail-item">

                <span>
                    المبلغ
                </span>

                <strong class="finance-detail-money">
                    ${amount} دج
                </strong>

            </div>


            <div class="finance-detail-item">

                <span>
                    طريقة الدفع
                </span>

                <strong>
                    ${escapeHTML(
                        payment.payment_method_label ||
                        "غير محدد"
                    )}
                </strong>

            </div>


            <div class="finance-detail-item">

                <span>
                    تاريخ الدفع
                </span>

                <strong>
                    ${escapeHTML(
                        formatArabicDate(
                            payment.payment_date
                        )
                    )}
                </strong>

            </div>


            <div class="finance-detail-item">

                <span>
                    الحالة
                </span>

                <strong>

                    <span
                        class="finance-status ${
                            payment.status === "paid"
                                ? "paid"
                                : "pending"
                        }"
                    >
                        ${escapeHTML(
                            payment.status_label ||
                            "-"
                        )}
                    </span>

                </strong>

            </div>


            <div class="finance-detail-item full">

                <span>
                    الملاحظات
                </span>

                <strong>
                    ${escapeHTML(
                        payment.notes ||
                        "لا توجد ملاحظات"
                    )}
                </strong>

            </div>

        </div>
    `;


    details.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}


function closeFinanceDetails() {

    const details =
        document.getElementById(
            "financeDetails"
        );


    if (details) {

        details.style.display =
            "none";

        details.innerHTML =
            "";
    }
}


// =========================================================
// ================= ADMIN — REPORTS =======================
// =========================================================

let adminReportsData = null;


// =========================================================
// LOAD REPORTS
// =========================================================

async function loadAdminReports() {

    try {

        const data =
            await apiRequest(
                `${API_BASE}/admin/reports`
            );

        if (!data) {

            throw new Error(
                "لم تصل بيانات التقارير من الخادم."
            );

        }

        adminReportsData = data;

        renderReportsContent();

    } catch (error) {

        console.error(
            "REPORTS ERROR:",
            error
        );

        if (!moduleContent) {
            return;
        }

        moduleContent.innerHTML = `

            <div
                class="reports-admin-module"
                dir="rtl"
            >

                <div class="reports-empty-state">

                    <div class="reports-empty-icon">
                        ⚠️
                    </div>

                    <div class="reports-empty-title">
                        تعذر تحميل التقارير
                    </div>

                    <div class="reports-empty-text">
                        ${escapeHTML(
                            error.message ||
                            "حدث خطأ غير معروف."
                        )}
                    </div>

                    <button
                        type="button"
                        class="module-refresh-btn"
                        onclick="renderReportsModule()"
                    >
                        ↻ إعادة المحاولة
                    </button>

                </div>

            </div>

        `;
    }
}


// =========================================================
// RENDER REPORTS MODULE
// =========================================================

function renderReportsModule() {

    if (!moduleContent) {
        return;
    }

    moduleContent.innerHTML = `

        <div
            class="reports-admin-module"
            dir="rtl"
        >

            <div class="reports-module-header">

                <div>

                    <div class="module-kicker">
                        التقارير الإدارية
                    </div>

                    <h2 class="reports-module-title">
                        تقرير العيادة
                    </h2>

                    <p class="reports-module-description">
                        ملخص شامل لحالة العيادة والمواعيد
                        والتشغيل والأطباء والوضع المالي.
                    </p>

                </div>

                <button
                    type="button"
                    class="module-refresh-btn"
                    id="reportsRefreshBtn"
                >
                    ↻ تحديث التقرير
                </button>

            </div>


            <div id="reportsContent">

                <div class="reports-loading">
                    جاري تحميل التقارير...
                </div>

            </div>

        </div>

    `;


    const refreshButton =
        document.getElementById(
            "reportsRefreshBtn"
        );

    if (refreshButton) {

        refreshButton.addEventListener(
            "click",
            loadAdminReports
        );

    }


    loadAdminReports();
}


// =========================================================
// RENDER REPORT CONTENT
// =========================================================

function renderReportsContent() {

    const container =
        document.getElementById(
            "reportsContent"
        );

    if (
        !container ||
        !adminReportsData
    ) {
        return;
    }


    const data =
        adminReportsData;

    const summary =
        data.summary || {};

    const operations =
        data.operations || {};

    const finance =
        data.finance || {};

    const paymentMethods =
        finance.paymentMethods || {};

    const doctors =
        Array.isArray(data.doctors)
            ? data.doctors
            : [];

    const reportStatus =
        data.reportStatus || {};


    container.innerHTML = `

        <!-- ========================================= -->
        <!-- TODAY SUMMARY -->
        <!-- ========================================= -->

        <section class="reports-section">

            <div class="reports-section-heading">

                <div>

                    <h3>
                        ملخص اليوم
                    </h3>

                    <p>
                        نظرة سريعة على أداء العيادة اليوم.
                    </p>

                </div>

            </div>


            <div class="reports-summary-grid">

                <div class="reports-summary-card">

                    <div class="reports-summary-icon">
                        👥
                    </div>

                    <div>

                        <span>
                            المرضى اليوم
                        </span>

                        <strong>
                            ${Number(
                                summary.patientsToday || 0
                            )}
                        </strong>

                    </div>

                </div>


                <div class="reports-summary-card">

                    <div class="reports-summary-icon">
                        📅
                    </div>

                    <div>

                        <span>
                            المواعيد
                        </span>

                        <strong>
                            ${Number(
                                summary.totalAppointments || 0
                            )}
                        </strong>

                    </div>

                </div>


                <div class="reports-summary-card">

                    <div class="reports-summary-icon">
                        ✓
                    </div>

                    <div>

                        <span>
                            المكتمل
                        </span>

                        <strong>
                            ${Number(
                                summary.completedPatients || 0
                            )}
                        </strong>

                    </div>

                </div>


                <div class="reports-summary-card">

                    <div class="reports-summary-icon">
                        ⏳
                    </div>

                    <div>

                        <span>
                            المنتظرون
                        </span>

                        <strong>
                            ${Number(
                                summary.waitingPatients || 0
                            )}
                        </strong>

                    </div>

                </div>


                <div class="reports-summary-card">

                    <div class="reports-summary-icon">
                        🩺
                    </div>

                    <div>

                        <span>
                            داخل الزيارة
                        </span>

                        <strong>
                            ${Number(
                                summary.patientsInVisit || 0
                            )}
                        </strong>

                    </div>

                </div>


                <div class="reports-summary-card">

                    <div class="reports-summary-icon">
                        💰
                    </div>

                    <div>

                        <span>
                            إيرادات اليوم
                        </span>

                        <strong>
                            ${Number(
                                summary.totalRevenue || 0
                            ).toLocaleString("ar-DZ")}
                            دج
                        </strong>

                    </div>

                </div>

            </div>

        </section>


        <!-- ========================================= -->
        <!-- DOCTORS REPORT -->
        <!-- ========================================= -->

        <section class="reports-section">

            <div class="reports-section-heading">

                <div>

                    <h3>
                        تقرير الأطباء
                    </h3>

                    <p>
                        الحضور والمواعيد وحالة المرضى لكل طبيب.
                    </p>

                </div>

            </div>


            <div class="reports-table-panel">

                <div class="table-wrapper">

                    <table>

                        <thead>

                            <tr>

                                <th>
                                    الطبيب
                                </th>

                                <th>
                                    التخصص
                                </th>

                                <th>
                                    الحضور
                                </th>

                                <th>
                                    المواعيد
                                </th>

                                <th>
                                    المكتمل
                                </th>

                                <th>
                                    الانتظار
                                </th>

                                <th>
                                    داخل الزيارة
                                </th>

                            </tr>

                        </thead>


                        <tbody>

                            ${
                                doctors.length > 0

                                ?

                                doctors.map(
                                    doctor => `

                                        <tr>

                                            <td>

                                                <strong>
                                                    ${escapeHTML(
                                                        doctor.name ||
                                                        "غير محدد"
                                                    )}
                                                </strong>

                                            </td>


                                            <td>
                                                ${escapeHTML(
                                                    doctor.specialty ||
                                                    "غير محدد"
                                                )}
                                            </td>


                                            <td>

                                                <span
                                                    class="report-status-badge
                                                    ${
                                                        doctor.work_status ===
                                                        "working"

                                                        ? "status-working"

                                                        : "status-not-started"
                                                    }"
                                                >

                                                    ${
                                                        doctor.work_status ===
                                                        "working"

                                                        ? "يعمل الآن"

                                                        : "لم يبدأ"
                                                    }

                                                </span>

                                            </td>


                                            <td>
                                                ${Number(
                                                    doctor.appointments || 0
                                                )}
                                            </td>


                                            <td>
                                                ${Number(
                                                    doctor.completed || 0
                                                )}
                                            </td>


                                            <td>
                                                ${Number(
                                                    doctor.waiting || 0
                                                )}
                                            </td>


                                            <td>
                                                ${Number(
                                                    doctor.in_visit || 0
                                                )}
                                            </td>

                                        </tr>

                                    `
                                ).join("")

                                :

                                `

                                    <tr>

                                        <td
                                            colspan="7"
                                            class="reports-table-empty"
                                        >
                                            لا توجد بيانات أطباء.
                                        </td>

                                    </tr>

                                `
                            }

                        </tbody>

                    </table>

                </div>

            </div>

        </section>


        <!-- ========================================= -->
        <!-- OPERATIONS REPORT -->
        <!-- ========================================= -->

        <section class="reports-section">

            <div class="reports-section-heading">

                <div>

                    <h3>
                        تقرير التشغيل
                    </h3>

                    <p>
                        حالة حركة المرضى والطابور خلال اليوم.
                    </p>

                </div>

            </div>


            <div class="reports-operations-grid">

                <div class="reports-operation-card">

                    <span>
                        إجمالي الطابور
                    </span>

                    <strong>
                        ${Number(
                            operations.total || 0
                        )}
                    </strong>

                </div>


                <div class="reports-operation-card">

                    <span>
                        انتظار
                    </span>

                    <strong>
                        ${Number(
                            operations.waiting || 0
                        )}
                    </strong>

                </div>


                <div class="reports-operation-card">

                    <span>
                        تم استدعاؤه
                    </span>

                    <strong>
                        ${Number(
                            operations.called || 0
                        )}
                    </strong>

                </div>


                <div class="reports-operation-card">

                    <span>
                        داخل الزيارة
                    </span>

                    <strong>
                        ${Number(
                            operations.inVisit || 0
                        )}
                    </strong>

                </div>


                <div class="reports-operation-card">

                    <span>
                        مكتمل
                    </span>

                    <strong>
                        ${Number(
                            operations.completed || 0
                        )}
                    </strong>

                </div>


                <div class="reports-operation-card">

                    <span>
                        غائب
                    </span>

                    <strong>
                        ${Number(
                            operations.absent || 0
                        )}
                    </strong>

                </div>


                <div class="reports-operation-card">

                    <span>
                        ملغى
                    </span>

                    <strong>
                        ${Number(
                            operations.cancelled || 0
                        )}
                    </strong>

                </div>

            </div>

        </section>


        <!-- ========================================= -->
        <!-- FINANCIAL REPORT -->
        <!-- ========================================= -->

        <section class="reports-section">

            <div class="reports-section-heading">

                <div>

                    <h3>
                        التقرير المالي
                    </h3>

                    <p>
                        ملخص المدفوعات والإيرادات وطرق الدفع.
                    </p>

                </div>

            </div>


            <div class="reports-finance-grid">

                <div class="reports-finance-card">

                    <span>
                        إجمالي الإيرادات
                    </span>

                    <strong>
                        ${Number(
                            finance.totalRevenue || 0
                        ).toLocaleString("ar-DZ")}
                        دج
                    </strong>

                </div>


                <div class="reports-finance-card">

                    <span>
                        المدفوع
                    </span>

                    <strong>
                        ${Number(
                            finance.paidAmount || 0
                        ).toLocaleString("ar-DZ")}
                        دج
                    </strong>

                </div>


                <div class="reports-finance-card">

                    <span>
                        المعلق
                    </span>

                    <strong>
                        ${Number(
                            finance.pendingAmount || 0
                        ).toLocaleString("ar-DZ")}
                        دج
                    </strong>

                </div>

            </div>


            <div class="reports-payment-methods">

                <div class="reports-payment-card">

                    <span>
                        💵 نقدًا
                    </span>

                    <strong>
                        ${Number(
                            paymentMethods.cash || 0
                        ).toLocaleString("ar-DZ")}
                        دج
                    </strong>

                </div>


                <div class="reports-payment-card">

                    <span>
                        💳 بطاقة
                    </span>

                    <strong>
                        ${Number(
                            paymentMethods.card || 0
                        ).toLocaleString("ar-DZ")}
                        دج
                    </strong>

                </div>


                <div class="reports-payment-card">

                    <span>
                        🏦 تحويل بنكي
                    </span>

                    <strong>
                        ${Number(
                            paymentMethods.bankTransfer || 0
                        ).toLocaleString("ar-DZ")}
                        دج
                    </strong>

                </div>

            </div>

        </section>


        <!-- ========================================= -->
        <!-- REPORT STATUS -->
        <!-- ========================================= -->

        <section class="reports-section">

            <div class="reports-section-heading">

                <div>

                    <h3>
                        حالة التقارير
                    </h3>

                    <p>
                        حالة التقارير المطلوبة للإدارة.
                    </p>

                </div>

            </div>


            <div class="reports-status-grid">

                <div class="reports-status-card">

                    <div>

                        <strong>
                            تقرير الأطباء
                        </strong>

                        <span>
                            ${
                                reportStatus.doctorReports ===
                                "ready"

                                ? "جاهز"

                                : "غير متوفر"
                            }
                        </span>

                    </div>

                    <div
                        class="
                            report-status-dot
                            ${
                                reportStatus.doctorReports ===
                                "ready"

                                ? "dot-ready"

                                : "dot-empty"
                            }
                        "
                    ></div>

                </div>


                <div class="reports-status-card">

                    <div>

                        <strong>
                            تقرير الاستقبال
                        </strong>

                        <span>
                            ${
                                reportStatus.receptionReport ===
                                "ready"

                                ? "جاهز"

                                : "غير متوفر"
                            }
                        </span>

                    </div>

                    <div
                        class="
                            report-status-dot
                            ${
                                reportStatus.receptionReport ===
                                "ready"

                                ? "dot-ready"

                                : "dot-empty"
                            }
                        "
                    ></div>

                </div>


                <div class="reports-status-card">

                    <div>

                        <strong>
                            التسوية المالية
                        </strong>

                        <span>
                            ${
                                reportStatus.financialHandover ===
                                "ready"

                                ? "جاهزة"

                                : "لا توجد بيانات اليوم"
                            }
                        </span>

                    </div>

                    <div
                        class="
                            report-status-dot
                            ${
                                reportStatus.financialHandover ===
                                "ready"

                                ? "dot-ready"

                                : "dot-empty"
                            }
                        "
                    ></div>

                </div>

            </div>

        </section>

    `;
}


// =========================================================
// ================= ADMIN — SETTINGS ======================
// =========================================================

let adminSettingsData = null;

async function loadAdminSettings() {
    try {
        const data = await apiRequest(
            `${API_BASE}/admin/settings`
        );

        if (!data) {
            throw new Error(
                "لم تصل بيانات الإعدادات من الخادم."
            );
        }

        adminSettingsData = data;

        renderSettingsContent();

    } catch (error) {

        console.error(
            "SETTINGS ERROR:",
            error
        );

        if (!moduleContent) {
            return;
        }

        moduleContent.innerHTML = `
            <div
                class="settings-admin-module"
                dir="rtl"
            >
                <div class="settings-empty-state">

                    <div class="settings-empty-icon">
                        ⚠️
                    </div>

                    <div class="settings-empty-title">
                        تعذر تحميل الإعدادات
                    </div>

                    <div class="settings-empty-text">
                        ${escapeHTML(
                            error.message ||
                            "حدث خطأ غير معروف."
                        )}
                    </div>

                    <button
                        type="button"
                        class="module-refresh-btn"
                        onclick="renderSettingsModule()"
                    >
                        ↻ إعادة المحاولة
                    </button>

                </div>
            </div>
        `;
    }
}


function renderSettingsModule() {

    if (!moduleContent) {
        return;
    }

    moduleContent.innerHTML = `
        <div
            class="settings-admin-module"
            dir="rtl"
        >

            <div class="settings-module-header">

                <div>

                    <div class="settings-kicker">
                        إعدادات النظام
                    </div>

                    <h2 class="settings-module-title">
                        إعدادات SmileCare
                    </h2>

                    <p class="settings-module-description">
                        إدارة معلومات العيادة وأوقات العمل
                        وبيانات المسؤول.
                    </p>

                </div>

                <button
                    type="button"
                    class="module-refresh-btn"
                    id="settingsRefreshBtn"
                >
                    ↻ تحديث
                </button>

            </div>

            <div id="settingsContent">

                <div class="settings-loading">
                    جاري تحميل الإعدادات...
                </div>

            </div>

        </div>
    `;

    const refreshButton =
        document.getElementById(
            "settingsRefreshBtn"
        );

    if (refreshButton) {

        refreshButton.addEventListener(
            "click",
            loadAdminSettings
        );

    }

    loadAdminSettings();
}


function renderSettingsContent() {

    const container =
        document.getElementById(
            "settingsContent"
        );

    if (
        !container ||
        !adminSettingsData
    ) {
        return;
    }

    const settings =
        adminSettingsData;

    container.innerHTML = `

        <form
            id="adminSettingsForm"
            class="settings-form"
            dir="rtl"
        >

            <!-- ================= CLINIC ================= -->

            <section class="settings-section">

                <div class="settings-section-heading">

                    <div class="settings-section-icon">
                        🏥
                    </div>

                    <div>

                        <h3>
                            معلومات العيادة
                        </h3>

                        <p>
                            المعلومات الأساسية التي تظهر
                            داخل نظام SmileCare.
                        </p>

                    </div>

                </div>

                <div class="settings-fields-grid">

                    <div class="settings-field">

                        <label for="settingsClinicName">
                            اسم العيادة
                        </label>

                        <input
                            type="text"
                            id="settingsClinicName"
                            value="${escapeHTML(
                                settings.clinic_name || ""
                            )}"
                            required
                        >

                    </div>

                    <div class="settings-field">

                        <label for="settingsClinicPhone">
                            رقم الهاتف
                        </label>

                        <input
                            type="text"
                            id="settingsClinicPhone"
                            value="${escapeHTML(
                                settings.clinic_phone || ""
                            )}"
                        >

                    </div>

                    <div
                        class="settings-field settings-field-full"
                    >

                        <label for="settingsClinicAddress">
                            عنوان العيادة
                        </label>

                        <input
                            type="text"
                            id="settingsClinicAddress"
                            value="${escapeHTML(
                                settings.clinic_address || ""
                            )}"
                        >

                    </div>

                </div>

            </section>


            <!-- ================= ADMIN ================= -->

            <section class="settings-section">

                <div class="settings-section-heading">

                    <div class="settings-section-icon">
                        👤
                    </div>

                    <div>

                        <h3>
                            بيانات المسؤول
                        </h3>

                        <p>
                            معلومات المسؤول المستخدمة
                            داخل النظام.
                        </p>

                    </div>

                </div>

                <div class="settings-fields-grid">

                    <div class="settings-field">

                        <label for="settingsUsername">
                            اسم المستخدم
                        </label>

                        <input
                            type="text"
                            id="settingsUsername"
                            value="${escapeHTML(
                                settings.username || ""
                            )}"
                            required
                        >

                    </div>

                    <div class="settings-field">

                        <label for="settingsEmail">
                            البريد الإلكتروني
                        </label>

                        <input
                            type="email"
                            id="settingsEmail"
                            value="${escapeHTML(
                                settings.email || ""
                            )}"
                        >

                    </div>

                </div>

            </section>


            <!-- ================= WORKING HOURS ================= -->

            <section class="settings-section">

                <div class="settings-section-heading">

                    <div class="settings-section-icon">
                        🕐
                    </div>

                    <div>

                        <h3>
                            أوقات العمل
                        </h3>

                        <p>
                            تحديد أيام وساعات عمل العيادة.
                        </p>

                    </div>

                </div>

                <div class="settings-fields-grid">

                    <div class="settings-field">

                        <label for="settingsWorkingDays">
                            أيام العمل
                        </label>

                        <input
                            type="text"
                            id="settingsWorkingDays"
                            value="${escapeHTML(
                                settings.working_days || ""
                            )}"
                        >

                        <small>
                            مثال: السبت - الخميس
                        </small>

                    </div>

                    <div class="settings-field">

                        <label for="settingsWorkingHours">
                            ساعات العمل
                        </label>

                        <input
                            type="text"
                            id="settingsWorkingHours"
                            value="${escapeHTML(
                                settings.working_hours || ""
                            )}"
                        >

                        <small>
                            مثال: 08:00 - 20:00
                        </small>

                    </div>

                </div>

            </section>


            <!-- ================= SYSTEM ================= -->

            <section class="settings-section">

                <div class="settings-section-heading">

                    <div class="settings-section-icon">
                        ⚙️
                    </div>

                    <div>

                        <h3>
                            حالة النظام
                        </h3>

                        <p>
                            معلومات تقنية مختصرة عن
                            إعدادات SmileCare.
                        </p>

                    </div>

                </div>

                <div class="settings-system-grid">

                    <div class="settings-system-card">

                        <span>
                            اسم النظام
                        </span>

                        <strong>
                            SmileCare
                        </strong>

                    </div>

                    <div class="settings-system-card">

                        <span>
                            حالة النظام
                        </span>

                        <strong class="settings-system-online">
                            ● يعمل بشكل طبيعي
                        </strong>

                    </div>

                    <div class="settings-system-card">

                        <span>
                            آخر تحديث
                        </span>

                        <strong>
                            ${
                                settings.updated_at
                                    ? formatArabicDate(
                                        settings.updated_at
                                    )
                                    : "غير متوفر"
                            }
                        </strong>

                    </div>

                </div>

            </section>


            <!-- ================= ACTIONS ================= -->

            <div class="settings-actions">

                <button
                    type="button"
                    class="settings-reset-btn"
                    id="settingsResetBtn"
                >
                    إعادة القيم
                </button>

                <button
                    type="submit"
                    class="settings-save-btn"
                >
                    💾 حفظ الإعدادات
                </button>

            </div>

            <div
                id="settingsSaveMessage"
                class="settings-save-message"
            ></div>

        </form>
    `;


    const form =
        document.getElementById(
            "adminSettingsForm"
        );

    const resetButton =
        document.getElementById(
            "settingsResetBtn"
        );

    if (form) {

        form.addEventListener(
            "submit",
            saveAdminSettings
        );

    }

    if (resetButton) {

        resetButton.addEventListener(
            "click",
            () => {

                renderSettingsContent();

            }
        );

    }
}


async function saveAdminSettings(event) {

    event.preventDefault();

    const message =
        document.getElementById(
            "settingsSaveMessage"
        );

    const saveButton =
        document.querySelector(
            ".settings-save-btn"
        );

    const data = {

        clinic_name:
            document.getElementById(
                "settingsClinicName"
            ).value.trim(),

        clinic_phone:
            document.getElementById(
                "settingsClinicPhone"
            ).value.trim(),

        clinic_address:
            document.getElementById(
                "settingsClinicAddress"
            ).value.trim(),

        username:
            document.getElementById(
                "settingsUsername"
            ).value.trim(),

        email:
            document.getElementById(
                "settingsEmail"
            ).value.trim(),

        working_days:
            document.getElementById(
                "settingsWorkingDays"
            ).value.trim(),

        working_hours:
            document.getElementById(
                "settingsWorkingHours"
            ).value.trim()

    };


    if (
        !data.clinic_name ||
        !data.username
    ) {

        if (message) {

            message.className =
                "settings-save-message error";

            message.textContent =
                "اسم العيادة واسم المستخدم مطلوبان.";

        }

        return;
    }


    try {

        if (saveButton) {

            saveButton.disabled = true;

            saveButton.textContent =
                "جاري الحفظ...";

        }


        const result =
            await apiRequest(
                `${API_BASE}/admin/settings`,
                {
                    method: "PUT",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify(data)
                }
            );


        if (
            !result ||
            result.success !== true
        ) {

            throw new Error(
                result?.message ||
                "تعذر حفظ الإعدادات."
            );

        }


        if (message) {

            message.className =
                "settings-save-message success";

            message.textContent =
                "✓ تم حفظ الإعدادات بنجاح.";

        }


        adminSettingsData = {
            ...adminSettingsData,
            ...data
        };


        setTimeout(
            () => {

                if (message) {
                    message.textContent = "";
                }

            },
            3000
        );


    } catch (error) {

        console.error(
            "SAVE SETTINGS ERROR:",
            error
        );

        if (message) {

            message.className =
                "settings-save-message error";

            message.textContent =
                error.message ||
                "حدث خطأ أثناء حفظ الإعدادات.";

        }

    } finally {

        if (saveButton) {

            saveButton.disabled = false;

            saveButton.textContent =
                "💾 حفظ الإعدادات";

        }

    }
}

/* =========================================================
   GENERIC MODULES
   ========================================================= */

function renderGenericModule(target) {

    const module =
        adminModules[target];

    if (!moduleContent || !module) {
        return;
    }

    moduleContent.innerHTML = `

        <div
            dir="rtl"
            style="
                width:100%;
                display:grid;
                grid-template-columns:repeat(3,minmax(0,1fr));
                gap:20px;
            "
        >

            <div class="module-card">

                <div class="module-card-icon">
                    ◈
                </div>

                <strong>
                    ${escapeHTML(module.title)}
                </strong>

                <span>
                    هذا القسم جاهز للتطوير.
                </span>

            </div>


            <div class="module-card">

                <div class="module-card-icon">
                    ◷
                </div>

                <strong>
                    إدارة القسم
                </strong>

                <span>
                    سيتم ربط الوظائف الإدارية الخاصة بهذا القسم.
                </span>

            </div>


            <div class="module-card">

                <div class="module-card-icon">
                    ✓
                </div>

                <strong>
                    حالة النظام
                </strong>

                <span>
                    النظام يعمل بشكل طبيعي.
                </span>

            </div>

        </div>
    `;
}

/* =========================================================
   SHOW MODULE
   ========================================================= */

function showAdminModule(target) {

    const module =
        adminModules[target];

    if (!module || !moduleView) {
        return;
    }

    setOverviewVisibility(false);

    moduleView.classList.remove("hidden");

    moduleView.style.display = "block";

    if (moduleKicker) {
        moduleKicker.textContent =
            module.kicker;
    }

    if (moduleTitle) {
        moduleTitle.textContent =
            module.title;
    }

    if (moduleDescription) {
        moduleDescription.textContent =
            module.description;
    }

    if (target === "doctors") {
    renderDoctorsModule();
} 

else if (target === "doctorLeaves") {
    renderDoctorLeavesModule();
}

else if (target === "staff") {
    renderStaffModule();

} 
else if (target === "patients") {
    renderPatientsModule();
}

else if (target === "appointments") {
    renderAppointmentsModule();

}

else if (target === "operations") {

    renderOperationsModule();

}

else if (target === "rooms") {
    renderRoomsModule();

}

else if (target === "finance") {
    renderFinanceModule();

}

else if (target === "reports") {

    renderReportsModule();

}

else if (target === "settings") {
    renderSettingsModule();
}

else {
    renderGenericModule(target);
}

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}

/* =========================================================
   NAVIGATION EVENTS
   ========================================================= */

document
    .querySelectorAll(".nav-item")
    .forEach(item => {

        item.addEventListener(
            "click",
            event => {

                event.preventDefault();

                const target =
                    item.dataset.target;

                if (!target) {
                    return;
                }

                document
                    .querySelectorAll(".nav-item")
                    .forEach(nav => {

                        nav.classList.remove(
                            "active"
                        );

                    });

                item.classList.add("active");

                if (target === "overview") {

                    showAdminOverview();

                    return;
                }

                showAdminModule(target);
            }
        );
    });

/* =========================================================
   LOGOUT
   ========================================================= */

if (logoutBtn) {

    logoutBtn.addEventListener(
        "click",
        () => {

            sessionStorage.removeItem(
                "smilecare_user"
            );

            localStorage.removeItem(
                "smilecare_user"
            );

            window.location.href =
                "../../index.html";
        }
    );
}

/* =========================================================
   CLOSE CLINIC DAY
   ========================================================= */

if (closeClinicDayBtn) {

    closeClinicDayBtn.addEventListener(
        "click",
        () => {

            if (closeClinicDayBtn.disabled) {
                return;
            }

            showToast(
                "info",
                "إغلاق يوم العيادة",
                "سيتم تفعيل عملية الإغلاق النهائية عند ربط جميع التقارير وعمليات التسليم."
            );
        }
    );
}

/* =========================================================
   AUTO REFRESH
   ========================================================= */

let dashboardRefreshTimer = null;


function startAutoRefresh() {

    if (dashboardRefreshTimer) {

        clearInterval(
            dashboardRefreshTimer
        );

    }

    dashboardRefreshTimer =
        setInterval(() => {

            const isModuleOpen =
                moduleView &&
                !moduleView.classList.contains("hidden") &&
                moduleView.style.display !== "none";

            if (!isModuleOpen) {

                loadDashboard();

            }

        }, 30000);
}

async function loadAdminHeaderSettings() {

    try {

        const settings = await apiRequest(
            `${API_BASE}/admin/settings`
        );

        if (adminName) {

            adminName.textContent =
                settings.username ||
                "المدير";
        }

    } catch (error) {

        console.error(
            "ADMIN HEADER SETTINGS ERROR:",
            error
        );

        const user =
            getCurrentUser();

        if (adminName) {

            adminName.textContent =
                user?.username ||
                user?.name ||
                "المدير";
        }
    }
}
/* =========================================================
   INITIALIZE
   ========================================================= */

(function initAdmin() {

    const user =
        checkAdminAccess();

    if (!user) {
        return;
    }

    if (adminName) {

        adminName.textContent =
            "جاري التحميل...";
    }

    updateDate();

    showAdminOverview();

    loadDashboard();

    loadAdminHeaderSettings();

    startAutoRefresh();

})();


// =====================================================
// DOCTOR EDIT / DELETE
// =====================================================


/*
 * فتح نموذج تعديل الطبيب
 */
function showDoctorEditForm(doctorId) {

    if (!moduleContent) {
        return;
    }

    const doctor =
        window.adminDoctorsList?.find(
            item =>
                Number(item.id) === Number(doctorId)
        );

    if (!doctor) {
        showToast(
            "خطأ",
            "لم يتم العثور على بيانات الطبيب.",
            "error"
        );
        return;
    }


    moduleContent.innerHTML = `

        <div
            dir="rtl"
            style="
                width:100%;
                background:#ffffff;
                border:1px solid #e5e7eb;
                border-radius:20px;
                padding:30px;
                box-sizing:border-box;
                box-shadow:0 8px 25px rgba(0,0,0,.05);
            "
        >

            <!-- HEADER -->

            <div
                style="
                    display:flex;
                    justify-content:space-between;
                    align-items:center;
                    gap:15px;
                    margin-bottom:28px;
                    flex-wrap:wrap;
                "
            >

                <div>

                    <div
                        style="
                            color:#2563eb;
                            font-size:13px;
                            font-weight:800;
                            margin-bottom:6px;
                        "
                    >
                        إدارة الأطباء
                    </div>

                    <h2
                        style="
                            margin:0 0 6px;
                            color:#1f2937;
                            font-size:25px;
                            font-weight:800;
                        "
                    >
                        ✏️ تعديل بيانات الطبيب
                    </h2>

                    <p
                        style="
                            margin:0;
                            color:#6b7280;
                            font-size:14px;
                        "
                    >
                        تعديل البيانات الأساسية للطبيب.
                    </p>

                </div>


                <button
                    type="button"
                    id="doctorEditBackBtn"
                    style="
                        border:0;
                        background:#f3f4f6;
                        color:#374151;
                        padding:11px 18px;
                        border-radius:10px;
                        cursor:pointer;
                        font-weight:700;
                    "
                >
                    ← العودة
                </button>

            </div>


            <!-- FORM -->

            <div
                style="
                    display:grid;
                    grid-template-columns:
                        repeat(auto-fit,minmax(250px,1fr));
                    gap:20px;
                "
            >

                <!-- First name -->

                <div>

                    <label
                        style="
                            display:block;
                            margin-bottom:8px;
                            color:#374151;
                            font-size:13px;
                            font-weight:700;
                        "
                    >
                        الاسم الأول *
                    </label>

                    <input
                        id="editDoctorFirstName"
                        type="text"
                        value="${escapeHTML(
                            doctor.first_name || ""
                        )}"
                        style="
                            width:100%;
                            padding:12px;
                            border:1px solid #d1d5db;
                            border-radius:10px;
                            box-sizing:border-box;
                            font-family:inherit;
                            outline:none;
                        "
                    >

                </div>


                <!-- Last name -->

                <div>

                    <label
                        style="
                            display:block;
                            margin-bottom:8px;
                            color:#374151;
                            font-size:13px;
                            font-weight:700;
                        "
                    >
                        اسم العائلة *
                    </label>

                    <input
                        id="editDoctorLastName"
                        type="text"
                        value="${escapeHTML(
                            doctor.last_name || ""
                        )}"
                        style="
                            width:100%;
                            padding:12px;
                            border:1px solid #d1d5db;
                            border-radius:10px;
                            box-sizing:border-box;
                            font-family:inherit;
                            outline:none;
                        "
                    >

                </div>


                <!-- Phone -->

                <div>

                    <label
                        style="
                            display:block;
                            margin-bottom:8px;
                            color:#374151;
                            font-size:13px;
                            font-weight:700;
                        "
                    >
                        رقم الهاتف
                    </label>

                    <input
                        id="editDoctorPhone"
                        type="text"
                        value="${escapeHTML(
                            doctor.phone || ""
                        )}"
                        style="
                            width:100%;
                            padding:12px;
                            border:1px solid #d1d5db;
                            border-radius:10px;
                            box-sizing:border-box;
                            font-family:inherit;
                            outline:none;
                            direction:ltr;
                            text-align:right;
                        "
                    >

                </div>


                <!-- Email -->

                <div>

                    <label
                        style="
                            display:block;
                            margin-bottom:8px;
                            color:#374151;
                            font-size:13px;
                            font-weight:700;
                        "
                    >
                        البريد الإلكتروني
                    </label>

                    <input
                        id="editDoctorEmail"
                        type="email"
                        value="${escapeHTML(
                            doctor.email || ""
                        )}"
                        style="
                            width:100%;
                            padding:12px;
                            border:1px solid #d1d5db;
                            border-radius:10px;
                            box-sizing:border-box;
                            font-family:inherit;
                            outline:none;
                        "
                    >

                </div>


                <!-- Specialty -->

                <div
                    style="
                        grid-column:
                            1 / -1;
                    "
                >

                    <label
                        style="
                            display:block;
                            margin-bottom:8px;
                            color:#374151;
                            font-size:13px;
                            font-weight:700;
                        "
                    >
                        التخصص
                    </label>

                    <input
                        id="editDoctorSpecialty"
                        type="text"
                        value="${escapeHTML(
                            doctor.specialty || ""
                        )}"
                        placeholder="مثال: طب الأسنان العام"
                        style="
                            width:100%;
                            padding:12px;
                            border:1px solid #d1d5db;
                            border-radius:10px;
                            box-sizing:border-box;
                            font-family:inherit;
                            outline:none;
                        "
                    >

                </div>

            </div>


            <!-- ACTIONS -->

            <div
                style="
                    display:flex;
                    gap:10px;
                    justify-content:flex-start;
                    margin-top:28px;
                    padding-top:22px;
                    border-top:1px solid #e5e7eb;
                    flex-wrap:wrap;
                "
            >

                <button
                    type="button"
                    id="saveDoctorEditBtn"
                    style="
                        border:0;
                        background:#2563eb;
                        color:#ffffff;
                        padding:12px 24px;
                        border-radius:10px;
                        cursor:pointer;
                        font-weight:800;
                        font-size:14px;
                    "
                >
                    💾 حفظ التعديلات
                </button>


                <button
                    type="button"
                    id="cancelDoctorEditBtn"
                    style="
                        border:0;
                        background:#f3f4f6;
                        color:#374151;
                        padding:12px 24px;
                        border-radius:10px;
                        cursor:pointer;
                        font-weight:700;
                        font-size:14px;
                    "
                >
                    إلغاء
                </button>

            </div>

        </div>

    `;


    /*
     * Back
     */

    const backButton =
        document.getElementById(
            "doctorEditBackBtn"
        );

    if (backButton) {

        backButton.addEventListener(
            "click",
            () => {

                renderDoctorsModule();

            }
        );

    }


    /*
     * Cancel
     */

    const cancelButton =
        document.getElementById(
            "cancelDoctorEditBtn"
        );

    if (cancelButton) {

        cancelButton.addEventListener(
            "click",
            () => {

                renderDoctorsModule();

            }
        );

    }


    /*
     * Save
     */

    const saveButton =
        document.getElementById(
            "saveDoctorEditBtn"
        );

    if (saveButton) {

        saveButton.addEventListener(
            "click",
            async () => {

                const firstName =
                    document
                        .getElementById(
                            "editDoctorFirstName"
                        )
                        ?.value
                        .trim();

                const lastName =
                    document
                        .getElementById(
                            "editDoctorLastName"
                        )
                        ?.value
                        .trim();

                const phone =
                    document
                        .getElementById(
                            "editDoctorPhone"
                        )
                        ?.value
                        .trim();

                const email =
                    document
                        .getElementById(
                            "editDoctorEmail"
                        )
                        ?.value
                        .trim();

                const specialty =
                    document
                        .getElementById(
                            "editDoctorSpecialty"
                        )
                        ?.value
                        .trim();


                if (!firstName || !lastName) {

                    showToast(
                        "تنبيه",
                        "الاسم الأول واسم العائلة مطلوبان.",
                        "error"
                    );

                    return;

                }


                saveButton.disabled = true;

                saveButton.innerHTML =
                    "⏳ جاري الحفظ...";


                try {

                    const result =
                        await apiRequest(
                            `${API_BASE}/dentists/${doctorId}`,
                            {
                                method:"PUT",

                                headers:{
                                    "Content-Type":
                                        "application/json"
                                },

                                body:
                                    JSON.stringify({

                                        first_name:
                                            firstName,

                                        last_name:
                                            lastName,

                                        phone:
                                            phone || null,

                                        email:
                                            email || null,

                                        specialty:
                                            specialty || null

                                    })
                            }
                        );


                    showToast(
                        "تم التعديل",
                        result.message ||
                            "تم تحديث بيانات الطبيب بنجاح.",
                        "success"
                    );


                    /*
                     * العودة للقائمة بعد الحفظ
                     */

                    setTimeout(
                        () => {

                            renderDoctorsModule();

                        },
                        500
                    );


                } catch (error) {

                    console.error(
                        "UPDATE DOCTOR ERROR:",
                        error
                    );

                    showToast(
                        "خطأ",
                        error.message ||
                            "تعذر تعديل بيانات الطبيب.",
                        "error"
                    );


                    saveButton.disabled = false;

                    saveButton.innerHTML =
                        "💾 حفظ التعديلات";

                }

            }
        );

    }

}


/*
 * حذف الطبيب
 */

async function deleteDoctor(
    doctorId,
    doctorName
) {

    const confirmed =
        confirm(
            `هل أنت متأكد من حذف الطبيب:\n\n${doctorName}\n\nسيتم حذف بيانات الطبيب، ولن يكون ذلك متاحًا إذا كان مرتبطًا بمواعيد.`
        );


    if (!confirmed) {
        return;
    }


    try {

        const result =
            await apiRequest(
                `${API_BASE}/dentists/${doctorId}`,
                {
                    method:"DELETE"
                }
            );


        showToast(
            "تم الحذف",
            result.message ||
                "تم حذف الطبيب بنجاح.",
            "success"
        );


        /*
         * تحديث القائمة
         */

        setTimeout(
            () => {

                renderDoctorsModule();

            },
            500
        );


    } catch (error) {

        console.error(
            "DELETE DOCTOR ERROR:",
            error
        );


        showToast(
            "تعذر حذف الطبيب",
            error.message ||
                "لا يمكن حذف الطبيب حاليًا.",
            "error"
        );

    }

}
