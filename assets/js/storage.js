// ===========================
// PATIENTS
// ===========================

function getPatients() {

    return JSON.parse(localStorage.getItem("patients")) || [];

}

function savePatients(data) {

    localStorage.setItem("patients", JSON.stringify(data));

}



// ===========================
// APPOINTMENTS
// ===========================

function getAppointments() {

    return JSON.parse(localStorage.getItem("appointments")) || [];

}

function saveAppointments(data) {

    localStorage.setItem("appointments", JSON.stringify(data));

}
