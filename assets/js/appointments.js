// ===========================
// API
// ===========================

const API_URL = "http://localhost:3000/api";


// ===========================
// VARIABLES
// ===========================

let appointments = [];
let editingId = null;
let deleteId = null;

const appointmentsTable =
    document.getElementById("appointmentsTable");

const modal =
    document.getElementById("appointmentModal");

const deleteModal =
    document.getElementById("deleteModal");

const viewModal =
    document.getElementById("viewModal");

const addBtn =
    document.querySelector(".add-btn");

const cancelBtn =
    document.querySelector("#appointmentModal .cancel-btn");

const deleteCancelBtn =
    document.querySelector(".delete-cancel-btn");

const deleteConfirmBtn =
    document.querySelector(".delete-confirm-btn");

const saveBtn =
    document.getElementById("saveAppointment");

const patientSelect =
    document.getElementById("appointmentPatient");

const doctorSelect =
    document.getElementById("appointmentDoctor");

const appointmentDate =
    document.getElementById("appointmentDate");

const appointmentTime =
    document.getElementById("appointmentTime");

const searchInput =
    document.getElementById("searchAppointment");

const closeView =
    document.getElementById("closeView");


// ===========================
// LOAD APPOINTMENTS
// ===========================

async function loadAppointments() {

    console.log("1️⃣ Starting loadAppointments...");

    try {

        const url = `${API_URL}/appointments`;

        console.log("2️⃣ Request URL:", url);

        const response = await fetch(url);

        console.log("3️⃣ Response status:", response.status);
        console.log("4️⃣ Response OK:", response.ok);

        const text = await response.text();

        console.log("5️⃣ Raw response:", text);

        if (!response.ok) {
            throw new Error(
                `Server error: ${response.status}`
            );
        }

        appointments = JSON.parse(text);

        console.log("6️⃣ Appointments:", appointments);
        console.log("7️⃣ Number of appointments:", appointments.length);

        renderAppointments();

        console.log("8️⃣ Table rendered.");

    } catch (error) {

        console.error("❌ APPOINTMENTS ERROR:", error);

        alert(
            "Error loading appointments:\n" +
            error.message
        );

    }

}


// ===========================
// LOAD PATIENTS
// ===========================

async function loadPatients() {

    try {

        const response =
            await fetch(`${API_URL}/patients`);

        const patients =
            await response.json();

        patientSelect.innerHTML =
            "";

        patients.forEach(patient => {

            const option =
                document.createElement("option");

            option.value =
                patient.id;

            option.textContent =
                `${patient.first_name} ${patient.last_name}`;

            patientSelect.appendChild(option);

        });

    } catch (error) {

        console.error(
            "Failed to load patients:",
            error
        );

    }

}


// ===========================
// LOAD DOCTORS
// ===========================

async function loadDoctors() {

    try {

        const response =
            await fetch(`${API_URL}/dentists`);

        const doctors =
            await response.json();

        doctorSelect.innerHTML =
            "";

        doctors.forEach(doctor => {

            const option =
                document.createElement("option");

            option.value =
                doctor.id;

            option.textContent =
                `${doctor.first_name} ${doctor.last_name}`;

            doctorSelect.appendChild(option);

        });

    } catch (error) {

        console.error(
            "Failed to load doctors:",
            error
        );

    }

}


// ===========================
// RENDER APPOINTMENTS
// ===========================

function renderAppointments() {

    console.log("Rendering appointments...");
    console.log(appointments);

    appointmentsTable.innerHTML = "";

    if (appointments.length === 0) {

        appointmentsTable.innerHTML = `
            <tr>
                <td colspan="7" style="text-align:center;">
                    No appointments found
                </td>
            </tr>
        `;

        return;
    }

    appointments.forEach(appointment => {

        const row = document.createElement("tr");

        const date =
            appointment.appointment_date
                ? appointment.appointment_date.split("T")[0]
                : "";

        const time =
            appointment.appointment_time
                ? appointment.appointment_time.substring(0, 5)
                : "";

        row.innerHTML = `

            <td>
                ${String(appointment.id).padStart(3, "0")}
            </td>

            <td>
                ${appointment.patient_name || ""}
            </td>

            <td>
                ${appointment.dentist_name || ""}
            </td>

            <td>
                ${date}
            </td>

            <td>
                ${time}
            </td>

            <td>
                <span class="status active">
    ${
        appointment.booking_type === "online"
            ? `Online - ${appointment.booking_status || "pending"}`
            : appointment.status || "scheduled"
    }
</span>
            </td>





            <td>

                <button
                    class="action-btn view"
                    data-id="${appointment.id}">
                    👁
                </button>

                <button
                    class="action-btn edit"
                    data-id="${appointment.id}">
                    ✏
                </button>

                <button
                    class="action-btn delete"
                    data-id="${appointment.id}">
                    🗑
                </button>

            </td>

        `;

        appointmentsTable.appendChild(row);

    });

}

// ===========================
// ADD APPOINTMENT
// ===========================

addBtn.addEventListener(
    "click",
    async () => {

        editingId = null;

        saveBtn.textContent =
            "Save";

        await loadPatients();

        await loadDoctors();

        clearForm();

        modal.style.display =
            "flex";

    }
);


// ===========================
// SAVE APPOINTMENT
// ===========================

