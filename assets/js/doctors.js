// ===========================
// CONFIGURATION
// ===========================

const API_URL =
    "http://localhost:3000/api/dentists";


// ===========================
// VARIABLES
// ===========================

let doctors = [];
let editingId = null;
let deleteId = null;


// ===========================
// DOM ELEMENTS
// ===========================

const table =
    document.getElementById("doctorsTable");

const modal =
    document.getElementById("doctorModal");

const deleteModal =
    document.getElementById("deleteModal");

const viewModal =
    document.getElementById("viewModal");

const addBtn =
    document.querySelector(".add-btn");

const cancelBtn =
    document.querySelector(".cancel-btn");

const saveBtn =
    document.getElementById("saveDoctorBtn");

const deleteCancelBtn =
    document.querySelector(".delete-cancel-btn");

const deleteConfirmBtn =
    document.querySelector(".delete-confirm-btn");

const closeView =
    document.getElementById("closeView");

const modalTitle =
    document.getElementById("modalTitle");

const doctorName =
    document.getElementById("doctorName");

const doctorSpecialization =
    document.getElementById(
        "doctorSpecialization"
    );

const doctorPhone =
    document.getElementById("doctorPhone");

const searchInput =
    document.getElementById("searchDoctor");

const openDoctorWorkspace =
    document.getElementById(
        "openDoctorWorkspace"
    );


// ===========================
// LOAD DOCTORS
// ===========================

async function loadDoctors() {

    try {

        const response =
            await fetch(API_URL);

        if (!response.ok) {
            throw new Error(
                "Failed to load doctors"
            );
        }

        doctors =
            await response.json();

        renderDoctors();

    } catch (error) {

        console.error(error);

        alert(
            "Cannot connect to SmileCare Backend."
        );
    }
}


// ===========================
// RENDER DOCTORS
// ===========================

