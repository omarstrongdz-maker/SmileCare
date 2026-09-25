const API_BASE = "https://smilecare-r68s.onrender.com/api";

// =====================================================
// RECEPTION USER
// =====================================================

const loggedInUser = JSON.parse(
    sessionStorage.getItem("smilecare_user") || "null"
);

if (
    !loggedInUser ||
    loggedInUser.role !== "receptionist"
) {
    window.location.href = "../index.html";
}

const employeeId = Number(loggedInUser.id);

// =====================================================
// DOM
// =====================================================

const todayDate = document.getElementById("todayDate");
const employeeName = document.getElementById("employeeName");

const workStatus = document.getElementById("workStatus");
const statusDot = document.getElementById("statusDot");
const workDayTitle = document.getElementById("workDayTitle");
const workDayMessage = document.getElementById("workDayMessage");
const startTimeText = document.getElementById("startTimeText");

const startWorkBtn = document.getElementById("startWorkBtn");
const endWorkBtn = document.getElementById("endWorkBtn");

const totalPatients = document.getElementById("totalPatients");
const waitingPatients = document.getElementById("waitingPatients");
const availableDoctors = document.getElementById("availableDoctors");
const waitingRoomStatus = document.getElementById("waitingRoomStatus");

const doctorsList = document.getElementById("doctorsList");

const queueTableBody = document.getElementById("queueTableBody");
const queueCount = document.getElementById("queueCount");

const appointmentsTableBody =
    document.getElementById("appointmentsTableBody");

const nextPatientBtn =
    document.getElementById("nextPatientBtn");

const newPatientBtn =
    document.getElementById("newPatientBtn");

const emergencyBtn =
    document.getElementById("emergencyBtn");

const appointmentsBtn =
    document.getElementById("appointmentsBtn");

const printTicketBtn =
    document.getElementById("printTicketBtn");

const searchPatientBtn =
    document.getElementById("searchPatientBtn");

const viewAllAppointmentsBtn =
    document.getElementById("viewAllAppointmentsBtn");

// =====================================================
// WALK-IN MODAL
// =====================================================

const walkInModal =
    document.getElementById("walkInModal");

const closeWalkInModal =
    document.getElementById("closeWalkInModal");

const cancelWalkInBtn =
    document.getElementById("cancelWalkInBtn");

const saveWalkInBtn =
    document.getElementById("saveWalkInBtn");

const walkInPatient =
    document.getElementById("walkInPatient");

const walkInDentist =
    document.getElementById("walkInDentist");

const walkInReason =
    document.getElementById("walkInReason");

const walkInPriority =
    document.getElementById("walkInPriority");

// =====================================================
// PATIENT SEARCH
// =====================================================

const searchPatientModal =
    document.getElementById("searchPatientModal");

const closeSearchPatientModal =
    document.getElementById("closeSearchPatientModal");

const searchPatientActionBtn =
    document.getElementById("searchPatientActionBtn");

const patientSearchInput =
    document.getElementById("patientSearchInput");

const patientSearchResults =
    document.getElementById("patientSearchResults");

// =====================================================
// DATA
// =====================================================

let currentData = null;

let currentQueue = [];
let currentAppointments = [];
let currentDoctors = [];

let isLoading = false;

// =====================================================
// INITIALIZATION
// =====================================================

document.addEventListener("DOMContentLoaded", () => {

    setTodayDate();
    startClock();

    // Load everything once
    loadReceptionData();

    // ---------------------------------------------
    // SEARCH
    // ---------------------------------------------

    if (searchPatientBtn) {
        searchPatientBtn.addEventListener(
            "click",
            openPatientSearch
        );
    }

    if (closeSearchPatientModal) {
        closeSearchPatientModal.addEventListener(
            "click",
            closePatientSearch
        );
    }

    if (searchPatientActionBtn) {
        searchPatientActionBtn.addEventListener(
            "click",
            searchPatients
        );
    }

    if (patientSearchInput) {
        patientSearchInput.addEventListener(
            "keydown",
            (event) => {
                if (event.key === "Enter") {
                    event.preventDefault();
                    searchPatients();
                }
            }
        );
    }

    if (searchPatientModal) {
        searchPatientModal.addEventListener(
            "click",
            (event) => {
                if (event.target === searchPatientModal) {
                    closePatientSearch();
                }
            }
        );
    }

    // ---------------------------------------------
    // EMERGENCY
    // ---------------------------------------------

    if (emergencyBtn) {
        emergencyBtn.addEventListener(
            "click",
            openEmergencyModal
        );
    }

    // ---------------------------------------------
    // WORK DAY
    // ---------------------------------------------

    if (startWorkBtn) {
        startWorkBtn.addEventListener(
            "click",
            startWorkDay
        );
    }

    if (endWorkBtn) {
        endWorkBtn.addEventListener(
            "click",
            endWorkDay
        );
    }

    // ---------------------------------------------
    // QUICK ACTIONS
    // ---------------------------------------------

    if (nextPatientBtn) {
        nextPatientBtn.addEventListener(
            "click",
            focusQueue
        );
    }

    if (newPatientBtn) {
        newPatientBtn.addEventListener(
            "click",
            openWalkInModal
        );
    }

    if (appointmentsBtn) {
        appointmentsBtn.addEventListener(
            "click",
            focusAppointments
        );
    }

    if (viewAllAppointmentsBtn) {
        viewAllAppointmentsBtn.addEventListener(
            "click",
            focusAppointments
        );
    }

    if (printTicketBtn) {
        printTicketBtn.addEventListener(
            "click",
            printLastTicket
        );
    }

    // ---------------------------------------------
    // WALK-IN MODAL
    // ---------------------------------------------

    if (closeWalkInModal) {
        closeWalkInModal.addEventListener(
            "click",
            closeWalkIn
        );
    }

    if (cancelWalkInBtn) {
        cancelWalkInBtn.addEventListener(
            "click",
            closeWalkIn
        );
    }

    if (saveWalkInBtn) {
        saveWalkInBtn.addEventListener(
            "click",
            registerWalkIn
        );
    }

    if (walkInModal) {
        walkInModal.addEventListener(
            "click",
            (event) => {
                if (event.target === walkInModal) {
                    closeWalkIn();
                }
            }
        );
    }

    // ---------------------------------------------
    // QUEUE EVENTS
    // ---------------------------------------------

    if (queueTableBody) {
        queueTableBody.addEventListener(
            "click",
            handleQueueTableClick
        );
    }

    // ---------------------------------------------
    // APPOINTMENT EVENTS
    // ---------------------------------------------

    if (appointmentsTableBody) {
        appointmentsTableBody.addEventListener(
            "click",
            handleAppointmentsTableClick
        );
    }
});

