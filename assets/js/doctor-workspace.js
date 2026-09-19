/* =========================================================
   SMILECARE - DOCTOR WORKSPACE
========================================================= */


/* =========================================================
   CONFIGURATION
========================================================= */

const API_BASE = "http://localhost:3000/api";

/*
    Temporary testing doctor.

    Ahmed Benali = ID 1

    Later this will come automatically
    from the logged-in doctor's account.
*/
const loggedInUser =
    JSON.parse(
        sessionStorage.getItem("smilecare_user") || "null"
    );

if (
    !loggedInUser ||
    loggedInUser.role !== "dentist" ||
    !loggedInUser.dentist_id
) {
    window.location.href = "../index.html";
}

const dentistId =
    Number(loggedInUser.dentist_id);


/* =========================================================
   DOM ELEMENTS
========================================================= */

const doctorNameElement =
    document.getElementById("doctorName");

const todayDateElement =
    document.getElementById("todayDate");

const workStatusElement =
    document.getElementById("workStatus");

const startTimeElement =
    document.getElementById("startTime");

const statusIconElement =
    document.getElementById("statusIcon");

const startWorkBtn =
    document.getElementById("startWorkBtn");

const endWorkBtn =
    document.getElementById("endWorkBtn");


const totalPatientsElement =
    document.getElementById("totalPatients");

const waitingPatientsElement =
    document.getElementById("waitingPatients");

const arrivedPatientsElement =
    document.getElementById("arrivedPatients");

const completedPatientsElement =
    document.getElementById("completedPatients");

const patientCountElement =
    document.getElementById("patientCount");

const patientsListElement =
    document.getElementById("patientsList");

const callNextBtn =
    document.getElementById("callNextBtn");

const currentPatientElement =
    document.getElementById("currentPatient");

const toastElement =
    document.getElementById("toast");

const toastTitleElement =
    document.getElementById("toastTitle");

const toastMessageElement =
    document.getElementById("toastMessage");


/* =========================================================
   STATE
========================================================= */

let currentData = null;


/* =========================================================
   DATE
========================================================= */

function displayTodayDate() {

    const now = new Date();

    const options = {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric"
    };

    todayDateElement.textContent =
        now.toLocaleDateString(
            "en-US",
            options
        );
}


/* =========================================================
   TIME FORMAT
========================================================= */

function formatTime(value) {

    if (!value) {
        return "";
    }

    const date =
        new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return date.toLocaleTimeString(
        "en-US",
        {
            hour: "2-digit",
            minute: "2-digit"
        }
    );
}


/* =========================================================
   STATUS
========================================================= */

function getStatusLabel(status) {

    const labels = {

        waiting: "Waiting",

        called: "Called",

        in_visit: "Inside Doctor Room",

        completed: "Completed",

        cancelled: "Cancelled",

        absent: "Absent",

        not_arrived: "Not arrived"

    };

    return labels[status] || "Not arrived";
}


/* =========================================================
   STATUS CLASS
========================================================= */

function getStatusClass(status) {

    const classes = {

        waiting: "status-waiting",

        called: "status-called",

        in_visit: "status-in-visit",

        completed: "status-completed",

        cancelled: "status-cancelled",

        absent: "status-absent",

        not_arrived: "status-not-arrived"

    };

    return classes[status] ||
        "status-not-arrived";
}


/* =========================================================
   INITIALIZATION
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        displayTodayDate();

        loadTodayData();

    }
);


/* =========================================================
   LOAD TODAY
========================================================= */

async function loadTodayData() {

    try {

        const response =
            await fetch(
                `${API_BASE}/doctor-work/today/${dentistId}`
            );


        if (!response.ok) {

            throw new Error(
                "Failed to load doctor data."
            );

        }


        const data =
            await response.json();


        currentData = data;


       renderDoctor(data);

renderWorkStatus(data);

renderStatistics(data);

renderPatients(data);

renderCurrentPatient(data);

    } catch (error) {

        console.error(
            "Doctor workspace error:",
            error
        );


        showToast(
            "Connection Error",
            "Could not connect to SmileCare backend.",
            "error"
        );

    }

}


