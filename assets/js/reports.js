// ===========================
// API
// ===========================

const API_URL = "http://localhost:3000/api";


// ===========================
// ELEMENTS
// ===========================

const reportPatients = document.getElementById("reportPatients");
const reportDoctors = document.getElementById("reportDoctors");
const reportAppointments = document.getElementById("reportAppointments");
const reportRevenue = document.getElementById("reportRevenue");


// ===========================
// LOAD REPORTS
// ===========================

async function updateReports() {

    try {

        // Load all data from MySQL API
        const [patientsResponse, doctorsResponse, appointmentsResponse, paymentsResponse] =
            await Promise.all([
                fetch(`${API_URL}/patients`),
                fetch(`${API_URL}/dentists`),
                fetch(`${API_URL}/appointments`),
                fetch(`${API_URL}/payments`)
            ]);


        // Check responses
        if (
            !patientsResponse.ok ||
            !doctorsResponse.ok ||
            !appointmentsResponse.ok ||
            !paymentsResponse.ok
        ) {
            throw new Error("Failed to load report data");
        }


        // Convert responses to JSON
        const patients = await patientsResponse.json();
        const doctors = await doctorsResponse.json();
        const appointments = await appointmentsResponse.json();
        const payments = await paymentsResponse.json();


        // ===========================
        // TOTAL PATIENTS
        // ===========================

        reportPatients.textContent = patients.length;


        // ===========================
        // TOTAL DOCTORS
        // ===========================

        reportDoctors.textContent = doctors.length;


        // ===========================
        // TOTAL APPOINTMENTS
        // ===========================

        reportAppointments.textContent = appointments.length;


        // ===========================
        // TOTAL REVENUE
        // ===========================

        let totalRevenue = 0;

        payments.forEach(payment => {

            totalRevenue += Number(payment.amount) || 0;

        });


        // Format number
        reportRevenue.textContent =
            totalRevenue.toLocaleString("en-US") + " DA";


    } catch (error) {

        console.error("Reports Error:", error);

        // Display safe default values
        reportPatients.textContent = "0";
        reportDoctors.textContent = "0";
        reportAppointments.textContent = "0";
        reportRevenue.textContent = "0 DA";

    }

}


// ===========================
// START
// ===========================

updateReports();