const API_URL = "https://smilecare-r68s.onrender.com/api";

const dentalPatient = document.getElementById("dentalPatient");
const dentalTable = document.getElementById("dentalTable");

// ===============================
// تحميل المرضى
// ===============================
async function loadPatients() {
    try {
        const response = await fetch(`${API_URL}/patients`);

        if (!response.ok) {
            throw new Error("Failed to load patients");
        }

        const patients = await response.json();

        dentalPatient.innerHTML = `
            <option value="">Select Patient</option>
        `;

        patients.forEach(patient => {
            const option = document.createElement("option");

            option.value = patient.id;
            option.textContent =
                `${patient.first_name} ${patient.last_name}`;

            dentalPatient.appendChild(option);
        });

    } catch (error) {
        console.error(error);

        dentalPatient.innerHTML = `
            <option value="">Failed to load patients</option>
        `;
    }
}


// ===============================
// تحميل مخطط أسنان المريض
// ===============================
async function loadDentalChart() {

    const patientId = dentalPatient.value;

    dentalTable.innerHTML = "";

    if (!patientId) {
        return;
    }

    try {

        // جلب بيانات أسنان المريض
        let response = await fetch(
            `${API_URL}/dental-chart/patient/${patientId}`
        );

        if (!response.ok) {
            throw new Error("Failed to load dental chart");
        }

        let records = await response.json();

        // معرفة الأسنان الموجودة بالفعل
        const existingTeeth = new Map();

        records.forEach(record => {
            existingTeeth.set(
                Number(record.tooth_number),
                record
            );
        });


        // ===============================
        // إنشاء الأسنان الناقصة 1 - 32
        // ===============================
        for (let tooth = 1; tooth <= 32; tooth++) {

            if (!existingTeeth.has(tooth)) {

                const addResponse = await fetch(
                    `${API_URL}/dental-chart`,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type": "application/json"
                        },

                        body: JSON.stringify({
                            patient_id: Number(patientId),
                            tooth_number: tooth,
                            condition_status: "Healthy",
                            notes: ""
                        })
                    }
                );

                if (!addResponse.ok) {
                    console.error(
                        `Failed to create tooth ${tooth}`
                    );
                }
            }
        }


        // ===============================
        // إعادة تحميل البيانات
        // ===============================
        response = await fetch(
            `${API_URL}/dental-chart/patient/${patientId}`
        );

        records = await response.json();


        // ===============================
        // عرض الأسنان
        // ===============================
        records.sort(
            (a, b) =>
                Number(a.tooth_number) -
                Number(b.tooth_number)
        );


        dentalTable.innerHTML = records.map(record => {

            return `
                <tr>

                    <td>
                        ${record.tooth_number}
                    </td>

                    <td>
                        ${record.condition_status}
                    </td>

                    <td>

                        <button
                            class="action-btn change-status"
                            data-id="${record.id}"
                            data-tooth="${record.tooth_number}"
                            data-status="${record.condition_status}"
                        >
                            Change
                        </button>

                    </td>

                </tr>
            `;

        }).join("");


    } catch (error) {

        console.error(error);

        dentalTable.innerHTML = `
            <tr>
                <td colspan="3">
                    Failed to load dental chart
                </td>
            </tr>
        `;
    }
}


// ===============================
// تغيير حالة السن
// ===============================
document.addEventListener("click", async function(event) {

    const button =
        event.target.closest(".change-status");

    if (!button) {
        return;
    }


    const id = button.dataset.id;

    const toothNumber =
        Number(button.dataset.tooth);

    const currentStatus =
        button.dataset.status;


    let newStatus;


    if (currentStatus === "Healthy") {

        newStatus = "Cavity";

    } else if (currentStatus === "Cavity") {

        newStatus = "Missing";

    } else {

        newStatus = "Healthy";
    }


    try {

        const response = await fetch(
            `${API_URL}/dental-chart/${id}`,
            {
                method: "PUT",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({

                    tooth_number: toothNumber,

                    condition_status: newStatus,

                    notes: ""
                })
            }
        );


        if (!response.ok) {

            const errorData =
                await response.json();

            throw new Error(
                errorData.error ||
                "Update failed"
            );
        }


        // إعادة تحميل الجدول
        await loadDentalChart();


    } catch (error) {

        console.error(error);

        alert(
            "Failed to update tooth status"
        );
    }

});


// ===============================
// عند اختيار مريض
// ===============================
dentalPatient.addEventListener(
    "change",
    loadDentalChart
);


// ===============================
// تشغيل الصفحة
// ===============================
loadPatients();