/* =========================================================
   DOCTOR
========================================================= */

function renderDoctor(data) {

    if (
        data.dentist &&
        data.dentist.first_name
    ) {

        const firstName =
            data.dentist.first_name;

        const lastName =
            data.dentist.last_name || "";


        doctorNameElement.textContent =
            `Dr. ${firstName} ${lastName}`;
    }

}


/* =========================================================
   WORK STATUS
========================================================= */

function renderWorkStatus(data) {


if (endWorkBtn) {
    endWorkBtn.style.display = "none";
    endWorkBtn.disabled = true;
}





    const workDay =
        data.work_day;


    /*
        No work-day row yet.
    */

    if (!workDay) {

        workStatusElement.textContent =
            "Not started";

        statusIconElement.textContent =
            "○";

        startTimeElement.textContent =
            "Your work day has not started yet.";

        startWorkBtn.disabled = false;

        startWorkBtn.innerHTML =
            `<span class="button-icon">▶</span>
             Start Work Day`;

        return;
    }


    /*
        WORKING
    */

    if (
        workDay.status === "working"
    ) {

        if (endWorkBtn) {
    endWorkBtn.style.display = "inline-flex";
    endWorkBtn.disabled = false;
}

        workStatusElement.textContent =
            "Present — Working";

        statusIconElement.textContent =
            "●";

        startTimeElement.textContent =
            `Work started at ${formatTime(workDay.start_time)}`;

        startWorkBtn.disabled = true;

        startWorkBtn.innerHTML =
            `<span class="button-icon">✓</span>
             Work Day Started`;

        const card =
            document.querySelector(
                ".work-status-card"
            );

        card.classList.add("working");

        return;
    }


    /*
        TEMPORARILY UNAVAILABLE
    */

    if (
        workDay.status ===
        "temporarily_unavailable"
    ) {

        workStatusElement.textContent =
            "Temporarily unavailable";

        statusIconElement.textContent =
            "⏸";

        startTimeElement.textContent =
            "New patients are temporarily paused.";

        return;
    }


    /*
        CLOSED
    */

    if (
        workDay.status === "closed"
    ) {

        workStatusElement.textContent =
            "Work day closed";

        statusIconElement.textContent =
            "✓";

        startTimeElement.textContent =
            "Today's work day has ended.";

        startWorkBtn.disabled = true;

        startWorkBtn.innerHTML =
            `<span class="button-icon">✓</span>
             Work Day Closed`;

    }

}


/* =========================================================
   STATISTICS
========================================================= */

function renderStatistics(data) {

    const stats =
        data.stats || {};


    totalPatientsElement.textContent =
        stats.total ?? 0;


    waitingPatientsElement.textContent =
        stats.waiting ?? 0;


    arrivedPatientsElement.textContent =
        stats.arrived ?? 0;


    completedPatientsElement.textContent =
        stats.completed ?? 0;

}


/* =========================================================
   PATIENTS
========================================================= */

function renderPatients(data) {

    const patients =
        data.patients || [];


    patientCountElement.textContent =
        patients.length;


    if (!patients.length) {

        patientsListElement.innerHTML = `

            <tr>

                <td colspan="5">

                    <div class="table-empty">

                        <div>
                            👥
                        </div>

                        <span>
                            No patients scheduled for today.
                        </span>

                    </div>

                </td>

            </tr>

        `;

        return;
    }


    patientsListElement.innerHTML =
        patients.map(
            (patient, index) =>
                createPatientRow(
                    patient,
                    index
                )
        ).join("");

}


/* =========================================================
   CREATE PATIENT ROW
========================================================= */

