const API_URL = "https://smilecare-r68s.onrender.com/api";

const table = document.getElementById("recordsTable");
const modal = document.getElementById("recordModal");
const deleteModal = document.getElementById("deleteModal");
const viewModal = document.getElementById("viewModal");

const addBtn = document.querySelector(".add-btn");
const cancelBtn = document.querySelector("#recordModal .cancel-btn");
const saveBtn = document.getElementById("saveRecordBtn");

const deleteConfirmBtn =
    document.querySelector(".delete-confirm-btn");

const deleteCancelBtn =
    document.querySelector(".delete-cancel-btn");

const closeView =
    document.getElementById("closeView");

const modalTitle =
    document.getElementById("modalTitle");

const patientSelect =
    document.getElementById("recordPatient");

const diagnosisInput =
    document.getElementById("recordDiagnosis");

const treatmentInput =
    document.getElementById("recordTreatment");

const notesInput =
    document.getElementById("recordNotes");

const dateInput =
    document.getElementById("recordDate");

const searchInput =
    document.getElementById("searchRecord");

let records = [];
let editingId = null;
let deleteId = null;


// =====================================
// LOAD PATIENTS
// =====================================

async function loadPatients() {

    try {

        const response =
            await fetch(`${API_URL}/patients`);

        if (!response.ok) {
            throw new Error("Failed to load patients");
        }

        const patients =
            await response.json();

        patientSelect.innerHTML = `
            <option value="">
                Select Patient
            </option>
        `;

        patients.forEach(patient => {

            const option =
                document.createElement("option");

            option.value = patient.id;

            option.textContent =
                `${patient.first_name} ${patient.last_name}`;

            patientSelect.appendChild(option);
        });

    } catch (error) {

        console.error(error);

        patientSelect.innerHTML = `
            <option value="">
                Failed to load patients
            </option>
        `;
    }
}


// =====================================
// LOAD MEDICAL RECORDS
// =====================================

async function loadRecords() {

    try {

        const response =
            await fetch(`${API_URL}/medical-records`);

        if (!response.ok) {
            throw new Error(
                "Failed to load medical records"
            );
        }

        records = await response.json();

        renderRecords();

    } catch (error) {

        console.error(error);

        table.innerHTML = `
            <tr>
                <td colspan="6">
                    Failed to load medical records
                </td>
            </tr>
        `;
    }
}


// =====================================
// RENDER TABLE
// =====================================

function renderRecords() {

    table.innerHTML = "";

    records.forEach(record => {

        const row = document.createElement("tr");

        row.innerHTML = `
            <td>
                ${String(record.id).padStart(3, "0")}
            </td>

            <td>
                ${record.patient_name}
            </td>

            <td>
                ${record.diagnosis}
            </td>

            <td>
                ${record.treatment}
            </td>

            <td>
                ${record.record_date}
            </td>

            <td>

                <button
                    class="action-btn view"
                    data-id="${record.id}"
                >
                    👁
                </button>

                <button
                    class="action-btn edit"
                    data-id="${record.id}"
                >
                    ✏
                </button>

                <button
                    class="action-btn delete"
                    data-id="${record.id}"
                >
                    🗑
                </button>

            </td>
        `;

        table.appendChild(row);
    });
}


// =====================================
// CLEAR FORM
// =====================================

function clearForm() {

    patientSelect.value = "";
    diagnosisInput.value = "";
    treatmentInput.value = "";
    notesInput.value = "";
    dateInput.value = "";
}


// =====================================
// OPEN ADD MODAL
// =====================================

addBtn.addEventListener("click", async () => {

    editingId = null;

    modalTitle.textContent =
        "Add Medical Record";

    saveBtn.textContent =
        "Save";

    clearForm();

    await loadPatients();

    modal.style.display = "flex";
});


// =====================================
// CLOSE MODALS
// =====================================

cancelBtn.addEventListener("click", () => {

    modal.style.display = "none";
});


deleteCancelBtn.addEventListener("click", () => {

    deleteModal.style.display = "none";

    deleteId = null;
});


closeView.addEventListener("click", () => {

    viewModal.style.display = "none";
});


window.addEventListener("click", event => {

    if (event.target === modal) {
        modal.style.display = "none";
    }

    if (event.target === deleteModal) {
        deleteModal.style.display = "none";
        deleteId = null;
    }

    if (event.target === viewModal) {
        viewModal.style.display = "none";
    }

});


// =====================================
// SAVE / UPDATE MEDICAL RECORD
// =====================================

