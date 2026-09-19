const API_URL = "http://localhost:3000/api/patients";
const DOCTORS_API_URL = "http://localhost:3000/api/dentists";

let patients = [];
let doctors = [];
let editingId = null;
let deleteId = null;

const table = document.getElementById("patientsTable");
const modal = document.getElementById("patientModal");
const deleteModal = document.getElementById("deleteModal");
const viewModal = document.getElementById("viewModal");

const addBtn = document.querySelector(".add-btn");
const cancelBtn = document.querySelector(".cancel-btn");
const deleteCancelBtn = document.querySelector(".delete-cancel-btn");
const deleteConfirmBtn = document.querySelector(".delete-confirm-btn");
const saveBtn = document.getElementById("saveBtn");

const patientName = document.getElementById("patientName");
const patientAge = document.getElementById("patientAge");
const patientPhone = document.getElementById("patientPhone");
const patientDoctor = document.getElementById("patientDoctor");
const modalTitle = document.getElementById("modalTitle");
const searchInput = document.getElementById("searchPatient");
const closeView = document.getElementById("closeView");


// ===========================
// LOAD DOCTORS
// ===========================

async function loadDoctors() {

    try {

        const response = await fetch(DOCTORS_API_URL);

        if (!response.ok) {
            throw new Error("Failed to load doctors");
        }

        doctors = await response.json();

        patientDoctor.innerHTML =
            `<option value="">Select Doctor</option>`;

        doctors.forEach(doctor => {

            const option = document.createElement("option");

            option.value = doctor.id;

            option.textContent =
                `Dr. ${doctor.first_name} ${doctor.last_name}`;

            patientDoctor.appendChild(option);
        });

    } catch (error) {

        console.error("Doctors Error:", error);

        alert("Cannot load doctors.");
    }
}


// ===========================
// LOAD PATIENTS
// ===========================

async function loadPatients() {

    try {

        const response = await fetch(API_URL);

        if (!response.ok) {
            throw new Error("Failed to load patients");
        }

        patients = await response.json();

        renderPatients();

    } catch (error) {

        console.error(error);

        alert("Cannot connect to SmileCare Backend.");
    }
}


// ===========================
// CALCULATE AGE
// ===========================

function calculateAge(dateOfBirth) {

    if (!dateOfBirth) {
        return "-";
    }

    const birthDate = new Date(dateOfBirth);

    const today = new Date();

    let age =
        today.getFullYear() -
        birthDate.getFullYear();

    const monthDifference =
        today.getMonth() -
        birthDate.getMonth();

    if (
        monthDifference < 0 ||
        (
            monthDifference === 0 &&
            today.getDate() < birthDate.getDate()
        )
    ) {
        age--;
    }

    return age;
}


// ===========================
// RENDER TABLE
// ===========================

function renderPatients() {

    table.innerHTML = "";

    patients.forEach(patient => {

        const row = document.createElement("tr");

        row.innerHTML = `

            <td>
                ${String(patient.id).padStart(3, "0")}
            </td>

            <td>
                ${patient.first_name}
                ${patient.last_name}
            </td>

            <td>
                ${calculateAge(patient.date_of_birth)}
            </td>

            <td>
                ${patient.phone || "-"}
            </td>

            <td>
                ${patient.doctor || "-"}
            </td>

            <td>
                <span class="status active">
                    Active
                </span>
            </td>

            <td>

                <button
                    class="action-btn view"
                    data-id="${patient.id}">
                    👁
                </button>

                <button
                    class="action-btn edit"
                    data-id="${patient.id}">
                    ✏
                </button>

                <button
                    class="action-btn delete"
                    data-id="${patient.id}">
                    🗑
                </button>

            </td>
        `;

        table.appendChild(row);
    });
}


// ===========================
// CLEAR FORM
// ===========================

function clearForm() {

    patientName.value = "";
    patientAge.value = "";
    patientPhone.value = "";
    patientDoctor.value = "";
}


// ===========================
// ADD PATIENT
// ===========================

addBtn.addEventListener("click", () => {

    editingId = null;

    modalTitle.textContent =
        "Add New Patient";

    saveBtn.textContent =
        "Save";

    clearForm();

    modal.style.display = "flex";
});


// ===========================
// CANCEL
// ===========================

cancelBtn.addEventListener("click", () => {

    modal.style.display = "none";

});


// ===========================
// SAVE PATIENT
// ===========================