function createPatientRow(
    patient,
    index
) {

    const firstName =
        patient.first_name || "";

    const lastName =
        patient.last_name || "";

    const fullName =
        `${firstName} ${lastName}`.trim();


    const initials =
        (
            firstName.charAt(0) +
            lastName.charAt(0)
        ).toUpperCase();


    const status =
        patient.patient_status ||
        "not_arrived";


    const time =
        patient.appointment_time
            ? formatAppointmentTime(
                patient.appointment_time
            )
            : "—";


    const reason =
        patient.reason ||
        "General consultation";


    return `

        <tr>

            <td>

                <span class="patient-number">
                    #${String(index + 1).padStart(2, "0")}
                </span>

            </td>


            <td>

                <div class="patient-name-cell">

                    <div class="patient-mini-avatar">
                        ${initials || "P"}
                    </div>

                    <div>

                        <div class="patient-name">
                            ${escapeHtml(fullName)}
                        </div>

                        <div class="patient-id">
                            Patient #${patient.patient_id ?? patient.id ?? "—"}
                        </div>

                    </div>

                </div>

            </td>


            <td>

                <span class="appointment-time">
                    ${escapeHtml(time)}
                </span>

            </td>


            <td>

                <span class="reason-cell">
                    ${escapeHtml(reason)}
                </span>

            </td>


            <td>

                <span
                    class="status-badge ${getStatusClass(status)}"
                >
                    ${getStatusLabel(status)}
                </span>

            </td>

        </tr>

    `;
}


/* =========================================================
   FORMAT APPOINTMENT TIME
========================================================= */

function formatAppointmentTime(time) {

    if (!time) {
        return "—";
    }


    const parts =
        String(time).split(":");


    if (parts.length < 2) {
        return time;
    }


    let hour =
        parseInt(parts[0], 10);

    const minute =
        parts[1];


    const suffix =
        hour >= 12
            ? "PM"
            : "AM";


    hour =
        hour % 12 || 12;


    return `${hour}:${minute} ${suffix}`;
}


/* =========================================================
   CURRENT PATIENT
========================================================= */

function renderCurrentPatient(data) {

    if (!currentPatientElement) {
        return;
    }

    const patients = data.patients || [];

    // Find the patient currently called or inside the visit
    const currentPatient = patients.find(
        patient =>
            patient.patient_status === "called" ||
            patient.patient_status === "in_visit"
    );

    // No current patient
    if (!currentPatient) {

        currentPatientElement.innerHTML = `
            <div class="current-patient-empty">

                <div class="empty-icon">
                    👤
                </div>

                <h3>No Current Patient</h3>

                <p>
                    Call the next patient when you are ready.
                </p>

            </div>
        `;

        return;
    }

    const firstName =
        currentPatient.first_name || "";

    const lastName =
        currentPatient.last_name || "";

    const fullName =
        `${firstName} ${lastName}`.trim();

    const initials =
        (
            firstName.charAt(0) +
            lastName.charAt(0)
        ).toUpperCase();

    const status =
        currentPatient.patient_status;

    const reason =
        currentPatient.reason ||
        "General consultation";

    const appointmentTime =
        currentPatient.appointment_time
            ? formatAppointmentTime(
                currentPatient.appointment_time
            )
            : "—";

    const statusText =
        status === "in_visit"
            ? "Inside Doctor Room"
            : "Patient Called";

    currentPatientElement.innerHTML = `
        <div class="current-patient-content">

            <div class="current-patient-avatar">
                ${escapeHtml(initials || "P")}
            </div>

            <div class="current-patient-info">

                <h3>
                    ${escapeHtml(fullName)}
                </h3>

                <p>
                    Patient #${escapeHtml(
                        currentPatient.patient_id ??
                        currentPatient.id ??
                        "—"
                    )}
                </p>

                <div class="current-patient-details">

                    <span>
                        🕐 ${escapeHtml(appointmentTime)}
                    </span>

                    <span>
                        🦷 ${escapeHtml(reason)}
                    </span>

                </div>

                <span class="status-badge ${getStatusClass(status)}">
                    ${statusText}
                </span>

            </div>

        </div>
    `;
}