function renderDoctors() {

    table.innerHTML = "";

    doctors.forEach((doctor) => {

        const fullName =
            `${doctor.first_name} ${doctor.last_name}`;

        const row =
            document.createElement("tr");

        row.innerHTML = `

            <td>
                ${String(doctor.id).padStart(3, "0")}
            </td>

            <td>
                ${fullName}
            </td>

            <td>
                ${doctor.specialty || "-"}
            </td>

            <td>
                ${doctor.phone || "-"}
            </td>

            <td>
                <span class="status active">
                    Active
                </span>
            </td>

            <td>

                <button
                    class="action-btn view"
                    data-id="${doctor.id}"
                    title="View"
                >
                    👁
                </button>

                <button
                    class="action-btn edit"
                    data-id="${doctor.id}"
                    title="Edit"
                >
                    ✏
                </button>

                <button
                    class="action-btn delete"
                    data-id="${doctor.id}"
                    title="Delete"
                >
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

    doctorName.value = "";
    doctorSpecialization.value = "";
    doctorPhone.value = "";
}


// ===========================
// ADD DOCTOR
// ===========================

addBtn.addEventListener(
    "click",
    () => {

        editingId = null;

        modalTitle.textContent =
            "Add New Doctor";

        saveBtn.textContent =
            "Save";

        clearForm();

        modal.style.display =
            "flex";
    }
);


// ===========================
// CANCEL ADD / EDIT
// ===========================

cancelBtn.addEventListener(
    "click",
    () => {

        modal.style.display =
            "none";

        editingId = null;
    }
);


// ===========================
// SAVE / UPDATE DOCTOR
// ===========================

saveBtn.addEventListener(
    "click",
    async () => {

        const fullName =
            doctorName.value.trim();

        const specialization =
            doctorSpecialization.value.trim();

        const phone =
            doctorPhone.value.trim();


        // ===========================
        // VALIDATION
        // ===========================

        if (
            fullName === "" ||
            specialization === "" ||
            phone === ""
        ) {

            alert(
                "Please fill all fields."
            );

            return;
        }


        // ===========================
        // SPLIT NAME
        // ===========================

        const nameParts =
            fullName.split(/\s+/);

        const first_name =
            nameParts.shift();

        const last_name =
            nameParts.join(" ") || "-";


        // ===========================
        // DATA
        // ===========================

        const data = {

            first_name,

            last_name,

            phone,

            email: null,

            specialty:
                specialization
        };


        try {

            let response;


            // ===========================
            // UPDATE
            // ===========================

            if (editingId !== null) {

                response =
                    await fetch(
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


            // ===========================
            // ADD
            // ===========================

            else {

                response =
                    await fetch(
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


            // ===========================
            // CHECK RESPONSE
            // ===========================

            if (!response.ok) {

                const error =
                    await response.json();

                throw new Error(
                    error.error ||
                    "Operation failed"
                );
            }


            // ===========================
            // RELOAD
            // ===========================

            await loadDoctors();

            editingId = null;

            clearForm();

            modal.style.display =
                "none";

            modalTitle.textContent =
                "Add New Doctor";

            saveBtn.textContent =
                "Save";


        } catch (error) {

            console.error(error);

            alert(error.message);
        }
    }
);


// ===========================
// TABLE ACTIONS
// ===========================

table.addEventListener(
    "click",
    (event) => {

        const button =
            event.target.closest(
                ".action-btn"
            );

        if (!button) {
            return;
        }


        const id =
            Number(button.dataset.id);


        const doctor =
            doctors.find(
                (d) =>
                    Number(d.id) === id
            );


        if (!doctor) {
            return;
        }


        // ===========================
        // VIEW
        // ===========================

        if (
            button.classList.contains("view")
        ) {

            document.getElementById(
                "viewID"
            ).textContent =
                String(doctor.id)
                    .padStart(3, "0");


            document.getElementById(
                "viewName"
            ).textContent =
                `${doctor.first_name} ${doctor.last_name}`;


            document.getElementById(
                "viewSpecialization"
            ).textContent =
                doctor.specialty || "-";


            document.getElementById(
                "viewPhone"
            ).textContent =
                doctor.phone || "-";


            document.getElementById(
                "viewStatus"
            ).textContent =
                "Active";


            // ===========================
            // SAVE REAL DOCTOR ID
            // ===========================

            localStorage.setItem(
                "selectedDoctorId",
                String(doctor.id)
            );


            // ===========================
            // OPEN VIEW MODAL
            // ===========================

            viewModal.style.display =
                "flex";

            return;
        }


        // ===========================
        // EDIT
        // ===========================

        if (
            button.classList.contains("edit")
        ) {

            editingId =
                doctor.id;


            doctorName.value =
                `${doctor.first_name} ${doctor.last_name}`;


            doctorSpecialization.value =
                doctor.specialty || "";


            doctorPhone.value =
                doctor.phone || "";


            modalTitle.textContent =
                "Edit Doctor";


            saveBtn.textContent =
                "Update";


            modal.style.display =
                "flex";

            return;
        }


        // ===========================
        // DELETE
        // ===========================

        if (
            button.classList.contains("delete")
        ) {

            deleteId =
                doctor.id;

            deleteModal.style.display =
                "flex";
        }
    }
);


// ===========================
// OPEN DOCTOR WORKSPACE
// ===========================

if (openDoctorWorkspace) {

    openDoctorWorkspace.addEventListener(
        "click",
        () => {

            const doctorId =
                localStorage.getItem(
                    "selectedDoctorId"
                );


            if (!doctorId) {

                alert(
                    "Doctor information not found."
                );

                return;
            }


            window.location.href =
                "doctor-workspace.html";
        }
    );
}


// ===========================
// CONFIRM DELETE
// ===========================

deleteConfirmBtn.addEventListener(
    "click",
    async () => {

        if (deleteId === null) {
            return;
        }


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


            // ===========================
            // REMOVE SELECTED DOCTOR
            // ===========================

            const selectedDoctorId =
                localStorage.getItem(
                    "selectedDoctorId"
                );


            if (
                selectedDoctorId ===
                String(deleteId)
            ) {

                localStorage.removeItem(
                    "selectedDoctorId"
                );
            }


            deleteId = null;

            deleteModal.style.display =
                "none";


            await loadDoctors();


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
    (event) => {

        if (event.target === modal) {

            modal.style.display =
                "none";

            editingId = null;
        }


        if (
            event.target === deleteModal
        ) {

            deleteModal.style.display =
                "none";

            deleteId = null;
        }


        if (
            event.target === viewModal
        ) {

            viewModal.style.display =
                "none";
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
            searchInput.value
                .toLowerCase()
                .trim();


        const rows =
            table.querySelectorAll("tr");


        rows.forEach((row) => {

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


// ===========================
// START
// ===========================

loadDoctors();