// =====================================================
// AUTO REFRESH
// =====================================================

setInterval(() => {

    if (!document.hidden) {
        loadReceptionData(true);
    }

}, 8000);

// =====================================================
// DATE
// =====================================================

function setTodayDate() {

    if (!todayDate) return;

    const now = new Date();

    const day =
        String(now.getDate()).padStart(2, "0");

    const month =
        String(now.getMonth() + 1).padStart(2, "0");

    const year =
        now.getFullYear();

    todayDate.textContent =
        `${day}/${month}/${year}`;
}

// =====================================================
// CLOCK
// =====================================================

function startClock() {

    updateClock();

    setInterval(
        updateClock,
        1000
    );
}

function updateClock() {

    const clockElement =
        document.getElementById("currentTime");

    if (!clockElement) return;

    const now = new Date();

    clockElement.textContent =
        now.toLocaleTimeString(
            "ar-DZ",
            {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit"
            }
        );
}

// =====================================================
// LOAD RECEPTION DATA
// =====================================================

async function loadReceptionData(isRefresh = false) {

    if (isLoading) return;

    isLoading = true;

    try {

        const response =
            await fetch(
                `${API_BASE}/reception/today/${employeeId}`
            );

        const data =
            await response.json();

        if (!response.ok) {

            throw new Error(
                data.message ||
                "تعذر تحميل بيانات الاستقبال."
            );
        }

        currentData = data;

        renderEmployee(data);
        renderWorkStatus(data);
        renderStatistics(data);

        await Promise.all([
            loadDoctors(),
            loadQueue(),
            loadAppointments()
        ]);

    } catch (error) {

        console.error(
            "RECEPTION LOAD ERROR:",
            error
        );

        if (!isRefresh) {

            showToast(
                "خطأ",
                error.message ||
                "تعذر الاتصال بالخادم."
            );
        }

    } finally {

        isLoading = false;
    }
}

// =====================================================
// EMPLOYEE
// =====================================================

function renderEmployee(data) {

    if (!employeeName) return;

    if (
        data.employee &&
        data.employee.username
    ) {

        employeeName.textContent =
            data.employee.username;

    } else {

        employeeName.textContent =
            "موظف الاستقبال";
    }
}

// =====================================================
// WORK STATUS
// =====================================================

function renderWorkStatus(data) {

    const workDay =
        data.work_day || null;

    // ---------------------------------------------
    // NO WORK DAY
    // ---------------------------------------------

    if (!workDay) {

        setWorkDayUI(
            "not_started",
            "لم يبدأ الدوام",
            "ابدأ يوم العمل",
            "اضغط على زر بدء العمل لتسجيل وقت حضورك."
        );

        if (startTimeText) {
            startTimeText.textContent = "";
        }

        return;
    }

    const status =
        workDay.status;

    // ---------------------------------------------
    // NOT STARTED
    // ---------------------------------------------

    if (status === "not_started") {

        setWorkDayUI(
            "not_started",
            "لم يبدأ الدوام",
            "ابدأ يوم العمل",
            "اضغط على زر بدء العمل لتسجيل وقت حضورك."
        );

        if (startTimeText) {
            startTimeText.textContent = "";
        }

        return;
    }

    // ---------------------------------------------
    // WORKING
    // ---------------------------------------------

    if (status === "working") {

        setWorkDayUI(
            "working",
            "يعمل الآن",
            "دوام الاستقبال نشط",
            "يمكنك الآن استقبال المرضى وإدارة المواعيد."
        );

        if (startTimeText) {

            startTimeText.textContent =
                "وقت البدء: " +
                formatDateTime(
                    workDay.start_time
                );
        }

        return;
    }

    // ---------------------------------------------
    // TEMPORARILY UNAVAILABLE
    // ---------------------------------------------

    if (
        status ===
        "temporarily_unavailable"
    ) {

        setWorkDayUI(
            "unavailable",
            "غير متاح مؤقتًا",
            "الاستقبال غير متاح مؤقتًا",
            "تم إيقاف استقبال المرضى مؤقتًا."
        );

        return;
    }

    // ---------------------------------------------
    // CLOSED
    // ---------------------------------------------

    if (status === "closed") {

        setWorkDayUI(
            "closed",
            "تم إغلاق الدوام",
            "تم إنهاء يوم العمل",
            "تم تسجيل وقت الانصراف لهذا اليوم."
        );

        if (startTimeText) {

            startTimeText.textContent =
                "وقت البدء: " +
                formatDateTime(
                    workDay.start_time
                );
        }
    }
}

// =====================================================
// WORK DAY UI
// =====================================================

function setWorkDayUI(
    status,
    statusText,
    title,
    message
) {

    if (workStatus) {
        workStatus.textContent =
            statusText;
    }

    if (workDayTitle) {
        workDayTitle.textContent =
            title;
    }

    if (workDayMessage) {
        workDayMessage.textContent =
            message;
    }

    if (status === "not_started") {

        if (startWorkBtn) {
            startWorkBtn.style.display =
                "inline-flex";
            startWorkBtn.disabled = false;
        }

        if (endWorkBtn) {
            endWorkBtn.style.display =
                "none";
        }

    } else if (status === "working") {

        if (startWorkBtn) {
            startWorkBtn.style.display =
                "none";
        }

        if (endWorkBtn) {
            endWorkBtn.style.display =
                "inline-flex";
            endWorkBtn.disabled = false;
        }

    } else if (status === "unavailable") {

        if (startWorkBtn) {
            startWorkBtn.style.display =
                "none";
        }

        if (endWorkBtn) {
            endWorkBtn.style.display =
                "inline-flex";
        }

    } else if (status === "closed") {

        if (startWorkBtn) {
            startWorkBtn.style.display =
                "none";
        }

        if (endWorkBtn) {
            endWorkBtn.style.display =
                "none";
        }
    }

    setStatus(
        status === "unavailable"
            ? "unavailable"
            : status
    );
}

// =====================================================
// STATUS DOT
// =====================================================

function setStatus(status) {

    if (!statusDot) return;

    statusDot.className =
        "status-dot";

    statusDot.classList.add(
        `status-${status}`
    );
}

// =====================================================
// STATISTICS
// =====================================================

function renderStatistics(data) {

    const stats =
        data.stats || {};

    if (totalPatients) {

        totalPatients.textContent =
            Number(stats.total || 0);
    }

    if (waitingPatients) {

        waitingPatients.textContent =
            Number(stats.waiting || 0);
    }

    if (waitingRoomStatus) {

        const waiting =
            Number(stats.waiting || 0);

        if (waiting === 0) {

            waitingRoomStatus.textContent =
                "هادئة";

        } else if (waiting < 5) {

            waitingRoomStatus.textContent =
                "طبيعية";

        } else {

            waitingRoomStatus.textContent =
                "مزدحمة";
        }
    }
}