saveBtn.addEventListener("click", async () => {

    const fullName =
        patientName.value.trim();

    const phone =
        patientPhone.value.trim();

    const doctorId =
        patientDoctor.value;

    if (
        !fullName ||
        !patientAge.value ||
        !phone ||
        !doctorId
    ) {

        alert(
            "Please fill all fields and select a doctor."
        );

        return;
    }


    const nameParts =
        fullName.split(" ");

    const first_name =
        nameParts.shift();

    const last_name =
        nameParts.join(" ") || "-";


    const age =
        parseInt(patientAge.value);


    const currentYear =
        new Date().getFullYear();


    const date_of_birth =
        `${currentYear - age}-01-01`;


    const data = {

        first_name,
        last_name,
        phone,

        email: null,

        date_of_birth,

        address: null,

        medical_history: null,

        dentist_id: Number(doctorId)
    };


    try {

        let response;


        // UPDATE
        if (editingId !== null) {

            response = await fetch(
                `${API_URL}/${editingId}`,
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

        // ADD
        else {

            response = await fetch(
                API_URL,
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


        if (!response.ok) {

            const error =
                await response.json();

            throw new Error(
                error.error ||
                "Operation failed"
            );
        }


        await loadPatients();

        editingId = null;

        modal.style.display = "none";

        clearForm();


    } catch (error) {

        console.error(error);

        alert(error.message);
    }
});


// ===========================
// TABLE BUTTONS
// ===========================

table.addEventListener("click", event => {

    const button =
        event.target.closest(".action-btn");

    if (!button) return;


    const id =
        Number(button.dataset.id);


    const patient =
        patients.find(p => p.id === id);


    if (!patient) return;


    // VIEW
    if (button.classList.contains("view")) {

        document.getElementById("viewID")
            .textContent =
            String(patient.id)
                .padStart(3, "0");

        document.getElementById("viewName")
            .textContent =
            `${patient.first_name}
             ${patient.last_name}`;

        document.getElementById("viewAge")
            .textContent =
            calculateAge(
                patient.date_of_birth
            );

        document.getElementById("viewPhone")
            .textContent =
            patient.phone || "-";

        document.getElementById("viewDoctor")
            .textContent =
            patient.doctor || "-";

        document.getElementById("viewStatus")
            .textContent =
            "Active";

        viewModal.style.display = "flex";

        return;
    }


    // EDIT
    if (button.classList.contains("edit")) {

        editingId =
            patient.id;

        patientName.value =
            `${patient.first_name}
             ${patient.last_name}`;

        patientAge.value =
            calculateAge(
                patient.date_of_birth
            );

        patientPhone.value =
            patient.phone || "";

        patientDoctor.value =
            patient.dentist_id || "";

        modalTitle.textContent =
            "Edit Patient";

        saveBtn.textContent =
            "Update";

        modal.style.display =
            "flex";

        return;
    }


    // DELETE
    if (button.classList.contains("delete")) {

        deleteId =
            patient.id;

        deleteModal.style.display =
            "flex";
    }
});


// ===========================
// CONFIRM DELETE
// ===========================

deleteConfirmBtn.addEventListener(
    "click",
    async () => {

        if (deleteId === null) return;


        try {

            const response =
                await fetch(
                    `${API_URL}/${deleteId}`,
                    {
                        method: "DELETE"
                    }
                );


            if (!response.ok) {

                const error =
                    await response.json();

                throw new Error(
                    error.error ||
                    "Delete failed"
                );
            }


            deleteId = null;

            deleteModal.style.display =
                "none";

            await loadPatients();


        } catch (error) {

            console.error(error);

            alert(error.message);
        }
    }
);


// ===========================
// CANCEL DELETE
// ===========================

deleteCancelBtn.addEventListener(
    "click",
    () => {

        deleteId = null;

        deleteModal.style.display =
            "none";
    }
);


// ===========================
// CLOSE VIEW
// ===========================

closeView.addEventListener(
    "click",
    () => {

        viewModal.style.display =
            "none";
    }
);


// ===========================
// CLOSE MODALS
// ===========================

window.addEventListener(
    "click",
    event => {

        if (event.target === modal) {
            modal.style.display = "none";
        }

        if (event.target === deleteModal) {
            deleteModal.style.display = "none";
        }

        if (event.target === viewModal) {
            viewModal.style.display = "none";
        }
    }
);


// ===========================
// SEARCH
// ===========================

searchInput.addEventListener(
    "input",
    () => {

        const value =
            searchInput.value.toLowerCase();

        const rows =
            table.querySelectorAll("tr");

        rows.forEach(row => {

            const text =
                row.textContent.toLowerCase();

            row.style.display =
                text.includes(value)
                    ? ""
                    : "none";
        });
    }
);


// ===========================
// START
// ===========================

async function init() {

    await loadDoctors();

    await loadPatients();
}

init();