saveBtn.addEventListener("click", async () => {

    const patientId =
        patientSelect.value;

    const diagnosis =
        diagnosisInput.value.trim();

    const treatment =
        treatmentInput.value.trim();

    const notes =
        notesInput.value.trim();

    const recordDate =
        dateInput.value;


    // REQUIRED FIELDS

    if (
        patientId === "" ||
        diagnosis === "" ||
        treatment === "" ||
        recordDate === ""
    ) {

        alert(
            "Please fill all required fields."
        );

        return;
    }


    try {

        let response;


        // UPDATE

        if (editingId !== null) {

            response = await fetch(
                `${API_URL}/medical-records/${editingId}`,
                {
                    method: "PUT",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({

                        patient_id:
                            Number(patientId),

                        diagnosis:
                            diagnosis,

                        treatment:
                            treatment,

                        notes:
                            notes,

                        record_date:
                            recordDate
                    })
                }
            );

        }


        // ADD

        else {

            response = await fetch(
                `${API_URL}/medical-records`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({

                        patient_id:
                            Number(patientId),

                        diagnosis:
                            diagnosis,

                        treatment:
                            treatment,

                        notes:
                            notes,

                        record_date:
                            recordDate
                    })
                }
            );
        }


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.error ||
                "Operation failed"
            );
        }


        alert(
            editingId !== null
                ? "Medical record updated successfully."
                : "Medical record saved successfully."
        );


        modal.style.display =
            "none";

        clearForm();

        editingId =
            null;

        await loadRecords();


    } catch (error) {

        console.error(error);

        alert(
            error.message ||
            "Failed to save medical record."
        );
    }

});


// =====================================
// VIEW MEDICAL RECORD
// =====================================

async function viewRecord(id) {

    try {

        const response =
            await fetch(
                `${API_URL}/medical-records/${id}`
            );

        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.error ||
                "Failed to load record"
            );
        }


        document.getElementById("viewID")
            .textContent =
            String(data.id).padStart(3, "0");


        document.getElementById("viewPatient")
            .textContent =
            data.patient_name;


        document.getElementById("viewDiagnosis")
            .textContent =
            data.diagnosis;


        document.getElementById("viewTreatment")
            .textContent =
            data.treatment;


        document.getElementById("viewNotes")
            .textContent =
            data.notes || "";


        document.getElementById("viewDate")
            .textContent =
            data.record_date;


        viewModal.style.display =
            "flex";


    } catch (error) {

        console.error(error);

        alert(
            error.message ||
            "Failed to load medical record."
        );
    }
}


// =====================================
// EDIT MEDICAL RECORD
// =====================================

async function editRecord(id) {

    try {

        const response =
            await fetch(
                `${API_URL}/medical-records/${id}`
            );

        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.error ||
                "Failed to load record"
            );
        }


        await loadPatients();


        patientSelect.value =
            data.patient_id;


        diagnosisInput.value =
            data.diagnosis || "";


        treatmentInput.value =
            data.treatment || "";


        notesInput.value =
            data.notes || "";


        dateInput.value =
            data.record_date || "";


        editingId =
            data.id;


        modalTitle.textContent =
            "Edit Medical Record";


        saveBtn.textContent =
            "Update";


        modal.style.display =
            "flex";


    } catch (error) {

        console.error(error);

        alert(
            error.message ||
            "Failed to load medical record."
        );
    }
}


// =====================================
// ACTION BUTTONS
// =====================================

document.addEventListener(
    "click",
    async (event) => {

        const button =
            event.target.closest(".action-btn");


        if (!button) {
            return;
        }


        const id =
            button.dataset.id;


        // VIEW

        if (
            button.classList.contains("view")
        ) {

            await viewRecord(id);

            return;
        }


        // EDIT

        if (
            button.classList.contains("edit")
        ) {

            await editRecord(id);

            return;
        }


        // DELETE

        if (
            button.classList.contains("delete")
        ) {

            deleteId =
                id;

            deleteModal.style.display =
                "flex";

            return;
        }

    }
);


// =====================================
// CONFIRM DELETE
// =====================================

deleteConfirmBtn.addEventListener(
    "click",
    async () => {

        if (deleteId === null) {
            return;
        }


        try {

            const response =
                await fetch(
                    `${API_URL}/medical-records/${deleteId}`,
                    {
                        method: "DELETE"
                    }
                );


            const data =
                await response.json();


            if (!response.ok) {

                throw new Error(
                    data.error ||
                    "Failed to delete medical record"
                );
            }


            alert(
                "Medical record deleted successfully."
            );


            deleteModal.style.display =
                "none";


            deleteId =
                null;


            await loadRecords();


        } catch (error) {

            console.error(error);

            alert(
                error.message ||
                "Failed to delete medical record."
            );
        }

    }
);


// =====================================
// SEARCH
// =====================================

searchInput.addEventListener(
    "keyup",
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


// =====================================
// START
// =====================================

loadPatients();
loadRecords();
