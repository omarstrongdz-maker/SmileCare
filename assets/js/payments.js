const API_URL = "http://localhost:3000/api";


// =====================================
// VARIABLES
// =====================================

const table =
    document.getElementById("paymentsTable");

const modal =
    document.getElementById("paymentModal");

const deleteModal =
    document.getElementById("deleteModal");

const viewModal =
    document.getElementById("viewModal");


const addBtn =
    document.querySelector(".add-btn");

const cancelBtn =
    document.querySelector(
        "#paymentModal .cancel-btn"
    );

const deleteCancelBtn =
    document.querySelector(
        ".delete-cancel-btn"
    );

const deleteConfirmBtn =
    document.querySelector(
        ".delete-confirm-btn"
    );

const closeView =
    document.getElementById("closeView");


const saveBtn =
    document.getElementById("savePaymentBtn");

const modalTitle =
    document.getElementById("modalTitle");


const patientSelect =
    document.getElementById("paymentPatient");

const paymentAmount =
    document.getElementById("paymentAmount");

const paymentMethod =
    document.getElementById("paymentMethod");

const paymentDate =
    document.getElementById("paymentDate");

const searchInput =
    document.getElementById("searchPayment");


let payments = [];

let editingId = null;

let deleteId = null;


// =====================================
// LOAD PATIENTS
// =====================================