// =====================================================
// START WORK DAY
// =====================================================

async function startWorkDay() {

    if (!startWorkBtn) return;

    startWorkBtn.disabled = true;

    startWorkBtn.innerHTML =
        `<span>⏳</span> جاري البدء...`;

    try {

        const response =
            await fetch(
                `${API_BASE}/reception-work/start`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type":
                            "application/json"
                    },
                    body: JSON.stringify({
                        user_id: employeeId
                    })
                }
            );

        const result =
            await response.json();

        if (!response.ok) {

            throw new Error(
                result.message ||
                "تعذر بدء الدوام."
            );
        }

        showToast(
            "تم بدء الدوام",
            "تم تسجيل وقت حضور موظف الاستقبال."
        );

        await loadReceptionData();

    } catch (error) {

        console.error(
            "START RECEPTION WORK ERROR:",
            error
        );

        showToast(
            "خطأ",
            error.message
        );

        startWorkBtn.disabled = false;

        startWorkBtn.innerHTML =
            `<span>▶</span> بدء العمل`;
    }
}

// =====================================================
// END WORK DAY
// =====================================================

async function endWorkDay() {

    if (!currentData) return;

    const workDay =
        currentData.work_day;

    if (
        !workDay ||
        workDay.status !== "working"
    ) {

        showToast(
            "تنبيه",
            "لا يوجد دوام نشط."
        );

        return;
    }

    // -------------------------------------------------
    // CHECK OPEN PATIENTS BEFORE CLOSING
    // -------------------------------------------------

    const openPatients =
        currentQueue.filter(
            item =>
                item.queue_status === "called" ||
                item.queue_status === "in_visit"
        );

    if (openPatients.length > 0) {

        showToast(
            "لا يمكن إنهاء الدوام",
            "يوجد مريض مستدعى أو قيد الزيارة. يجب إنهاء حالته أولًا."
        );

        return;
    }

    const confirmed =
        confirm(
            "هل أنت متأكد من رغبتك في إنهاء دوام الاستقبال؟"
        );

    if (!confirmed) return;

    if (endWorkBtn) {

        endWorkBtn.disabled = true;

        endWorkBtn.innerHTML =
            `<span>⏳</span> جاري الإنهاء...`;
    }

    try {

        const response =
            await fetch(
                `${API_BASE}/reception-work/end`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type":
                            "application/json"
                    },
                    body: JSON.stringify({
                        user_id: employeeId
                    })
                }
            );

        const result =
            await response.json();

        if (!response.ok) {

            throw new Error(
                result.message ||
                "تعذر إنهاء الدوام."
            );
        }

        showToast(
            "تم إنهاء الدوام",
            "تم تسجيل وقت الانصراف."
        );

        await loadReceptionData();

    } catch (error) {

        console.error(
            "END RECEPTION WORK ERROR:",
            error
        );

        showToast(
            "خطأ",
            error.message
        );

        if (endWorkBtn) {

            endWorkBtn.disabled = false;

            endWorkBtn.innerHTML =
                `<span>■</span> إنهاء الدوام`;
        }
    }
}

// =====================================================
// LOAD DOCTORS
// =====================================================

async function loadDoctors() {

    if (!doctorsList) return;

    try {

        const response =
            await fetch(
                `${API_BASE}/reception/doctors`
            );

        const result =
            await response.json();

        if (!response.ok) {

            throw new Error(
                result.message ||
                "تعذر تحميل الأطباء."
            );
        }

        const doctors =
            Array.isArray(result)
                ? result
                : (
                    result.dentists ||
                    result.doctors ||
                    []
                );

        currentDoctors = doctors;

        renderDoctors(doctors);

        if (availableDoctors) {

            const workingDoctors =
                doctors.filter(
                    doctor =>
                        doctor.work_status === "working"
                );

            availableDoctors.textContent =
                workingDoctors.length;
        }

    } catch (error) {

        console.error(
            "DOCTORS ERROR:",
            error
        );

        currentDoctors = [];

        if (doctorsList) {

            doctorsList.innerHTML = `
                <div class="empty-state">
                    <div>👨‍⚕️</div>
                    <p>تعذر تحميل الأطباء</p>
                </div>
            `;
        }

        if (availableDoctors) {
            availableDoctors.textContent = "0";
        }
    }
}

// =====================================================
// RENDER DOCTORS
// =====================================================

function renderDoctors(doctors) {

    if (!doctorsList) return;

    if (!doctors.length) {

        doctorsList.innerHTML = `
            <div class="empty-state">
                <div>👨‍⚕️</div>
                <p>لا يوجد أطباء</p>
            </div>
        `;

        return;
    }

    doctorsList.innerHTML =
        doctors.map(doctor => {

            const firstName =
                doctor.first_name || "";

            const lastName =
                doctor.last_name || "";

            const workStatus =
                doctor.work_status ||
                "not_started";

            let statusText =
                "لم يبدأ الدوام";

            let statusClass =
                "not-started";

            if (workStatus === "working") {

                statusText =
                    "متاح";

                statusClass =
                    "working";

            } else if (
                workStatus ===
                "temporarily_unavailable"
            ) {

                statusText =
                    "غير متاح مؤقتًا";

                statusClass =
                    "unavailable";

            } else if (
                workStatus === "closed"
            ) {

                statusText =
                    "انتهى الدوام";

                statusClass =
                    "closed";
            }

            return `
                <div class="doctor-card">

                    <div class="doctor-avatar">
                        👨‍⚕️
                    </div>

                    <div class="doctor-info">

                        <h3>
                            د.
                            ${escapeHtml(firstName)}
                            ${escapeHtml(lastName)}
                        </h3>

                        <p>
                            ${escapeHtml(
                                doctor.specialty ||
                                "طبيب أسنان"
                            )}
                        </p>

                    </div>

                    <div class="doctor-status">

                        <span
                            class="status-dot status-${statusClass}">
                        </span>

                        <span>
                            ${statusText}
                        </span>

                    </div>

                </div>
            `;

        }).join("");
}

// =====================================================
// LOAD QUEUE
// =====================================================

async function loadQueue() {

    if (!queueTableBody) return;

    try {

        const response =
            await fetch(
                `${API_BASE}/reception/queue`
            );

        const result =
            await response.json();

        if (!response.ok) {

            throw new Error(
                result.message ||
                "تعذر تحميل قائمة الانتظار."
            );
        }

        const queue =
            Array.isArray(result)
                ? result
                : (
                    result.queue ||
                    []
                );

        currentQueue = queue;

        renderQueue(queue);

    } catch (error) {

        console.error(
            "QUEUE ERROR:",
            error
        );

        currentQueue = [];

        queueTableBody.innerHTML = `
            <tr>
                <td colspan="7">

                    <div class="empty-table">

                        <div>⚠️</div>

                        <p>
                            تعذر تحميل قائمة الانتظار
                        </p>

                    </div>

                </td>
            </tr>
        `;

        if (queueCount) {
            queueCount.textContent = "0";
        }
    }
}