saveBtn.addEventListener(
    "click",
    async () => {

        const patientId =
            patientSelect.value;

        const doctorId =
            doctorSelect.value;

        const date =
            appointmentDate.value;

        const time =
            appointmentTime.value;


        if (
            !patientId ||
            !doctorId ||
            !date ||
            !time
        ) {

            alert(
                "Please fill all fields."
            );

            return;

        }


        const data = {

            patient_id:
                Number(patientId),

            dentist_id:
                Number(doctorId),

            appointment_date:
                date,

            appointment_time:
                time,

            reason:
                "Dental examination",

            status:
                "scheduled",

            notes:
                null

        };


        try {

            let response;


            // =====================
            // UPDATE
            // =====================

            if (editingId !== null) {

                response =
                    await fetch(
                        `${API_URL}/appointments/${editingId}`,
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

            }

            // =====================
            // ADD
            // =====================

            else {

                response =
                    await fetch(
                        `${API_URL}/appointments`,
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body:
                                JSON.stringify(data)
                        }
                    );

            }


            const result =
                await response.json();


            if (!response.ok) {

                throw new Error(
                    result.error ||
                    "Operation failed"
                );

            }


            alert(
                editingId !== null
                    ? "Appointment updated successfully!"
                    : "Appointment added successfully!"
            );


            editingId = null;

            saveBtn.textContent =
                "Save";

            modal.style.display =
                "none";

            clearForm();

            await loadAppointments();

        } catch (error) {

            console.error(error);

            alert(
                error.message
            );

        }

    }
);


// ===========================
// EDIT APPOINTMENT
// ===========================

appointmentsTable.addEventListener(
    "click",
    async (event) => {

        const editButton =
            event.target.closest(".edit");

        if (!editButton)
            return;


        const id =
            Number(editButton.dataset.id);

        const appointment =
            appointments.find(
                item => item.id === id
            );

        if (!appointment)
            return;


        editingId =
            appointment.id;


        await loadPatients();

        await loadDoctors();


        patientSelect.value =
            appointment.patient_id;

        doctorSelect.value =
            appointment.dentist_id;


        appointmentDate.value =
            appointment.appointment_date
                .split("T")[0];


        appointmentTime.value =
            appointment.appointment_time
                .substring(0, 5);


        saveBtn.textContent =
            "Update";


        modal.style.display =
            "flex";

    }
);


// ===========================
// VIEW APPOINTMENT
// ===========================

appointmentsTable.addEventListener(
    "click",
    event => {

        const viewButton =
            event.target.closest(".view");

        if (!viewButton)
            return;


        const id =
            Number(viewButton.dataset.id);

        const appointment =
            appointments.find(
                item => item.id === id
            );

        if (!appointment)
            return;


        document.getElementById("viewID")
            .textContent =
            String(appointment.id)
                .padStart(3, "0");


        document.getElementById("viewPatient")
            .textContent =
            appointment.patient_name;


        document.getElementById("viewDoctor")
            .textContent =
            appointment.dentist_name;


        document.getElementById("viewDate")
            .textContent =
            appointment.appointment_date
                .split("T")[0];


        document.getElementById("viewTime")
            .textContent =
            appointment.appointment_time
                .substring(0, 5);


        document.getElementById("viewStatus")
            .textContent =
            appointment.status;


        viewModal.style.display =
            "flex";

    }
);


// ===========================
// DELETE BUTTON
// ===========================

appointmentsTable.addEventListener(
    "click",
    event => {

        const deleteButton =
            event.target.closest(".delete");

        if (!deleteButton)
            return;


        deleteId =
            Number(deleteButton.dataset.id);


        deleteModal.style.display =
            "flex";

    }
);


// ===========================
// CONFIRM DELETE
// ===========================

deleteConfirmBtn.addEventListener(
    "click",
    async () => {

        if (deleteId === null)
            return;


        try {

            const response =
                await fetch(
                    `${API_URL}/appointments/${deleteId}`,
                    {
                        method: "DELETE"
                    }
                );


            const result =
                await response.json();


            if (!response.ok) {

                throw new Error(
                    result.error ||
                    "Failed to delete appointment"
                );

            }


            alert(
                "Appointment deleted successfully!"
            );


            deleteId =
                null;


            deleteModal.style.display =
                "none";


            await loadAppointments();

        } catch (error) {

            console.error(error);

            alert(
                error.message
            );

        }

    }
);


// ===========================
// CANCEL BUTTONS
// ===========================

cancelBtn.addEventListener(
    "click",
    () => {

        modal.style.display =
            "none";

    }
);


deleteCancelBtn.addEventListener(
    "click",
    () => {

        deleteModal.style.display =
            "none";

        deleteId =
            null;

    }
);


closeView.addEventListener(
    "click",
    () => {

        viewModal.style.display =
            "none";

    }
);


// ===========================
// CLOSE BY CLICKING OUTSIDE
// ===========================

window.addEventListener(
    "click",
    event => {

        if (event.target === modal) {

            modal.style.display =
                "none";

        }

        if (event.target === deleteModal) {

            deleteModal.style.display =
                "none";

        }

        if (event.target === viewModal) {

            viewModal.style.display =
                "none";

        }

    }
);


// ===========================
// CLEAR FORM
// ===========================

function clearForm() {

    appointmentDate.value =
        "";

    appointmentTime.value =
        "";

}


// ===========================
// SEARCH
// ===========================

searchInput.addEventListener(
    "input",
    () => {

        const value =
            searchInput.value
                .toLowerCase();


        const rows =
            appointmentsTable
                .querySelectorAll("tr");


        rows.forEach(row => {

            const text =
                row.textContent
                    .toLowerCase();


            row.style.display =
                text.includes(value)
                    ? ""
                    : "none";

        });

    }
);


// =====================================================
// START
// =====================================================

loadAppointments();
loadPatients();
loadDoctors();


renderAppointments