async function loadPatients() {

    try {

        const response =
            await fetch(
                `${API_URL}/patients`
            );


        if (!response.ok) {

            throw new Error(
                "Failed to load patients"
            );
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
                document.createElement(
                    "option"
                );


            option.value =
                patient.id;


            option.textContent =
                `${patient.first_name} ${patient.last_name}`;


            patientSelect.appendChild(
                option
            );
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
// LOAD PAYMENTS
// =====================================

async function loadPayments() {

    try {

        const response =
            await fetch(
                `${API_URL}/payments`
            );


        if (!response.ok) {

            throw new Error(
                "Failed to load payments"
            );
        }


        payments =
            await response.json();


        renderPayments();


    } catch (error) {

        console.error(error);


        table.innerHTML = `
            <tr>
                <td colspan="6">
                    Failed to load payments
                </td>
            </tr>
        `;
    }
}


// =====================================
// RENDER PAYMENTS
// =====================================

function renderPayments() {

    table.innerHTML = "";


    payments.forEach(payment => {

        const row =
            document.createElement("tr");


        row.innerHTML = `

            <td>
                ${String(payment.id)
                    .padStart(3, "0")}
            </td>

            <td>
                ${payment.patient_name}
            </td>

            <td>
                ${payment.amount} DA
            </td>

            <td>
                ${formatPaymentMethod(
                    payment.payment_method
                )}
            </td>

            <td>
                ${payment.payment_date}
            </td>

            <td>

                <button
                    class="action-btn view"
                    data-id="${payment.id}"
                >
                    👁
                </button>

                <button
                    class="action-btn edit"
                    data-id="${payment.id}"
                >
                    ✏
                </button>

                <button
                    class="action-btn delete"
                    data-id="${payment.id}"
                >
                    🗑
                </button>

            </td>
        `;


        table.appendChild(row);
    });
}


// =====================================
// FORMAT PAYMENT METHOD
// =====================================

function formatPaymentMethod(method) {

    if (method === "cash") {
        return "Cash";
    }

    if (method === "card") {
        return "Card";
    }

    if (method === "bank_transfer") {
        return "Bank Transfer";
    }

    return method || "";
}


// =====================================
// CLEAR FORM
// =====================================

function clearForm() {

    patientSelect.value = "";

    paymentAmount.value = "";

    paymentMethod.value = "cash";

    paymentDate.value = "";
}


// =====================================
// OPEN ADD MODAL
// =====================================

addBtn.addEventListener(
    "click",
    async () => {

        editingId = null;

        modalTitle.textContent =
            "Add Payment";

        saveBtn.textContent =
            "Save";


        clearForm();

        await loadPatients();


        modal.style.display =
            "flex";
    }
);


// =====================================
// CLOSE MODALS
// =====================================

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

        deleteId = null;
    }
);


closeView.addEventListener(
    "click",
    () => {

        viewModal.style.display =
            "none";
    }
);


window.addEventListener(
    "click",
    event => {

        if (event.target === modal) {

            modal.style.display =
                "none";
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


// =====================================
// SAVE / UPDATE PAYMENT
// =====================================

saveBtn.addEventListener(
    "click",
    async () => {

        const patientId =
            patientSelect.value;

        const amount =
            paymentAmount.value.trim();

        const method =
            paymentMethod.value;

        const date =
            paymentDate.value;


        if (
            patientId === "" ||
            amount === "" ||
            date === ""
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

                response =
                    await fetch(
                        `${API_URL}/payments/${editingId}`,
                        {
                            method: "PUT",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body:
                                JSON.stringify({

                                    patient_id:
                                        Number(
                                            patientId
                                        ),

                                    treatment_id:
                                        null,

                                    amount:
                                        Number(
                                            amount
                                        ),

                                    payment_date:
                                        date,

                                    payment_method:
                                        method,

                                    status:
                                        "paid",

                                    notes:
                                        null
                                })
                        }
                    );
            }


            // ADD

            else {

                response =
                    await fetch(
                        `${API_URL}/payments`,
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body:
                                JSON.stringify({

                                    patient_id:
                                        Number(
                                            patientId
                                        ),

                                    treatment_id:
                                        null,

                                    amount:
                                        Number(
                                            amount
                                        ),

                                    payment_date:
                                        date,

                                    payment_method:
                                        method,

                                    status:
                                        "paid",

                                    notes:
                                        null
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
                    ? "Payment updated successfully."
                    : "Payment saved successfully."
            );


            modal.style.display =
                "none";


            clearForm();

            editingId = null;


            await loadPayments();


        } catch (error) {

            console.error(error);


            alert(
                error.message ||
                "Failed to save payment."
            );
        }
    }
);


// =====================================
// VIEW PAYMENT
// =====================================

async function viewPayment(id) {

    try {

        const response =
            await fetch(
                `${API_URL}/payments/${id}`
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.error ||
                "Failed to load payment"
            );
        }


        document.getElementById(
            "viewID"
        ).textContent =
            String(data.id)
                .padStart(3, "0");


        document.getElementById(
            "viewPatient"
        ).textContent =
            data.patient_name;


        document.getElementById(
            "viewAmount"
        ).textContent =
            `${data.amount} DA`;


        document.getElementById(
            "viewMethod"
        ).textContent =
            formatPaymentMethod(
                data.payment_method
            );


        document.getElementById(
            "viewDate"
        ).textContent =
            data.payment_date;


        viewModal.style.display =
            "flex";


    } catch (error) {

        console.error(error);


        alert(
            error.message ||
            "Failed to load payment."
        );
    }
}


// =====================================
// EDIT PAYMENT
// =====================================

async function editPayment(id) {

    try {

        const response =
            await fetch(
                `${API_URL}/payments/${id}`
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.error ||
                "Failed to load payment"
            );
        }


        await loadPatients();


        patientSelect.value =
            data.patient_id;


        paymentAmount.value =
            data.amount;


        paymentMethod.value =
            data.payment_method;


        paymentDate.value =
            data.payment_date;


        editingId =
            data.id;


        modalTitle.textContent =
            "Edit Payment";


        saveBtn.textContent =
            "Update";


        modal.style.display =
            "flex";


    } catch (error) {

        console.error(error);


        alert(
            error.message ||
            "Failed to load payment."
        );
    }
}


// =====================================
// ACTION BUTTONS
// =====================================

document.addEventListener(
    "click",
    async event => {

        const button =
            event.target.closest(
                ".action-btn"
            );


        if (!button) {
            return;
        }


        const id =
            button.dataset.id;


        // VIEW

        if (
            button.classList.contains(
                "view"
            )
        ) {

            await viewPayment(id);

            return;
        }


        // EDIT

        if (
            button.classList.contains(
                "edit"
            )
        ) {

            await editPayment(id);

            return;
        }


        // DELETE

        if (
            button.classList.contains(
                "delete"
            )
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
                    `${API_URL}/payments/${deleteId}`,
                    {
                        method: "DELETE"
                    }
                );


            const data =
                await response.json();


            if (!response.ok) {

                throw new Error(
                    data.error ||
                    "Failed to delete payment"
                );
            }


            alert(
                "Payment deleted successfully."
            );


            deleteModal.style.display =
                "none";


            deleteId = null;


            await loadPayments();


        } catch (error) {

            console.error(error);


            alert(
                error.message ||
                "Failed to delete payment."
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
            searchInput.value
                .toLowerCase();


        const rows =
            table.querySelectorAll("tr");


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


// =====================================
// START
// =====================================

loadPatients();

loadPayments();