// =====================================================
// RENDER QUEUE
// =====================================================

function renderQueue(queue) {

    if (!queueTableBody) return;

    if (queueCount) {
        queueCount.textContent =
            queue.length;
    }

    if (!queue.length) {

        queueTableBody.innerHTML = `
            <tr>

                <td colspan="7">

                    <div class="empty-table">

                        <div>🪑</div>

                        <p>
                            لا يوجد مرضى في قائمة الانتظار
                        </p>

                    </div>

                </td>

            </tr>
        `;

        return;
    }

    queueTableBody.innerHTML =
        queue.map(patient => {

            const queueId =
                patient.queue_id ||
                patient.id;

            const queueStatus =
                patient.queue_status ||
                "waiting";

            let actionButton = "";

            // -----------------------------------------
            // WAITING
            // -----------------------------------------

            if (
                queueStatus === "waiting"
            ) {

                actionButton = `
                    <button
                        class="table-action"
                        type="button"
                        data-action="absent"
                        data-queue-id="${queueId}"
                    >
                        غياب
                    </button>
                `;

            // -----------------------------------------
            // OTHER STATES
            // -----------------------------------------

            } else {

                actionButton = `
                    <button
                        class="table-action"
                        type="button"
                        data-action="view-queue"
                        data-queue-id="${queueId}"
                    >
                        عرض
                    </button>
                `;
            }

            const patientName =
                `${patient.first_name || ""} ${patient.last_name || ""}`
                    .trim();

            const dentistName =
                patient.dentist_name ||
                `${patient.dentist_first_name || ""} ${patient.dentist_last_name || ""}`
                    .trim() ||
                "—";

            return `
                <tr>

                    <td>
                        <strong>
                            ${patient.queue_number ?? "--"}
                        </strong>
                    </td>

                    <td>
                        ${escapeHtml(
                            patientName
                        )}
                    </td>

                    <td>
                        د.
                        ${escapeHtml(
                            dentistName
                        )}
                    </td>

                    <td>
                        ${escapeHtml(
                            patient.reason ||
                            "استشارة"
                        )}
                    </td>

                    <td>
                        ${getQueueStatus(
                            queueStatus
                        )}
                    </td>

                    <td>
                        ${formatDateTime(
                            patient.arrived_at
                        )}
                    </td>

                    <td>
                        ${actionButton}
                    </td>

                </tr>
            `;

        }).join("");
}

// =====================================================
// QUEUE TABLE CLICK
// =====================================================

function handleQueueTableClick(event) {

    const button =
        event.target.closest(
            "button[data-action]"
        );

    if (!button) return;

    const action =
        button.dataset.action;

    const queueId =
        Number(
            button.dataset.queueId
        );

    if (!queueId) return;

    if (action === "absent") {

        markQueuePatientAbsent(
            queueId
        );

    } else if (
        action === "view-queue"
    ) {

        handleQueuePatient(
            queueId
        );
    }
}

// =====================================================
// MARK QUEUE PATIENT ABSENT
// =====================================================

async function markQueuePatientAbsent(
    queueId
) {

    if (!queueId) return;

    const patient =
        currentQueue.find(
            item =>
                Number(
                    item.queue_id || item.id
                ) === Number(queueId)
        );

    const patientName =
        patient
            ? `${patient.first_name || ""} ${patient.last_name || ""}`.trim()
            : "هذا المريض";

    const confirmed =
        confirm(
            `هل تريد تسجيل ${patientName || "هذا المريض"} كغائب؟`
        );

    if (!confirmed) return;

    try {

        const response =
            await fetch(
                `${API_BASE}/reception/queue/absent`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type":
                            "application/json"
                    },
                    body: JSON.stringify({
                        queue_id: queueId
                    })
                }
            );

        const result =
            await response.json();

        if (!response.ok) {

            throw new Error(
                result.message ||
                "تعذر تسجيل غياب المريض."
            );
        }

        showToast(
            "تم تسجيل الغياب",
            `${patientName || "المريض"} أصبح غائبًا.`
        );

        await refreshOperationalData();

    } catch (error) {

        console.error(
            "MARK ABSENT ERROR:",
            error
        );

        showToast(
            "خطأ",
            error.message ||
            "حدث خطأ أثناء تسجيل الغياب."
        );
    }
}

// =====================================================
// LOAD APPOINTMENTS
// =====================================================

async function loadAppointments() {

    if (!appointmentsTableBody) return;

    try {

        const response =
            await fetch(
                `${API_BASE}/reception/appointments`
            );

        const result =
            await response.json();

        if (!response.ok) {

            throw new Error(
                result.message ||
                "تعذر تحميل المواعيد."
            );
        }

        const appointments =
            Array.isArray(result)
                ? result
                : (
                    result.appointments ||
                    []
                );

        currentAppointments =
            appointments;

        renderAppointments(
            appointments
        );

    } catch (error) {

        console.error(
            "APPOINTMENTS ERROR:",
            error
        );

        currentAppointments = [];

        appointmentsTableBody.innerHTML = `
            <tr>

                <td colspan="7">

                    <div class="empty-table">

                        <div>⚠️</div>

                        <p>
                            تعذر تحميل المواعيد
                        </p>

                    </div>

                </td>

            </tr>
        `;
    }
}

// =====================================================
// RENDER APPOINTMENTS
// =====================================================