/* =========================================================
   START WORK DAY
========================================================= */

startWorkBtn.addEventListener(
    "click",
    startWorkDay
);


async function startWorkDay() {

    if (startWorkBtn.disabled) {
        return;
    }


    startWorkBtn.disabled = true;

    startWorkBtn.innerHTML =
        `<span class="button-icon">⏳</span>
         Starting...`;


    try {

        const response =
            await fetch(
                `${API_BASE}/doctor-work/start`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        dentist_id: dentistId
                    })
                }
            );


        const result =
            await response.json();


        if (!response.ok) {

            throw new Error(
                result.message ||
                "Could not start work day."
            );

        }


        showToast(
            "Work Day Started",
            "You are now marked as Present — Working."
        );


        await loadTodayData();


    } catch (error) {

        console.error(error);


        startWorkBtn.disabled = false;

        startWorkBtn.innerHTML =
            `<span class="button-icon">▶</span>
             Start Work Day`;


        showToast(
            "Unable to Start",
            error.message ||
            "Something went wrong.",
            "error"
        );

    }

}


/* =========================================================
   END WORK DAY
========================================================= */

if (endWorkBtn) {
    endWorkBtn.addEventListener(
        "click",
        endWorkDay
    );
}

async function endWorkDay() {

    if (!currentData?.work_day) {
        showToast(
            "Work Day Required",
            "Start your work day first.",
            "error"
        );
        return;
    }

    if (
        currentData.work_day.status !==
        "working"
    ) {
        showToast(
            "Cannot Close",
            "The doctor is not currently working.",
            "error"
        );
        return;
    }

    const confirmed = confirm(
        "Are you sure you want to close your work day?"
    );

    if (!confirmed) {
        return;
    }

    endWorkBtn.disabled = true;

    endWorkBtn.innerHTML =
        `
        <span class="button-icon">⏳</span>
        Closing...
        `;

    try {

        const response =
            await fetch(
                `${API_BASE}/doctor-work/end`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        dentist_id:
                            dentistId
                    })
                }
            );

        const result =
            await response.json();

        if (!response.ok) {

            throw new Error(
                result.message ||
                result.error ||
                "Could not close work day."
            );

        }

        showToast(
            "Work Day Closed",
            "Your work day has been closed successfully."
        );

        await loadTodayData();

    } catch (error) {

        console.error(
            "END WORK DAY ERROR:",
            error
        );

        endWorkBtn.disabled = false;

        endWorkBtn.innerHTML =
            `
            <span class="button-icon">■</span>
            End Work Day
            `;

        showToast(
            "Unable to Close",
            error.message ||
            "Something went wrong.",
            "error"
        );
    }
}

/* =========================================================
   CALL NEXT
========================================================= */
/* =========================================================
   CALL NEXT PATIENT
========================================================= */

callNextBtn.addEventListener(
    "click",
    callNextPatient
);


async function callNextPatient() {

    if (!currentData?.work_day) {

        showToast(
            "Work Day Required",
            "Start your work day first.",
            "error"
        );

        return;

    }


    if (
        currentData.work_day.status !==
        "working"
    ) {

        showToast(
            "Doctor Unavailable",
            "The doctor is not currently available.",
            "error"
        );

        return;

    }


    callNextBtn.disabled = true;


    callNextBtn.innerHTML =
        `
        <span>⏳</span>
        Calling...
        `;


    try {

        const response =
            await fetch(
                `${API_BASE}/doctor-work/call-next`,
                {

                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        dentist_id:
                            dentistId
                    })

                }
            );


        const result =
            await response.json();


        if (!response.ok) {

            throw new Error(
                result.message ||
                result.error ||
                "Could not call next patient."
            );

        }


        const patient =
            result.patient;


        showToast(
            "Patient Called",
            `${patient.patient_name} is next.`
        );


        /*
            Save the called patient temporarily.
        */

        sessionStorage.setItem(
            "smilecare_called_patient",
            JSON.stringify(
                patient
            )
        );


        /*
            Start the visit automatically.

            Doctor does NOT need another
            unnecessary click.
        */

        await startVisit(
            patient.queue_id
        );


    } catch (error) {

        console.error(
            "CALL NEXT ERROR:",
            error
        );


        callNextBtn.disabled =
            false;


        callNextBtn.innerHTML =
            `
            <span>📢</span>
            Call Next Patient
            `;


        showToast(
            "Unable to Call",
            error.message ||
            "Something went wrong.",
            "error"
        );

    }

}


