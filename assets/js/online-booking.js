const API_URL = "https://smilecare-r68s.onrender.com/api";

const bookingForm =
    document.getElementById("bookingForm");

const doctorSelect =
    document.getElementById("doctorSelect");

const appointmentDate =
    document.getElementById("appointmentDate");

const appointmentTime =
    document.getElementById("appointmentTime");

const successBox =
    document.getElementById("successBox");

const bookingCode =
    document.getElementById("bookingCode");

const printBooking =
    document.getElementById("printBooking");

const newBooking =
    document.getElementById("newBooking");

let bookingData = null;


// =====================================================
// LOAD DOCTORS
// =====================================================

async function loadDoctors() {

    try {

        const response =
            await fetch(`${API_URL}/dentists`);

        if (!response.ok) {
            throw new Error("Failed to load doctors");
        }

        const doctors =
            await response.json();

        doctorSelect.innerHTML = `
            <option value="">
                Select a doctor
            </option>
        `;

        doctors.forEach(doctor => {

            const option =
                document.createElement("option");

            option.value = doctor.id;

            option.textContent =
                `${doctor.first_name} ${doctor.last_name}`;

            doctorSelect.appendChild(option);
        });

    } catch (error) {

        console.error(error);

        alert(
            "Unable to load doctors. Please try again."
        );
    }
}


// =====================================================
// SET MINIMUM DATE
// =====================================================

function setMinimumDate() {

    const today = new Date();

    const year =
        today.getFullYear();

    const month =
        String(today.getMonth() + 1)
            .padStart(2, "0");

    const day =
        String(today.getDate())
            .padStart(2, "0");

    appointmentDate.min =
        `${year}-${month}-${day}`;
}


// =====================================================
// BOOK APPOINTMENT
// =====================================================

bookingForm.addEventListener(
    "submit",
    async event => {

        event.preventDefault();


        const data = {

            name:
                document
                    .getElementById("patientName")
                    .value
                    .trim(),

            phone:
                document
                    .getElementById("patientPhone")
                    .value
                    .trim(),

            email:
                document
                    .getElementById("patientEmail")
                    .value
                    .trim(),

            dentist_id:
                Number(doctorSelect.value),

            appointment_date:
                appointmentDate.value,

            appointment_time:
                appointmentTime.value,

            reason:
                document
                    .getElementById("appointmentReason")
                    .value
                    .trim()
        };


        if (
            !data.name ||
            !data.phone ||
            !data.dentist_id ||
            !data.appointment_date ||
            !data.appointment_time
        ) {

            alert(
                "Please fill all required fields."
            );

            return;
        }


        try {

            const response =
                await fetch(
                    `${API_URL}/online-bookings`,
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


            const result =
                await response.json();


            if (!response.ok) {

                throw new Error(
                    result.error ||
                    "Booking failed"
                );
            }


            bookingData =
                result.booking;


            bookingCode.textContent =
                result.booking_code;


            bookingForm.style.display =
                "none";

            successBox.style.display =
                "block";


        } catch (error) {

            console.error(error);

            alert(error.message);
        }
    }
);


// =====================================================
// PRINT BOOKING CARD
// =====================================================

printBooking.addEventListener(
    "click",
    () => {

        if (!bookingData) {
            return;
        }


        const doctorName =
            bookingData.dentist_name || "";


        const printWindow =
            window.open(
                "",
                "_blank",
                "width=700,height=800"
            );


        printWindow.document.write(`

            <!DOCTYPE html>

            <html>

            <head>

                <title>
                    SmileCare Appointment Card
                </title>

                <style>

                    * {
                        box-sizing: border-box;
                    }

                    body {
                        margin: 0;
                        padding: 30px;
                        font-family: Arial, sans-serif;
                        background: #ffffff;
                        color: #111827;
                    }

                    .card {
                        max-width: 600px;
                        margin: auto;
                        border: 2px solid #111827;
                        border-radius: 18px;
                        overflow: hidden;
                    }

                    .header {
                        text-align: center;
                        padding: 25px;
                        border-bottom: 1px solid #ddd;
                    }

                    .logo {
                        font-size: 40px;
                    }

                    .header h1 {
                        margin: 8px 0 4px;
                    }

                    .header p {
                        margin: 0;
                        color: #666;
                    }

                    .content {
                        padding: 25px;
                    }

                    .code {
                        text-align: center;
                        padding: 15px;
                        margin-bottom: 20px;
                        background: #f3f4f6;
                        border-radius: 10px;
                    }

                    .code strong {
                        display: block;
                        margin-top: 5px;
                        font-size: 24px;
                    }

                    .row {
                        display: flex;
                        justify-content: space-between;
                        gap: 20px;
                        padding: 12px 0;
                        border-bottom: 1px solid #eee;
                    }

                    .label {
                        color: #6b7280;
                    }

                    .value {
                        font-weight: bold;
                        text-align: right;
                    }

                    .footer {
                        text-align: center;
                        padding: 20px;
                        background: #f9fafb;
                        font-size: 13px;
                        color: #6b7280;
                    }

                    @media print {

                        body {
                            padding: 0;
                        }

                        .card {
                            border: 2px solid #000;
                        }
                    }

                </style>

            </head>

            <body>

                <div class="card">

                    <div class="header">

                        <div class="logo">
                            🦷
                        </div>

                        <h1>
                            SmileCare
                        </h1>

                        <p>
                            Dental Clinic
                        </p>

                    </div>


                    <div class="content">

                        <div class="code">

                            Booking Number

                            <strong>
                                ${bookingData.booking_code}
                            </strong>

                        </div>


                        <div class="row">

                            <span class="label">
                                Patient
                            </span>

                            <span class="value">
                                ${bookingData.name}
                            </span>

                        </div>


                        <div class="row">

                            <span class="label">
                                Phone
                            </span>

                            <span class="value">
                                ${bookingData.phone}
                            </span>

                        </div>


                        <div class="row">

                            <span class="label">
                                Doctor
                            </span>

                            <span class="value">
                                ${doctorName}
                            </span>

                        </div>


                        <div class="row">

                            <span class="label">
                                Date
                            </span>

                            <span class="value">
                                ${bookingData.appointment_date}
                            </span>

                        </div>


                        <div class="row">

                            <span class="label">
                                Time
                            </span>

                            <span class="value">
                                ${bookingData.appointment_time}
                            </span>

                        </div>


                        <div class="row">

                            <span class="label">
                                Status
                            </span>

                            <span class="value">
                                Pending Confirmation
                            </span>

                        </div>

                    </div>


                    <div class="footer">

                        Please keep this card and bring it
                        to SmileCare on your appointment day.

                    </div>

                </div>


                <script>

                    window.onload = function() {

                        window.print();

                    };

                <\/script>

            </body>

            </html>

        `);

        printWindow.document.close();
    }
);


// =====================================================
// NEW BOOKING
// =====================================================

newBooking.addEventListener(
    "click",
    () => {

        bookingForm.reset();

        bookingForm.style.display =
            "block";

        successBox.style.display =
            "none";

        bookingData = null;
    }
);


// =====================================================
// START
// =====================================================

setMinimumDate();

loadDoctors();