function renderAppointments(
    appointments
) {

    if (!appointmentsTableBody) return;

    if (!appointments.length) {

        appointmentsTableBody.innerHTML = `
            <tr>

                <td colspan="7">

                    <div class="empty-table">

                        <div>📅</div>

                        <p>
                            لا توجد مواعيد اليوم
                        </p>

                    </div>

                </td>

            </tr>
        `;

        return;
    }

    appointmentsTableBody.innerHTML =
        appointments.map(
            appointment => {

                const appointmentId =
                    appointment.appointment_id ||
                    appointment.id;

                const patientName =
                    appointment.patient_name ||
                    (
                        `${appointment.first_name || ""} ${appointment.last_name || ""}`
                    ).trim() ||
                    appointment.booking_name ||
                    "مريض";

                const dentistName =
                    appointment.dentist_name ||
                    (
                        `${appointment.dentist_first_name || ""} ${appointment.dentist_last_name || ""}`
                    ).trim() ||
                    "—";

                // -------------------------------------
                // IMPORTANT:
                // Queue status has priority.
                // -------------------------------------

                const queueStatus =
                    appointment.queue_status ||
                    null;

                const appointmentStatus =
                    appointment.appointment_status ||
                    appointment.status ||
                    null;

                const bookingStatus =
                    appointment.booking_status ||
                    null;

                let realStatus =
                    queueStatus ||
                    appointmentStatus ||
                    bookingStatus ||
                    "scheduled";

                let actionButton = "";

                // -------------------------------------
                // PATIENT ALREADY IN QUEUE
                // -------------------------------------

                if (
                    queueStatus === "waiting" ||
                    queueStatus === "called" ||
                    queueStatus === "in_visit" ||
                    queueStatus === "completed"
                ) {

                    actionButton = `
                        <button
                            class="table-action"
                            type="button"
                            data-action="view-appointment"
                            data-appointment-id="${appointmentId}"
                        >
                            عرض
                        </button>
                    `;

                // -------------------------------------
                // ABSENT
                // -------------------------------------

                } else if (
                    queueStatus === "absent"
                ) {

                    actionButton = `
                        <button
                            class="table-action"
                            type="button"
                            data-action="view-appointment"
                            data-appointment-id="${appointmentId}"
                        >
                            عرض
                        </button>
                    `;

                // -------------------------------------
                // CANCELLED
                // -------------------------------------

                } else if (
                    appointmentStatus === "cancelled" ||
                    bookingStatus === "cancelled"
                ) {

                    actionButton = `
                        <button
                            class="table-action"
                            type="button"
                            disabled
                        >
                            ملغى
                        </button>
                    `;

                // -------------------------------------
                // NOT ARRIVED YET
                // -------------------------------------

                } else {

                    actionButton = `
                        <button
                            class="table-action arrival-button"
                            type="button"
                            data-action="arrival"
                            data-appointment-id="${appointmentId}"
                            data-dentist-id="${appointment.dentist_id}"
                        >
                            تسجيل الوصول
                        </button>
                    `;
                }

                return `
                    <tr>

                        <td>
                            ${formatTime(
                                appointment.appointment_time
                            )}
                        </td>

                        <td>
                            ${escapeHtml(
                                patientName
                            )}
                        </td>

                        <td>
                            د.
                            ${escapeHtml(
                                dentistName
                            )}
                        </td>

                        <td>
                            ${escapeHtml(
                                appointment.reason ||
                                "استشارة"
                            )}
                        </td>

                        <td>
                            ${
                                appointment.booking_type === "online"
                                    ? "🌐 حجز إلكتروني"
                                    : "🏥 حجز العيادة"
                            }
                        </td>

                        <td>
                            ${getAppointmentStatus(
                                realStatus
                            )}
                        </td>

                        <td>
                            ${actionButton}
                        </td>

                    </tr>
                `;
            }
        ).join("");
}

// =====================================================
// APPOINTMENTS TABLE CLICK
// =====================================================

function handleAppointmentsTableClick(
    event
) {

    const button =
        event.target.closest(
            "button[data-action]"
        );

    if (!button) return;

    const action =
        button.dataset.action;

    const appointmentId =
        Number(
            button.dataset.appointmentId
        );

    if (!appointmentId) return;

    // ---------------------------------------------
    // REGISTER ARRIVAL
    // ---------------------------------------------

    if (action === "arrival") {

        const dentistId =
            Number(
                button.dataset.dentistId
            );

        registerArrival(
            appointmentId,
            dentistId
        );

        return;
    }

    // ---------------------------------------------
    // VIEW APPOINTMENT
    // ---------------------------------------------

    if (
        action ===
        "view-appointment"
    ) {

        handleAppointment(
            appointmentId
        );
    }
}

// =====================================================
// REGISTER PATIENT ARRIVAL
// =====================================================

async function registerArrival(
    appointmentId,
    dentistId
) {

    if (
        !appointmentId ||
        !dentistId
    ) {

        showToast(
            "خطأ",
            "بيانات الموعد غير مكتملة."
        );

        return;
    }

    const appointment =
        currentAppointments.find(
            item =>
                Number(
                    item.appointment_id ||
                    item.id
                ) === Number(
                    appointmentId
                )
        );

    const patientName =
        appointment
            ? (
                appointment.patient_name ||
                `${appointment.first_name || ""} ${appointment.last_name || ""}`
            ).trim()
            : "المريض";

    const confirmed =
        confirm(
            `هل تريد تسجيل وصول ${patientName || "المريض"}؟`
        );

    if (!confirmed) return;

    try {

        const response =
            await fetch(
                `${API_BASE}/queue/arrive`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type":
                            "application/json"
                    },
                    body: JSON.stringify({
                        appointment_id:
                            Number(
                                appointmentId
                            ),
                        dentist_id:
                            Number(
                                dentistId
                            )
                    })
                }
            );

        const result =
            await response.json();

        if (!response.ok) {

            throw new Error(
                result.message ||
                "تعذر تسجيل وصول المريض."
            );
        }

        const queue =
            result.queue ||
            result.data ||
            {};

        const queueNumber =
            queue.queue_number ??
            "--";

        showToast(
            "تم تسجيل الوصول",
            `${patientName || "المريض"} أصبح حاضرًا ورقم الانتظار ${queueNumber}.`
        );

        // -----------------------------------------
        // UPDATE EVERYTHING
        // -----------------------------------------

        await refreshOperationalData();

    } catch (error) {

        console.error(
            "REGISTER ARRIVAL ERROR:",
            error
        );

        showToast(
            "خطأ",
            error.message ||
            "تعذر تسجيل وصول المريض."
        );
    }
}

// =====================================================
// REFRESH OPERATIONAL DATA
// =====================================================

async function refreshOperationalData() {

    await Promise.all([
        loadReceptionData()
    ]);
}

// =====================================================
// WALK-IN PATIENT
// =====================================================

async function openWalkInModal() {

    if (!walkInModal) return;

    await Promise.all([
        loadWalkInPatients(),
        loadWalkInDentists()
    ]);

    if (walkInReason) {

        walkInReason.value = "";

        walkInReason.placeholder =
            "سبب الزيارة...";
    }

    if (walkInPriority) {

        walkInPriority.value =
            "normal";
    }

    walkInModal.classList.add(
        "show"
    );
}

// =====================================================
// CLOSE WALK-IN
// =====================================================

function closeWalkIn() {

    if (!walkInModal) return;

    walkInModal.classList.remove(
        "show"
    );
}

// =====================================================
// LOAD WALK-IN PATIENTS
// =====================================================

