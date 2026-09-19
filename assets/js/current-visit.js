/* =========================================================
   SMILECARE - CURRENT VISIT
========================================================= */

const API_BASE =
    "http://localhost:3000/api";


/*
    Temporary doctor.

    Later this will come automatically
    from the logged-in account.
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
   DOM
========================================================= */

const patientNameElement =
    document.getElementById("patientName");

const patientIdElement =
    document.getElementById("patientId");

const patientAgeElement =
    document.getElementById("patientAge");

const appointmentTimeElement =
    document.getElementById("appointmentTime");

const visitReasonElement =
    document.getElementById("visitReason");

const patientAvatarElement =
    document.getElementById("patientAvatar");

const medicalAlertElement =
    document.getElementById("medicalAlert");

const medicalHistoryElement =
    document.getElementById("medicalHistory");

const visitTimerElement =
    document.getElementById("visitTimer");

const visitForm =
    document.getElementById("visitForm");

const finishVisitBtn =
    document.getElementById("finishVisitBtn");

const needsFollowUpElement =
    document.getElementById("needsFollowUp");

const followUpFieldsElement =
    document.getElementById("followUpFields");

const toastElement =
    document.getElementById("toast");

const toastTitleElement =
    document.getElementById("toastTitle");

const toastMessageElement =
    document.getElementById("toastMessage");


/* =========================================================
   STATE
========================================================= */

let currentVisit = null;

let timerInterval = null;


/* =========================================================
   INITIALIZATION
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        loadCurrentVisit();

    }
);


/* =========================================================
   LOAD CURRENT VISIT
========================================================= */

function loadCurrentVisit() {

    const savedVisit =
        sessionStorage.getItem(
            "smilecare_current_visit"
        );


    if (!savedVisit) {

        showToast(
            "No Active Visit",
            "No current patient was found.",
            "error"
        );

        setTimeout(
            () => {

                window.location.href =
                    "doctor-workspace.html";

            },
            1800
        );

        return;
    }


    try {

        currentVisit =
            JSON.parse(savedVisit);


        renderPatient(
            currentVisit
        );


        startVisitTimer(
            currentVisit.started_at
        );


    } catch (error) {

        console.error(error);

        showToast(
            "Visit Error",
            "Could not load the current visit.",
            "error"
        );

    }

}


/* =========================================================
   RENDER PATIENT
========================================================= */

function renderPatient(patient) {

    const fullName =
        patient.patient_name ||
        `${patient.first_name || ""} ${patient.last_name || ""}`.trim();


    patientNameElement.textContent =
        fullName || "Unknown Patient";


    patientIdElement.textContent =
        patient.patient_id ?? "—";


    appointmentTimeElement.textContent =
        formatAppointmentTime(
            patient.appointment_time
        );


    visitReasonElement.textContent =
        patient.reason ||
        "General consultation";


    patientAvatarElement.textContent =
        getInitials(
            patient.first_name,
            patient.last_name,
            fullName
        );


    patientAgeElement.textContent =
        calculateAge(
            patient.date_of_birth
        );


    const medicalHistory =
        patient.medical_history;


    if (
        medicalHistory &&
        String(medicalHistory).trim()
    ) {

        medicalHistoryElement.textContent =
            medicalHistory;

        medicalAlertElement.classList.remove(
            "hidden"
        );

    }

}


/* =========================================================
   AGE
========================================================= */

function calculateAge(dateOfBirth) {

    if (!dateOfBirth) {

        return "—";

    }


    const birth =
        new Date(dateOfBirth);


    if (
        Number.isNaN(
            birth.getTime()
        )
    ) {

        return "—";

    }


    const today =
        new Date();


    let age =
        today.getFullYear() -
        birth.getFullYear();


    const monthDifference =
        today.getMonth() -
        birth.getMonth();


    if (
        monthDifference < 0 ||
        (
            monthDifference === 0 &&
            today.getDate() < birth.getDate()
        )
    ) {

        age--;

    }


    return age >= 0
        ? age
        : "—";

}


/* =========================================================
   INITIALS
========================================================= */

function getInitials(
    firstName,
    lastName,
    fullName
) {

    if (firstName || lastName) {

        return (
            `${firstName || ""}${lastName || ""}`
        )
        .substring(0, 2)
        .toUpperCase();

    }


    return (
        fullName || "P"
    )
    .split(" ")
    .map(
        part => part.charAt(0)
    )
    .join("")
    .substring(0, 2)
    .toUpperCase();

}


/* =========================================================
   VISIT TIMER
========================================================= */

function startVisitTimer(startedAt) {

    if (!startedAt) {

        return;

    }


    const start =
        new Date(startedAt);


    if (
        Number.isNaN(
            start.getTime()
        )
    ) {

        return;

    }


    updateTimer(start);


    clearInterval(
        timerInterval
    );


    timerInterval =
        setInterval(
            () => {

                updateTimer(start);

            },
            1000
        );

}