/* =========================================================
   START VISIT
========================================================= */

async function startVisit(
    queueId
) {

    try {

        const response =
            await fetch(
                `${API_BASE}/doctor-work/start-visit`,
                {

                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        queue_id:
                            queueId,

                        dentist_id:
                            dentistId

                    })

                }
            );


        const result =
            await response.json();


        if (!response.ok) {

            throw new Error(
                result.message ||
                result.error ||
                "Could not start visit."
            );

        }


        /*
            The backend returns the new visit
            and patient information.
        */

        const visit =
            result.visit || {};


        const patient =
            result.patient ||
            JSON.parse(
                sessionStorage.getItem(
                    "smilecare_called_patient"
                ) || "{}"
            );


        const currentVisit = {

            visit_id:
                visit.id ||
                result.visit_id,

            queue_id:
                queueId,

            appointment_id:
                patient.appointment_id,

            patient_id:
                patient.patient_id,

            patient_name:
                patient.patient_name,

            first_name:
                patient.first_name,

            last_name:
                patient.last_name,

            phone:
                patient.phone,

            email:
                patient.email,

            date_of_birth:
                patient.date_of_birth,

            medical_history:
                patient.medical_history,

            appointment_time:
                patient.appointment_time,

            reason:
                patient.reason,

            priority:
                patient.priority,

            queue_number:
                patient.queue_number,

            started_at:
                visit.started_at ||
                new Date().toISOString()

        };


        sessionStorage.setItem(
            "smilecare_current_visit",
            JSON.stringify(
                currentVisit
            )
        );


        sessionStorage.removeItem(
            "smilecare_called_patient"
        );


        /*
            Doctor goes directly to
            Current Visit.

            One click:
            CALL NEXT

            System:
            Call → Start Visit → Open Visit
        */

        window.location.href =
            "current-visit.html";

    } catch (error) {

        console.error(
            "START VISIT ERROR:",
            error
        );


        callNextBtn.disabled =
            false;


        callNextBtn.innerHTML =
            `
            <span>📢</span>
            Call Next Patient
            `;


        showToast(
            "Unable to Start Visit",
            error.message ||
            "Something went wrong.",
            "error"
        );

    }

}

/* =========================================================
   TOAST
========================================================= */

function showToast(
    title,
    message,
    type = "success"
) {

    toastTitleElement.textContent =
        title;

    toastMessageElement.textContent =
        message;


    const icon =
        document.getElementById(
            "toastIcon"
        );


    if (type === "error") {

        icon.textContent = "×";

        icon.style.background =
            "#fef2f2";

        icon.style.color =
            "#dc2626";

    } else {

        icon.textContent = "✓";

        icon.style.background =
            "#f0fdf4";

        icon.style.color =
            "#16a34a";
    }


    toastElement.classList.add(
        "show"
    );


    clearTimeout(
        window.smilecareToastTimer
    );


    window.smilecareToastTimer =
        setTimeout(
            () => {

                toastElement.classList.remove(
                    "show"
                );

            },
            3500
        );

}


/* =========================================================
   SECURITY
========================================================= */

function escapeHtml(value) {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}