async function loadWalkInPatients() {

    if (!walkInPatient) return;

    try {

        const response =
            await fetch(
                `${API_BASE}/patients`
            );

        const result =
            await response.json();

        if (!response.ok) {

            throw new Error(
                result.message ||
                "تعذر تحميل المرضى."
            );
        }

        const patients =
            Array.isArray(result)
                ? result
                : (
                    result.patients ||
                    []
                );

        walkInPatient.innerHTML = `
            <option value="">
                اختر المريض
            </option>
        `;

        patients.forEach(
            patient => {

                const name =
                    `${patient.first_name || ""} ${patient.last_name || ""}`
                        .trim();

                walkInPatient.innerHTML += `
                    <option value="${patient.id}">
                        ${escapeHtml(name)}
                        — رقم ${patient.id}
                    </option>
                `;
            }
        );

    } catch (error) {

        console.error(
            "WALK-IN PATIENTS ERROR:",
            error
        );

        showToast(
            "خطأ",
            "تعذر تحميل قائمة المرضى."
        );
    }
}

// =====================================================
// LOAD WALK-IN DENTISTS
// =====================================================

async function loadWalkInDentists() {

    if (!walkInDentist) return;

    try {

        const response =
            await fetch(
                `${API_BASE}/reception/doctors`
            );

        const result =
            await response.json();

        if (!response.ok) {

            throw new Error(
                result.message ||
                "تعذر تحميل الأطباء."
            );
        }

        const doctors =
            Array.isArray(result)
                ? result
                : (
                    result.dentists ||
                    result.doctors ||
                    []
                );

        walkInDentist.innerHTML = `
            <option value="">
                اختر الطبيب
            </option>
        `;

        doctors.forEach(
            doctor => {

                const name =
                    `${doctor.first_name || ""} ${doctor.last_name || ""}`
                        .trim();

                walkInDentist.innerHTML += `
                    <option value="${doctor.id}">
                        د. ${escapeHtml(name)}
                    </option>
                `;
            }
        );

    } catch (error) {

        console.error(
            "WALK-IN DOCTORS ERROR:",
            error
        );

        showToast(
            "خطأ",
            "تعذر تحميل قائمة الأطباء."
        );
    }
}

// =====================================================
// REGISTER WALK-IN
// =====================================================

async function registerWalkIn() {

    if (
        !walkInPatient ||
        !walkInDentist
    ) {
        return;
    }

    const patientId =
        Number(
            walkInPatient.value
        );

    const dentistId =
        Number(
            walkInDentist.value
        );

    const reason =
        walkInReason
            ? walkInReason.value.trim()
            : "";

    const priority =
        walkInPriority
            ? walkInPriority.value
            : "normal";

    if (!patientId) {

        showToast(
            "تنبيه",
            "اختر المريض أولًا."
        );

        return;
    }

    if (!dentistId) {

        showToast(
            "تنبيه",
            "اختر الطبيب أولًا."
        );

        return;
    }

    if (saveWalkInBtn) {

        saveWalkInBtn.disabled = true;

        saveWalkInBtn.innerHTML =
            "⏳ جاري التسجيل...";
    }

    try {

        const response =
            await fetch(
                `${API_BASE}/reception/walk-in`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type":
                            "application/json"
                    },
                    body: JSON.stringify({

                        patient_id:
                            patientId,

                        dentist_id:
                            dentistId,

                        reason:
                            reason ||
                            "زيارة بدون موعد",

                        priority:
                            priority

                    })
                }
            );

        const result =
            await response.json();

        if (!response.ok) {

            throw new Error(
                result.message ||
                "تعذر تسجيل المريض."
            );
        }

        const queue =
            result.queue ||
            result.data ||
            {};

        const patientName =
            queue.patient_name ||
            "المريض";

        const queueNumber =
            queue.queue_number ??
            "--";

        closeWalkIn();

        showToast(
            "تم تسجيل المريض",
            `تم إدخال ${patientName} إلى قائمة الانتظار رقم ${queueNumber}.`
        );

        await refreshOperationalData();

    } catch (error) {

        console.error(
            "REGISTER WALK-IN ERROR:",
            error
        );

        showToast(
            "خطأ",
            error.message ||
            "تعذر تسجيل المريض."
        );

    } finally {

        if (saveWalkInBtn) {

            saveWalkInBtn.disabled =
                false;

            saveWalkInBtn.innerHTML =
                "🟢 تسجيل الوصول";
        }
    }
}

// =====================================================
// EMERGENCY
// =====================================================

async function openEmergencyModal() {

    if (!walkInModal) return;

    await Promise.all([
        loadWalkInPatients(),
        loadWalkInDentists()
    ]);

    if (walkInReason) {

        walkInReason.value = "";

        walkInReason.placeholder =
            "مثال: ألم شديد، نزيف، إصابة...";
    }

    if (walkInPriority) {

        walkInPriority.value =
            "emergency";
    }

    walkInModal.classList.add(
        "show"
    );
}

// =====================================================
// PATIENT SEARCH
// =====================================================

function openPatientSearch() {

    if (!searchPatientModal) return;

    searchPatientModal.classList.add(
        "show"
    );

    if (patientSearchInput) {

        patientSearchInput.value = "";

        setTimeout(
            () => {

                patientSearchInput.focus();

            },
            100
        );
    }

    if (patientSearchResults) {

        patientSearchResults.innerHTML = `
            <div class="search-empty">

                <div>🔍</div>

                <p>
                    اكتب اسم المريض أو الهاتف أو رقم الملف
                </p>

            </div>
        `;
    }
}

// =====================================================
// CLOSE PATIENT SEARCH
// =====================================================

function closePatientSearch() {

    if (!searchPatientModal) return;

    searchPatientModal.classList.remove(
        "show"
    );
}

// =====================================================
// SEARCH PATIENTS
// =====================================================