function updateTimer(start) {

    const now =
        new Date();


    const seconds =
        Math.max(
            0,
            Math.floor(
                (now - start) / 1000
            )
        );


    const minutes =
        Math.floor(
            seconds / 60
        );


    const remainingSeconds =
        seconds % 60;


    visitTimerElement.textContent =
        `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;

}


/* =========================================================
   FOLLOW-UP TOGGLE
========================================================= */

needsFollowUpElement.addEventListener(
    "change",
    () => {

        if (
            needsFollowUpElement.checked
        ) {

            followUpFieldsElement.classList.remove(
                "hidden"
            );

        } else {

            followUpFieldsElement.classList.add(
                "hidden"
            );

        }

    }
);


/* =========================================================
   FINISH VISIT
========================================================= */

visitForm.addEventListener(
    "submit",
    finishVisit
);


async function finishVisit(event) {

    event.preventDefault();


    if (
        !currentVisit ||
        !currentVisit.visit_id
    ) {

        showToast(
            "Visit Error",
            "No active visit was found.",
            "error"
        );

        return;

    }


    const needsFollowUp =
        needsFollowUpElement.checked;


    const followUpDate =
        document.getElementById(
            "followUpDate"
        ).value;


    const followUpType =
        document.getElementById(
            "followUpType"
        ).value.trim();


    const followUpNotes =
        document.getElementById(
            "followUpNotes"
        ).value.trim();


    if (
        needsFollowUp &&
        (
            !followUpDate ||
            !followUpType
        )
    ) {

        showToast(
            "Follow-up Required",
            "Please enter the follow-up date and type.",
            "error"
        );

        return;

    }


    finishVisitBtn.disabled =
        true;


    finishVisitBtn.innerHTML =
        `
        <span>⏳</span>
        Saving Visit...
        `;


    const body = {

        visit_id:
            currentVisit.visit_id,

        queue_id:
            currentVisit.queue_id,

        dentist_id:
            dentistId,

        reason:
            currentVisit.reason || null,

        examination:
            document.getElementById(
                "examination"
            ).value.trim(),

        diagnosis:
            document.getElementById(
                "diagnosis"
            ).value.trim(),

        doctor_notes:
            document.getElementById(
                "doctorNotes"
            ).value.trim(),

        recommendation:
            document.getElementById(
                "recommendation"
            ).value.trim(),

        needs_follow_up:
            needsFollowUp,

        follow_up_date:
            needsFollowUp
                ? followUpDate
                : null,

        follow_up_type:
            needsFollowUp
                ? followUpType
                : null,

        follow_up_notes:
            needsFollowUp
                ? followUpNotes
                : null,

        treatment_name:
            document.getElementById(
                "treatmentName"
            ).value.trim(),

        treatment_description:
            document.getElementById(
                "treatmentDescription"
            ).value.trim()

    };


    try {

        const response =
            await fetch(
                `${API_BASE}/doctor-work/finish-visit`,
                {

                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify(body)

                }
            );


        const result =
            await response.json();


        if (!response.ok) {

            throw new Error(
                result.message ||
                result.error ||
                "Could not finish visit."
            );

        }


        clearInterval(
            timerInterval
        );


       sessionStorage.removeItem("smilecare_current_visit");
sessionStorage.removeItem("smilecare_called_patient");


        showToast(
            "Visit Completed",
            "The visit was saved successfully."
        );


        setTimeout(
            () => {

                window.location.href =
                    "doctor-workspace.html";

            },
            900
        );


    } catch (error) {

        console.error(
            "FINISH VISIT ERROR:",
            error
        );


        finishVisitBtn.disabled =
            false;


        finishVisitBtn.innerHTML =
            `
            <span>✓</span>
            Finish Visit
            `;


        showToast(
            "Unable to Finish",
            error.message ||
            "Something went wrong.",
            "error"
        );

    }

}


/* =========================================================
   TIME FORMAT
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
        parseInt(
            parts[0],
            10
        );


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


    toastElement.classList.add(
        "show"
    );


    clearTimeout(
        window.smilecareVisitToast
    );


    window.smilecareVisitToast =
        setTimeout(
            () => {

                toastElement.classList.remove(
                    "show"
                );

            },
            3500
        );

}


function showToast(
    title,
    message,
    type = "success"
) {
    toastTitleElement.textContent =
        title;

    toastMessageElement.textContent =
        message;

    toastElement.classList.add(
        "show"
    );

    clearTimeout(
        window.smilecareVisitToast
    );

    window.smilecareVisitToast =
        setTimeout(
            () => {
                toastElement.classList.remove(
                    "show"
                );
            },
            3500
        );
}