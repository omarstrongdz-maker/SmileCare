// ===========================
// API
// ===========================

const API_URL = "http://localhost:3000/api";


// ===========================
// VARIABLES
// ===========================




const patientsCount = document.getElementById("patientsCount");
const doctorsCount = document.getElementById("doctorsCount");
const appointmentsCount = document.getElementById("appointmentsCount");
const revenueCount = document.getElementById("revenueCount");

const recentPatients = document.getElementById("recentPatients");
const todayAppointments = document.getElementById("todayAppointments");


// ===========================
// LOAD DASHBOARD DATA
// ===========================

async function updateDashboard() {

    try {

        // Get data from MySQL API
        const [
            patientsResponse,
            doctorsResponse,
            appointmentsResponse,
            paymentsResponse
        ] = await Promise.all([

            fetch(`${API_URL}/patients`),

            fetch(`${API_URL}/dentists`),

            fetch(`${API_URL}/appointments`),

            fetch(`${API_URL}/payments`)

        ]);


        // Check API responses
        if (
            !patientsResponse.ok ||
            !doctorsResponse.ok ||
            !appointmentsResponse.ok ||
            !paymentsResponse.ok
        ) {
            throw new Error("Failed to load dashboard data");
        }


        // Convert responses to JSON
        const patients = await patientsResponse.json();
        const doctors = await doctorsResponse.json();
        const appointments = await appointmentsResponse.json();
        const payments = await paymentsResponse.json();


        // ===========================
        // COUNTS
        // ===========================

        patientsCount.textContent = patients.length;

        doctorsCount.textContent = doctors.length;

        appointmentsCount.textContent = appointments.length;


        // ===========================
        // REVENUE
        // ===========================

        let totalRevenue = 0;

        payments.forEach(payment => {

            totalRevenue += Number(payment.amount) || 0;

        });


        revenueCount.textContent =
            totalRevenue.toLocaleString("en-US") + " DA";


        // ===========================
        // RECENT PATIENTS
        // ===========================

        recentPatients.innerHTML = "";

        // The API returns newest patients first
       const lastPatients = patients;

        lastPatients.forEach(patient => {

            const firstName = patient.first_name || "";
            const lastName = patient.last_name || "";

            const fullName =
                `${firstName} ${lastName}`.trim();


            const li = document.createElement("li");

            li.textContent = fullName || "Unknown Patient";

            recentPatients.appendChild(li);

        });


        // ===========================
        // TODAY'S APPOINTMENTS
        // ===========================

        todayAppointments.innerHTML = "";


        // Get today's date in local time
        const today = new Date();

        const year = today.getFullYear();

        const month =
            String(today.getMonth() + 1).padStart(2, "0");

        const day =
            String(today.getDate()).padStart(2, "0");

        const todayDate =
            `${year}-${month}-${day}`;


        // Filter today's appointments
        const appointmentsToday = appointments.filter(
            appointment => {

                const appointmentDate =
                    String(
                        appointment.appointment_date ||
                        appointment.date ||
                        ""
                    ).substring(0, 10);

                return appointmentDate === todayDate;

            }
        );


        // Display today's appointments
        appointmentsToday.forEach(appointment => {

            const patientName =
                appointment.patient_name ||
                "Unknown Patient";

            const time =
                appointment.appointment_time ||
                appointment.time ||
                "--:--";


            const row = document.createElement("tr");


            const patientCell =
                document.createElement("td");

            patientCell.textContent = patientName;


            const timeCell =
                document.createElement("td");

            timeCell.textContent = time;


            row.appendChild(patientCell);

            row.appendChild(timeCell);

            todayAppointments.appendChild(row);

        });


        // If there are no appointments today
        if (appointmentsToday.length === 0) {

            const row = document.createElement("tr");

            const cell = document.createElement("td");

            cell.colSpan = 2;

            cell.textContent = "No appointments today.";

            row.appendChild(cell);

            todayAppointments.appendChild(row);

        }


    } catch (error) {

        console.error("Dashboard Error:", error);

        // Safe default values
        patientsCount.textContent = "0";

        doctorsCount.textContent = "0";

        appointmentsCount.textContent = "0";

        revenueCount.textContent = "0 DA";

        recentPatients.innerHTML = "";

        todayAppointments.innerHTML = "";

    }

}


// ===========================
// START
// ===========================

updateDashboard();