async function searchPatients() {

    if (
        !patientSearchInput ||
        !patientSearchResults
    ) {
        return;
    }

    const search =
        patientSearchInput.value.trim();

    if (!search) {

        patientSearchResults.innerHTML = `
            <div class="search-empty">

                <div>⚠️</div>

                <p>
                    اكتب شيئًا للبحث
                </p>

            </div>
        `;

        return;
    }

    patientSearchResults.innerHTML = `
        <div class="search-empty">

            <div>⏳</div>

            <p>
                جاري البحث...
            </p>

        </div>
    `;

    try {

        const response =
            await fetch(
                `${API_BASE}/patients`
            );

        const result =
            await response.json();

        if (!response.ok) {

            throw new Error(
                result.message ||
                "تعذر تحميل المرضى."
            );
        }

        const patients =
            Array.isArray(result)
                ? result
                : (
                    result.patients ||
                    []
                );

        const query =
            search.toLowerCase();

        const matches =
            patients.filter(
                patient => {

                    const id =
                        String(
                            patient.id ||
                            ""
                        );

                    const firstName =
                        String(
                            patient.first_name ||
                            ""
                        );

                    const lastName =
                        String(
                            patient.last_name ||
                            ""
                        );

                    const phone =
                        String(
                            patient.phone ||
                            ""
                        );

                    const fullName =
                        `${firstName} ${lastName}`
                            .trim();

                    return (

                        id.includes(query) ||

                        firstName
                            .toLowerCase()
                            .includes(query) ||

                        lastName
                            .toLowerCase()
                            .includes(query) ||

                        fullName
                            .toLowerCase()
                            .includes(query) ||

                        phone.includes(query)

                    );
                }
            );

        renderPatientSearchResults(
            matches
        );

    } catch (error) {

        console.error(
            "PATIENT SEARCH ERROR:",
            error
        );

        patientSearchResults.innerHTML = `
            <div class="search-empty">

                <div>❌</div>

                <p>
                    تعذر تنفيذ البحث.
                </p>

            </div>
        `;
    }
}

// =====================================================
// RENDER PATIENT SEARCH RESULTS
// =====================================================

function renderPatientSearchResults(
    patients
) {

    if (!patientSearchResults) return;

    if (!patients.length) {

        patientSearchResults.innerHTML = `
            <div class="search-empty">

                <div>😕</div>

                <p>
                    لم يتم العثور على المريض
                </p>

            </div>
        `;

        return;
    }

    patientSearchResults.innerHTML =
        patients.map(
            patient => {

                const name =
                    `${patient.first_name || ""} ${patient.last_name || ""}`
                        .trim();

                const phone =
                    patient.phone ||
                    "لا يوجد هاتف";

                return `
                    <div class="patient-result-card">

                        <div class="patient-result-info">

                            <div class="patient-result-avatar">
                                👤
                            </div>

                            <div>

                                <h3>
                                    ${escapeHtml(name)}
                                </h3>

                                <p>
                                    ملف #${patient.id}
                                    &nbsp; • &nbsp;
                                    ${escapeHtml(phone)}
                                </p>

                            </div>

                        </div>

                        <div class="patient-result-actions">

                            <button
                                class="patient-view-btn"
                                type="button"
                                onclick="viewPatientFromSearch(${patient.id})"
                            >
                                👁 عرض الملف
                            </button>

                        </div>

                    </div>
                `;
            }
        ).join("");
}

// =====================================================
// VIEW PATIENT FROM SEARCH
// =====================================================

async function viewPatientFromSearch(
    patientId
) {

    try {

        const response =
            await fetch(
                `${API_BASE}/patients/${patientId}`
            );

        const result =
            await response.json();

        if (!response.ok) {

            throw new Error(
                result.message ||
                "تعذر تحميل ملف المريض."
            );
        }

        const patient =
            result.patient ||
            result;

        const name =
            `${patient.first_name || ""} ${patient.last_name || ""}`
                .trim();

        const phone =
            patient.phone ||
            "لا يوجد";

        closePatientSearch();

        alert(
            `ملف المريض\n\n` +
            `👤 الاسم: ${name || "—"}\n` +
            `🔢 رقم الملف: ${patient.id}\n` +
            `📞 الهاتف: ${phone}\n` +
            `📧 البريد: ${patient.email || "—"}`
        );

    } catch (error) {

        console.error(
            "VIEW PATIENT ERROR:",
            error
        );

        showToast(
            "تنبيه",
            "تعذر فتح ملف المريض."
        );
    }
}

// =====================================================
// VIEW QUEUE PATIENT
// =====================================================

async function handleQueuePatient(
    queueId
) {

    if (!queueId) return;

    try {

        const patient =
            currentQueue.find(
                item =>
                    Number(
                        item.queue_id ||
                        item.id
                    ) ===
                    Number(queueId)
            );

        if (!patient) {

            throw new Error(
                "لم يتم العثور على المريض."
            );
        }

        const patientName =
            `${patient.first_name || ""} ${patient.last_name || ""}`
                .trim();

        const doctorName =
            patient.dentist_name ||
            `${patient.dentist_first_name || ""} ${patient.dentist_last_name || ""}`
                .trim() ||
            "—";

        alert(
            `معلومات المريض\n\n` +

            `👤 المريض: ${patientName || "—"}\n` +

            `📞 الهاتف: ${patient.phone || "—"}\n` +

            `🦷 الطبيب: د. ${doctorName}\n` +

            `🔢 رقم الانتظار: ${patient.queue_number ?? "—"}\n` +

            `📋 السبب: ${patient.reason || "استشارة"}\n` +

            `📌 الحالة: ${getQueueStatusText(
                patient.queue_status
            )}`
        );

    } catch (error) {

        console.error(
            "VIEW QUEUE PATIENT ERROR:",
            error
        );

        showToast(
            "تنبيه",
            error.message ||
            "تعذر عرض معلومات المريض."
        );
    }
}

// =====================================================
// APPOINTMENT ACTION
// =====================================================

function handleAppointment(
    appointmentId
) {

    const appointment =
        currentAppointments.find(
            item =>
                Number(
                    item.appointment_id ||
                    item.id
                ) ===
                Number(appointmentId)
        );

    if (!appointment) {

        showToast(
            "تنبيه",
            "لم يتم العثور على الموعد."
        );

        return;
    }

    const patientName =
        appointment.patient_name ||
        `${appointment.first_name || ""} ${appointment.last_name || ""}`
            .trim() ||
        appointment.booking_name ||
        "مريض";

    const dentistName =
        appointment.dentist_name ||
        `${appointment.dentist_first_name || ""} ${appointment.dentist_last_name || ""}`
            .trim() ||
        "—";

    const queueStatus =
        appointment.queue_status ||
        appointment.appointment_status ||
        appointment.booking_status ||
        "scheduled";

    alert(
        `معلومات الموعد\n\n` +

        `👤 المريض: ${patientName}\n` +

        `🕐 الموعد: ${formatTime(
            appointment.appointment_time
        )}\n` +

        `🦷 الطبيب: د. ${dentistName}\n` +

        `📋 السبب: ${
            appointment.reason ||
            "استشارة"
        }\n` +

        `📌 الحالة: ${getAppointmentStatusText(
            queueStatus
        )}\n` +

        `🔢 رقم الموعد: ${
            appointment.appointment_id ||
            appointment.id
        }`
    );
}

// =====================================================
// QUEUE STATUS TEXT
// =====================================================

function getQueueStatusText(
    status
) {

    const statuses = {

        waiting:
            "في الانتظار",

        called:
            "تم الاستدعاء",

        in_visit:
            "داخل الطبيب",

        completed:
            "مكتمل",

        cancelled:
            "ملغى",

        absent:
            "غائب"
    };

    return (
        statuses[status] ||
        "غير معروف"
    );
}

// =====================================================
// QUEUE STATUS DISPLAY
// =====================================================

function getQueueStatus(
    status
) {

    switch (status) {

        case "waiting":
            return "🟡 ينتظر";

        case "called":
            return "🔵 مستدعى";

        case "in_visit":
            return "🟢 قيد الزيارة";

        case "completed":
            return "✅ مكتمل";

        case "cancelled":
            return "🔴 ملغى";

        case "absent":
            return "⚫ غائب";

        default:
            return "—";
    }
}

// =====================================================
// APPOINTMENT STATUS TEXT
// =====================================================

function getAppointmentStatusText(
    status
) {

    switch (status) {

        case "waiting":
            return "حاضر";

        case "called":
            return "تم الاستدعاء";

        case "in_visit":
            return "قيد الزيارة";

        case "completed":
            return "مكتمل";

        case "absent":
            return "غائب";

        case "cancelled":
            return "ملغى";

        case "pending":
            return "قيد الانتظار";

        case "confirmed":
        case "scheduled":
            return "محجوز";

        default:
            return "محجوز";
    }
}

// =====================================================
// APPOINTMENT STATUS DISPLAY
// =====================================================

function getAppointmentStatus(
    status
) {

    switch (status) {

        case "waiting":
            return "🟡 حاضر";

        case "called":
            return "🔵 مستدعى";

        case "in_visit":
            return "🟢 قيد الزيارة";

        case "completed":
            return "✅ مكتمل";

        case "absent":
            return "⚫ غائب";

        case "cancelled":
            return "🔴 ملغى";

        case "pending":
            return "🟠 قيد الانتظار";

        case "confirmed":
        case "scheduled":
            return "📅 محجوز";

        default:
            return "📅 محجوز";
    }
}

// =====================================================
// FOCUS QUEUE
// =====================================================

function focusQueue() {

    const section =
        document.querySelector(
            ".queue-section"
        );

    if (!section) return;

    section.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}

// =====================================================
// FOCUS APPOINTMENTS
// =====================================================

function focusAppointments() {

    const section =
        document.querySelector(
            ".appointments-section"
        );

    if (!section) return;

    section.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}

// =====================================================
// PRINT LAST TICKET
// =====================================================

function printLastTicket() {

    const latest =
        currentQueue.length
            ? currentQueue[
                currentQueue.length - 1
            ]
            : null;

    if (!latest) {

        showToast(
            "طباعة البطاقة",
            "لا توجد بطاقة حجز متاحة للطباعة."
        );

        return;
    }

    const patientName =
        `${latest.first_name || ""} ${latest.last_name || ""}`
            .trim();

    const doctorName =
        latest.dentist_name ||
        `${latest.dentist_first_name || ""} ${latest.dentist_last_name || ""}`
            .trim() ||
        "—";

    const ticketWindow =
        window.open(
            "",
            "_blank",
            "width=400,height=600"
        );

    if (!ticketWindow) {

        showToast(
            "تنبيه",
            "المتصفح منع نافذة الطباعة."
        );

        return;
    }

    ticketWindow.document.write(`
        <!DOCTYPE html>

        <html lang="ar" dir="rtl">

        <head>

            <meta charset="UTF-8">

            <title>
                بطاقة الانتظار
            </title>

            <style>

                body {
                    font-family: Arial, sans-serif;
                    text-align: center;
                    padding: 30px;
                }

                h1 {
                    margin-bottom: 10px;
                }

                .number {
                    font-size: 64px;
                    font-weight: bold;
                    margin: 25px 0;
                }

                .info {
                    margin: 10px 0;
                }

            </style>

        </head>

        <body>

            <h1>
                🦷 SmileCare
            </h1>

            <h2>
                بطاقة الانتظار
            </h2>

            <div class="number">
                ${latest.queue_number ?? "--"}
            </div>

            <div class="info">
                👤 ${escapeHtml(patientName)}
            </div>

            <div class="info">
                🦷 د. ${escapeHtml(doctorName)}
            </div>

            <div class="info">
                📋 ${escapeHtml(
                    latest.reason ||
                    "استشارة"
                )}
            </div>

            <script>

                window.onload = function() {

                    window.print();

                };

            <\/script>

        </body>

        </html>
    `);

    ticketWindow.document.close();
}

// =====================================================
// HELPERS
// =====================================================

function formatDateTime(
    value
) {

    if (!value) {
        return "--";
    }

    const date =
        new Date(value);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return String(value);
    }

    return date.toLocaleTimeString(
        "ar-DZ",
        {
            hour: "2-digit",
            minute: "2-digit"
        }
    );
}

// =====================================================
// FORMAT TIME
// =====================================================

function formatTime(
    value
) {

    if (!value) {
        return "--";
    }

    return String(value)
        .substring(0, 5);
}

// =====================================================
// ESCAPE HTML
// =====================================================

function escapeHtml(
    value
) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";
    }

    return String(value)
        .replaceAll(
            "&",
            "&amp;"
        )
        .replaceAll(
            "<",
            "&lt;"
        )
        .replaceAll(
            ">",
            "&gt;"
        )
        .replaceAll(
            '"',
            "&quot;"
        )
        .replaceAll(
            "'",
            "&#039;"
        );
}

// =====================================================
// TOAST
// =====================================================

function showToast(
    title,
    message
) {

    const toast =
        document.getElementById(
            "toast"
        );

    const toastTitle =
        document.getElementById(
            "toastTitle"
        );

    const toastMessage =
        document.getElementById(
            "toastMessage"
        );

    if (!toast) return;

    if (toastTitle) {

        toastTitle.textContent =
            title;
    }

    if (toastMessage) {

        toastMessage.textContent =
            message;
    }

    toast.classList.add(
        "show"
    );

    setTimeout(
        () => {

            toast.classList.remove(
                "show"
            );

        },
        3500
    );
}

// =====================================================
// GLOBAL FUNCTIONS
// =====================================================
// Keep these available for buttons/functions
// that may still exist in the HTML.

window.markQueuePatientAbsent =
    markQueuePatientAbsent;

window.handleQueuePatient =
    handleQueuePatient;

window.handleAppointment =
    handleAppointment;

window.registerArrival =
    registerArrival;

window.viewPatientFromSearch =
    viewPatientFromSearch;

window.openWalkInModal =
    openWalkInModal;

window.closeWalkIn =
    closeWalkIn;

window.registerWalkIn =
    registerWalkIn;

window.openEmergencyModal =
    openEmergencyModal;
