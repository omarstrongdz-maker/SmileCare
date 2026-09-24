require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mysql = require("mysql2");

const fs = require("fs");

const app = express();

app.use(cors());
app.use(express.json());


// =====================================================
// MYSQL DATABASE CONNECTION
// =====================================================


const db = mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,

    ssl: {
        ca: fs.readFileSync(__dirname + "/certs/ca2.pem"),
        rejectUnauthorized: true
    },

    dateStrings: true
});

// =====================================================
// TEST DATABASE CONNECTION
// =====================================================

db.connect((err) => {
    if (err) {
        console.error("❌ MySQL connection failed:");
        console.error(err.message);
        return;
    }

    console.log("✅ MySQL connected successfully!");
});


// =====================================================
// HOME / TEST API
// =====================================================

app.get("/", (req, res) => {
    res.json({
        message: "SmileCare Backend is running!",
        database: "dental_clinic"
    });
});


// =====================================================
// ======================= PATIENTS =====================
// =====================================================


// -----------------------------------------------------
// GET ALL PATIENTS
// -----------------------------------------------------

app.get("/api/patients", (req, res) => {

    const sql = `
        SELECT
            p.id,
            p.first_name,
            p.last_name,
            p.phone,
            p.email,
            p.date_of_birth,
            p.address,
            p.medical_history,
            p.dentist_id,
            p.created_at,

            CONCAT(
                d.first_name,
                ' ',
                d.last_name
            ) AS doctor

        FROM patients p

        LEFT JOIN dentists d
            ON p.dentist_id = d.id

        ORDER BY p.id DESC
    `;

    db.query(sql, (err, results) => {

        if (err) {
            console.error("GET PATIENTS ERROR:", err);

            return res.status(500).json({
                error: "Failed to get patients"
            });
        }

        res.json(results);
    });
});


// -----------------------------------------------------
// GET ONE PATIENT
// -----------------------------------------------------

app.get("/api/patients/:id", (req, res) => {

    const id = req.params.id;

    const sql = `
        SELECT
            p.id,
            p.first_name,
            p.last_name,
            p.phone,
            p.email,
            p.date_of_birth,
            p.address,
            p.medical_history,
            p.dentist_id,
            p.created_at,

            CONCAT(
                d.first_name,
                ' ',
                d.last_name
            ) AS doctor

        FROM patients p

        LEFT JOIN dentists d
            ON p.dentist_id = d.id

        WHERE p.id = ?
    `;

    db.query(sql, [id], (err, results) => {

        if (err) {
            console.error("GET ONE PATIENT ERROR:", err);

            return res.status(500).json({
                error: "Failed to get patient"
            });
        }

        if (results.length === 0) {

            return res.status(404).json({
                error: "Patient not found"
            });
        }

        res.json(results[0]);
    });
});


// -----------------------------------------------------
// ADD PATIENT
// -----------------------------------------------------

app.post("/api/patients", (req, res) => {

    const {
        first_name,
        last_name,
        phone,
        email,
        date_of_birth,
        address,
        medical_history,
        dentist_id
    } = req.body;


    if (!first_name || !last_name) {

        return res.status(400).json({
            error: "First name and last name are required"
        });
    }


    const sql = `
        INSERT INTO patients
        (
            first_name,
            last_name,
            phone,
            email,
            date_of_birth,
            address,
            medical_history,
            dentist_id
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;


    const values = [
        first_name,
        last_name,
        phone || null,
        email || null,
        date_of_birth || null,
        address || null,
        medical_history || null,
        dentist_id || null
    ];


    db.query(sql, values, (err, result) => {

        if (err) {

            console.error("ADD PATIENT ERROR:", err);

            return res.status(500).json({
                error: "Failed to add patient"
            });
        }


        res.status(201).json({
            message: "Patient added successfully",
            id: result.insertId
        });

    });

});


// -----------------------------------------------------
// UPDATE PATIENT
// -----------------------------------------------------

app.put("/api/patients/:id", (req, res) => {

    const id = req.params.id;

    const {
        first_name,
        last_name,
        phone,
        email,
        date_of_birth,
        address,
        medical_history,
        dentist_id
    } = req.body;


    if (!first_name || !last_name) {

        return res.status(400).json({
            error: "First name and last name are required"
        });
    }


    const sql = `
        UPDATE patients

        SET
            first_name = ?,
            last_name = ?,
            phone = ?,
            email = ?,
            date_of_birth = ?,
            address = ?,
            medical_history = ?,
            dentist_id = ?

        WHERE id = ?
    `;


    const values = [
        first_name,
        last_name,
        phone || null,
        email || null,
        date_of_birth || null,
        address || null,
        medical_history || null,
        dentist_id || null,
        id
    ];


    db.query(sql, values, (err, result) => {

        if (err) {

            console.error("UPDATE PATIENT ERROR:", err);

            return res.status(500).json({
                error: "Failed to update patient"
            });
        }


        if (result.affectedRows === 0) {

            return res.status(404).json({
                error: "Patient not found"
            });
        }


        res.json({
            message: "Patient updated successfully"
        });

    });

});


// -----------------------------------------------------
// DELETE PATIENT
// -----------------------------------------------------
//
// This deletes the patient and his related records:
// appointments
// dental chart
// medical records
// payments
// treatments
//
// Payments are deleted before treatments because
// payments may reference treatments.
// -----------------------------------------------------

app.delete("/api/patients/:id", (req, res) => {

    const patientId = req.params.id;


    db.beginTransaction((transactionError) => {

        if (transactionError) {

            console.error(
                "START DELETE TRANSACTION ERROR:",
                transactionError
            );

            return res.status(500).json({
                error: "Failed to start delete transaction"
            });
        }


        const deletePayments = `
            DELETE FROM payments
            WHERE patient_id = ?
        `;


        db.query(
            deletePayments,
            [patientId],
            (err) => {

                if (err) {

                    return db.rollback(() => {

                        console.error(
                            "DELETE PAYMENTS ERROR:",
                            err
                        );

                        res.status(500).json({
                            error:
                                "Failed to delete patient payments"
                        });

                    });

                }


                const deleteMedicalRecords = `
                    DELETE FROM medical_records
                    WHERE patient_id = ?
                `;


                db.query(
                    deleteMedicalRecords,
                    [patientId],
                    (err) => {

                        if (err) {

                            return db.rollback(() => {

                                console.error(
                                    "DELETE MEDICAL RECORDS ERROR:",
                                    err
                                );

                                res.status(500).json({
                                    error:
                                        "Failed to delete patient medical records"
                                });

                            });

                        }


                        const deleteDentalChart = `
                            DELETE FROM dental_chart
                            WHERE patient_id = ?
                        `;


                        db.query(
                            deleteDentalChart,
                            [patientId],
                            (err) => {

                                if (err) {

                                    return db.rollback(() => {

                                        console.error(
                                            "DELETE DENTAL CHART ERROR:",
                                            err
                                        );

                                        res.status(500).json({
                                            error:
                                                "Failed to delete patient dental chart"
                                        });

                                    });

                                }


                                const deleteTreatments = `
                                    DELETE FROM treatments
                                    WHERE patient_id = ?
                                `;


                                db.query(
                                    deleteTreatments,
                                    [patientId],
                                    (err) => {

                                        if (err) {

                                            return db.rollback(() => {

                                                console.error(
                                                    "DELETE TREATMENTS ERROR:",
                                                    err
                                                );

                                                res.status(500).json({
                                                    error:
                                                        "Failed to delete patient treatments"
                                                });

                                            });

                                        }


                                        const deleteAppointments = `
                                            DELETE FROM appointments
                                            WHERE patient_id = ?
                                        `;


                                        db.query(
                                            deleteAppointments,
                                            [patientId],
                                            (err) => {

                                                if (err) {

                                                    return db.rollback(() => {

                                                        console.error(
                                                            "DELETE APPOINTMENTS ERROR:",
                                                            err
                                                        );

                                                        res.status(500).json({
                                                            error:
                                                                "Failed to delete patient appointments"
                                                        });

                                                    });

                                                }


                                                const deletePatient = `
                                                    DELETE FROM patients
                                                    WHERE id = ?
                                                `;


                                                db.query(
                                                    deletePatient,
                                                    [patientId],
                                                    (err, result) => {

                                                        if (err) {

                                                            return db.rollback(() => {

                                                                console.error(
                                                                    "DELETE PATIENT ERROR:",
                                                                    err
                                                                );

                                                                res.status(500).json({
                                                                    error:
                                                                        "Failed to delete patient"
                                                                });

                                                            });

                                                        }


                                                        if (
                                                            result.affectedRows === 0
                                                        ) {

                                                            return db.rollback(() => {

                                                                res.status(404).json({
                                                                    error:
                                                                        "Patient not found"
                                                                });

                                                            });

                                                        }


                                                        db.commit(
                                                            (commitError) => {

                                                                if (commitError) {

                                                                    return db.rollback(() => {

                                                                        console.error(
                                                                            "COMMIT DELETE ERROR:",
                                                                            commitError
                                                                        );

                                                                        res.status(500).json({
                                                                            error:
                                                                                "Failed to complete patient deletion"
                                                                        });

                                                                    });

                                                                }


                                                                res.json({
                                                                    message:
                                                                        "Patient and related records deleted successfully"
                                                                });

                                                            }
                                                        );

                                                    }
                                                );

                                            }
                                        );

                                    }
                                );

                            }
                        );

                    }
                );

            }
        );

    });

});



// =====================================================
// ======================= DOCTORS =====================
// =====================================================


// -----------------------------------------------------
// GET ALL DOCTORS
// -----------------------------------------------------

app.get("/api/dentists", (req, res) => {

    const sql = `
        SELECT
            id,
            first_name,
            last_name,
            phone,
            email,
            specialty,
            created_at

        FROM dentists

        ORDER BY id DESC
    `;


    db.query(sql, (err, results) => {

        if (err) {

            console.error("GET DENTISTS ERROR:", err);

            return res.status(500).json({
                error: "Failed to get dentists"
            });
        }


        const doctors = results.map((doctor) => ({

            ...doctor,

            status: "Active"

        }));


        res.json(doctors);

    });

});


// -----------------------------------------------------
// GET ONE DOCTOR
// -----------------------------------------------------

app.get("/api/dentists/:id", (req, res) => {

    const id = req.params.id;


    const sql = `
        SELECT
            id,
            first_name,
            last_name,
            phone,
            email,
            specialty,
            created_at

        FROM dentists

        WHERE id = ?
    `;


    db.query(sql, [id], (err, results) => {

        if (err) {

            console.error("GET ONE DENTIST ERROR:", err);

            return res.status(500).json({
                error: "Failed to get dentist"
            });
        }


        if (results.length === 0) {

            return res.status(404).json({
                error: "Dentist not found"
            });
        }


        res.json({
            ...results[0],
            status: "Active"
        });

    });

});


// -----------------------------------------------------
// ADD DOCTOR
// -----------------------------------------------------
// =====================================================
// ADMIN - ADD DOCTOR + CREATE LOGIN ACCOUNT
// =====================================================

app.post("/api/dentists", (req, res) => {

    const {
        first_name,
        last_name,
        phone,
        email,
        specialty,
        username,
        password
    } = req.body;


    // -----------------------------------------
    // Validate required fields
    // -----------------------------------------

    if (
        !first_name ||
        !first_name.trim() ||
        !last_name ||
        !last_name.trim() ||
        !username ||
        !username.trim() ||
        !password ||
        !password.trim()
    ) {
        return res.status(400).json({
            error:
                "الاسم الأول واسم العائلة واسم المستخدم وكلمة المرور مطلوبة."
        });
    }


    const cleanFirstName =
        first_name.trim();

    const cleanLastName =
        last_name.trim();

    const cleanPhone =
        phone
            ? phone.trim()
            : null;

    const cleanEmail =
        email
            ? email.trim()
            : null;

    const cleanSpecialty =
        specialty
            ? specialty.trim()
            : null;

    const cleanUsername =
        username.trim();

    const cleanPassword =
        password.trim();


    // -----------------------------------------
    // Check username
    // -----------------------------------------

    const usernameSql = `
        SELECT
            id
        FROM users
        WHERE username = ?
        LIMIT 1
    `;


    db.query(
        usernameSql,
        [cleanUsername],
        (usernameError, usernameResults) => {

            if (usernameError) {

                console.error(
                    "ADD DOCTOR - USERNAME CHECK ERROR:",
                    usernameError
                );

                return res.status(500).json({
                    error:
                        "تعذر التحقق من اسم المستخدم."
                });
            }


            if (usernameResults.length > 0) {

                return res.status(409).json({
                    error:
                        "اسم المستخدم مستخدم بالفعل."
                });
            }


            // -----------------------------------------
            // Create doctor
            // -----------------------------------------

            const dentistSql = `
                INSERT INTO dentists
                (
                    first_name,
                    last_name,
                    phone,
                    email,
                    specialty
                )
                VALUES (?, ?, ?, ?, ?)
            `;


            db.query(
                dentistSql,
                [
                    cleanFirstName,
                    cleanLastName,
                    cleanPhone,
                    cleanEmail,
                    cleanSpecialty
                ],
                (dentistError, dentistResult) => {

                    if (dentistError) {

                        console.error(
                            "ADD DOCTOR ERROR:",
                            dentistError
                        );

                        return res.status(500).json({
                            error:
                                "تعذر إضافة الطبيب."
                        });
                    }


                    const dentistId =
                        dentistResult.insertId;


                    // -----------------------------------------
                    // Create linked login account
                    // -----------------------------------------

                    const accountSql = `
                        INSERT INTO users
                        (
                            username,
                            password,
                            role,
                            dentist_id
                        )
                        VALUES (?, ?, 'dentist', ?)
                    `;


                    db.query(
                        accountSql,
                        [
                            cleanUsername,
                            cleanPassword,
                            dentistId
                        ],
                        (accountError, accountResult) => {

                            if (accountError) {

                                console.error(
                                    "ADD DOCTOR - ACCOUNT ERROR:",
                                    accountError
                                );


                                // Rollback doctor
                                db.query(
                                    `
                                        DELETE FROM dentists
                                        WHERE id = ?
                                    `,
                                    [dentistId],
                                    () => {}
                                );


                                return res.status(500).json({
                                    error:
                                        "تعذر إنشاء حساب الطبيب، وتم إلغاء إضافة الطبيب."
                                });
                            }


                            // -----------------------------------------
                            // Success
                            // -----------------------------------------

                            return res.status(201).json({

                                success: true,

                                message:
                                    "تمت إضافة الطبيب وإنشاء حساب الدخول بنجاح.",

                                dentist: {
                                    id:
                                        dentistId,

                                    first_name:
                                        cleanFirstName,

                                    last_name:
                                        cleanLastName,

                                    phone:
                                        cleanPhone,

                                    email:
                                        cleanEmail,

                                    specialty:
                                        cleanSpecialty
                                },

                                account: {
                                    id:
                                        accountResult.insertId,

                                    username:
                                        cleanUsername,

                                    role:
                                        "dentist",

                                    dentist_id:
                                        dentistId
                                }

                            });

                        }
                    );

                }
            );

        }
    );

});

// -----------------------------------------------------
// UPDATE DOCTOR
// -----------------------------------------------------

app.put("/api/dentists/:id", (req, res) => {

    const id = req.params.id;


    const {
        first_name,
        last_name,
        phone,
        email,
        specialty
    } = req.body;


    if (!first_name || !last_name) {

        return res.status(400).json({
            error: "First name and last name are required"
        });
    }


    const sql = `
        UPDATE dentists

        SET
            first_name = ?,
            last_name = ?,
            phone = ?,
            email = ?,
            specialty = ?

        WHERE id = ?
    `;


    db.query(
        sql,
        [
            first_name,
            last_name,
            phone || null,
            email || null,
            specialty || null,
            id
        ],
        (err, result) => {

            if (err) {

                console.error("UPDATE DENTIST ERROR:", err);

                return res.status(500).json({
                    error: "Failed to update dentist"
                });
            }


            if (result.affectedRows === 0) {

                return res.status(404).json({
                    error: "Dentist not found"
                });
            }


            res.json({
                message: "Dentist updated successfully"
            });

        }
    );

});


// -----------------------------------------------------
// DELETE DOCTOR
// -----------------------------------------------------

// -----------------------------------------------------
// DELETE DOCTOR
// -----------------------------------------------------

app.delete(
    "/api/dentists/:id",
    (req, res) => {

        const doctorId =
            Number(req.params.id);


        if (
            !doctorId ||
            Number.isNaN(doctorId)
        ) {

            return res.status(400).json({
                message:
                    "معرف الطبيب غير صالح."
            });

        }


        /*
         * أولًا نتأكد أن الطبيب موجود
         */

        const doctorSql = `
            SELECT
                id,
                first_name,
                last_name
            FROM dentists
            WHERE id = ?
            LIMIT 1
        `;


        db.query(
            doctorSql,
            [doctorId],
            (doctorError, doctors) => {

                if (doctorError) {

                    console.error(
                        "DELETE DOCTOR - FIND ERROR:",
                        doctorError
                    );

                    return res.status(500).json({
                        message:
                            "تعذر التحقق من الطبيب."
                    });

                }


                if (!doctors.length) {

                    return res.status(404).json({
                        message:
                            "الطبيب غير موجود."
                    });

                }


                /*
                 * نتحقق من وجود مواعيد
                 */

                const appointmentsSql = `
                    SELECT
                        COUNT(*) AS total
                    FROM appointments
                    WHERE dentist_id = ?
                `;


                db.query(
                    appointmentsSql,
                    [doctorId],
                    (appointmentsError, appointmentResult) => {

                        if (appointmentsError) {

                            console.error(
                                "DELETE DOCTOR - APPOINTMENTS ERROR:",
                                appointmentsError
                            );

                            return res.status(500).json({
                                message:
                                    "تعذر التحقق من مواعيد الطبيب."
                            });

                        }


                        const appointmentCount =
                            Number(
                                appointmentResult[0]?.total || 0
                            );


                        if (
                            appointmentCount > 0
                        ) {

                            return res.status(409).json({
                                message:
                                    "لا يمكن حذف هذا الطبيب لأنه مرتبط بمواعيد مسجلة في النظام. استخدم التعديل بدل الحذف للحفاظ على السجل."
                            });

                        }


                        /*
                         * إذا لم توجد مواعيد،
                         * نحذف الطبيب.
                         *
                         * العلاقات التي تستخدم
                         * ON DELETE SET NULL / CASCADE
                         * ستتعامل مع السجلات المرتبطة.
                         */

                        const deleteSql = `
                            DELETE FROM dentists
                            WHERE id = ?
                        `;


                        db.query(
                            deleteSql,
                            [doctorId],
                            (deleteError, result) => {

                                if (deleteError) {

                                    console.error(
                                        "DELETE DOCTOR ERROR:",
                                        deleteError
                                    );

                                    return res.status(500).json({
                                        message:
                                            "تعذر حذف الطبيب. قد توجد بيانات مرتبطة تمنع الحذف."
                                    });

                                }


                                if (
                                    result.affectedRows === 0
                                ) {

                                    return res.status(404).json({
                                        message:
                                            "الطبيب غير موجود."
                                    });

                                }


                                res.json({

                                    success:true,

                                    message:
                                        "تم حذف الطبيب بنجاح."

                                });

                            }
                        );

                    }
                );

            }
        );

    }
);



app.get("/api/admin/doctors", (req, res) => {

    const sql = `
        SELECT
            d.id,
            d.first_name,
            d.last_name,
            d.phone,
            d.email,
            d.specialty,
            d.created_at,

            u.id AS user_id,
            u.username,
            u.role AS user_role,

            dw.id AS work_day_id,
            dw.work_date,
            dw.start_time,
            dw.end_time,
            dw.status AS work_status

        FROM dentists d

        LEFT JOIN users u
            ON u.dentist_id = d.id
            AND u.role = 'dentist'

        LEFT JOIN doctor_work_days dw
            ON dw.dentist_id = d.id
            AND dw.work_date = CURDATE()

        ORDER BY
            d.id ASC
    `;

    db.query(sql, (err, results) => {

        if (err) {

            console.error(
                "ADMIN DOCTORS ERROR:",
                err
            );

            return res.status(500).json({
                message:
                    "تعذر تحميل بيانات الأطباء."
            });
        }

        const doctors = results.map(doctor => ({

            ...doctor,

            name:
                `${doctor.first_name || ""} ${doctor.last_name || ""}`
                .trim(),

            work_status:
                doctor.work_status ||
                "not_started",

            work_status_label:
                doctor.work_status === "working"
                    ? "يعمل الآن"
                    : doctor.work_status === "temporarily_unavailable"
                    ? "غير متاح مؤقتًا"
                    : doctor.work_status === "closed"
                    ? "أنهى الدوام"
                    : "لم يبدأ الدوام",

            account_status:
                doctor.user_id
                    ? "مرتبط"
                    : "بدون حساب"

        }));

        res.json(doctors);
    });
});




// =========================================================
// ADMIN - CREATE DOCTOR ACCOUNT
// =========================================================

app.post("/api/admin/doctors/:doctorId/account", (req, res) => {

    const doctorId = Number(req.params.doctorId);

    const {
        username,
        password
    } = req.body;

    // -----------------------------------------
    // Validate doctor ID
    // -----------------------------------------

    if (!doctorId || Number.isNaN(doctorId)) {

        return res.status(400).json({
            message: "معرف الطبيب غير صالح."
        });

    }

    // -----------------------------------------
    // Validate username and password
    // -----------------------------------------

    if (!username || !username.trim()) {

        return res.status(400).json({
            message: "اسم المستخدم مطلوب."
        });

    }

    if (!password || !password.trim()) {

        return res.status(400).json({
            message: "كلمة المرور مطلوبة."
        });

    }

    const cleanUsername =
        username.trim();

    const cleanPassword =
        password.trim();


    // -----------------------------------------
    // Check doctor exists
    // -----------------------------------------

    const doctorSql = `
        SELECT
            id,
            first_name,
            last_name
        FROM dentists
        WHERE id = ?
        LIMIT 1
    `;

    db.query(
        doctorSql,
        [doctorId],
        (doctorErr, doctorResults) => {

            if (doctorErr) {

                console.error(
                    "CREATE DOCTOR ACCOUNT - DOCTOR ERROR:",
                    doctorErr
                );

                return res.status(500).json({
                    message:
                        "تعذر التحقق من بيانات الطبيب."
                });

            }


            if (!doctorResults.length) {

                return res.status(404).json({
                    message:
                        "الطبيب غير موجود."
                });

            }


            // -----------------------------------------
            // Check if doctor already has an account
            // -----------------------------------------

            const linkedAccountSql = `
                SELECT
                    id,
                    username
                FROM users
                WHERE dentist_id = ?
                AND role = 'dentist'
                LIMIT 1
            `;

            db.query(
                linkedAccountSql,
                [doctorId],
                (accountErr, accountResults) => {

                    if (accountErr) {

                        console.error(
                            "CREATE DOCTOR ACCOUNT - LINKED ACCOUNT ERROR:",
                            accountErr
                        );

                        return res.status(500).json({
                            message:
                                "تعذر التحقق من حساب الطبيب."
                        });

                    }


                    if (accountResults.length) {

                        return res.status(409).json({
                            message:
                                "هذا الطبيب لديه حساب بالفعل."
                        });

                    }


                    // -----------------------------------------
                    // Check username is unique
                    // -----------------------------------------

                    const usernameSql = `
                        SELECT
                            id,
                            username
                        FROM users
                        WHERE username = ?
                        LIMIT 1
                    `;

                    db.query(
                        usernameSql,
                        [cleanUsername],
                        (usernameErr, usernameResults) => {

                            if (usernameErr) {

                                console.error(
                                    "CREATE DOCTOR ACCOUNT - USERNAME ERROR:",
                                    usernameErr
                                );

                                return res.status(500).json({
                                    message:
                                        "تعذر التحقق من اسم المستخدم."
                                });

                            }


                            if (usernameResults.length) {

                                return res.status(409).json({
                                    message:
                                        "اسم المستخدم مستخدم بالفعل."
                                });

                            }


                            // -----------------------------------------
                            // Create doctor account
                            // -----------------------------------------

                            const insertSql = `
                                INSERT INTO users
                                    (
                                        username,
                                        password,
                                        role,
                                        dentist_id
                                    )
                                VALUES
                                    (
                                        ?,
                                        ?,
                                        'dentist',
                                        ?
                                    )
                            `;

                            db.query(
                                insertSql,
                                [
                                    cleanUsername,
                                    cleanPassword,
                                    doctorId
                                ],
                                (insertErr, result) => {

                                    if (insertErr) {

                                        console.error(
                                            "CREATE DOCTOR ACCOUNT - INSERT ERROR:",
                                            insertErr
                                        );

                                        return res.status(500).json({
                                            message:
                                                "تعذر إنشاء حساب الطبيب."
                                        });

                                    }


                                    return res.status(201).json({

                                        success: true,

                                        message:
                                            "تم إنشاء حساب الطبيب وربطه بنجاح.",

                                        account: {
                                            id: result.insertId,
                                            username: cleanUsername,
                                            role: "dentist",
                                            dentist_id: doctorId
                                        }

                                    });

                                }
                            );

                        }
                    );

                }
            );

        }
    );

});




// =========================================================
// ADMIN - DOCTOR ABSENCE / TODAY APPOINTMENTS
// =========================================================

app.get("/api/admin/doctors/:doctorId/absence", (req, res) => {

    const doctorId = Number(req.params.doctorId);

    if (!doctorId || Number.isNaN(doctorId)) {
        return res.status(400).json({
            message: "معرف الطبيب غير صالح."
        });
    }

    const doctorSql = `
        SELECT
            d.id,
            CONCAT(
                d.first_name,
                ' ',
                d.last_name
            ) AS name,
            d.specialty,

            dw.status AS work_status,
            dw.start_time,
            dw.end_time

        FROM dentists d

        LEFT JOIN doctor_work_days dw
            ON dw.dentist_id = d.id
            AND dw.work_date = CURDATE()

        WHERE d.id = ?

        LIMIT 1
    `;

    db.query(
        doctorSql,
        [doctorId],
        (doctorErr, doctorResults) => {

            if (doctorErr) {
                console.error(
                    "ADMIN DOCTOR ABSENCE DOCTOR ERROR:",
                    doctorErr
                );

                return res.status(500).json({
                    message:
                        "تعذر تحميل بيانات الطبيب."
                });
            }

            if (!doctorResults.length) {
                return res.status(404).json({
                    message:
                        "الطبيب غير موجود."
                });
            }

            const doctor = {
                id: doctorResults[0].id,
                name: doctorResults[0].name,
                specialty: doctorResults[0].specialty,
                work_status:
                    doctorResults[0].work_status ||
                    "not_started",
                start_time:
                    doctorResults[0].start_time,
                end_time:
                    doctorResults[0].end_time
            };

            /*
             * نبحث عن:
             * 1. مواعيد الطبيب المجدولة اليوم
             * 2. المواعيد المرتبطة بإجراءات غياب سابقة
             */
            const appointmentsSql = `
                SELECT DISTINCT

                    a.id,
                    a.patient_id,
                    a.dentist_id,
                    a.appointment_date,
                    a.appointment_time,
                    a.reason,
                    a.status,

                    CONCAT(
                        p.first_name,
                        ' ',
                        p.last_name
                    ) AS patient_name,

                    p.phone AS patient_phone,

                    CASE
                        WHEN a.appointment_date = CURDATE()
                        THEN 1
                        ELSE 0
                    END AS is_today,

                    CASE
                        WHEN daa.id IS NOT NULL
                        THEN 1
                        ELSE 0
                    END AS has_absence_action,

                    daa.id AS absence_action_id,
                    daa.action_type,
                    daa.reason AS absence_reason,
                    daa.patient_contacted,
                    daa.notes AS absence_notes

                FROM appointments a

                LEFT JOIN patients p
                    ON p.id = a.patient_id

                LEFT JOIN doctor_absence_actions daa
                    ON daa.appointment_id = a.id

                WHERE
                    (
                        (
                            a.dentist_id = ?
                            AND a.appointment_date = CURDATE()
                            AND a.status = 'scheduled'
                        )

                        OR

                        (
                            daa.dentist_id = ?
                            AND daa.appointment_id = a.id
                        )
                    )

                ORDER BY
                    a.appointment_date ASC,
                    a.appointment_time ASC,
                    a.id ASC
            `;

            db.query(
                appointmentsSql,
                [
                    doctorId,
                    doctorId
                ],
                (appointmentsErr, results) => {

                    if (appointmentsErr) {
                        console.error(
                            "ADMIN DOCTOR ABSENCE APPOINTMENTS ERROR:",
                            appointmentsErr
                        );

                        return res.status(500).json({
                            message:
                                "تعذر تحميل مواعيد الطبيب."
                        });
                    }

                    const appointments =
                        results.map(item => ({
                            id: item.id,
                            patient_id: item.patient_id,
                            dentist_id: item.dentist_id,

                            patient_name:
                                item.patient_name ||
                                "غير معروف",

                            patient_phone:
                                item.patient_phone ||
                                null,

                            appointment_date:
                                item.appointment_date,

                            appointment_time:
                                item.appointment_time,

                            reason:
                                item.reason ||
                                "بدون سبب محدد",

                            status:
                                item.status,

                            is_today:
                                Boolean(item.is_today),

                            has_absence_action:
                                Boolean(
                                    item.has_absence_action
                                ),

                            absence_action_id:
                                item.absence_action_id,

                            action_type:
                                item.action_type,

                            absence_reason:
                                item.absence_reason,

                            patient_contacted:
                                Boolean(
                                    item.patient_contacted
                                ),

                            absence_notes:
                                item.absence_notes
                        }));

                    /*
                     * المواعيد التي تحتاج تدخلًا فعليًا
                     */
                    const affectedAppointments =
                        appointments.filter(item => {

                            if (
                                item.has_absence_action
                            ) {
                                return false;
                            }

                            return (
                                item.is_today &&
                                item.status ===
                                    "scheduled"
                            );
                        });

                    /*
                     * آخر إجراءات الغياب للطبيب
                     */
                    const actionsSql = `
                        SELECT

                            daa.id,
                            daa.absence_date,
                            daa.reason,
                            daa.action_type,
                            daa.appointment_id,
                            daa.new_dentist_id,
                            daa.new_appointment_date,
                            daa.new_appointment_time,
                            daa.patient_contacted,
                            daa.notes,

                            CONCAT(
                                nd.first_name,
                                ' ',
                                nd.last_name
                            ) AS new_dentist_name

                        FROM doctor_absence_actions daa

                        LEFT JOIN dentists nd
                            ON nd.id =
                                daa.new_dentist_id

                        WHERE daa.dentist_id = ?

                        ORDER BY
                            daa.id DESC

                        LIMIT 20
                    `;

                    db.query(
                        actionsSql,
                        [doctorId],
                        (actionsErr, actions) => {

                            if (actionsErr) {
                                console.error(
                                    "ADMIN DOCTOR ABSENCE ACTIONS ERROR:",
                                    actionsErr
                                );

                                return res.status(500).json({
                                    message:
                                        "تعذر تحميل سجل إجراءات الغياب."
                                });
                            }

                            const hasTodayProblem =
                                doctor.work_status ===
                                    "not_started" &&
                                affectedAppointments.length >
                                    0;

                            res.json({

                                doctor,

                                appointments,

                                affectedAppointments,

                                actions,

                                summary: {

                                    totalAppointments:
                                        appointments.length,

                                    affectedAppointments:
                                        affectedAppointments.length,

                                    previousActions:
                                        actions.length,

                                    requiresAction:
                                        hasTodayProblem

                                }

                            });

                        }
                    );

                }
            );

        }
    );

});

// =====================================================
// ADMIN - MANAGE DOCTOR ABSENCE
// =====================================================

app.post(
    "/api/admin/doctors/:doctorId/absence/action",
    (req, res) => {

        const doctorId =
            Number(req.params.doctorId);

        const {
            absence_date,
            reason,
            action_type,
            appointment_id,
            new_dentist_id,
            new_appointment_date,
            new_appointment_time,
            patient_contacted,
            notes
        } = req.body;

        if (
            !doctorId ||
            Number.isNaN(doctorId)
        ) {
            return res.status(400).json({
                message:
                    "معرف الطبيب غير صالح."
            });
        }

        const allowedActions = [
            "reschedule",
            "transfer",
            "cancel",
            "contact_patient",
            "other"
        ];

        if (
            !action_type ||
            !allowedActions.includes(
                action_type
            )
        ) {
            return res.status(400).json({
                message:
                    "نوع الإجراء الإداري غير صالح."
            });
        }

        const cleanDate =
            absence_date ||
            new Date()
                .toISOString()
                .split("T")[0];

        const cleanReason =
            reason ||
            null;

        const cleanAppointmentId =
            appointment_id
                ? Number(appointment_id)
                : null;

        const cleanNewDentistId =
            new_dentist_id
                ? Number(new_dentist_id)
                : null;

        const cleanContacted =
            patient_contacted
                ? 1
                : 0;

        // -------------------------------------------------
        // 1. التحقق من الطبيب
        // -------------------------------------------------

        const doctorSql = `
            SELECT
                id,
                first_name,
                last_name
            FROM dentists
            WHERE id = ?
            LIMIT 1
        `;

        db.query(
            doctorSql,
            [doctorId],
            (doctorErr, doctorResults) => {

                if (doctorErr) {

                    console.error(
                        "ABSENCE ACTION - DOCTOR ERROR:",
                        doctorErr
                    );

                    return res.status(500).json({
                        message:
                            "تعذر التحقق من الطبيب."
                    });
                }

                if (!doctorResults.length) {

                    return res.status(404).json({
                        message:
                            "الطبيب غير موجود."
                    });
                }

                // -------------------------------------------------
                // 2. إذا كان هناك موعد، نتحقق من وجوده
                // -------------------------------------------------

                if (!cleanAppointmentId) {

                    return saveAbsenceAction();

                }

                const appointmentSql = `
                    SELECT
                        id,
                        patient_id,
                        dentist_id,
                        appointment_date,
                        appointment_time,
                        status
                    FROM appointments
                    WHERE id = ?
                    LIMIT 1
                `;

                db.query(
                    appointmentSql,
                    [cleanAppointmentId],
                    (appointmentErr, appointmentResults) => {

                        if (appointmentErr) {

                            console.error(
                                "ABSENCE ACTION - APPOINTMENT ERROR:",
                                appointmentErr
                            );

                            return res.status(500).json({
                                message:
                                    "تعذر التحقق من الموعد."
                            });
                        }

                        if (
                            !appointmentResults.length
                        ) {

                            return res.status(404).json({
                                message:
                                    "الموعد غير موجود."
                            });
                        }

                        const appointment =
                            appointmentResults[0];

                        if (
                            Number(
                                appointment.dentist_id
                            ) !== doctorId
                        ) {

                            return res.status(400).json({
                                message:
                                    "هذا الموعد لا يتبع للطبيب المحدد."
                            });
                        }

                        saveAbsenceAction();
                    }
                );

                // -------------------------------------------------
                // 3. حفظ القرار الإداري
                // -------------------------------------------------

                function saveAbsenceAction() {

                    const insertSql = `
                        INSERT INTO doctor_absence_actions
                        (
                            dentist_id,
                            absence_date,
                            reason,
                            action_type,
                            appointment_id,
                            new_dentist_id,
                            new_appointment_date,
                            new_appointment_time,
                            patient_contacted,
                            notes
                        )
                        VALUES
                        (
                            ?,
                            ?,
                            ?,
                            ?,
                            ?,
                            ?,
                            ?,
                            ?,
                            ?,
                            ?
                        )
                    `;

                    const values = [
                        doctorId,
                        cleanDate,
                        cleanReason,
                        action_type,
                        cleanAppointmentId,
                        cleanNewDentistId,
                        new_appointment_date ||
                            null,
                        new_appointment_time ||
                            null,
                        cleanContacted,
                        notes || null
                    ];

                    db.query(
                        insertSql,
                        values,
                        (
                            insertErr,
                            result
                        ) => {

                            if (insertErr) {

                                console.error(
                                    "ABSENCE ACTION - INSERT ERROR:",
                                    insertErr
                                );

                                return res.status(500).json({
                                    message:
                                        "تعذر حفظ الإجراء الإداري."
                                });
                            }

                            // -----------------------------------------
                            // إذا كان الإجراء إلغاء الموعد
                            // -----------------------------------------

                            if (
                                action_type ===
                                "cancel" &&
                                cleanAppointmentId
                            ) {

                                const cancelSql = `
                                    UPDATE appointments
                                    SET status = 'cancelled'
                                    WHERE id = ?
                                `;

                                return db.query(
                                    cancelSql,
                                    [
                                        cleanAppointmentId
                                    ],
                                    (
                                        cancelErr
                                    ) => {

                                        if (
                                            cancelErr
                                        ) {

                                            console.error(
                                                "ABSENCE ACTION - CANCEL ERROR:",
                                                cancelErr
                                            );

                                            return res.status(
                                                500
                                            ).json({
                                                message:
                                                    "تم حفظ الإجراء لكن تعذر إلغاء الموعد."
                                            });
                                        }

                                        return res.status(
                                            201
                                        ).json({
                                            success: true,
                                            message:
                                                "تم تسجيل الغياب وإلغاء الموعد بنجاح.",
                                            action_id:
                                                result.insertId
                                        });
                                    }
                                );
                            }

                            // -----------------------------------------
                            // إذا كان الإجراء تحويل الموعد
                            // -----------------------------------------

                            if (
                                action_type ===
                                    "transfer" &&
                                cleanAppointmentId &&
                                cleanNewDentistId
                            ) {

                                const transferSql = `
                                    UPDATE appointments
                                    SET dentist_id = ?
                                    WHERE id = ?
                                `;

                                return db.query(
                                    transferSql,
                                    [
                                        cleanNewDentistId,
                                        cleanAppointmentId
                                    ],
                                    (
                                        transferErr
                                    ) => {

                                        if (
                                            transferErr
                                        ) {

                                            console.error(
                                                "ABSENCE ACTION - TRANSFER ERROR:",
                                                transferErr
                                            );

                                            return res.status(
                                                500
                                            ).json({
                                                message:
                                                    "تم حفظ الإجراء لكن تعذر تحويل الموعد."
                                            });
                                        }

                                        return res.status(
                                            201
                                        ).json({
                                            success: true,
                                            message:
                                                "تم تسجيل الغياب وتحويل الموعد بنجاح.",
                                            action_id:
                                                result.insertId
                                        });
                                    }
                                );
                            }

                            // -----------------------------------------
                            // إعادة الجدولة
                            // -----------------------------------------

                            if (
                                action_type ===
                                    "reschedule" &&
                                cleanAppointmentId &&
                                new_appointment_date &&
                                new_appointment_time
                            ) {

                                const rescheduleSql = `
                                    UPDATE appointments
                                    SET
                                        appointment_date = ?,
                                        appointment_time = ?
                                    WHERE id = ?
                                `;

                                return db.query(
                                    rescheduleSql,
                                    [
                                        new_appointment_date,
                                        new_appointment_time,
                                        cleanAppointmentId
                                    ],
                                    (
                                        rescheduleErr
                                    ) => {

                                        if (
                                            rescheduleErr
                                        ) {

                                            console.error(
                                                "ABSENCE ACTION - RESCHEDULE ERROR:",
                                                rescheduleErr
                                            );

                                            return res.status(
                                                500
                                            ).json({
                                                message:
                                                    "تم حفظ الإجراء لكن تعذر إعادة جدولة الموعد."
                                            });
                                        }

                                        return res.status(
                                            201
                                        ).json({
                                            success: true,
                                            message:
                                                "تم تسجيل الغياب وإعادة جدولة الموعد بنجاح.",
                                            action_id:
                                                result.insertId
                                        });
                                    }
                                );
                            }

                            // -----------------------------------------
                            // باقي الإجراءات
                            // -----------------------------------------

                            return res.status(
                                201
                            ).json({
                                success: true,
                                message:
                                    "تم تسجيل الإجراء الإداري بنجاح.",
                                action_id:
                                    result.insertId
                            });
                        }
                    );
                }
            }
        );
    }
);




app.get("/api/admin/doctor-leaves", (req, res) => {

    const sql = `
        SELECT
            dl.id,
            dl.dentist_id,
            dl.start_date,
            dl.end_date,
            dl.reason,
            dl.status,
            dl.admin_notes,
            dl.decided_by,
            dl.decided_at,
            dl.created_at,

            CONCAT(
                d.first_name,
                ' ',
                d.last_name
            ) AS doctor_name,

            d.specialty,

            u.username AS decided_by_username

        FROM doctor_leave_requests dl

        INNER JOIN dentists d
            ON d.id = dl.dentist_id

        LEFT JOIN users u
            ON u.id = dl.decided_by

        ORDER BY
            CASE
                WHEN dl.status = 'pending' THEN 1
                WHEN dl.status = 'approved' THEN 2
                WHEN dl.status = 'rejected' THEN 3
                ELSE 4
            END,
            dl.start_date ASC,
            dl.id DESC
    `;

    db.query(sql, (err, results) => {

        if (err) {

            console.error(
                "ADMIN DOCTOR LEAVES ERROR:",
                err
            );

            return res.status(500).json({
                message:
                    "تعذر تحميل طلبات إجازات الأطباء."
            });
        }

        const requests = results.map(item => ({

            ...item,

            doctor_name:
                item.doctor_name ||
                "طبيب غير معروف",

            status_label:
                item.status === "pending"
                    ? "قيد الانتظار"
                    : item.status === "approved"
                    ? "مقبول"
                    : item.status === "rejected"
                    ? "مرفوض"
                    : "غير معروف"

        }));

        const summary = {

            total:
                requests.length,

            pending:
                requests.filter(
                    item =>
                        item.status === "pending"
                ).length,

            approved:
                requests.filter(
                    item =>
                        item.status === "approved"
                ).length,

            rejected:
                requests.filter(
                    item =>
                        item.status === "rejected"
                ).length

        };

        res.json({
            summary,
            requests
        });

    });

});


app.put("/api/admin/doctor-leaves/:leaveId/decision", (req, res) => {

    const leaveId = Number(req.params.leaveId);

    const {
        status,
        admin_notes,
        decided_by
    } = req.body;

    if (!leaveId || Number.isNaN(leaveId)) {
        return res.status(400).json({
            message: "معرف طلب الإجازة غير صالح."
        });
    }

    if (!["approved", "rejected"].includes(status)) {
        return res.status(400).json({
            message:
                "حالة القرار يجب أن تكون approved أو rejected."
        });
    }

    const adminId =
        decided_by
            ? Number(decided_by)
            : null;

    const findSql = `
        SELECT
            id,
            dentist_id,
            start_date,
            end_date,
            status
        FROM doctor_leave_requests
        WHERE id = ?
        LIMIT 1
    `;

    db.query(
        findSql,
        [leaveId],
        (findErr, results) => {

            if (findErr) {

                console.error(
                    "DOCTOR LEAVE FIND ERROR:",
                    findErr
                );

                return res.status(500).json({
                    message:
                        "تعذر التحقق من طلب الإجازة."
                });
            }

            if (!results.length) {

                return res.status(404).json({
                    message:
                        "طلب الإجازة غير موجود."
                });
            }

            const leave = results[0];

            if (leave.status !== "pending") {

                return res.status(409).json({
                    message:
                        "تم اتخاذ قرار بشأن طلب الإجازة مسبقًا."
                });
            }

            const updateSql = `
                UPDATE doctor_leave_requests
                SET
                    status = ?,
                    admin_notes = ?,
                    decided_by = ?,
                    decided_at = NOW()
                WHERE id = ?
            `;

            db.query(
                updateSql,
                [
                    status,
                    admin_notes || null,
                    adminId,
                    leaveId
                ],
                (updateErr, result) => {

                    if (updateErr) {

                        console.error(
                            "DOCTOR LEAVE DECISION ERROR:",
                            updateErr
                        );

                        return res.status(500).json({
                            message:
                                "تعذر حفظ قرار الإجازة."
                        });
                    }

                    return res.json({
                        success: true,

                        message:
                            status === "approved"
                                ? "تمت الموافقة على طلب الإجازة."
                                : "تم رفض طلب الإجازة.",

                        leave: {
                            id: leaveId,
                            dentist_id:
                                leave.dentist_id,
                            status
                        }
                    });

                }
            );

        }
    );

});


app.get("/api/admin/doctor-leaves/:leaveId/conflicts", (req, res) => {

    const leaveId = Number(req.params.leaveId);

    if (!leaveId || Number.isNaN(leaveId)) {
        return res.status(400).json({
            message: "معرف طلب الإجازة غير صالح."
        });
    }

    const leaveSql = `
        SELECT
            dl.id,
            dl.dentist_id,
            dl.start_date,
            dl.end_date,
            dl.reason,
            dl.status,

            CONCAT(
                d.first_name,
                ' ',
                d.last_name
            ) AS doctor_name

        FROM doctor_leave_requests dl

        INNER JOIN dentists d
            ON d.id = dl.dentist_id

        WHERE dl.id = ?

        LIMIT 1
    `;

    db.query(
        leaveSql,
        [leaveId],
        (leaveErr, leaveResults) => {

            if (leaveErr) {

                console.error(
                    "DOCTOR LEAVE CONFLICT LEAVE ERROR:",
                    leaveErr
                );

                return res.status(500).json({
                    message:
                        "تعذر تحميل بيانات الإجازة."
                });
            }

            if (!leaveResults.length) {

                return res.status(404).json({
                    message:
                        "طلب الإجازة غير موجود."
                });
            }

            const leave = leaveResults[0];

            const appointmentsSql = `
                SELECT
                    a.id,
                    a.patient_id,
                    a.dentist_id,
                    a.appointment_date,
                    a.appointment_time,
                    a.reason,
                    a.status,

                    CONCAT(
                        p.first_name,
                        ' ',
                        p.last_name
                    ) AS patient_name,

                    p.phone AS patient_phone

                FROM appointments a

                LEFT JOIN patients p
                    ON p.id = a.patient_id

                WHERE
                    a.dentist_id = ?

                    AND a.appointment_date
                        BETWEEN ? AND ?

                    AND a.status = 'scheduled'

                ORDER BY
                    a.appointment_date ASC,
                    a.appointment_time ASC,
                    a.id ASC
            `;

            db.query(
                appointmentsSql,
                [
                    leave.dentist_id,
                    leave.start_date,
                    leave.end_date
                ],
                (appointmentsErr, appointments) => {

                    if (appointmentsErr) {

                        console.error(
                            "DOCTOR LEAVE CONFLICT APPOINTMENTS ERROR:",
                            appointmentsErr
                        );

                        return res.status(500).json({
                            message:
                                "تعذر تحميل المواعيد المتعارضة."
                        });
                    }

                    res.json({

                        leave: {
                            id: leave.id,
                            dentist_id:
                                leave.dentist_id,
                            doctor_name:
                                leave.doctor_name,
                            start_date:
                                leave.start_date,
                            end_date:
                                leave.end_date,
                            reason:
                                leave.reason,
                            status:
                                leave.status
                        },

                        summary: {
                            totalConflicts:
                                appointments.length
                        },

                        appointments:
                            appointments.map(item => ({
                                ...item,

                                patient_name:
                                    item.patient_name ||
                                    "غير معروف",

                                patient_phone:
                                    item.patient_phone ||
                                    null
                            }))

                    });

                }
            );

        }
    );

});


app.get(
    "/api/admin/doctor-leaves/:leaveId/actions",
    (req, res) => {

        const leaveId =
            Number(req.params.leaveId);

        if (
            !leaveId ||
            Number.isNaN(leaveId)
        ) {

            return res.status(400).json({
                message:
                    "معرف طلب الإجازة غير صالح."
            });

        }


        const sql = `
            SELECT
                dla.id,
                dla.leave_id,
                dla.dentist_id,
                dla.appointment_id,
                dla.action_type,

                dla.new_dentist_id,
                dla.new_appointment_date,
                dla.new_appointment_time,

                dla.patient_contacted,
                dla.notes,
                dla.created_by,
                dla.created_at,

                CONCAT(
                    p.first_name,
                    ' ',
                    p.last_name
                ) AS patient_name,

                p.phone AS patient_phone,

                CONCAT(
                    nd.first_name,
                    ' ',
                    nd.last_name
                ) AS new_dentist_name,

                u.username AS created_by_username

            FROM doctor_leave_actions dla

            LEFT JOIN appointments a
                ON a.id = dla.appointment_id

            LEFT JOIN patients p
                ON p.id = a.patient_id

            LEFT JOIN dentists nd
                ON nd.id = dla.new_dentist_id

            LEFT JOIN users u
                ON u.id = dla.created_by

            WHERE
                dla.leave_id = ?

            ORDER BY
                dla.id DESC
        `;


        db.query(
            sql,
            [leaveId],
            (err, results) => {

                if (err) {

                    console.error(
                        "DOCTOR LEAVE ACTIONS ERROR:",
                        err
                    );

                    return res.status(500).json({
                        message:
                            "تعذر تحميل سجل إجراءات الإجازة."
                    });

                }


                const actions =
                    results.map(item => ({

                        ...item,

                        action_label:
                            item.action_type === "reschedule"
                                ? "إعادة جدولة"
                                : item.action_type === "transfer"
                                ? "تحويل لطبيب آخر"
                                : item.action_type === "cancel"
                                ? "إلغاء الموعد"
                                : item.action_type === "contact_patient"
                                ? "التواصل مع المريض"
                                : "إجراء آخر",

                        patient_name:
                            item.patient_name ||
                            "غير معروف",

                        patient_phone:
                            item.patient_phone ||
                            null,

                        new_dentist_name:
                            item.new_dentist_name ||
                            null

                    }));


                res.json({
                    summary: {
                        total:
                            actions.length,

                        contactedPatients:
                            actions.filter(
                                item =>
                                    Number(
                                        item.patient_contacted
                                    ) === 1
                            ).length
                    },

                    actions

                });

            }
        );

    }
);


app.put(
    "/api/admin/doctor-leaves/:leaveId/conflicts/:appointmentId/action",
    (req, res) => {

        const leaveId =
            Number(req.params.leaveId);

        const appointmentId =
            Number(req.params.appointmentId);

        const {
            action_type,
            new_dentist_id,
            new_appointment_date,
            new_appointment_time,
            patient_contacted,
            notes,
            created_by
        } = req.body;


        /*
         * VALIDATE IDS
         */

        if (
            !leaveId ||
            Number.isNaN(leaveId) ||
            !appointmentId ||
            Number.isNaN(appointmentId)
        ) {

            return res.status(400).json({
                message:
                    "معرف الإجازة أو الموعد غير صالح."
            });

        }


        /*
         * VALIDATE ACTION
         */

        const allowedActions = [
            "reschedule",
            "transfer",
            "cancel",
            "contact_patient"
        ];

        if (
            !allowedActions.includes(
                action_type
            )
        ) {

            return res.status(400).json({
                message:
                    "نوع الإجراء غير صالح."
            });

        }


        /*
         * LOAD LEAVE
         */

        const leaveSql = `
            SELECT
                id,
                dentist_id,
                start_date,
                end_date,
                status
            FROM doctor_leave_requests
            WHERE id = ?
            LIMIT 1
        `;


        db.query(
            leaveSql,
            [leaveId],
            (leaveErr, leaveResults) => {

                if (leaveErr) {

                    console.error(
                        "DOCTOR LEAVE ACTION LEAVE ERROR:",
                        leaveErr
                    );

                    return res.status(500).json({
                        message:
                            "تعذر تحميل بيانات الإجازة."
                    });

                }


                if (!leaveResults.length) {

                    return res.status(404).json({
                        message:
                            "طلب الإجازة غير موجود."
                    });

                }


                const leave =
                    leaveResults[0];


                /*
                 * ONLY APPROVED LEAVE
                 */

                if (
                    leave.status !==
                    "approved"
                ) {

                    return res.status(409).json({
                        message:
                            "لا يمكن إدارة تعارضات إجازة غير مقبولة."
                    });

                }


                /*
                 * LOAD APPOINTMENT
                 */

                const appointmentSql = `
                    SELECT
                        id,
                        patient_id,
                        dentist_id,
                        appointment_date,
                        appointment_time,
                        reason,
                        status
                    FROM appointments
                    WHERE id = ?
                    LIMIT 1
                `;


                db.query(
                    appointmentSql,
                    [appointmentId],
                    (appointmentErr, appointmentResults) => {

                        if (appointmentErr) {

                            console.error(
                                "DOCTOR LEAVE ACTION APPOINTMENT ERROR:",
                                appointmentErr
                            );

                            return res.status(500).json({
                                message:
                                    "تعذر تحميل بيانات الموعد."
                            });

                        }


                        if (
                            !appointmentResults.length
                        ) {

                            return res.status(404).json({
                                message:
                                    "الموعد غير موجود."
                            });

                        }


                        const appointment =
                            appointmentResults[0];


                        /*
                         * MAKE SURE THE APPOINTMENT
                         * BELONGS TO THE DOCTOR
                         */

                        if (
                            Number(
                                appointment.dentist_id
                            ) !==
                            Number(
                                leave.dentist_id
                            )
                        ) {

                            return res.status(409).json({
                                message:
                                    "هذا الموعد لا يعود للطبيب صاحب الإجازة."
                            });

                        }


                        /*
                         * MAKE SURE APPOINTMENT
                         * IS INSIDE LEAVE PERIOD
                         */

                        const appointmentDate =
                            String(
                                appointment.appointment_date
                            ).substring(0, 10);


                        const startDate =
                            String(
                                leave.start_date
                            ).substring(0, 10);


                        const endDate =
                            String(
                                leave.end_date
                            ).substring(0, 10);


                        if (
                            appointmentDate <
                            startDate ||
                            appointmentDate >
                            endDate
                        ) {

                            return res.status(409).json({
                                message:
                                    "هذا الموعد ليس ضمن فترة الإجازة."
                            });

                        }


                        /*
                         * ONLY SCHEDULED APPOINTMENTS
                         */

                        if (
                            appointment.status !==
                            "scheduled"
                        ) {

                            return res.status(409).json({
                                message:
                                    "هذا الموعد لم يعد في حالة مجدولة."
                            });

                        }


                        /*
                         * VALIDATE TRANSFER
                         */

                        if (
                            action_type ===
                            "transfer"
                        ) {

                            const newDentistId =
                                Number(
                                    new_dentist_id
                                );


                            if (
                                !newDentistId ||
                                Number.isNaN(
                                    newDentistId
                                )
                            ) {

                                return res.status(400).json({
                                    message:
                                        "يجب اختيار طبيب بديل."
                                });

                            }


                            if (
                                newDentistId ===
                                Number(
                                    leave.dentist_id
                                )
                            ) {

                                return res.status(400).json({
                                    message:
                                        "يجب اختيار طبيب آخر."
                                });

                            }


                            const doctorSql = `
                                SELECT
                                    id
                                FROM dentists
                                WHERE id = ?
                                LIMIT 1
                            `;


                            return db.query(
                                doctorSql,
                                [newDentistId],
                                (doctorErr, doctorResults) => {

                                    if (doctorErr) {

                                        console.error(
                                            "DOCTOR LEAVE ACTION NEW DOCTOR ERROR:",
                                            doctorErr
                                        );

                                        return res.status(500).json({
                                            message:
                                                "تعذر التحقق من الطبيب البديل."
                                        });

                                    }


                                    if (
                                        !doctorResults.length
                                    ) {

                                        return res.status(404).json({
                                            message:
                                                "الطبيب البديل غير موجود."
                                        });

                                    }


                                    saveDoctorLeaveAction({
                                        leave,
                                        appointment,
                                        leaveId,
                                        appointmentId,
                                        action_type,
                                        new_dentist_id:
                                            newDentistId,
                                        new_appointment_date:
                                            null,
                                        new_appointment_time:
                                            null,
                                        patient_contacted,
                                        notes,
                                        created_by
                                    }, res);

                                }
                            );

                        }


                        /*
                         * VALIDATE RESCHEDULE
                         */

                        if (
                            action_type ===
                            "reschedule"
                        ) {

                            if (
                                !new_appointment_date ||
                                !new_appointment_time
                            ) {

                                return res.status(400).json({
                                    message:
                                        "يجب تحديد التاريخ والوقت الجديدين."
                                });

                            }


                            const newDate =
                                String(
                                    new_appointment_date
                                ).substring(0, 10);


                            const newTime =
                                String(
                                    new_appointment_time
                                ).substring(0, 8);


                            /*
                             * DO NOT RESCHEDULE
                             * INSIDE SAME LEAVE
                             */

                            if (
                                newDate >= startDate &&
                                newDate <= endDate
                            ) {

                                return res.status(409).json({
                                    message:
                                        "التاريخ الجديد يقع داخل فترة إجازة الطبيب."
                                });

                            }


                            /*
                             * CHECK TIME CONFLICT
                             */

                            const conflictSql = `
                                SELECT
                                    id
                                FROM appointments
                                WHERE
                                    dentist_id = ?
                                    AND appointment_date = ?
                                    AND appointment_time = ?
                                    AND status = 'scheduled'
                                    AND id <> ?
                                LIMIT 1
                            `;


                            return db.query(
                                conflictSql,
                                [
                                    leave.dentist_id,
                                    newDate,
                                    newTime,
                                    appointmentId
                                ],
                                (conflictErr, conflictResults) => {

                                    if (conflictErr) {

                                        console.error(
                                            "DOCTOR LEAVE ACTION RESCHEDULE CONFLICT ERROR:",
                                            conflictErr
                                        );

                                        return res.status(500).json({
                                            message:
                                                "تعذر التحقق من الموعد الجديد."
                                        });

                                    }


                                    if (
                                        conflictResults.length
                                    ) {

                                        return res.status(409).json({
                                            message:
                                                "يوجد موعد آخر للطبيب في التاريخ والوقت المحددين."
                                        });

                                    }


                                    saveDoctorLeaveAction({
                                        leave,
                                        appointment,
                                        leaveId,
                                        appointmentId,
                                        action_type,
                                        new_dentist_id:
                                            null,
                                        new_appointment_date:
                                            newDate,
                                        new_appointment_time:
                                            newTime,
                                        patient_contacted,
                                        notes,
                                        created_by
                                    }, res);

                                }
                            );

                        }


                        /*
                         * CANCEL OR CONTACT PATIENT
                         */

                        saveDoctorLeaveAction({
                            leave,
                            appointment,
                            leaveId,
                            appointmentId,
                            action_type,
                            new_dentist_id:
                                null,
                            new_appointment_date:
                                null,
                            new_appointment_time:
                                null,
                            patient_contacted,
                            notes,
                            created_by
                        }, res);

                    }
                );

            }
        );

    }
);

function saveDoctorLeaveAction(
    data,
    res
) {

    const {
        leave,
        appointment,
        leaveId,
        appointmentId,
        action_type,
        new_dentist_id,
        new_appointment_date,
        new_appointment_time,
        patient_contacted,
        notes,
        created_by
    } = data;


    const insertSql = `
        INSERT INTO doctor_leave_actions (
            leave_id,
            dentist_id,
            appointment_id,
            action_type,
            new_dentist_id,
            new_appointment_date,
            new_appointment_time,
            patient_contacted,
            notes,
            created_by
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;


    db.query(
        insertSql,
        [
            leaveId,
            leave.dentist_id,
            appointmentId,
            action_type,
            new_dentist_id || null,
            new_appointment_date || null,
            new_appointment_time || null,
            patient_contacted ? 1 : 0,
            notes || null,
            created_by || null
        ],
        (insertErr, insertResult) => {

            if (insertErr) {

                console.error(
                    "DOCTOR LEAVE ACTION INSERT ERROR:",
                    insertErr
                );

                return res.status(500).json({
                    message:
                        "تعذر تسجيل إجراء الإجازة."
                });

            }


            /*
             * TRANSFER
             */

            if (
                action_type ===
                "transfer"
            ) {

                const updateSql = `
                    UPDATE appointments
                    SET dentist_id = ?
                    WHERE id = ?
                `;


                return db.query(
                    updateSql,
                    [
                        new_dentist_id,
                        appointmentId
                    ],
                    (updateErr) => {

                        if (updateErr) {

                            console.error(
                                "DOCTOR LEAVE TRANSFER UPDATE ERROR:",
                                updateErr
                            );

                            return res.status(500).json({
                                message:
                                    "تم تسجيل الإجراء ولكن تعذر تحويل الموعد."
                            });

                        }


                        /*
                         * UPDATE QUEUE IF EXISTS
                         */

                        updateQueueDentist(
                            appointmentId,
                            new_dentist_id,
                            () => {

                                return res.json({
                                    success: true,
                                    message:
                                        "تم تحويل الموعد إلى الطبيب البديل بنجاح.",
                                    action: {
                                        id:
                                            insertResult.insertId,
                                        action_type,
                                        appointment_id:
                                            appointmentId
                                    }
                                });

                            }
                        );

                    }
                );

            }


            /*
             * RESCHEDULE
             */

            if (
                action_type ===
                "reschedule"
            ) {

                const updateSql = `
                    UPDATE appointments
                    SET
                        appointment_date = ?,
                        appointment_time = ?
                    WHERE id = ?
                `;


                return db.query(
                    updateSql,
                    [
                        new_appointment_date,
                        new_appointment_time,
                        appointmentId
                    ],
                    (updateErr) => {

                        if (updateErr) {

                            console.error(
                                "DOCTOR LEAVE RESCHEDULE UPDATE ERROR:",
                                updateErr
                            );

                            return res.status(500).json({
                                message:
                                    "تم تسجيل الإجراء ولكن تعذر إعادة جدولة الموعد."
                            });

                        }


                        return res.json({
                            success: true,
                            message:
                                "تمت إعادة جدولة الموعد بنجاح.",
                            action: {
                                id:
                                    insertResult.insertId,
                                action_type,
                                appointment_id:
                                    appointmentId
                            }
                        });

                    }
                );

            }


            /*
             * CANCEL
             */

            if (
                action_type ===
                "cancel"
            ) {

                const updateSql = `
                    UPDATE appointments
                    SET status = 'cancelled'
                    WHERE id = ?
                `;


                return db.query(
                    updateSql,
                    [appointmentId],
                    (updateErr) => {

                        if (updateErr) {

                            console.error(
                                "DOCTOR LEAVE CANCEL UPDATE ERROR:",
                                updateErr
                            );

                            return res.status(500).json({
                                message:
                                    "تم تسجيل الإجراء ولكن تعذر إلغاء الموعد."
                            });

                        }


                        return res.json({
                            success: true,
                            message:
                                "تم إلغاء الموعد بنجاح.",
                            action: {
                                id:
                                    insertResult.insertId,
                                action_type,
                                appointment_id:
                                    appointmentId
                            }
                        });

                    }
                );

            }


            /*
             * CONTACT PATIENT
             */

            if (
                action_type ===
                "contact_patient"
            ) {

                return res.json({
                    success: true,
                    message:
                        "تم تسجيل التواصل مع المريض.",
                    action: {
                        id:
                            insertResult.insertId,
                        action_type,
                        appointment_id:
                            appointmentId
                    }
                });

            }


            /*
             * OTHER
             */

            return res.json({
                success: true,
                message:
                    "تم تسجيل الإجراء بنجاح.",
                action: {
                    id:
                        insertResult.insertId,
                    action_type,
                    appointment_id:
                        appointmentId
                }
            });

        }
    );

}

function updateQueueDentist(
    appointmentId,
    newDentistId,
    callback
) {

    const sql = `
        UPDATE queue
        SET dentist_id = ?
        WHERE appointment_id = ?
    `;

    db.query(
        sql,
        [
            newDentistId,
            appointmentId
        ],
        (err) => {

            if (err) {

                console.error(
                    "QUEUE DENTIST UPDATE ERROR:",
                    err
                );

            }

            callback();

        }
    );

}

// =====================================================
// ADMIN - RECEPTIONISTS CRUD
// =====================================================

// -----------------------------------------------------
// GET ALL RECEPTIONISTS
// -----------------------------------------------------

app.get("/api/admin/receptionists", async (req, res) => {
    try {

        const rows = await runQuery(`
            SELECT
                u.id,
                u.username,
                u.display_name,
                u.phone,
                u.email,
                u.role,

                rwd.status AS work_status,
                rwd.start_time,
                rwd.end_time

            FROM users u

            LEFT JOIN reception_work_days rwd
                ON rwd.user_id = u.id
                AND rwd.work_date = CURDATE()

            WHERE u.role = 'receptionist'

            ORDER BY u.id ASC
        `);

        res.json({
            receptionists: rows
        });

    } catch (error) {

        console.error(
            "GET RECEPTIONISTS ERROR:",
            error
        );

        res.status(500).json({
            error: "تعذر تحميل موظفي الاستقبال."
        });
    }
});


// -----------------------------------------------------
// ADD RECEPTIONIST + LOGIN ACCOUNT
// -----------------------------------------------------

app.post("/api/admin/receptionists", async (req, res) => {

    const {
        display_name,
        phone,
        email,
        username,
        password
    } = req.body;

    const cleanName =
        display_name
            ? String(display_name).trim()
            : "";

    const cleanPhone =
        phone
            ? String(phone).trim()
            : null;

    const cleanEmail =
        email
            ? String(email).trim()
            : null;

    const cleanUsername =
        username
            ? String(username).trim()
            : "";

    const cleanPassword =
        password
            ? String(password).trim()
            : "";

    if (
        !cleanName ||
        !cleanUsername ||
        !cleanPassword
    ) {
        return res.status(400).json({
            error:
                "اسم الموظف واسم المستخدم وكلمة المرور مطلوبة."
        });
    }

    try {

        // -----------------------------------------
        // Check duplicate username
        // -----------------------------------------

        const existingUser = await runQuery(`
            SELECT id
            FROM users
            WHERE username = ?
            LIMIT 1
        `, [cleanUsername]);

        if (existingUser.length > 0) {
            return res.status(409).json({
                error:
                    "اسم المستخدم مستخدم بالفعل. اختر اسم مستخدم آخر."
            });
        }

        // -----------------------------------------
        // Create receptionist account
        // -----------------------------------------

        const result = await runQuery(`
            INSERT INTO users
            (
                username,
                password,
                role,
                dentist_id,
                display_name,
                phone,
                email
            )
            VALUES
            (
                ?,
                ?,
                'receptionist',
                NULL,
                ?,
                ?,
                ?
            )
        `, [
            cleanUsername,
            cleanPassword,
            cleanName,
            cleanPhone,
            cleanEmail
        ]);

        res.status(201).json({
            message:
                "تمت إضافة موظف الاستقبال وإنشاء حساب الدخول بنجاح.",
            receptionist: {
                id: result.insertId,
                username: cleanUsername,
                display_name: cleanName,
                phone: cleanPhone,
                email: cleanEmail,
                role: "receptionist"
            }
        });

    } catch (error) {

        console.error(
            "ADD RECEPTIONIST ERROR:",
            error
        );

        res.status(500).json({
            error:
                "تعذر إضافة موظف الاستقبال."
        });
    }
});


// -----------------------------------------------------
// UPDATE RECEPTIONIST
// -----------------------------------------------------

app.put(
    "/api/admin/receptionists/:id",
    async (req, res) => {

        const id =
            Number(req.params.id);

        if (
            !Number.isInteger(id) ||
            id <= 0
        ) {
            return res.status(400).json({
                error: "معرف الموظف غير صالح."
            });
        }

        const {
            display_name,
            phone,
            email,
            username,
            password
        } = req.body;

        const cleanName =
            display_name
                ? String(display_name).trim()
                : "";

        const cleanPhone =
            phone
                ? String(phone).trim()
                : null;

        const cleanEmail =
            email
                ? String(email).trim()
                : null;

        const cleanUsername =
            username
                ? String(username).trim()
                : "";

        const cleanPassword =
            password
                ? String(password).trim()
                : "";

        if (
            !cleanName ||
            !cleanUsername
        ) {
            return res.status(400).json({
                error:
                    "اسم الموظف واسم المستخدم مطلوبان."
            });
        }

        try {

            // -------------------------------------
            // Check receptionist exists
            // -------------------------------------

            const receptionistRows =
                await runQuery(`
                    SELECT id
                    FROM users
                    WHERE id = ?
                      AND role = 'receptionist'
                    LIMIT 1
                `, [id]);

            if (
                receptionistRows.length === 0
            ) {
                return res.status(404).json({
                    error:
                        "موظف الاستقبال غير موجود."
                });
            }

            // -------------------------------------
            // Check username belongs to another user
            // -------------------------------------

            const duplicateRows =
                await runQuery(`
                    SELECT id
                    FROM users
                    WHERE username = ?
                      AND id <> ?
                    LIMIT 1
                `, [
                    cleanUsername,
                    id
                ]);

            if (
                duplicateRows.length > 0
            ) {
                return res.status(409).json({
                    error:
                        "اسم المستخدم مستخدم بالفعل."
                });
            }

            // -------------------------------------
            // Update with password
            // -------------------------------------

            if (cleanPassword) {

                await runQuery(`
                    UPDATE users

                    SET
                        display_name = ?,
                        phone = ?,
                        email = ?,
                        username = ?,
                        password = ?

                    WHERE id = ?
                      AND role = 'receptionist'
                `, [
                    cleanName,
                    cleanPhone,
                    cleanEmail,
                    cleanUsername,
                    cleanPassword,
                    id
                ]);

            }

            // -------------------------------------
            // Update without changing password
            // -------------------------------------

            else {

                await runQuery(`
                    UPDATE users

                    SET
                        display_name = ?,
                        phone = ?,
                        email = ?,
                        username = ?

                    WHERE id = ?
                      AND role = 'receptionist'
                `, [
                    cleanName,
                    cleanPhone,
                    cleanEmail,
                    cleanUsername,
                    id
                ]);
            }

            res.json({
                message:
                    "تم تحديث بيانات موظف الاستقبال بنجاح."
            });

        } catch (error) {

            console.error(
                "UPDATE RECEPTIONIST ERROR:",
                error
            );

            res.status(500).json({
                error:
                    "تعذر تحديث بيانات موظف الاستقبال."
            });
        }
    }
);


// -----------------------------------------------------
// DELETE RECEPTIONIST
// -----------------------------------------------------

app.delete(
    "/api/admin/receptionists/:id",
    async (req, res) => {

        const id =
            Number(req.params.id);

        if (
            !Number.isInteger(id) ||
            id <= 0
        ) {
            return res.status(400).json({
                error:
                    "معرف الموظف غير صالح."
            });
        }

        try {

            // -------------------------------------
            // Make sure it is receptionist
            // -------------------------------------

            const rows =
                await runQuery(`
                    SELECT id
                    FROM users
                    WHERE id = ?
                      AND role = 'receptionist'
                    LIMIT 1
                `, [id]);

            if (rows.length === 0) {
                return res.status(404).json({
                    error:
                        "موظف الاستقبال غير موجود."
                });
            }

            // -------------------------------------
            // Delete work-day records first
            // -------------------------------------

            await runQuery(`
                DELETE FROM reception_work_days
                WHERE user_id = ?
            `, [id]);

            // -------------------------------------
            // Delete account
            // -------------------------------------

            const result =
                await runQuery(`
                    DELETE FROM users
                    WHERE id = ?
                      AND role = 'receptionist'
                `, [id]);

            if (
                result.affectedRows === 0
            ) {
                return res.status(404).json({
                    error:
                        "موظف الاستقبال غير موجود."
                });
            }

            res.json({
                message:
                    "تم حذف موظف الاستقبال وحساب الدخول بنجاح."
            });

        } catch (error) {

            console.error(
                "DELETE RECEPTIONIST ERROR:",
                error
            );

            res.status(500).json({
                error:
                    "تعذر حذف موظف الاستقبال."
            });
        }
    }
);


// ===============================
// DOCTOR DASHBOARD API
// ===============================

function runQuery(sql, values = []) {
    return new Promise((resolve, reject) => {
        db.query(sql, values, (err, results) => {
            if (err) {
                reject(err);
            } else {
                resolve(results);
            }
        });
    });
}

app.get("/api/dentists/:id/dashboard", async (req, res) => {

    const doctorId = Number(req.params.id);

    if (!Number.isInteger(doctorId) || doctorId <= 0) {
        return res.status(400).json({
            error: "Invalid doctor ID"
        });
    }

    try {

        // =========================
        // Doctor information
        // =========================
        const doctorRows = await runQuery(`
            SELECT
                id,
                first_name,
                last_name,
                phone,
                email,
                specialty
            FROM dentists
            WHERE id = ?
        `, [doctorId]);

        if (doctorRows.length === 0) {
            return res.status(404).json({
                error: "Doctor not found"
            });
        }

        const doctor = doctorRows[0];


        // =========================
        // Today's appointments
        // =========================
        const todayAppointments = await runQuery(`
            SELECT
                a.id,
                a.patient_id,
                a.dentist_id,
                a.appointment_date,
                a.appointment_time,
                a.reason,
                a.status,
                a.notes,
                a.booking_type,
                a.booking_name,
                a.booking_phone,
                a.booking_email,
                a.booking_code,
                a.booking_status,

                COALESCE(
                    CONCAT(p.first_name, ' ', p.last_name),
                    a.booking_name
                ) AS patient_name

            FROM appointments a

            LEFT JOIN patients p
                ON a.patient_id = p.id

            WHERE a.dentist_id = ?
              AND a.appointment_date = CURDATE()

            ORDER BY a.appointment_time ASC
        `, [doctorId]);


        // =========================
        // Upcoming appointments
        // =========================
        const upcomingAppointments = await runQuery(`
            SELECT
                a.id,
                a.patient_id,
                a.dentist_id,
                a.appointment_date,
                a.appointment_time,
                a.reason,
                a.status,
                a.booking_type,
                a.booking_name,
                a.booking_phone,
                a.booking_code,
                a.booking_status,

                COALESCE(
                    CONCAT(p.first_name, ' ', p.last_name),
                    a.booking_name
                ) AS patient_name

            FROM appointments a

            LEFT JOIN patients p
                ON a.patient_id = p.id

            WHERE a.dentist_id = ?

              AND (
                    a.appointment_date > CURDATE()

                    OR

                    (
                        a.appointment_date = CURDATE()
                        AND a.appointment_time > CURTIME()
                    )
              )

              AND LOWER(COALESCE(a.status, '')) <> 'cancelled'

              AND LOWER(COALESCE(a.booking_status, '')) <> 'cancelled'

            ORDER BY
                a.appointment_date ASC,
                a.appointment_time ASC

            LIMIT 10
        `, [doctorId]);


        // =========================
        // Online bookings
        // =========================
        const onlineBookings = await runQuery(`
            SELECT
                a.id,
                a.patient_id,
                a.dentist_id,
                a.appointment_date,
                a.appointment_time,
                a.reason,
                a.booking_name,
                a.booking_phone,
                a.booking_email,
                a.booking_code,
                a.booking_status,

                COALESCE(
                    CONCAT(p.first_name, ' ', p.last_name),
                    a.booking_name
                ) AS patient_name

            FROM appointments a

            LEFT JOIN patients p
                ON a.patient_id = p.id

            WHERE a.dentist_id = ?
              AND a.booking_type = 'online'
              AND a.booking_status = 'pending'

            ORDER BY
                a.appointment_date ASC,
                a.appointment_time ASC

            LIMIT 10
        `, [doctorId]);


        // =========================
        // Number of patients
        // =========================
        const patientCountRows = await runQuery(`
    SELECT COUNT(*) AS total
    FROM patients p
    WHERE p.dentist_id = ?
       OR EXISTS (
            SELECT 1
            FROM appointments a
            WHERE a.patient_id = p.id
              AND a.dentist_id = ?
              AND LOWER(COALESCE(a.status, '')) <> 'cancelled'
       )
`, [doctorId, doctorId]);


        // =========================
        // Doctor's patients
        // =========================
        const doctorPatients = await runQuery(`
            SELECT DISTINCT
                p.id,
                p.first_name,
                p.last_name,
                p.phone,
                p.email,
                p.date_of_birth,
                p.address,
                p.medical_history,
                p.dentist_id

            FROM patients p

            LEFT JOIN appointments a
                ON a.patient_id = p.id
                AND a.dentist_id = ?
                AND LOWER(COALESCE(a.status, '')) <> 'cancelled'

            WHERE p.dentist_id = ?
               OR a.id IS NOT NULL

            ORDER BY p.id DESC
        `, [doctorId, doctorId]);


        // =========================
        // Today's revenue
        // =========================
        const revenueRows = await runQuery(`
            SELECT
                COALESCE(SUM(p.amount), 0) AS total

            FROM payments p

            INNER JOIN treatments t
                ON p.treatment_id = t.id

            WHERE t.dentist_id = ?
              AND p.payment_date = CURDATE()
              AND p.status = 'paid'
        `, [doctorId]);


        // =========================
        // Statistics
        // =========================
        const completedToday = todayAppointments.filter(
            appointment =>
                String(appointment.status || "").toLowerCase() === "completed"
        ).length;


        const waitingToday = todayAppointments.filter(
            appointment =>
                String(appointment.status || "").toLowerCase() === "waiting"
        ).length;


        const todayPatients = new Set(
            todayAppointments
                .map(appointment => appointment.patient_id)
                .filter(
                    id =>
                        id !== null &&
                        id !== undefined
                )
        ).size;


        // =========================
        // Response
        // =========================
        res.json({

            doctor: doctor,

            stats: {

                totalPatients:
                    Number(patientCountRows[0].total) || 0,

                todayAppointments:
                    todayAppointments.length,

                todayPatients:
                    todayPatients,

                completedToday:
                    completedToday,

                waitingToday:
                    waitingToday,

                upcomingAppointments:
                    upcomingAppointments.length,

                pendingOnlineBookings:
                    onlineBookings.length,

                todayRevenue:
                    Number(revenueRows[0].total) || 0
            },

            todayAppointments:
                todayAppointments,

            upcomingAppointments:
                upcomingAppointments,

            onlineBookings:
                onlineBookings,

            // NEW
            patients:
                doctorPatients
        });

    } catch (error) {

        console.error(
            "DOCTOR DASHBOARD ERROR:",
            error
        );

        res.status(500).json({
            error: "Failed to load doctor dashboard"
        });
    }

});



// =====================================================
// ==================== APPOINTMENTS ====================
// =====================================================


// -----------------------------------------------------
// GET ALL APPOINTMENTS
// -----------------------------------------------------

app.get("/api/appointments", (req, res) => {

    const sql = `
        SELECT
            a.id,
            a.patient_id,
            a.dentist_id,
            a.appointment_date,
            a.appointment_time,
            a.reason,
            a.status,
            a.notes,
            a.created_at,

            a.booking_type,
            a.booking_name,
            a.booking_phone,
            a.booking_email,
            a.booking_code,
            a.booking_status,

            COALESCE(
                CONCAT(
                    p.first_name,
                    ' ',
                    p.last_name
                ),
                a.booking_name
            ) AS patient_name,

            CONCAT(
                d.first_name,
                ' ',
                d.last_name
            ) AS dentist_name

        FROM appointments a

        LEFT JOIN patients p
            ON a.patient_id = p.id

        LEFT JOIN dentists d
            ON a.dentist_id = d.id

        ORDER BY
            a.appointment_date ASC,
            a.appointment_time ASC
    `;


    db.query(sql, (err, results) => {

        if (err) {

            console.error(
                "GET APPOINTMENTS ERROR:",
                err
            );

            return res.status(500).json({
                error:
                    "Failed to get appointments"
            });
        }

        res.json(results);
    });
});






// -----------------------------------------------------
// GET ONE APPOINTMENT
// -----------------------------------------------------

app.get("/api/appointments/:id", (req, res) => {

    const id = req.params.id;


    const sql = `
        SELECT
            a.id,
            a.patient_id,
            a.dentist_id,
            a.appointment_date,
            a.appointment_time,
            a.reason,
            a.status,
            a.notes,
            a.created_at,

            CONCAT(
                p.first_name,
                ' ',
                p.last_name
            ) AS patient_name,

            CONCAT(
                d.first_name,
                ' ',
                d.last_name
            ) AS dentist_name

        FROM appointments a

        JOIN patients p
            ON a.patient_id = p.id

        JOIN dentists d
            ON a.dentist_id = d.id

        WHERE a.id = ?
    `;


    db.query(sql, [id], (err, results) => {

        if (err) {

            console.error("GET ONE APPOINTMENT ERROR:", err);

            return res.status(500).json({
                error: "Failed to get appointment"
            });
        }


        if (results.length === 0) {

            return res.status(404).json({
                error: "Appointment not found"
            });
        }


        res.json(results[0]);

    });

});



// -----------------------------------------------------
// ADD APPOINTMENT
// -----------------------------------------------------

app.post("/api/appointments", (req, res) => {

    const {
        patient_id,
        dentist_id,
        appointment_date,
        appointment_time,
        reason,
        status,
        notes
    } = req.body;


    if (
        !patient_id ||
        !dentist_id ||
        !appointment_date ||
        !appointment_time
    ) {

        return res.status(400).json({
            error:
                "Patient, dentist, date and time are required"
        });
    }


    const sql = `
        INSERT INTO appointments
        (
            patient_id,
            dentist_id,
            appointment_date,
            appointment_time,
            reason,
            status,
            notes
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;


    db.query(
        sql,
        [
            patient_id,
            dentist_id,
            appointment_date,
            appointment_time,
            reason || null,
            status || "scheduled",
            notes || null
        ],
        (err, result) => {

            if (err) {

                console.error("ADD APPOINTMENT ERROR:", err);

                return res.status(500).json({
                    error: "Failed to add appointment"
                });
            }


            res.status(201).json({
                message:
                    "Appointment added successfully",
                id:
                    result.insertId
            });

        }
    );

});


// -----------------------------------------------------
// UPDATE APPOINTMENT
// -----------------------------------------------------

app.put("/api/appointments/:id", (req, res) => {

    const id = req.params.id;


    const {
        patient_id,
        dentist_id,
        appointment_date,
        appointment_time,
        reason,
        status,
        notes
    } = req.body;


    if (
        !patient_id ||
        !dentist_id ||
        !appointment_date ||
        !appointment_time
    ) {

        return res.status(400).json({
            error:
                "Patient, dentist, date and time are required"
        });
    }


    const sql = `
        UPDATE appointments

        SET
            patient_id = ?,
            dentist_id = ?,
            appointment_date = ?,
            appointment_time = ?,
            reason = ?,
            status = ?,
            notes = ?

        WHERE id = ?
    `;


    db.query(
        sql,
        [
            patient_id,
            dentist_id,
            appointment_date,
            appointment_time,
            reason || null,
            status || "scheduled",
            notes || null,
            id
        ],
        (err, result) => {

            if (err) {

                console.error("UPDATE APPOINTMENT ERROR:", err);

                return res.status(500).json({
                    error:
                        "Failed to update appointment"
                });
            }


            if (result.affectedRows === 0) {

                return res.status(404).json({
                    error:
                        "Appointment not found"
                });
            }


            res.json({
                message:
                    "Appointment updated successfully"
            });

        }
    );

});


// -----------------------------------------------------
// DELETE APPOINTMENT
// -----------------------------------------------------

app.delete("/api/appointments/:id", (req, res) => {

    const id = req.params.id;


    const sql = `
        DELETE FROM appointments
        WHERE id = ?
    `;


    db.query(sql, [id], (err, result) => {

        if (err) {

            console.error("DELETE APPOINTMENT ERROR:", err);

            return res.status(500).json({
                error:
                    "Failed to delete appointment"
            });
        }


        if (result.affectedRows === 0) {

            return res.status(404).json({
                error:
                    "Appointment not found"
            });
        }


        res.json({
            message:
                "Appointment deleted successfully"
        });

    });

});



// =====================================================
// ===================== DENTAL CHART ===================
// =====================================================


// -----------------------------------------------------
// GET ALL DENTAL CHART
// -----------------------------------------------------

app.get("/api/dental-chart", (req, res) => {

    const sql = `
        SELECT
            dc.id,
            dc.patient_id,
            dc.tooth_number,
            dc.condition_status,
            dc.notes,
            dc.created_at,
            dc.updated_at,

            CONCAT(
                p.first_name,
                ' ',
                p.last_name
            ) AS patient_name

        FROM dental_chart dc

        JOIN patients p
            ON dc.patient_id = p.id

        ORDER BY
            dc.patient_id ASC,
            dc.tooth_number ASC
    `;


    db.query(sql, (err, results) => {

        if (err) {

            console.error("GET DENTAL CHART ERROR:", err);

            return res.status(500).json({
                error:
                    "Failed to get dental chart"
            });
        }


        res.json(results);

    });

});


// -----------------------------------------------------
// GET DENTAL CHART BY PATIENT
// -----------------------------------------------------

app.get(
    "/api/dental-chart/patient/:patient_id",
    (req, res) => {

        const patientId = req.params.patient_id;


        const sql = `
            SELECT
                dc.id,
                dc.patient_id,
                dc.tooth_number,
                dc.condition_status,
                dc.notes,
                dc.created_at,
                dc.updated_at,

                CONCAT(
                    p.first_name,
                    ' ',
                    p.last_name
                ) AS patient_name

            FROM dental_chart dc

            JOIN patients p
                ON dc.patient_id = p.id

            WHERE dc.patient_id = ?

            ORDER BY dc.tooth_number ASC
        `;


        db.query(
            sql,
            [patientId],
            (err, results) => {

                if (err) {

                    console.error(
                        "GET PATIENT DENTAL CHART ERROR:",
                        err
                    );

                    return res.status(500).json({
                        error:
                            "Failed to get patient dental chart"
                    });
                }


                res.json(results);

            }
        );

    }
);


// -----------------------------------------------------
// GET ONE DENTAL CHART RECORD
// -----------------------------------------------------

app.get(
    "/api/dental-chart/record/:id",
    (req, res) => {

        const id = req.params.id;


        const sql = `
            SELECT
                dc.id,
                dc.patient_id,
                dc.tooth_number,
                dc.condition_status,
                dc.notes,
                dc.created_at,
                dc.updated_at,

                CONCAT(
                    p.first_name,
                    ' ',
                    p.last_name
                ) AS patient_name

            FROM dental_chart dc

            JOIN patients p
                ON dc.patient_id = p.id

            WHERE dc.id = ?
        `;


        db.query(
            sql,
            [id],
            (err, results) => {

                if (err) {

                    console.error(
                        "GET ONE DENTAL CHART ERROR:",
                        err
                    );

                    return res.status(500).json({
                        error:
                            "Failed to get dental chart record"
                    });
                }


                if (results.length === 0) {

                    return res.status(404).json({
                        error:
                            "Dental chart record not found"
                    });
                }


                res.json(results[0]);

            }
        );

    }
);


// -----------------------------------------------------
// ADD DENTAL CHART RECORD
// -----------------------------------------------------

app.post("/api/dental-chart", (req, res) => {

    const {
        patient_id,
        tooth_number,
        condition_status,
        notes
    } = req.body;


    if (
        !patient_id ||
        !tooth_number ||
        !condition_status
    ) {

        return res.status(400).json({
            error:
                "Patient, tooth number and condition status are required"
        });
    }


    const sql = `
        INSERT INTO dental_chart
        (
            patient_id,
            tooth_number,
            condition_status,
            notes
        )
        VALUES (?, ?, ?, ?)
    `;


    db.query(
        sql,
        [
            patient_id,
            tooth_number,
            condition_status,
            notes || null
        ],
        (err, result) => {

            if (err) {

                console.error(
                    "ADD DENTAL CHART ERROR:",
                    err
                );

                return res.status(500).json({
                    error:
                        "Failed to add dental chart record"
                });
            }


            res.status(201).json({
                message:
                    "Dental chart record added successfully",
                id:
                    result.insertId
            });

        }
    );

});


// -----------------------------------------------------
// UPDATE DENTAL CHART RECORD
// -----------------------------------------------------

app.put("/api/dental-chart/:id", (req, res) => {

    const id = req.params.id;


    const {
        tooth_number,
        condition_status,
        notes
    } = req.body;


    if (!tooth_number || !condition_status) {

        return res.status(400).json({
            error:
                "Tooth number and condition status are required"
        });
    }


    const sql = `
        UPDATE dental_chart

        SET
            tooth_number = ?,
            condition_status = ?,
            notes = ?,
            updated_at = CURRENT_TIMESTAMP

        WHERE id = ?
    `;


    db.query(
        sql,
        [
            tooth_number,
            condition_status,
            notes || null,
            id
        ],
        (err, result) => {

            if (err) {

                console.error(
                    "UPDATE DENTAL CHART ERROR:",
                    err
                );

                return res.status(500).json({
                    error:
                        "Failed to update dental chart record"
                });
            }


            if (result.affectedRows === 0) {

                return res.status(404).json({
                    error:
                        "Dental chart record not found"
                });
            }


            res.json({
                message:
                    "Dental chart record updated successfully"
            });

        }
    );

});


// -----------------------------------------------------
// DELETE DENTAL CHART RECORD
// -----------------------------------------------------

app.delete("/api/dental-chart/:id", (req, res) => {

    const id = req.params.id;


    const sql = `
        DELETE FROM dental_chart
        WHERE id = ?
    `;


    db.query(sql, [id], (err, result) => {

        if (err) {

            console.error(
                "DELETE DENTAL CHART ERROR:",
                err
            );

            return res.status(500).json({
                error:
                    "Failed to delete dental chart record"
            });
        }


        if (result.affectedRows === 0) {

            return res.status(404).json({
                error:
                    "Dental chart record not found"
            });
        }


        res.json({
            message:
                "Dental chart record deleted successfully"
        });

    });

});



// =====================================================
// ================== MEDICAL RECORDS ==================
// =====================================================


// -----------------------------------------------------
// GET ALL MEDICAL RECORDS
// -----------------------------------------------------

app.get("/api/medical-records", (req, res) => {

    const sql = `
        SELECT
            mr.id,
            mr.patient_id,

            CONCAT(
                p.first_name,
                ' ',
                p.last_name
            ) AS patient_name,

            mr.diagnosis,
            mr.treatment,
            mr.notes,
            mr.record_date,
            mr.created_at,
            mr.updated_at

        FROM medical_records mr

        JOIN patients p
            ON mr.patient_id = p.id

        ORDER BY mr.id DESC
    `;


    db.query(sql, (err, results) => {

        if (err) {

            console.error(
                "GET MEDICAL RECORDS ERROR:",
                err
            );

            return res.status(500).json({
                error:
                    "Failed to get medical records"
            });
        }


        res.json(results);

    });

});


// -----------------------------------------------------
// GET ONE MEDICAL RECORD
// -----------------------------------------------------

app.get("/api/medical-records/:id", (req, res) => {

    const id = req.params.id;


    const sql = `
        SELECT
            mr.id,
            mr.patient_id,

            CONCAT(
                p.first_name,
                ' ',
                p.last_name
            ) AS patient_name,

            mr.diagnosis,
            mr.treatment,
            mr.notes,
            mr.record_date,
            mr.created_at,
            mr.updated_at

        FROM medical_records mr

        JOIN patients p
            ON mr.patient_id = p.id

        WHERE mr.id = ?
    `;


    db.query(
        sql,
        [id],
        (err, results) => {

            if (err) {

                console.error(
                    "GET ONE MEDICAL RECORD ERROR:",
                    err
                );

                return res.status(500).json({
                    error:
                        "Failed to get medical record"
                });
            }


            if (results.length === 0) {

                return res.status(404).json({
                    error:
                        "Medical record not found"
                });
            }


            res.json(results[0]);

        }
    );

});


// -----------------------------------------------------
// ADD MEDICAL RECORD
// -----------------------------------------------------

app.post("/api/medical-records", (req, res) => {

    const {
        patient_id,
        diagnosis,
        treatment,
        notes,
        record_date
    } = req.body;


    if (
        !patient_id ||
        !diagnosis ||
        !treatment ||
        !record_date
    ) {

        return res.status(400).json({
            error:
                "Patient, diagnosis, treatment and date are required"
        });
    }


    const sql = `
        INSERT INTO medical_records
        (
            patient_id,
            diagnosis,
            treatment,
            notes,
            record_date
        )
        VALUES (?, ?, ?, ?, ?)
    `;


    db.query(
        sql,
        [
            patient_id,
            diagnosis,
            treatment,
            notes || null,
            record_date
        ],
        (err, result) => {

            if (err) {

                console.error(
                    "ADD MEDICAL RECORD ERROR:",
                    err
                );

                return res.status(500).json({
                    error:
                        "Failed to add medical record"
                });
            }


            res.status(201).json({
                message:
                    "Medical record added successfully",
                id:
                    result.insertId
            });

        }
    );

});


// -----------------------------------------------------
// UPDATE MEDICAL RECORD
// -----------------------------------------------------

app.put("/api/medical-records/:id", (req, res) => {

    const id = req.params.id;


    const {
        patient_id,
        diagnosis,
        treatment,
        notes,
        record_date
    } = req.body;


    if (
        !patient_id ||
        !diagnosis ||
        !treatment ||
        !record_date
    ) {

        return res.status(400).json({
            error:
                "Patient, diagnosis, treatment and date are required"
        });
    }


    const sql = `
        UPDATE medical_records

        SET
            patient_id = ?,
            diagnosis = ?,
            treatment = ?,
            notes = ?,
            record_date = ?

        WHERE id = ?
    `;


    db.query(
        sql,
        [
            patient_id,
            diagnosis,
            treatment,
            notes || null,
            record_date,
            id
        ],
        (err, result) => {

            if (err) {

                console.error(
                    "UPDATE MEDICAL RECORD ERROR:",
                    err
                );

                return res.status(500).json({
                    error:
                        "Failed to update medical record"
                });
            }


            if (result.affectedRows === 0) {

                return res.status(404).json({
                    error:
                        "Medical record not found"
                });
            }


            res.json({
                message:
                    "Medical record updated successfully"
            });

        }
    );

});


// -----------------------------------------------------
// DELETE MEDICAL RECORD
// -----------------------------------------------------

app.delete("/api/medical-records/:id", (req, res) => {

    const id = req.params.id;


    const sql = `
        DELETE FROM medical_records
        WHERE id = ?
    `;


    db.query(sql, [id], (err, result) => {

        if (err) {

            console.error(
                "DELETE MEDICAL RECORD ERROR:",
                err
            );

            return res.status(500).json({
                error:
                    "Failed to delete medical record"
            });
        }


        if (result.affectedRows === 0) {

            return res.status(404).json({
                error:
                    "Medical record not found"
            });
        }


        res.json({
            message:
                "Medical record deleted successfully"
        });

    });

});



// =====================================================
// ===================== PAYMENTS =======================
// =====================================================


// -----------------------------------------------------
// GET ALL PAYMENTS
// -----------------------------------------------------

app.get("/api/payments", (req, res) => {

    const sql = `
        SELECT
            p.id,
            p.patient_id,

            CONCAT(
                pt.first_name,
                ' ',
                pt.last_name
            ) AS patient_name,

            p.treatment_id,
            t.treatment_name,
            p.amount,
            p.payment_date,
            p.payment_method,
            p.status,
            p.notes,
            p.created_at

        FROM payments p

        JOIN patients pt
            ON p.patient_id = pt.id

        LEFT JOIN treatments t
            ON p.treatment_id = t.id

        ORDER BY p.id DESC
    `;


    db.query(sql, (err, results) => {

        if (err) {

            console.error(
                "GET PAYMENTS ERROR:",
                err
            );

            return res.status(500).json({
                error:
                    "Failed to get payments"
            });
        }


        res.json(results);

    });

});


// -----------------------------------------------------
// GET ONE PAYMENT
// -----------------------------------------------------

app.get("/api/payments/:id", (req, res) => {

    const id = req.params.id;


    const sql = `
        SELECT
            p.id,
            p.patient_id,

            CONCAT(
                pt.first_name,
                ' ',
                pt.last_name
            ) AS patient_name,

            p.treatment_id,
            t.treatment_name,
            p.amount,
            p.payment_date,
            p.payment_method,
            p.status,
            p.notes,
            p.created_at

        FROM payments p

        JOIN patients pt
            ON p.patient_id = pt.id

        LEFT JOIN treatments t
            ON p.treatment_id = t.id

        WHERE p.id = ?
    `;


    db.query(
        sql,
        [id],
        (err, results) => {

            if (err) {

                console.error(
                    "GET ONE PAYMENT ERROR:",
                    err
                );

                return res.status(500).json({
                    error:
                        "Failed to get payment"
                });
            }


            if (results.length === 0) {

                return res.status(404).json({
                    error:
                        "Payment not found"
                });
            }


            res.json(results[0]);

        }
    );

});


// -----------------------------------------------------
// ADD PAYMENT
// -----------------------------------------------------

app.post("/api/payments", (req, res) => {

    const {
        patient_id,
        treatment_id,
        amount,
        payment_date,
        payment_method,
        status,
        notes
    } = req.body;


    if (
        !patient_id ||
        amount === undefined ||
        amount === null ||
        amount === "" ||
        !payment_date
    ) {

        return res.status(400).json({
            error:
                "Patient, amount and date are required"
        });
    }


    const sql = `
        INSERT INTO payments
        (
            patient_id,
            treatment_id,
            amount,
            payment_date,
            payment_method,
            status,
            notes
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;


    db.query(
        sql,
        [
            patient_id,
            treatment_id || null,
            amount,
            payment_date,
            payment_method || "cash",
            status || "paid",
            notes || null
        ],
        (err, result) => {

            if (err) {

                console.error(
                    "ADD PAYMENT ERROR:",
                    err
                );

                return res.status(500).json({
                    error:
                        "Failed to add payment"
                });
            }


            res.status(201).json({
                message:
                    "Payment added successfully",
                id:
                    result.insertId
            });

        }
    );

});


// -----------------------------------------------------
// UPDATE PAYMENT
// -----------------------------------------------------

app.put("/api/payments/:id", (req, res) => {

    const id = req.params.id;


    const {
        patient_id,
        treatment_id,
        amount,
        payment_date,
        payment_method,
        status,
        notes
    } = req.body;


    if (
        !patient_id ||
        amount === undefined ||
        amount === null ||
        amount === "" ||
        !payment_date
    ) {

        return res.status(400).json({
            error:
                "Patient, amount and date are required"
        });
    }


    const sql = `
        UPDATE payments

        SET
            patient_id = ?,
            treatment_id = ?,
            amount = ?,
            payment_date = ?,
            payment_method = ?,
            status = ?,
            notes = ?

        WHERE id = ?
    `;


    db.query(
        sql,
        [
            patient_id,
            treatment_id || null,
            amount,
            payment_date,
            payment_method || "cash",
            status || "paid",
            notes || null,
            id
        ],
        (err, result) => {

            if (err) {

                console.error(
                    "UPDATE PAYMENT ERROR:",
                    err
                );

                return res.status(500).json({
                    error:
                        "Failed to update payment"
                });
            }


            if (result.affectedRows === 0) {

                return res.status(404).json({
                    error:
                        "Payment not found"
                });
            }


            res.json({
                message:
                    "Payment updated successfully"
            });

        }
    );

});


// -----------------------------------------------------
// DELETE PAYMENT
// -----------------------------------------------------

app.delete("/api/payments/:id", (req, res) => {

    const id = req.params.id;


    const sql = `
        DELETE FROM payments
        WHERE id = ?
    `;


    db.query(sql, [id], (err, result) => {

        if (err) {

            console.error(
                "DELETE PAYMENT ERROR:",
                err
            );

            return res.status(500).json({
                error:
                    "Failed to delete payment"
            });
        }


        if (result.affectedRows === 0) {

            return res.status(404).json({
                error:
                    "Payment not found"
            });
        }


        res.json({
            message:
                "Payment deleted successfully"
        });

    });

});



// =====================================================
// ===================== SETTINGS =======================
// =====================================================


// -----------------------------------------------------
// GET SETTINGS
// -----------------------------------------------------

app.get("/api/settings", (req, res) => {

    const sql = `
        SELECT
            id,
            clinic_name,
            clinic_phone,
            clinic_address,
            username,
            email,
            working_days,
            working_hours,
            created_at,
            updated_at

        FROM settings

        ORDER BY id ASC

        LIMIT 1
    `;


    db.query(sql, (err, results) => {

        if (err) {

            console.error(
                "GET SETTINGS ERROR:",
                err
            );

            return res.status(500).json({
                error:
                    "Failed to load settings"
            });
        }


        if (results.length === 0) {

            return res.status(404).json({
                error:
                    "Settings not found"
            });
        }


        res.json(results[0]);

    });

});


// -----------------------------------------------------
// UPDATE SETTINGS
// -----------------------------------------------------

app.put("/api/settings/:id", (req, res) => {

    const {
        clinic_name,
        clinic_phone,
        clinic_address,
        username,
        email,
        working_days,
        working_hours
    } = req.body;


    if (
        !clinic_name ||
        !username ||
        !working_days ||
        !working_hours
    ) {

        return res.status(400).json({
            error:
                "Required settings are missing"
        });

    }


    const sql = `
        UPDATE settings

        SET
            clinic_name = ?,
            clinic_phone = ?,
            clinic_address = ?,
            username = ?,
            email = ?,
            working_days = ?,
            working_hours = ?

        WHERE id = ?
    `;


    const values = [
        clinic_name,
        clinic_phone || null,
        clinic_address || null,
        username,
        email || null,
        working_days,
        working_hours,
        req.params.id
    ];


    db.query(
        sql,
        values,
        (err, result) => {

            if (err) {

                console.error(
                    "UPDATE SETTINGS ERROR:",
                    err
                );

                return res.status(500).json({
                    error:
                        "Failed to update settings"
                });
            }


            if (result.affectedRows === 0) {

                return res.status(404).json({
                    error:
                        "Settings not found"
                });

            }


            res.json({
                message:
                    "Settings updated successfully"
            });

        }
    );

});


// =====================================================
// ================= ONLINE BOOKING =====================
// =====================================================

// Generate unique booking code
function generateBookingCode() {
    const now = new Date();

    const date =
        now.getFullYear().toString().slice(-2) +
        String(now.getMonth() + 1).padStart(2, "0") +
        String(now.getDate()).padStart(2, "0");

    const random =
        Math.floor(1000 + Math.random() * 9000);

    return `SC-${date}-${random}`;
}





// -----------------------------------------------------
// GET ONLINE BOOKINGS
// -----------------------------------------------------

app.get("/api/online-bookings", (req, res) => {

    const sql = `
        SELECT
            a.id,
            a.dentist_id,
            a.appointment_date,
            a.appointment_time,
            a.reason,
            a.status,
            a.booking_type,
            a.booking_name,
            a.booking_phone,
            a.booking_email,
            a.booking_code,
            a.booking_status,
            a.created_at,

            CONCAT(
                d.first_name,
                ' ',
                d.last_name
            ) AS dentist_name

        FROM appointments a

        JOIN dentists d
            ON a.dentist_id = d.id

        WHERE a.booking_type = 'online'

        ORDER BY
            a.appointment_date DESC,
            a.appointment_time DESC
    `;

    db.query(sql, (err, results) => {

        if (err) {
            console.error("GET ONLINE BOOKINGS ERROR:", err);

            return res.status(500).json({
                error: "Failed to get online bookings"
            });
        }

        res.json(results);
    });
});


// =====================================================
// CREATE ONLINE BOOKING
// =====================================================

app.post("/api/online-bookings", (req, res) => {

    const {
        name,
        phone,
        email,
        dentist_id,
        appointment_date,
        appointment_time,
        reason
    } = req.body;


    // -------------------------------------------------
    // VALIDATION
    // -------------------------------------------------

    if (
        !name ||
        !phone ||
        !dentist_id ||
        !appointment_date ||
        !appointment_time
    ) {
        return res.status(400).json({
            error:
                "Name, phone, dentist, date and time are required"
        });
    }


    // -------------------------------------------------
    // CHECK DOCTOR
    // -------------------------------------------------

    const doctorSQL = `
        SELECT
            id,
            first_name,
            last_name
        FROM dentists
        WHERE id = ?
    `;


    db.query(
        doctorSQL,
        [dentist_id],
        (doctorErr, doctors) => {

            if (doctorErr) {

                console.error(
                    "ONLINE BOOKING DOCTOR ERROR:",
                    doctorErr
                );

                return res.status(500).json({
                    error:
                        "Failed to verify doctor"
                });
            }


            if (doctors.length === 0) {

                return res.status(404).json({
                    error:
                        "Doctor not found"
                });
            }


            // -------------------------------------------------
            // CHECK TIME SLOT
            // -------------------------------------------------

            const checkSQL = `
                SELECT id
                FROM appointments
                WHERE dentist_id = ?
                AND appointment_date = ?
                AND appointment_time = ?
                AND (
                    booking_status IS NULL
                    OR booking_status != 'cancelled'
                )
                AND (
                    status IS NULL
                    OR status != 'cancelled'
                )
                LIMIT 1
            `;


            db.query(
                checkSQL,
                [
                    dentist_id,
                    appointment_date,
                    appointment_time
                ],
                (checkErr, existing) => {

                    if (checkErr) {

                        console.error(
                            "CHECK ONLINE SLOT ERROR:",
                            checkErr
                        );

                        return res.status(500).json({
                            error:
                                "Failed to check appointment time"
                        });
                    }


                    if (existing.length > 0) {

                        return res.status(409).json({
                            error:
                                "This appointment time is already booked. Please choose another time."
                        });
                    }


                    // -------------------------------------------------
                    // FIND EXISTING PATIENT BY PHONE
                    // -------------------------------------------------

                    const findPatientSQL = `
                        SELECT
                            id,
                            first_name,
                            last_name
                        FROM patients
                        WHERE phone = ?
                        LIMIT 1
                    `;


                    db.query(
                        findPatientSQL,
                        [phone.trim()],
                        (patientFindErr, patients) => {

                            if (patientFindErr) {

                                console.error(
                                    "FIND PATIENT ERROR:",
                                    patientFindErr
                                );

                                return res.status(500).json({
                                    error:
                                        "Failed to find patient"
                                });
                            }


                            // =================================================
                            // PATIENT ALREADY EXISTS
                            // =================================================

                            if (patients.length > 0) {

                                createOnlineAppointment(
                                    patients[0].id
                                );

                                return;
                            }


                            // =================================================
                            // CREATE NEW PATIENT
                            // =================================================

                            const nameParts =
                                name.trim().split(/\s+/);

                            const firstName =
                                nameParts.shift() || name.trim();

                            const lastName =
                                nameParts.join(" ") || "";


                            const createPatientSQL = `
                                INSERT INTO patients
                                (
                                    first_name,
                                    last_name,
                                    phone,
                                    email,
                                    dentist_id
                                )
                                VALUES (?, ?, ?, ?, ?)
                            `;


                            db.query(
                                createPatientSQL,
                                [
                                    firstName,
                                    lastName,
                                    phone.trim(),
                                    email
                                        ? email.trim()
                                        : null,
                                    dentist_id
                                ],
                                (createPatientErr, patientResult) => {

                                    if (createPatientErr) {

                                        console.error(
                                            "CREATE PATIENT ERROR:",
                                            createPatientErr
                                        );

                                        return res.status(500).json({
                                            error:
                                                "Failed to create patient"
                                        });
                                    }


                                    createOnlineAppointment(
                                        patientResult.insertId
                                    );
                                }
                            );


                            // =================================================
                            // CREATE APPOINTMENT
                            // =================================================

                            function createOnlineAppointment(patientId) {

                                const bookingCode =
                                    generateBookingCode();


                                const insertSQL = `
                                    INSERT INTO appointments
                                    (
                                        patient_id,
                                        dentist_id,
                                        appointment_date,
                                        appointment_time,
                                        reason,
                                        status,
                                        notes,
                                        booking_type,
                                        booking_name,
                                        booking_phone,
                                        booking_email,
                                        booking_code,
                                        booking_status
                                    )
                                    VALUES
                                    (
                                        ?,
                                        ?,
                                        ?,
                                        ?,
                                        ?,
                                        'scheduled',
                                        NULL,
                                        'online',
                                        ?,
                                        ?,
                                        ?,
                                        ?,
                                        'pending'
                                    )
                                `;


                                const values = [

                                    patientId,

                                    dentist_id,

                                    appointment_date,

                                    appointment_time,

                                    reason ||
                                        "Online appointment",

                                    name.trim(),

                                    phone.trim(),

                                    email
                                        ? email.trim()
                                        : null,

                                    bookingCode
                                ];


                                db.query(
                                    insertSQL,
                                    values,
                                    (insertErr, result) => {

                                        if (insertErr) {

                                            console.error(
                                                "CREATE ONLINE APPOINTMENT ERROR:",
                                                insertErr
                                            );

                                            return res.status(500).json({
                                                error:
                                                    "Failed to create online appointment"
                                            });
                                        }


                                        res.status(201).json({

                                            message:
                                                "Online appointment booked successfully",

                                            id:
                                                result.insertId,

                                            booking_code:
                                                bookingCode,

                                            booking: {

                                                id:
                                                    result.insertId,

                                                patient_id:
                                                    patientId,

                                                name:
                                                    name.trim(),

                                                phone:
                                                    phone.trim(),

                                                email:
                                                    email || "",

                                                dentist_id:
                                                    dentist_id,

                                                dentist_name:
                                                    `${doctors[0].first_name} ${doctors[0].last_name}`,

                                                appointment_date:
                                                    appointment_date,

                                                appointment_time:
                                                    appointment_time,

                                                reason:
                                                    reason ||
                                                    "Online appointment",

                                                booking_code:
                                                    bookingCode,

                                                booking_status:
                                                    "pending"
                                            }
                                        });
                                    }
                                );
                            }
                        }
                    );
                }
            );
        }
    );
});


// -----------------------------------------------------
// CONFIRM ONLINE BOOKING
// -----------------------------------------------------

app.put("/api/online-bookings/:id/confirm", (req, res) => {

    const sql = `
        UPDATE appointments
        SET booking_status = 'confirmed'
        WHERE id = ?
        AND booking_type = 'online'
    `;

    db.query(
        sql,
        [req.params.id],
        (err, result) => {

            if (err) {

                console.error(
                    "CONFIRM ONLINE BOOKING ERROR:",
                    err
                );

                return res.status(500).json({
                    error:
                        "Failed to confirm booking"
                });
            }

            if (result.affectedRows === 0) {

                return res.status(404).json({
                    error:
                        "Online booking not found"
                });
            }

            res.json({
                message:
                    "Online booking confirmed successfully"
            });
        }
    );
});


// -----------------------------------------------------
// CANCEL ONLINE BOOKING
// -----------------------------------------------------

app.put("/api/online-bookings/:id/cancel", (req, res) => {

    const sql = `
        UPDATE appointments
        SET
            booking_status = 'cancelled',
            status = 'cancelled'
        WHERE id = ?
        AND booking_type = 'online'
    `;

    db.query(
        sql,
        [req.params.id],
        (err, result) => {

            if (err) {

                console.error(
                    "CANCEL ONLINE BOOKING ERROR:",
                    err
                );

                return res.status(500).json({
                    error:
                        "Failed to cancel booking"
                });
            }

            if (result.affectedRows === 0) {

                return res.status(404).json({
                    error:
                        "Online booking not found"
                });
            }

            res.json({
                message:
                    "Online booking cancelled successfully"
            });
        }
    );
});




// =====================================================
// ================= DOCTOR WORK SYSTEM ================
// =====================================================

// -----------------------------------------------------
// START DOCTOR WORK DAY
// -----------------------------------------------------
// الطبيب يضغط "Start Work Day"
// النظام ينشئ يوم العمل تلقائياً إذا لم يكن موجوداً
// ويضع الحالة Working ويسجل وقت البداية.
// -----------------------------------------------------

app.post("/api/doctor-work/start", (req, res) => {

    const { dentist_id } = req.body;

    if (!dentist_id) {
        return res.status(400).json({
            error: "dentist_id is required"
        });
    }

    // First check that the dentist exists
    const dentistSql = `
        SELECT
            id,
            first_name,
            last_name,
            phone,
            email,
            specialty
        FROM dentists
        WHERE id = ?
    `;

    db.query(dentistSql, [dentist_id], (err, dentistResults) => {

        if (err) {
            console.error("START WORK - DENTIST ERROR:", err);

            return res.status(500).json({
                error: "Failed to verify dentist"
            });
        }

        if (dentistResults.length === 0) {
            return res.status(404).json({
                error: "Dentist not found"
            });
        }

        // Check today's work day
        const checkSql = `
            SELECT
                id,
                dentist_id,
                work_date,
                start_time,
                end_time,
                status,
                created_at
            FROM doctor_work_days
            WHERE dentist_id = ?
            AND work_date = CURDATE()
            LIMIT 1
        `;

        db.query(checkSql, [dentist_id], (err, results) => {

            if (err) {
                console.error("START WORK - CHECK ERROR:", err);

                return res.status(500).json({
                    error: "Failed to check work day"
                });
            }

            // ---------------------------------------------
            // Work day already exists
            // ---------------------------------------------

            if (results.length > 0) {

                const workDay = results[0];

                // Already working
                if (workDay.status === "working") {

                    return res.json({
                        message: "Work day already started",
                        already_started: true,
                        work_day: workDay,
                        dentist: dentistResults[0]
                    });
                }

                // Closed day cannot be started again
                if (workDay.status === "closed") {

                    return res.status(400).json({
                        error: "Today's work day is already closed"
                    });
                }

                // Temporarily unavailable -> return to working
                const updateSql = `
                    UPDATE doctor_work_days
                    SET
                        status = 'working',
                        start_time = COALESCE(start_time, NOW())
                    WHERE id = ?
                `;

                db.query(
                    updateSql,
                    [workDay.id],
                    (err) => {

                        if (err) {
                            console.error(
                                "START WORK - UPDATE ERROR:",
                                err
                            );

                            return res.status(500).json({
                                error: "Failed to start work day"
                            });
                        }

                        const getSql = `
                            SELECT
                                id,
                                dentist_id,
                                work_date,
                                start_time,
                                end_time,
                                status,
                                created_at
                            FROM doctor_work_days
                            WHERE id = ?
                        `;

                        db.query(
                            getSql,
                            [workDay.id],
                            (err, updatedResults) => {

                                if (err) {
                                    return res.status(500).json({
                                        error:
                                            "Failed to get updated work day"
                                    });
                                }

                                return res.json({
                                    message:
                                        "Doctor work day started successfully",
                                    already_started: false,
                                    work_day:
                                        updatedResults[0],
                                    dentist:
                                        dentistResults[0]
                                });
                            }
                        );
                    }
                );

                return;
            }

            // ---------------------------------------------
            // Create today's work day
            // ---------------------------------------------

            const insertSql = `
                INSERT INTO doctor_work_days
                (
                    dentist_id,
                    work_date,
                    start_time,
                    status
                )
                VALUES
                (
                    ?,
                    CURDATE(),
                    NOW(),
                    'working'
                )
            `;

            db.query(
                insertSql,
                [dentist_id],
                (err, result) => {

                    if (err) {
                        console.error(
                            "START WORK - INSERT ERROR:",
                            err
                        );

                        return res.status(500).json({
                            error: "Failed to start work day"
                        });
                    }

                    const getSql = `
                        SELECT
                            id,
                            dentist_id,
                            work_date,
                            start_time,
                            end_time,
                            status,
                            created_at
                        FROM doctor_work_days
                        WHERE id = ?
                    `;

                    db.query(
                        getSql,
                        [result.insertId],
                        (err, workResults) => {

                            if (err) {
                                return res.status(500).json({
                                    error:
                                        "Failed to get work day"
                                });
                            }

                            res.json({
                                message:
                                    "Doctor work day started successfully",
                                already_started: false,
                                work_day:
                                    workResults[0],
                                dentist:
                                    dentistResults[0]
                            });
                        }
                    );
                }
            );
        });
    });
});


// -----------------------------------------------------
// GET TODAY'S DOCTOR WORK PAGE
// -----------------------------------------------------
// يعيد:
// - معلومات الطبيب
// - حالة يوم العمل
// - مرضى اليوم
// - عدد المرضى
// - حالة كل مريض
// -----------------------------------------------------

app.get("/api/doctor-work/today/:dentistId", (req, res) => {

    const dentistId = req.params.dentistId;

    // ---------------------------------------------
    // Get dentist
    // ---------------------------------------------

    const dentistSql = `
        SELECT
            id,
            first_name,
            last_name,
            phone,
            email,
            specialty
        FROM dentists
        WHERE id = ?
    `;

    db.query(dentistSql, [dentistId], (err, dentistResults) => {

        if (err) {
            console.error("DOCTOR TODAY - DENTIST ERROR:", err);

            return res.status(500).json({
                error: "Failed to get dentist"
            });
        }

        if (dentistResults.length === 0) {
            return res.status(404).json({
                error: "Dentist not found"
            });
        }

        // ---------------------------------------------
        // Get today's work day
        // ---------------------------------------------

        const workDaySql = `
            SELECT
                id,
                dentist_id,
                work_date,
                start_time,
                end_time,
                status,
                created_at
            FROM doctor_work_days
            WHERE dentist_id = ?
            AND work_date = CURDATE()
            LIMIT 1
        `;

        db.query(
            workDaySql,
            [dentistId],
            (err, workDayResults) => {

                if (err) {
                    console.error(
                        "DOCTOR TODAY - WORK DAY ERROR:",
                        err
                    );

                    return res.status(500).json({
                        error:
                            "Failed to get doctor work day"
                    });
                }

                // ---------------------------------------------
                // Get today's appointments
                // ---------------------------------------------

                const appointmentsSql = `
                    SELECT

                        a.id AS appointment_id,

                        a.patient_id,

                        a.dentist_id,

                        a.appointment_date,

                        a.appointment_time,

                        a.reason,

                        a.status AS appointment_status,

                        a.booking_type,

                        a.booking_name,

                        a.booking_phone,

                        a.booking_code,

                        p.first_name AS patient_first_name,

                        p.last_name AS patient_last_name,

                        p.phone AS patient_phone,

                        p.email AS patient_email,

                        p.date_of_birth,

                        p.medical_history,

                        q.id AS queue_id,

                        q.priority,

                        q.queue_status,

                        q.queue_number,

                        q.arrived_at,

                        q.called_at,

                        q.visit_started_at,

                        q.completed_at

                    FROM appointments a

                    LEFT JOIN patients p
                        ON a.patient_id = p.id

                    LEFT JOIN queue q
                        ON q.appointment_id = a.id

                    WHERE a.dentist_id = ?
                    AND a.appointment_date = CURDATE()

                    ORDER BY
                        CASE
                            WHEN q.queue_status = 'in_visit'
                                THEN 1
                            WHEN q.queue_status = 'called'
                                THEN 2
                            WHEN q.queue_status = 'waiting'
                                THEN 3
                            WHEN q.queue_status = 'absent'
                                THEN 4
                            WHEN a.status = 'cancelled'
                                THEN 5
                            ELSE 6
                        END,

                        a.appointment_time ASC,

                        a.id ASC
                `;

                db.query(
                    appointmentsSql,
                    [dentistId],
                    (err, appointments) => {

                        if (err) {
                            console.error(
                                "DOCTOR TODAY - APPOINTMENTS ERROR:",
                                err
                            );

                            return res.status(500).json({
                                error:
                                    "Failed to get today's appointments"
                            });
                        }

                        // -----------------------------------------
                        // Convert database rows into doctor UI data
                        // -----------------------------------------

                        const patients = appointments.map(
                            (appointment) => {

                                let patientStatus =
                                    "not_arrived";

                                // Appointment cancelled
                                if (
                                    appointment.appointment_status ===
                                    "cancelled"
                                ) {
                                    patientStatus =
                                        "cancelled";
                                }

                                // Queue exists
                                else if (
                                    appointment.queue_status
                                ) {

                                    switch (
                                        appointment.queue_status
                                    ) {

                                        case "waiting":
                                            patientStatus =
                                                "waiting";
                                            break;

                                        case "called":
                                            patientStatus =
                                                "called";
                                            break;

                                        case "in_visit":
                                            patientStatus =
                                                "in_visit";
                                            break;

                                        case "completed":
                                            patientStatus =
                                                "completed";
                                            break;

                                        case "absent":
                                            patientStatus =
                                                "absent";
                                            break;

                                        case "cancelled":
                                            patientStatus =
                                                "cancelled";
                                            break;

                                        default:
                                            patientStatus =
                                                "not_arrived";
                                    }
                                }

                                return {
                                    appointment_id:
                                        appointment.appointment_id,

                                    patient_id:
                                        appointment.patient_id,

                                    dentist_id:
                                        appointment.dentist_id,

                                    patient_name:
                                        appointment.patient_id
                                            ? `${appointment.patient_first_name} ${appointment.patient_last_name}`
                                            : appointment.booking_name,

                                    patient_first_name:
                                        appointment.patient_first_name,

                                    patient_last_name:
                                        appointment.patient_last_name,

                                    patient_phone:
                                        appointment.patient_phone ||
                                        appointment.booking_phone,

                                    patient_email:
                                        appointment.patient_email ||
                                        appointment.booking_email,

                                    date_of_birth:
                                        appointment.date_of_birth,

                                    medical_history:
                                        appointment.medical_history,

                                    appointment_time:
                                        appointment.appointment_time,

                                    reason:
                                        appointment.reason,

                                    appointment_status:
                                        appointment.appointment_status,

                                    booking_type:
                                        appointment.booking_type,

                                    booking_name:
                                        appointment.booking_name,

                                    booking_code:
                                        appointment.booking_code,

                                    queue_id:
                                        appointment.queue_id,

                                    queue_number:
                                        appointment.queue_number,

                                    priority:
                                        appointment.priority ||
                                        "normal",

                                    queue_status:
                                        appointment.queue_status,

                                    patient_status:
                                        patientStatus,

                                    arrived_at:
                                        appointment.arrived_at,

                                    called_at:
                                        appointment.called_at,

                                    visit_started_at:
                                        appointment.visit_started_at,

                                    completed_at:
                                        appointment.completed_at
                                };
                            }
                        );

                        // ---------------------------------------------
                        // Statistics
                        // ---------------------------------------------

                        const stats = {
                            total: patients.length,

                            arrived: patients.filter(
                                p =>
                                    p.patient_status ===
                                    "waiting" ||
                                    p.patient_status ===
                                    "called" ||
                                    p.patient_status ===
                                    "in_visit" ||
                                    p.patient_status ===
                                    "completed"
                            ).length,

                            waiting: patients.filter(
                                p =>
                                    p.patient_status ===
                                    "waiting"
                            ).length,

                            called: patients.filter(
                                p =>
                                    p.patient_status ===
                                    "called"
                            ).length,

                            in_visit: patients.filter(
                                p =>
                                    p.patient_status ===
                                    "in_visit"
                            ).length,

                            completed: patients.filter(
                                p =>
                                    p.patient_status ===
                                    "completed"
                            ).length,

                            not_arrived: patients.filter(
                                p =>
                                    p.patient_status ===
                                    "not_arrived"
                            ).length,

                            cancelled: patients.filter(
                                p =>
                                    p.patient_status ===
                                    "cancelled"
                            ).length,

                            absent: patients.filter(
                                p =>
                                    p.patient_status ===
                                    "absent"
                            ).length,

                            emergency: patients.filter(
                                p =>
                                    p.priority ===
                                    "emergency"
                            ).length
                        };

                        // ---------------------------------------------
                        // Response
                        // ---------------------------------------------

                        res.json({

                            dentist:
                                dentistResults[0],

                            work_day:
                                workDayResults.length > 0
                                    ? workDayResults[0]
                                    : null,

                            date:
                                new Date()
                                    .toISOString()
                                    .split("T")[0],

                            stats,

                            patients
                        });
                    }
                );
            }
        );
    });
});


// =====================================================
// ===================== QUEUE SYSTEM ==================
// =====================================================


// -----------------------------------------------------
// REGISTER PATIENT ARRIVAL
// -----------------------------------------------------
// Reception تستخدم هذا الزر عندما يصل المريض.
// النظام ينشئ Queue تلقائياً ويضع المريض في Waiting.
// -----------------------------------------------------

app.post("/api/queue/arrive", (req, res) => {

    const {
        appointment_id,
        dentist_id
    } = req.body;


    if (!appointment_id || !dentist_id) {

        return res.status(400).json({
            error:
                "appointment_id and dentist_id are required"
        });

    }


    // -------------------------------------------------
    // Check appointment
    // -------------------------------------------------

    const appointmentSql = `
        SELECT
            a.id,
            a.patient_id,
            a.dentist_id,
            a.appointment_date,
            a.appointment_time,
            a.reason,
            a.status,
            a.booking_status,

            CONCAT(
                p.first_name,
                ' ',
                p.last_name
            ) AS patient_name

        FROM appointments a

        JOIN patients p
            ON a.patient_id = p.id

        WHERE a.id = ?
          AND a.dentist_id = ?
        LIMIT 1
    `;


    db.query(
        appointmentSql,
        [appointment_id, dentist_id],
        (err, appointments) => {

            if (err) {

                console.error(
                    "QUEUE ARRIVAL - APPOINTMENT ERROR:",
                    err
                );

                return res.status(500).json({
                    error:
                        "Failed to verify appointment"
                });

            }


            if (appointments.length === 0) {

                return res.status(404).json({
                    error:
                        "Appointment not found"
                });

            }


            const appointment =
                appointments[0];


            // -------------------------------------------------
            // Check cancelled appointment
            // -------------------------------------------------

            if (
                appointment.status === "cancelled" ||
                appointment.booking_status === "cancelled"
            ) {

                return res.status(400).json({
                    error:
                        "This appointment is cancelled"
                });

            }


            // -------------------------------------------------
            // Make sure appointment is today
            // -------------------------------------------------

            const todaySql = `
                SELECT CURDATE() AS today
            `;


            db.query(
                todaySql,
                (todayError, todayResults) => {

                    if (todayError) {

                        return res.status(500).json({
                            error:
                                "Failed to verify today's date"
                        });

                    }


                    const today =
                        todayResults[0].today;


                    if (
                        String(
                            appointment.appointment_date
                        ) !== String(today)
                    ) {

                        return res.status(400).json({
                            error:
                                "Only today's appointments can be registered"
                        });

                    }


                    // -------------------------------------------------
                    // Check existing queue
                    // -------------------------------------------------

                    const existingQueueSql = `
                        SELECT
                            id,
                            appointment_id,
                            dentist_id,
                            patient_id,
                            priority,
                            queue_status,
                            queue_number,
                            arrived_at,
                            called_at,
                            visit_started_at,
                            completed_at

                        FROM queue

                        WHERE appointment_id = ?

                        LIMIT 1
                    `;


                    db.query(
                        existingQueueSql,
                        [appointment_id],
                        (queueError, queueResults) => {

                            if (queueError) {

                                console.error(
                                    "QUEUE ARRIVAL - EXISTING ERROR:",
                                    queueError
                                );

                                return res.status(500).json({
                                    error:
                                        "Failed to check patient queue"
                                });

                            }


                            // -------------------------------------------------
                            // Already registered
                            // -------------------------------------------------

                            if (queueResults.length > 0) {

                                return res.json({

                                    message:
                                        "Patient is already registered",

                                    already_registered:
                                        true,

                                    queue:
                                        queueResults[0],

                                    patient:
                                        appointment.patient_name

                                });

                            }


                            // -------------------------------------------------
                            // Determine priority
                            // -------------------------------------------------

                            const priority =
                                "normal";


                            // -------------------------------------------------
                            // Get next queue number
                            // -------------------------------------------------

                            const queueNumberSql = `
                                SELECT
                                    COALESCE(
                                        MAX(queue_number),
                                        0
                                    ) + 1 AS next_number

                                FROM queue

                                WHERE dentist_id = ?
                                  AND DATE(arrived_at) = CURDATE()
                            `;


                            db.query(
                                queueNumberSql,
                                [dentist_id],
                                (numberError, numberResults) => {

                                    if (numberError) {

                                        console.error(
                                            "QUEUE ARRIVAL - NUMBER ERROR:",
                                            numberError
                                        );

                                        return res.status(500).json({
                                            error:
                                                "Failed to generate queue number"
                                        });

                                    }


                                    const queueNumber =
                                        numberResults[0].next_number;


                                    // -------------------------------------------------
                                    // Create queue
                                    // -------------------------------------------------

                                    const insertQueueSql = `
                                        INSERT INTO queue
                                        (
                                            appointment_id,
                                            dentist_id,
                                            patient_id,
                                            priority,
                                            queue_status,
                                            queue_number,
                                            arrived_at
                                        )
                                        VALUES
                                        (
                                            ?,
                                            ?,
                                            ?,
                                            ?,
                                            'waiting',
                                            ?,
                                            NOW()
                                        )
                                    `;


                                    db.query(
                                        insertQueueSql,
                                        [
                                            appointment_id,
                                            dentist_id,
                                            appointment.patient_id,
                                            priority,
                                            queueNumber
                                        ],
                                        (
                                            insertError,
                                            insertResult
                                        ) => {

                                            if (insertError) {

                                                console.error(
                                                    "QUEUE ARRIVAL - INSERT ERROR:",
                                                    insertError
                                                );

                                                return res.status(500).json({
                                                    error:
                                                        "Failed to register patient arrival"
                                                });

                                            }


                                            res.status(201).json({

                                                message:
                                                    "Patient arrival registered successfully",

                                                queue: {

                                                    id:
                                                        insertResult.insertId,

                                                    appointment_id:
                                                        appointment_id,

                                                    dentist_id:
                                                        dentist_id,

                                                    patient_id:
                                                        appointment.patient_id,

                                                    patient_name:
                                                        appointment.patient_name,

                                                    priority:
                                                        priority,

                                                    queue_status:
                                                        "waiting",

                                                    queue_number:
                                                        queueNumber
                                                }

                                            });

                                        }
                                    );

                                }
                            );

                        }
                    );

                }
            );

        }
    );

});



// -----------------------------------------------------
// CALL NEXT PATIENT
// -----------------------------------------------------
// الطبيب يضغط زر واحد فقط: CALL NEXT
//
// النظام يختار تلقائياً:
// 1. Emergency
// 2. Follow-up
// 3. Normal
// ثم حسب رقم الانتظار.
//
// لا يحتاج الطبيب إلى البحث عن المريض.
// -----------------------------------------------------

app.post("/api/doctor-work/call-next", (req, res) => {

    const {
        dentist_id
    } = req.body;


    if (!dentist_id) {

        return res.status(400).json({
            error:
                "dentist_id is required"
        });

    }


    // -------------------------------------------------
    // Check doctor work day
    // -------------------------------------------------

    const workDaySql = `
        SELECT
            id,
            dentist_id,
            work_date,
            start_time,
            end_time,
            status

        FROM doctor_work_days

        WHERE dentist_id = ?
          AND work_date = CURDATE()

        LIMIT 1
    `;


    db.query(
        workDaySql,
        [dentist_id],
        (workError, workDays) => {

            if (workError) {

                console.error(
                    "CALL NEXT - WORK DAY ERROR:",
                    workError
                );

                return res.status(500).json({
                    error:
                        "Failed to check doctor work day"
                });

            }


            if (workDays.length === 0) {

                return res.status(400).json({
                    error:
                        "Doctor has not started the work day"
                });

            }


            const workDay =
                workDays[0];


            if (workDay.status !== "working") {

                return res.status(400).json({
                    error:
                        "Doctor is not currently available"
                });

            }


            // -------------------------------------------------
            // Make sure doctor does not already have
            // a patient inside the room
            // -------------------------------------------------

            const activePatientSql = `
                SELECT
                    q.id,
                    q.patient_id,
                    q.queue_status,

                    CONCAT(
                        p.first_name,
                        ' ',
                        p.last_name
                    ) AS patient_name

                FROM queue q

                JOIN patients p
                    ON q.patient_id = p.id

                WHERE q.dentist_id = ?

                  AND q.queue_status IN
                      ('called', 'in_visit')

                ORDER BY
                    q.called_at ASC

                LIMIT 1
            `;


            db.query(
                activePatientSql,
                [dentist_id],
                (activeError, activePatients) => {

                    if (activeError) {

                        console.error(
                            "CALL NEXT - ACTIVE PATIENT ERROR:",
                            activeError
                        );

                        return res.status(500).json({
                            error:
                                "Failed to check active patient"
                        });

                    }


                    // -------------------------------------------------
                    // Doctor must finish current patient first
                    // -------------------------------------------------

                    if (activePatients.length > 0) {

                        return res.status(409).json({

                            error:
                                "Doctor already has an active patient",

                            active_patient:
                                activePatients[0]

                        });

                    }


                    // -------------------------------------------------
                    // Find next waiting patient
                    // -------------------------------------------------

                    const nextPatientSql = `
                        SELECT

                            q.id AS queue_id,

                            q.appointment_id,

                            q.dentist_id,

                            q.patient_id,

                            q.priority,

                            q.queue_status,

                            q.queue_number,

                            q.arrived_at,

                            q.called_at,

                            a.appointment_time,

                            a.reason,

                            p.first_name,

                            p.last_name,

                            p.phone,

                            p.email,

                            p.date_of_birth,

                            p.medical_history

                        FROM queue q

                        JOIN appointments a
                            ON q.appointment_id = a.id

                        JOIN patients p
                            ON q.patient_id = p.id

                        WHERE q.dentist_id = ?

                          AND q.queue_status = 'waiting'

                        ORDER BY

                            CASE q.priority

                                WHEN 'emergency'
                                    THEN 1

                                WHEN 'follow_up'
                                    THEN 2

                                ELSE 3

                            END,

                            q.queue_number ASC,

                            q.arrived_at ASC

                        LIMIT 1
                    `;


                    db.query(
                        nextPatientSql,
                        [dentist_id],
                        (nextError, nextPatients) => {

                            if (nextError) {

                                console.error(
                                    "CALL NEXT - NEXT PATIENT ERROR:",
                                    nextError
                                );

                                return res.status(500).json({
                                    error:
                                        "Failed to find next patient"
                                });

                            }


                            // -------------------------------------------------
                            // Nobody waiting
                            // -------------------------------------------------

                            if (nextPatients.length === 0) {

                                return res.status(404).json({

                                    error:
                                        "No patients are currently waiting",

                                    no_patient_waiting:
                                        true

                                });

                            }


                            const patient =
                                nextPatients[0];


                            // -------------------------------------------------
                            // Call patient
                            // -------------------------------------------------

                            const updateQueueSql = `
                                UPDATE queue

                                SET
                                    queue_status = 'called',
                                    called_at = NOW()

                                WHERE id = ?

                                  AND queue_status = 'waiting'
                            `;


                            db.query(
                                updateQueueSql,
                                [patient.queue_id],
                                (updateError, updateResult) => {

                                    if (updateError) {

                                        console.error(
                                            "CALL NEXT - UPDATE ERROR:",
                                            updateError
                                        );

                                        return res.status(500).json({
                                            error:
                                                "Failed to call patient"
                                        });

                                    }


                                    if (
                                        updateResult.affectedRows === 0
                                    ) {

                                        return res.status(409).json({
                                            error:
                                                "Patient was already called"
                                        });

                                    }


                                    // -------------------------------------------------
                                    // Response
                                    // -------------------------------------------------

                                    res.json({

                                        message:
                                            "Next patient called successfully",

                                        patient: {

                                            queue_id:
                                                patient.queue_id,

                                            appointment_id:
                                                patient.appointment_id,

                                            patient_id:
                                                patient.patient_id,

                                            patient_name:
                                                `${patient.first_name} ${patient.last_name}`,

                                            phone:
                                                patient.phone,

                                            email:
                                                patient.email,

                                            date_of_birth:
                                                patient.date_of_birth,

                                            medical_history:
                                                patient.medical_history,

                                            appointment_time:
                                                patient.appointment_time,

                                            reason:
                                                patient.reason,

                                            priority:
                                                patient.priority,

                                            queue_number:
                                                patient.queue_number,

                                            queue_status:
                                                "called",

                                            called_at:
                                                new Date()

                                        }

                                    });

                                }
                            );

                        }
                    );

                }
            );

        }
    );

});


// =====================================================
// ================= START PATIENT VISIT =================
// =====================================================
// الطبيب يضغط: START VISIT
//
// Called → In Visit
//
// النظام يقوم تلقائياً بـ:
// - التحقق من الطبيب
// - التحقق من حالة المريض
// - إنشاء زيارة في visits
// - تسجيل وقت البداية
// - تغيير حالة الطابور إلى in_visit
// =====================================================

app.post("/api/doctor-work/start-visit", (req, res) => {

    const {
        queue_id,
        dentist_id
    } = req.body;


    // -------------------------------------------------
    // Validate input
    // -------------------------------------------------

    if (!queue_id || !dentist_id) {

        return res.status(400).json({
            error:
                "queue_id and dentist_id are required"
        });

    }


    db.beginTransaction((transactionError) => {

        if (transactionError) {

            console.error(
                "START VISIT - TRANSACTION ERROR:",
                transactionError
            );

            return res.status(500).json({
                error:
                    "Failed to start visit"
            });

        }


        // -------------------------------------------------
        // Get and lock the queue record
        // -------------------------------------------------

        const queueSql = `
            SELECT

                q.id AS queue_id,
                q.appointment_id,
                q.dentist_id,
                q.patient_id,
                q.queue_status,
                q.priority,
                q.queue_number,

                a.appointment_time,
                a.reason,

                p.first_name,
                p.last_name,
                p.phone,
                p.email,
                p.date_of_birth,
                p.medical_history

            FROM queue q

            INNER JOIN appointments a
                ON q.appointment_id = a.id

            INNER JOIN patients p
                ON q.patient_id = p.id

            WHERE q.id = ?
              AND q.dentist_id = ?

            FOR UPDATE
        `;


        db.query(
            queueSql,
            [queue_id, dentist_id],
            (queueError, queues) => {

                if (queueError) {

                    return db.rollback(() => {

                        console.error(
                            "START VISIT - QUEUE ERROR:",
                            queueError
                        );

                        res.status(500).json({
                            error:
                                "Failed to load queue patient"
                        });

                    });

                }


                // -------------------------------------------------
                // Queue not found
                // -------------------------------------------------

                if (queues.length === 0) {

                    return db.rollback(() => {

                        res.status(404).json({
                            error:
                                "Queue patient not found"
                        });

                    });

                }


                const queue =
                    queues[0];


                // -------------------------------------------------
                // Patient must be called first
                // -------------------------------------------------

                if (queue.queue_status !== "called") {

                    return db.rollback(() => {

                        res.status(409).json({

                            error:
                                "Patient must be called before starting the visit",

                            current_status:
                                queue.queue_status

                        });

                    });

                }


                // -------------------------------------------------
                // Check if doctor already has an active visit
                // -------------------------------------------------

                const activeVisitSql = `
                    SELECT
                        id,
                        patient_id,
                        queue_id

                    FROM visits

                    WHERE dentist_id = ?

                      AND ended_at IS NULL

                    LIMIT 1
                `;


                db.query(
                    activeVisitSql,
                    [dentist_id],
                    (activeError, activeVisits) => {

                        if (activeError) {

                            return db.rollback(() => {

                                console.error(
                                    "START VISIT - ACTIVE VISIT ERROR:",
                                    activeError
                                );

                                res.status(500).json({
                                    error:
                                        "Failed to check active visit"
                                });

                            });

                        }


                        // -------------------------------------------------
                        // Doctor already has another patient
                        // -------------------------------------------------

                        if (activeVisits.length > 0) {

                            return db.rollback(() => {

                                res.status(409).json({

                                    error:
                                        "Doctor already has an active visit",

                                    active_visit:
                                        activeVisits[0]

                                });

                            });

                        }


                        // -------------------------------------------------
                        // Create visit
                        // -------------------------------------------------

                        const insertVisitSql = `
                            INSERT INTO visits
                            (
                                patient_id,
                                dentist_id,
                                appointment_id,
                                queue_id,
                                started_at,
                                reason
                            )
                            VALUES
                            (
                                ?,
                                ?,
                                ?,
                                ?,
                                NOW(),
                                ?
                            )
                        `;


                        db.query(
                            insertVisitSql,
                            [
                                queue.patient_id,
                                dentist_id,
                                queue.appointment_id,
                                queue.queue_id,
                                queue.reason || null
                            ],
                            (visitError, visitResult) => {

                                if (visitError) {

                                    return db.rollback(() => {

                                        console.error(
                                            "START VISIT - INSERT ERROR:",
                                            visitError
                                        );

                                        res.status(500).json({
                                            error:
                                                "Failed to create visit"
                                        });

                                    });

                                }


                                const visitId =
                                    visitResult.insertId;


                                // -------------------------------------------------
                                // Change queue status
                                // -------------------------------------------------

                                const updateQueueSql = `
                                    UPDATE queue

                                    SET
                                        queue_status = 'in_visit',
                                        visit_started_at = NOW()

                                    WHERE id = ?

                                      AND queue_status = 'called'
                                `;


                                db.query(
                                    updateQueueSql,
                                    [queue.queue_id],
                                    (updateError, updateResult) => {

                                        if (updateError) {

                                            return db.rollback(() => {

                                                console.error(
                                                    "START VISIT - QUEUE UPDATE ERROR:",
                                                    updateError
                                                );

                                                res.status(500).json({
                                                    error:
                                                        "Failed to update queue status"
                                                });

                                            });

                                        }


                                        // -------------------------------------------------
                                        // Queue changed unexpectedly
                                        // -------------------------------------------------

                                        if (
                                            updateResult.affectedRows === 0
                                        ) {

                                            return db.rollback(() => {

                                                res.status(409).json({
                                                    error:
                                                        "Patient is no longer available to start"
                                                });

                                            });

                                        }


                                        // -------------------------------------------------
                                        // Commit
                                        // -------------------------------------------------

                                        db.commit(
                                            (commitError) => {

                                                if (commitError) {

                                                    return db.rollback(() => {

                                                        console.error(
                                                            "START VISIT - COMMIT ERROR:",
                                                            commitError
                                                        );

                                                        res.status(500).json({
                                                            error:
                                                                "Failed to start visit"
                                                        });

                                                    });

                                                }


                                                // -------------------------------------------------
                                                // Success
                                                // -------------------------------------------------

                                                res.json({

                                                    message:
                                                        "Patient visit started successfully",

                                                    visit: {

                                                        id:
                                                            visitId,

                                                        queue_id:
                                                            queue.queue_id,

                                                        appointment_id:
                                                            queue.appointment_id,

                                                        patient_id:
                                                            queue.patient_id,

                                                        dentist_id:
                                                            dentist_id,

                                                        patient_name:
                                                            `${queue.first_name} ${queue.last_name}`,

                                                        phone:
                                                            queue.phone,

                                                        email:
                                                            queue.email,

                                                        date_of_birth:
                                                            queue.date_of_birth,

                                                        medical_history:
                                                            queue.medical_history,

                                                        appointment_time:
                                                            queue.appointment_time,

                                                        reason:
                                                            queue.reason,

                                                        priority:
                                                            queue.priority,

                                                        queue_number:
                                                            queue.queue_number,

                                                        queue_status:
                                                            "in_visit",

                                                        started_at:
                                                            new Date()

                                                    }

                                                });

                                            }
                                        );

                                    }
                                );

                            }
                        );

                    }
                );

            }
        );

    });

});




// =====================================================
// FINISH DOCTOR VISIT
// =====================================================
//
// Doctor saves the visit with ONE action.
//
// This operation updates:
// 1. visits
// 2. treatments (if entered)
// 3. medical_records
// 4. follow_ups (if requested)
// 5. queue -> completed
// 6. appointment -> completed
//
// Everything happens inside one transaction.
// =====================================================

app.post("/api/doctor-work/finish-visit", (req, res) => {

    const {
        visit_id,
        queue_id,
        dentist_id,

        reason,
        examination,
        diagnosis,
        doctor_notes,
        recommendation,

        needs_follow_up,

        follow_up_date,
        follow_up_type,
        follow_up_notes,

        treatment_name,
        treatment_description
    } = req.body;


    // -------------------------------------------------
    // VALIDATION
    // -------------------------------------------------

    if (
        !visit_id ||
        !queue_id ||
        !dentist_id
    ) {

        return res.status(400).json({
            error:
                "visit_id, queue_id and dentist_id are required"
        });

    }


    if (
        needs_follow_up === true &&
        (
            !follow_up_date ||
            !follow_up_type
        )
    ) {

        return res.status(400).json({
            error:
                "Follow-up date and type are required"
        });

    }


    // -------------------------------------------------
    // START TRANSACTION
    // -------------------------------------------------

    db.beginTransaction((transactionError) => {

        if (transactionError) {

            console.error(
                "FINISH VISIT - TRANSACTION ERROR:",
                transactionError
            );

            return res.status(500).json({
                error:
                    "Failed to start visit transaction"
            });

        }


        // -------------------------------------------------
        // GET ACTIVE VISIT
        // -------------------------------------------------

        const getVisitSql = `
            SELECT

                v.id AS visit_id,
                v.patient_id,
                v.dentist_id,
                v.appointment_id,
                v.queue_id,
                v.started_at,
                v.ended_at,

                q.queue_status,

                p.first_name,
                p.last_name

            FROM visits v

            INNER JOIN queue q
                ON q.id = v.queue_id

            INNER JOIN patients p
                ON p.id = v.patient_id

            WHERE v.id = ?
              AND v.queue_id = ?
              AND v.dentist_id = ?

            FOR UPDATE
        `;


        db.query(
            getVisitSql,
            [
                visit_id,
                queue_id,
                dentist_id
            ],
            (visitError, visits) => {

                if (visitError) {

                    return db.rollback(() => {

                        console.error(
                            "FINISH VISIT - GET VISIT ERROR:",
                            visitError
                        );

                        res.status(500).json({
                            error:
                                "Failed to get current visit"
                        });

                    });

                }


                if (visits.length === 0) {

                    return db.rollback(() => {

                        res.status(404).json({
                            error:
                                "Active visit not found"
                        });

                    });

                }


                const visit =
                    visits[0];


                // -------------------------------------------------
                // MAKE SURE VISIT IS STILL OPEN
                // -------------------------------------------------

                if (
                    visit.ended_at !== null ||
                    visit.queue_status !== "in_visit"
                ) {

                    return db.rollback(() => {

                        res.status(409).json({
                            error:
                                "This visit is already finished"
                        });

                    });

                }


                // -------------------------------------------------
                // UPDATE VISIT
                // -------------------------------------------------

                const updateVisitSql = `
                    UPDATE visits

                    SET

                        reason = ?,
                        examination = ?,
                        diagnosis = ?,
                        doctor_notes = ?,
                        recommendation = ?,
                        needs_follow_up = ?,
                        ended_at = NOW()

                    WHERE id = ?
                      AND dentist_id = ?
                      AND queue_id = ?
                      AND ended_at IS NULL
                `;


                db.query(
                    updateVisitSql,
                    [
                        reason || null,
                        examination || null,
                        diagnosis || null,
                        doctor_notes || null,
                        recommendation || null,
                        needs_follow_up === true ? 1 : 0,

                        visit_id,
                        dentist_id,
                        queue_id
                    ],
                    (updateVisitError, updateVisitResult) => {

                        if (updateVisitError) {

                            return db.rollback(() => {

                                console.error(
                                    "FINISH VISIT - UPDATE VISIT ERROR:",
                                    updateVisitError
                                );

                                res.status(500).json({
                                    error:
                                        "Failed to save visit"
                                });

                            });

                        }


                        if (
                            updateVisitResult.affectedRows === 0
                        ) {

                            return db.rollback(() => {

                                res.status(409).json({
                                    error:
                                        "Visit was already completed"
                                });

                            });

                        }


                        // -------------------------------------------------
                        // SAVE TREATMENT
                        // -------------------------------------------------

                        function saveTreatment(next) {

                            if (
                                !treatment_name ||
                                !String(
                                    treatment_name
                                ).trim()
                            ) {

                                return next();

                            }


                            const treatmentSql = `
                                INSERT INTO treatments
                                (
                                    patient_id,
                                    dentist_id,
                                    treatment_name,
                                    description,
                                    treatment_date,
                                    notes
                                )

                                VALUES
                                (
                                    ?,
                                    ?,
                                    ?,
                                    ?,
                                    CURDATE(),
                                    ?
                                )
                            `;


                            db.query(
                                treatmentSql,
                                [
                                    visit.patient_id,
                                    dentist_id,

                                    String(
                                        treatment_name
                                    ).trim(),

                                    treatment_description
                                        ? String(
                                            treatment_description
                                        ).trim()
                                        : null,

                                    doctor_notes
                                        ? String(
                                            doctor_notes
                                        ).trim()
                                        : null
                                ],
                                (treatmentError, treatmentResult) => {

                                    if (treatmentError) {

                                        return db.rollback(() => {

                                            console.error(
                                                "FINISH VISIT - TREATMENT ERROR:",
                                                treatmentError
                                            );

                                            res.status(500).json({
                                                error:
                                                    "Failed to save treatment"
                                            });

                                        });

                                    }


                                    next(
                                        treatmentResult.insertId
                                    );

                                }
                            );

                        }


                        // -------------------------------------------------
                        // SAVE MEDICAL RECORD
                        // -------------------------------------------------

                        function saveMedicalRecord(
                            treatmentId,
                            next
                        ) {

                            /*
                                medical_records requires:
                                diagnosis
                                treatment
                                record_date
                            */

                            const diagnosisValue =
                                diagnosis &&
                                String(
                                    diagnosis
                                ).trim()
                                    ? String(
                                        diagnosis
                                    ).trim()
                                    : "Clinical visit";


                            const treatmentValue =
                                treatment_name &&
                                String(
                                    treatment_name
                                ).trim()
                                    ? String(
                                        treatment_name
                                    ).trim()
                                    : "Consultation";


                            const medicalRecordSql = `
                                INSERT INTO medical_records
                                (
                                    patient_id,
                                    diagnosis,
                                    treatment,
                                    notes,
                                    record_date
                                )

                                VALUES
                                (
                                    ?,
                                    ?,
                                    ?,
                                    ?,
                                    CURDATE()
                                )
                            `;


                            db.query(
                                medicalRecordSql,
                                [
                                    visit.patient_id,
                                    diagnosisValue,
                                    treatmentValue,

                                    [
                                        examination,
                                        doctor_notes,
                                        recommendation
                                    ]
                                        .filter(
                                            value =>
                                                value &&
                                                String(
                                                    value
                                                ).trim()
                                        )
                                        .join("\n\n")
                                    ],
                                (medicalError, medicalResult) => {

                                    if (medicalError) {

                                        return db.rollback(() => {

                                            console.error(
                                                "FINISH VISIT - MEDICAL RECORD ERROR:",
                                                medicalError
                                            );

                                            res.status(500).json({
                                                error:
                                                    "Failed to save medical record"
                                            });

                                        });

                                    }


                                    next(
                                        medicalResult.insertId
                                    );

                                }
                            );

                        }


                        // -------------------------------------------------
                        // SAVE FOLLOW-UP
                        // -------------------------------------------------

                        function saveFollowUp(next) {

                            if (
                                needs_follow_up !== true
                            ) {

                                return next();

                            }


                            const followUpSql = `
                                INSERT INTO follow_ups
                                (
                                    patient_id,
                                    dentist_id,
                                    visit_id,
                                    follow_up_date,
                                    follow_up_type,
                                    notes,
                                    status
                                )

                                VALUES
                                (
                                    ?,
                                    ?,
                                    ?,
                                    ?,
                                    ?,
                                    ?,
                                    'pending'
                                )
                            `;


                            db.query(
                                followUpSql,
                                [
                                    visit.patient_id,
                                    dentist_id,
                                    visit_id,

                                    follow_up_date,

                                    String(
                                        follow_up_type
                                    ).trim(),

                                    follow_up_notes
                                        ? String(
                                            follow_up_notes
                                        ).trim()
                                        : null
                                ],
                                (followUpError, followUpResult) => {

                                    if (followUpError) {

                                        return db.rollback(() => {

                                            console.error(
                                                "FINISH VISIT - FOLLOW-UP ERROR:",
                                                followUpError
                                            );

                                            res.status(500).json({
                                                error:
                                                    "Failed to save follow-up"
                                            });

                                        });

                                    }


                                    next(
                                        followUpResult.insertId
                                    );

                                }
                            );

                        }


                        // -------------------------------------------------
                        // COMPLETE QUEUE
                        // -------------------------------------------------

                        function completeQueue(next) {

                            const queueSql = `
                                UPDATE queue

                                SET

                                    queue_status = 'completed',
                                    completed_at = NOW()

                                WHERE id = ?
                                  AND dentist_id = ?
                                  AND queue_status = 'in_visit'
                            `;


                            db.query(
                                queueSql,
                                [
                                    queue_id,
                                    dentist_id
                                ],
                                (queueError, queueResult) => {

                                    if (queueError) {

                                        return db.rollback(() => {

                                            console.error(
                                                "FINISH VISIT - QUEUE ERROR:",
                                                queueError
                                            );

                                            res.status(500).json({
                                                error:
                                                    "Failed to complete queue"
                                            });

                                        });

                                    }


                                    if (
                                        queueResult.affectedRows === 0
                                    ) {

                                        return db.rollback(() => {

                                            res.status(409).json({
                                                error:
                                                    "Queue item was already completed"
                                            });

                                        });

                                    }


                                    next();

                                }
                            );

                        }


                        // -------------------------------------------------
                        // COMPLETE APPOINTMENT
                        // -------------------------------------------------

                        function completeAppointment(next) {

                            const appointmentSql = `
                                UPDATE appointments

                                SET status = 'completed'

                                WHERE id = ?
                                  AND dentist_id = ?
                            `;


                            db.query(
                                appointmentSql,
                                [
                                    visit.appointment_id,
                                    dentist_id
                                ],
                                (appointmentError) => {

                                    if (appointmentError) {

                                        return db.rollback(() => {

                                            console.error(
                                                "FINISH VISIT - APPOINTMENT ERROR:",
                                                appointmentError
                                            );

                                            res.status(500).json({
                                                error:
                                                    "Failed to complete appointment"
                                            });

                                        });

                                    }


                                    next();

                                }
                            );

                        }


                        // -------------------------------------------------
                        // EXECUTE SAVE CHAIN
                        // -------------------------------------------------

                        saveTreatment(
                            (treatmentId) => {

                                saveMedicalRecord(
                                    treatmentId,
                                    (medicalRecordId) => {

                                        saveFollowUp(
                                            (followUpId) => {

                                                completeQueue(
                                                    () => {

                                                        completeAppointment(
                                                            () => {

                                                                // -----------------------------------------
                                                                // COMMIT
                                                                // -----------------------------------------

                                                                db.commit(
                                                                    (commitError) => {

                                                                        if (commitError) {

                                                                            return db.rollback(
                                                                                () => {

                                                                                    console.error(
                                                                                        "FINISH VISIT - COMMIT ERROR:",
                                                                                        commitError
                                                                                    );

                                                                                    res.status(500).json({
                                                                                        error:
                                                                                            "Failed to complete visit"
                                                                                    });

                                                                                }
                                                                            );

                                                                        }


                                                                        res.json({

                                                                            message:
                                                                                "Visit completed successfully",

                                                                            visit: {

                                                                                id:
                                                                                    visit_id,

                                                                                patient_id:
                                                                                    visit.patient_id,

                                                                                dentist_id:
                                                                                    dentist_id,

                                                                                appointment_id:
                                                                                    visit.appointment_id,

                                                                                queue_id:
                                                                                    queue_id,

                                                                                status:
                                                                                    "completed"

                                                                            },

                                                                            treatment_id:
                                                                                treatmentId || null,

                                                                            medical_record_id:
                                                                                medicalRecordId || null,

                                                                            follow_up_id:
                                                                                followUpId || null

                                                                        });

                                                                    }
                                                                );

                                                            }
                                                        );

                                                    }
                                                );

                                            }
                                        );

                                    }
                                );

                            }
                        );

                    }
                );

            }

        );

    });

});



app.post("/api/doctor-work/end", (req, res) => {

    const { dentist_id } = req.body;

    if (!dentist_id) {
        return res.status(400).json({
            message: "dentist_id is required."
        });
    }

    const sql = `
        UPDATE doctor_work_days
        SET
            end_time = NOW(),
            status = 'closed'
        WHERE dentist_id = ?
          AND work_date = CURDATE()
          AND status = 'working'
    `;

    db.query(
        sql,
        [dentist_id],
        (err, result) => {

            if (err) {
                console.error(
                    "END WORK DAY ERROR:",
                    err
                );

                return res.status(500).json({
                    message:
                        "Failed to close work day."
                });
            }

            if (result.affectedRows === 0) {
                return res.status(400).json({
                    message:
                        "No active work day found."
                });
            }

            res.json({
                message:
                    "Work day closed successfully."
            });
        }
    );
});



// =====================================================
// RECEPTION WORKSPACE
// =====================================================

app.get("/api/reception/today/:employeeId", (req, res) => {
    const employeeId = req.params.employeeId;

    const userSql = `
        SELECT id, username, role
        FROM users
        WHERE id = ?
          AND role = 'receptionist'
        LIMIT 1
    `;

    db.query(userSql, [employeeId], (err, userRows) => {
        if (err) {
            console.error("Reception user error:", err);
            return res.status(500).json({
                message: "Database error"
            });
        }

        if (userRows.length === 0) {
            return res.status(404).json({
                message: "Receptionist not found"
            });
        }

        const user = userRows[0];

        const todaySql = `
            SELECT
                COUNT(DISTINCT a.id) AS total,
                COUNT(DISTINCT CASE
                    WHEN q.queue_status = 'waiting' THEN q.id
                END) AS waiting,
                COUNT(DISTINCT CASE
                    WHEN q.queue_status = 'called' THEN q.id
                END) AS called,
                COUNT(DISTINCT CASE
                    WHEN q.queue_status = 'in_visit' THEN q.id
                END) AS in_visit,
                COUNT(DISTINCT CASE
                    WHEN q.queue_status = 'completed' THEN q.id
                END) AS completed,
                COUNT(DISTINCT CASE
                    WHEN q.queue_status = 'absent' THEN q.id
                END) AS absent
            FROM appointments a
            LEFT JOIN queue q
                ON q.appointment_id = a.id
            WHERE a.appointment_date = CURDATE()
        `;

        db.query(todaySql, (err, statsRows) => {
            if (err) {
                console.error("Reception stats error:", err);
                return res.status(500).json({
                    message: "Database error"
                });
            }

            const workDaySql = `
                SELECT
                    id,
                    user_id,
                    work_date,
                    start_time,
                    end_time,
                    status
                FROM reception_work_days
                WHERE user_id = ?
                  AND work_date = CURDATE()
                LIMIT 1
            `;

            db.query(workDaySql, [employeeId], (err, workRows) => {
                if (err) {
                    console.error("Reception work day error:", err);
                    return res.status(500).json({
                        message: "Database error"
                    });
                }

                const stats = statsRows[0] || {};

                res.json({
                    employee: {
                        id: user.id,
                        username: user.username,
                        role: user.role
                    },

                    date: new Date().toISOString().split("T")[0],

                    work_day: workRows.length > 0
                        ? workRows[0]
                        : {
                            id: null,
                            user_id: Number(employeeId),
                            work_date: new Date().toISOString().split("T")[0],
                            start_time: null,
                            end_time: null,
                            status: "not_started"
                        },

                    stats: {
                        total: Number(stats.total || 0),
                        waiting: Number(stats.waiting || 0),
                        called: Number(stats.called || 0),
                        in_visit: Number(stats.in_visit || 0),
                        completed: Number(stats.completed || 0),
                        absent: Number(stats.absent || 0)
                    }
                });
            });
        });
    });
});

// -----------------------------------------------------
// GET TODAY DOCTORS
// -----------------------------------------------------

app.get("/api/reception/doctors", (req, res) => {

    const sql = `

    SELECT

        d.id,
        d.first_name,
        d.last_name,
        d.specialty,

        COALESCE(
            w.status,
            'not_started'
        ) AS work_status,

        w.start_time

    FROM dentists d

    LEFT JOIN doctor_work_days w
        ON w.dentist_id = d.id
        AND w.work_date = CURDATE()

    ORDER BY
        d.first_name,
        d.last_name

`;


    db.query(sql, (err, rows) => {

        if (err) {

            console.error(
                "RECEPTION DOCTORS ERROR:",
                err
            );

            return res.status(500).json({
                message: "Failed to load doctors."
            });
        }


        res.json(rows);

    });

});


// -----------------------------------------------------
// GET TODAY APPOINTMENTS
// -----------------------------------------------------

app.get("/api/reception/appointments", (req, res) => {

    const sql = `

    SELECT

        a.id AS appointment_id,

        a.patient_id,
        a.dentist_id,

        a.appointment_date,
        a.appointment_time,

        a.reason,

        a.status AS appointment_status,

        a.booking_type,
        a.booking_name,
        a.booking_phone,
        a.booking_code,
        a.booking_status,

        p.first_name,
        p.last_name,
        p.phone,

        d.first_name AS dentist_first_name,
        d.last_name AS dentist_last_name,

        CONCAT(
            d.first_name,
            ' ',
            d.last_name
        ) AS dentist_name,

        q.id AS queue_id,
        q.queue_number,
        q.priority,
        q.queue_status,
        q.arrived_at,
        q.called_at,
        q.visit_started_at,
        q.completed_at

    FROM appointments a

    LEFT JOIN patients p
        ON p.id = a.patient_id

    INNER JOIN dentists d
        ON d.id = a.dentist_id

    LEFT JOIN queue q
        ON q.appointment_id = a.id

    WHERE a.appointment_date = CURDATE()

    ORDER BY
        a.appointment_time ASC,
        a.id ASC

`;


    db.query(sql, (err, rows) => {

        if (err) {

            console.error(
                "RECEPTION APPOINTMENTS ERROR:",
                err
            );

            return res.status(500).json({
                message: "Failed to load appointments."
            });
        }


        res.json(rows);

    });

});


// -----------------------------------------------------
// GET TODAY QUEUE
// -----------------------------------------------------

app.get("/api/reception/queue", (req, res) => {

    const sql = `

        SELECT

            q.id AS queue_id,

            q.appointment_id,

            q.dentist_id,

            q.patient_id,

            q.priority,

            q.queue_status,

            q.queue_number,

            q.arrived_at,

            q.called_at,

            q.visit_started_at,

            q.completed_at,

            p.first_name,
            p.last_name,
            p.phone,

            a.appointment_time,
            a.reason,

            d.first_name AS dentist_first_name,
            d.last_name AS dentist_last_name

        FROM queue q

        INNER JOIN patients p
            ON p.id = q.patient_id

        INNER JOIN appointments a
            ON a.id = q.appointment_id

        INNER JOIN dentists d
            ON d.id = q.dentist_id

        WHERE a.appointment_date = CURDATE()

        ORDER BY

            CASE q.queue_status

                WHEN 'called' THEN 1
                WHEN 'in_visit' THEN 2
                WHEN 'waiting' THEN 3
                WHEN 'completed' THEN 4
                WHEN 'absent' THEN 5
                WHEN 'cancelled' THEN 6

                ELSE 7

            END,

            q.queue_number ASC

    `;


    db.query(sql, (err, rows) => {

        if (err) {

            console.error(
                "RECEPTION QUEUE ERROR:",
                err
            );

            return res.status(500).json({
                message: "Failed to load queue."
            });
        }


        res.json(rows);

    });

});






// =====================================================
// RECEPTION WORK DAY - START
// =====================================================

// =====================================================
// RECEPTION WORK DAY - START
// =====================================================

app.post("/api/reception-work/start", (req, res) => {

    const { user_id } = req.body;

    if (!user_id) {
        return res.status(400).json({
            message: "user_id is required."
        });
    }

    const userSql = `
        SELECT id, username, role
        FROM users
        WHERE id = ?
          AND role = 'receptionist'
        LIMIT 1
    `;

    db.query(userSql, [user_id], (err, users) => {

        if (err) {
            console.error("RECEPTION START USER ERROR:", err);

            return res.status(500).json({
                message: "Database error."
            });
        }

        if (users.length === 0) {
            return res.status(404).json({
                message: "Receptionist account not found."
            });
        }

        const workSql = `
            SELECT *
            FROM reception_work_days
            WHERE user_id = ?
              AND work_date = CURDATE()
            LIMIT 1
        `;

        db.query(workSql, [user_id], (err, rows) => {

            if (err) {
                console.error("RECEPTION WORK DAY ERROR:", err);

                return res.status(500).json({
                    message: "Database error."
                });
            }

            // -----------------------------------------
            // Existing work day
            // -----------------------------------------

            if (rows.length > 0) {

                const workDay = rows[0];

                if (workDay.status === "working") {
                    return res.json({
                        message: "Reception work day already started.",
                        work_day: workDay
                    });
                }

                if (workDay.status === "closed") {
                    return res.status(400).json({
                        message: "Reception work day is already closed."
                    });
                }

                // If not_started, start the existing row
                if (workDay.status === "not_started") {

                    const updateSql = `
                        UPDATE reception_work_days
                        SET
                            start_time = NOW(),
                            end_time = NULL,
                            status = 'working'
                        WHERE id = ?
                    `;

                    db.query(
                        updateSql,
                        [workDay.id],
                        (err) => {

                            if (err) {
                                console.error(
                                    "RECEPTION START UPDATE ERROR:",
                                    err
                                );

                                return res.status(500).json({
                                    message:
                                        "Failed to start reception work day."
                                });
                            }

                            return res.json({
                                message:
                                    "Reception work day started successfully.",
                                work_day: {
                                    ...workDay,
                                    start_time: new Date(),
                                    end_time: null,
                                    status: "working"
                                }
                            });
                        }
                    );

                    return;
                }
            }

            // -----------------------------------------
            // No work day exists → create one
            // -----------------------------------------

            const insertSql = `
                INSERT INTO reception_work_days
                (
                    user_id,
                    work_date,
                    start_time,
                    status
                )
                VALUES
                (
                    ?,
                    CURDATE(),
                    NOW(),
                    'working'
                )
            `;

            db.query(insertSql, [user_id], (err, result) => {

                if (err) {
                    console.error(
                        "RECEPTION START WORK ERROR:",
                        err
                    );

                    return res.status(500).json({
                        message:
                            "Failed to start reception work day."
                    });
                }

                res.json({
                    message:
                        "Reception work day started successfully.",
                    work_day: {
                        id: result.insertId,
                        user_id: Number(user_id),
                        status: "working"
                    }
                });
            });

        });
    });
});


// =====================================================
// RECEPTION WORK DAY - END
// =====================================================

app.post("/api/reception-work/end", (req, res) => {

    const { user_id } = req.body;

    if (!user_id) {
        return res.status(400).json({
            message: "user_id is required."
        });
    }

    const sql = `
        SELECT *
        FROM reception_work_days
        WHERE user_id = ?
          AND work_date = CURDATE()
        LIMIT 1
    `;

    db.query(sql, [user_id], (err, rows) => {

        if (err) {
            console.error("RECEPTION END WORK ERROR:", err);

            return res.status(500).json({
                message: "Database error."
            });
        }

        if (rows.length === 0) {
            return res.status(404).json({
                message: "No reception work day found for today."
            });
        }

        const workDay = rows[0];

        if (workDay.status === "closed") {
            return res.json({
                message: "Reception work day already closed.",
                work_day: workDay
            });
        }

        const updateSql = `
            UPDATE reception_work_days
            SET
                end_time = NOW(),
                status = 'closed'
            WHERE id = ?
        `;

        db.query(updateSql, [workDay.id], (err) => {

            if (err) {
                console.error(
                    "RECEPTION CLOSE WORK ERROR:",
                    err
                );

                return res.status(500).json({
                    message: "Failed to close reception work day."
                });
            }

            res.json({
                message: "Reception work day closed successfully.",
                work_day: {
                    id: workDay.id,
                    user_id: Number(user_id),
                    status: "closed"
                }
            });
        });
    });
});



// =====================================================
// ============== RECEPTION WALK-IN PATIENT ============
// =====================================================

app.post("/api/reception/walk-in", (req, res) => {

    const {
        patient_id,
        dentist_id,
        reason,
        priority
    } = req.body;

    if (!patient_id || !dentist_id) {
        return res.status(400).json({
            message: "patient_id and dentist_id are required."
        });
    }

    const finalPriority =
        priority === "emergency"
            ? "emergency"
            : priority === "follow_up"
                ? "follow_up"
                : "normal";

    // -------------------------------------------------
    // 1. التأكد من وجود المريض والطبيب
    // -------------------------------------------------

    const checkSql = `
        SELECT
            p.id AS patient_id,
            CONCAT(
                p.first_name,
                ' ',
                p.last_name
            ) AS patient_name,

            d.id AS dentist_id,
            CONCAT(
                d.first_name,
                ' ',
                d.last_name
            ) AS dentist_name

        FROM patients p

        CROSS JOIN dentists d

        WHERE p.id = ?
          AND d.id = ?

        LIMIT 1
    `;

    db.query(
        checkSql,
        [patient_id, dentist_id],
        (err, rows) => {

            if (err) {
                console.error(
                    "WALK-IN CHECK ERROR:",
                    err
                );

                return res.status(500).json({
                    message: "Database error."
                });
            }

            if (rows.length === 0) {
                return res.status(404).json({
                    message:
                        "Patient or dentist not found."
                });
            }

            const patient = rows[0];

            // -------------------------------------------------
            // 2. إنشاء موعد للزيارة الحالية
            // -------------------------------------------------

            const appointmentSql = `
                INSERT INTO appointments
                (
                    patient_id,
                    dentist_id,
                    appointment_date,
                    appointment_time,
                    reason,
                    status,
                    booking_type,
                    booking_status
                )
                VALUES
                (
                    ?,
                    ?,
                    CURDATE(),
                    CURTIME(),
                    ?,
                    'scheduled',
                    'clinic',
                    'confirmed'
                )
            `;

            db.query(
                appointmentSql,
                [
                    patient_id,
                    dentist_id,
                    reason || "زيارة بدون موعد"
                ],
                (err, appointmentResult) => {

                    if (err) {
                        console.error(
                            "WALK-IN APPOINTMENT ERROR:",
                            err
                        );

                        return res.status(500).json({
                            message:
                                "Failed to create walk-in appointment."
                        });
                    }

                    const appointmentId =
                        appointmentResult.insertId;

                    // -------------------------------------------------
                    // 3. إنشاء رقم الانتظار
                    // -------------------------------------------------

                    const queueNumberSql = `
                        SELECT
                            COALESCE(
                                MAX(q.queue_number),
                                0
                            ) + 1 AS next_number

                        FROM queue q

                        JOIN appointments a
                            ON q.appointment_id = a.id

                        WHERE q.dentist_id = ?
                          AND a.appointment_date = CURDATE()
                    `;

                    db.query(
                        queueNumberSql,
                        [dentist_id],
                        (err, numberRows) => {

                            if (err) {
                                console.error(
                                    "WALK-IN QUEUE NUMBER ERROR:",
                                    err
                                );

                                return res.status(500).json({
                                    message:
                                        "Failed to generate queue number."
                                });
                            }

                            const queueNumber =
                                numberRows[0].next_number;

                            // -------------------------------------------------
                            // 4. إدخال المريض إلى قائمة الانتظار
                            // -------------------------------------------------

                            const queueSql = `
                                INSERT INTO queue
                                (
                                    appointment_id,
                                    dentist_id,
                                    patient_id,
                                    priority,
                                    queue_status,
                                    queue_number,
                                    arrived_at
                                )
                                VALUES
                                (
                                    ?,
                                    ?,
                                    ?,
                                    ?,
                                    'waiting',
                                    ?,
                                    NOW()
                                )
                            `;

                            db.query(
                                queueSql,
                                [
                                    appointmentId,
                                    dentist_id,
                                    patient_id,
                                    finalPriority,
                                    queueNumber
                                ],
                                (err, queueResult) => {

                                    if (err) {
                                        console.error(
                                            "WALK-IN QUEUE ERROR:",
                                            err
                                        );

                                        return res.status(500).json({
                                            message:
                                                "Failed to add patient to queue."
                                        });
                                    }

                                    // -------------------------------------------------
                                    // 5. النتيجة النهائية
                                    // -------------------------------------------------

                                    res.status(201).json({

                                        message:
                                            "Walk-in patient registered successfully.",

                                        appointment: {
                                            id: appointmentId,
                                            patient_id:
                                                Number(patient_id),
                                            dentist_id:
                                                Number(dentist_id)
                                        },

                                        queue: {
                                            id:
                                                queueResult.insertId,

                                            queue_number:
                                                queueNumber,

                                            patient_name:
                                                patient.patient_name,

                                            dentist_name:
                                                patient.dentist_name,

                                            priority:
                                                finalPriority,

                                            queue_status:
                                                "waiting"
                                        }
                                    });
                                }
                            );
                        }
                    );
                }
            );
        }
    );
});



// =========================================================
// LOGIN
// =========================================================

app.post("/api/login", (req, res) => {

    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({
            message: "Username and password are required."
        });
    }

    const sql = `
    SELECT id, username, role, dentist_id
    FROM users
    WHERE username = ? AND password = ?
    LIMIT 1
`;

    db.query(
        sql,
        [username, password],
        (err, results) => {

            if (err) {
                console.error("LOGIN ERROR:", err);

                return res.status(500).json({
                    message: "Database error."
                });
            }

            if (results.length === 0) {
                return res.status(401).json({
                    message: "Invalid username or password."
                });
            }

            const user = results[0];

            res.json({
                success: true,
                
                user: {
    id: user.id,
    username: user.username,
    role: user.role,
    dentist_id: user.dentist_id
}
            });

        }
    );

});


// =====================================================
// RECEPTION - MARK QUEUE PATIENT ABSENT
// =====================================================

app.post("/api/reception/queue/absent", (req, res) => {
    const { queue_id } = req.body;

    if (!queue_id) {
        return res.status(400).json({
            message: "queue_id is required."
        });
    }

    const sql = `
        UPDATE queue
        SET queue_status = 'absent'
        WHERE id = ?
          AND queue_status = 'waiting'
    `;

    db.query(sql, [queue_id], (err, result) => {
        if (err) {
            console.error(
                "MARK QUEUE ABSENT ERROR:",
                err
            );

            return res.status(500).json({
                message: "Failed to mark patient as absent."
            });
        }

        if (result.affectedRows === 0) {
            return res.status(400).json({
                message:
                    "Patient cannot be marked absent in the current status."
            });
        }

        res.json({
            success: true,
            message: "Patient marked as absent."
        });
    });
});


// =====================================================
// ================= ADMIN OVERVIEW ====================
// =====================================================

app.get("/api/admin/overview", (req, res) => {

    const response = {
        stats: {
            doctorsPresent: 0,
            receptionPresent: 0,
            patientsToday: 0,
            waitingPatients: 0,
            upcomingAppointments: 0,
            todayRevenue: 0
        },

        staff: [],
        queue: [],
        appointments: [],

        finance: {
            recordedRevenue: 0,
            receivedAmount: 0,
            difference: 0
        },

        reports: {
            doctorReports: "pending",
            receptionReport: "pending",
            financialHandover: "pending"
        },

        alerts: [],

        closeDay: {
            ready: false,
            message:
                "Final clinic closure will be activated after reports and handovers are completed."
        }
    };


    // =================================================
    // 1. DOCTORS
    // =================================================

    const doctorsSql = `
        SELECT
            d.id,
            CONCAT(
                d.first_name,
                ' ',
                d.last_name
            ) AS name,

            d.specialty,

            COALESCE(
                dw.status,
                'not_started'
            ) AS work_status,

            dw.start_time,
            dw.end_time

        FROM dentists d

        LEFT JOIN doctor_work_days dw
            ON dw.dentist_id = d.id
            AND dw.work_date = CURDATE()

        ORDER BY d.id ASC
    `;


    db.query(
        doctorsSql,
        (doctorsError, doctors) => {

            if (doctorsError) {

                console.error(
                    "ADMIN DOCTORS ERROR:",
                    doctorsError
                );

                return res.status(500).json({
                    error:
                        "Failed to load doctors."
                });
            }


            // =========================================
            // 2. RECEPTION STAFF
            // =========================================

            const receptionSql = `
                SELECT
                    u.id,
                    u.username,

                    COALESCE(
                        rw.status,
                        'not_started'
                    ) AS work_status,

                    rw.start_time,
                    rw.end_time

                FROM users u

                LEFT JOIN reception_work_days rw
                    ON rw.user_id = u.id
                    AND rw.work_date = CURDATE()

                WHERE u.role = 'receptionist'

                ORDER BY u.id ASC
            `;


            db.query(
                receptionSql,
                (receptionError, reception) => {

                    if (receptionError) {

                        console.error(
                            "ADMIN RECEPTION ERROR:",
                            receptionError
                        );

                        return res.status(500).json({
                            error:
                                "Failed to load reception staff."
                        });
                    }


                    // =================================
                    // 3. TODAY APPOINTMENTS
                    // =================================

                    const appointmentsSql = `
                        SELECT

                            a.id,
                            a.patient_id,
                            a.dentist_id,

                            a.appointment_date,
                            a.appointment_time,

                            a.reason,
                            a.status,

                            a.booking_type,
                            a.booking_name,
                            a.booking_phone,
                            a.booking_status,

                            p.first_name,
                            p.last_name,
                            p.phone,

                            d.first_name
                                AS dentist_first_name,

                            d.last_name
                                AS dentist_last_name,

                            q.id
                                AS queue_id,

                            q.priority,
                            q.queue_status,
                            q.queue_number,

                            q.arrived_at,
                            q.called_at,
                            q.visit_started_at,
                            q.completed_at

                        FROM appointments a

                        LEFT JOIN patients p
                            ON p.id = a.patient_id

                        INNER JOIN dentists d
                            ON d.id = a.dentist_id

                        LEFT JOIN queue q
                            ON q.appointment_id = a.id

                        WHERE
                            a.appointment_date = CURDATE()

                        ORDER BY
                            a.appointment_time ASC,
                            a.id ASC
                    `;


                    db.query(
                        appointmentsSql,
                        (appointmentsError, appointments) => {

                            if (appointmentsError) {

                                console.error(
                                    "ADMIN APPOINTMENTS ERROR:",
                                    appointmentsError
                                );

                                return res.status(500).json({
                                    error:
                                        "Failed to load appointments."
                                });
                            }


                            // =================================
                            // 4. QUEUE
                            // =================================

                            const queueSql = `
                                SELECT

                                    q.id AS queue_id,
                                    q.appointment_id,
                                    q.dentist_id,
                                    q.patient_id,

                                    q.priority,
                                    q.queue_status,
                                    q.queue_number,

                                    q.arrived_at,
                                    q.called_at,
                                    q.visit_started_at,
                                    q.completed_at,

                                    p.first_name,
                                    p.last_name,
                                    p.phone,

                                    a.appointment_time,
                                    a.reason,

                                    d.first_name
                                        AS dentist_first_name,

                                    d.last_name
                                        AS dentist_last_name

                                FROM queue q

                                INNER JOIN patients p
                                    ON p.id = q.patient_id

                                INNER JOIN appointments a
                                    ON a.id = q.appointment_id

                                INNER JOIN dentists d
                                    ON d.id = q.dentist_id

                                WHERE
                                    a.appointment_date = CURDATE()

                                ORDER BY

                                    CASE q.queue_status

                                        WHEN 'called'
                                            THEN 1

                                        WHEN 'in_visit'
                                            THEN 2

                                        WHEN 'waiting'
                                            THEN 3

                                        WHEN 'completed'
                                            THEN 4

                                        WHEN 'absent'
                                            THEN 5

                                        WHEN 'cancelled'
                                            THEN 6

                                        ELSE 7

                                    END,

                                    CASE q.priority

                                        WHEN 'emergency'
                                            THEN 1

                                        WHEN 'follow_up'
                                            THEN 2

                                        ELSE 3

                                    END,

                                    q.queue_number ASC
                            `;


                            db.query(
                                queueSql,
                                (queueError, queue) => {

                                    if (queueError) {

                                        console.error(
                                            "ADMIN QUEUE ERROR:",
                                            queueError
                                        );

                                        return res.status(500).json({
                                            error:
                                                "Failed to load queue."
                                        });
                                    }


                                    // =================================
                                    // 5. UPCOMING APPOINTMENTS
                                    // =================================

                                    const upcomingSql = `
                                        SELECT

                                            a.id,
                                            a.patient_id,
                                            a.dentist_id,

                                            a.appointment_date,
                                            a.appointment_time,

                                            a.reason,
                                            a.status,

                                            a.booking_name,
                                            a.booking_status,

                                            p.first_name,
                                            p.last_name,

                                            d.first_name
                                                AS dentist_first_name,

                                            d.last_name
                                                AS dentist_last_name

                                        FROM appointments a

                                        LEFT JOIN patients p
                                            ON p.id = a.patient_id

                                        INNER JOIN dentists d
                                            ON d.id = a.dentist_id

                                        WHERE

                                            (
                                                a.appointment_date > CURDATE()

                                                OR

                                                (
                                                    a.appointment_date = CURDATE()

                                                    AND
                                                    a.appointment_time >= CURTIME()
                                                )
                                            )

                                            AND LOWER(
                                                COALESCE(
                                                    a.status,
                                                    ''
                                                )
                                            ) <> 'cancelled'

                                            AND LOWER(
                                                COALESCE(
                                                    a.booking_status,
                                                    ''
                                                )
                                            ) <> 'cancelled'

                                        ORDER BY
                                            a.appointment_date ASC,
                                            a.appointment_time ASC

                                        LIMIT 8
                                    `;


                                    db.query(
                                        upcomingSql,
                                        (
                                            upcomingError,
                                            upcoming
                                        ) => {

                                            if (upcomingError) {

                                                console.error(
                                                    "ADMIN UPCOMING ERROR:",
                                                    upcomingError
                                                );

                                                return res.status(500).json({
                                                    error:
                                                        "Failed to load upcoming appointments."
                                                });
                                            }


                                            // =================================
                                            // 6. TODAY REVENUE
                                            // =================================

                                            const revenueSql = `
                                                SELECT

                                                    COALESCE(
                                                        SUM(amount),
                                                        0
                                                    ) AS total

                                                FROM payments

                                                WHERE

                                                    DATE(payment_date)
                                                        = CURDATE()

                                                    AND status = 'paid'
                                            `;


                                            db.query(
                                                revenueSql,
                                                (
                                                    revenueError,
                                                    revenueRows
                                                ) => {

                                                    if (revenueError) {

                                                        console.error(
                                                            "ADMIN REVENUE ERROR:",
                                                            revenueError
                                                        );

                                                        return res.status(500).json({
                                                            error:
                                                                "Failed to load revenue."
                                                        });
                                                    }


                                                    // =================================
                                                    // 7. BUILD STAFF LIST
                                                    // =================================

                                                    const doctorStaff =
                                                        doctors.map(
                                                            doctor => ({

                                                                type:
                                                                    "doctor",

                                                                name:
                                                                    doctor.name,

                                                                role:
                                                                    doctor.specialty ||
                                                                    "Doctor",

                                                                work_status:
                                                                    doctor.work_status,

                                                                start_time:
                                                                    doctor.start_time,

                                                                end_time:
                                                                    doctor.end_time
                                                            })
                                                        );


                                                    const receptionStaff =
                                                        reception.map(
                                                            employee => ({

                                                                type:
                                                                    "receptionist",

                                                                name:
                                                                    employee.username,

                                                                role:
                                                                    "Receptionist",

                                                                work_status:
                                                                    employee.work_status,

                                                                start_time:
                                                                    employee.start_time,

                                                                end_time:
                                                                    employee.end_time
                                                            })
                                                        );


                                                    response.staff =
                                                        [
                                                            ...doctorStaff,
                                                            ...receptionStaff
                                                        ];


                                                    // =================================
                                                    // 8. STATISTICS
                                                    // =================================

                                                    response.stats.doctorsPresent =
                                                        doctors.filter(
                                                            doctor =>
                                                                doctor.work_status ===
                                                                "working"
                                                        ).length;


                                                    response.stats.receptionPresent =
                                                        reception.filter(
                                                            employee =>
                                                                employee.work_status ===
                                                                "working"
                                                        ).length;


                                                    response.stats.patientsToday =
                                                        new Set(
                                                            appointments
                                                                .filter(
                                                                    appointment =>
                                                                        appointment.patient_id !== null
                                                                )
                                                                .map(
                                                                    appointment =>
                                                                        appointment.patient_id
                                                                )
                                                        ).size;


                                                    response.stats.waitingPatients =
                                                        queue.filter(
                                                            item =>
                                                                item.queue_status ===
                                                                "waiting"
                                                        ).length;


                                                    response.stats.upcomingAppointments =
                                                        upcoming.length;


                                                    response.stats.todayRevenue =
                                                        Number(
                                                            revenueRows[0]?.total ||
                                                            0
                                                        );


                                                    // =================================
                                                    // 9. QUEUE
                                                    // =================================

                                                    response.queue =
                                                        queue;


                                                    // =================================
                                                    // 10. APPOINTMENTS
                                                    // =================================

                                                    response.appointments =
                                                        upcoming;


                                                    // =================================
                                                    // 11. FINANCE
                                                    // =================================

                                                    response.finance = {

                                                        recordedRevenue:
                                                            Number(
                                                                revenueRows[0]?.total ||
                                                                0
                                                            ),

                                                        receivedAmount:
                                                            0,

                                                        difference:
                                                            0
                                                    };


                                                    // =================================
                                                    // 12. ALERTS
                                                    // =================================

                                                    const alerts = [];


                                                    // Doctor has appointments
                                                    // but has not started.

                                                    doctors.forEach(
                                                        doctor => {

                                                            const hasAppointments =
                                                                appointments.some(
                                                                    appointment =>
                                                                        Number(
                                                                            appointment.dentist_id
                                                                        ) ===
                                                                        Number(
                                                                            doctor.id
                                                                        )
                                                                );


                                                            if (
                                                                hasAppointments &&
                                                                doctor.work_status ===
                                                                "not_started"
                                                            ) {

                                                                alerts.push({

                                                                    title:
                                                                        "Doctor has not started work",

                                                                    message:
                                                                        `${doctor.name} has appointments today but has not started the work day.`
                                                                });
                                                            }
                                                        }
                                                    );


                                                    // Waiting patients older
                                                    // than approximately 30 minutes.

                                                    const now =
                                                        Date.now();


                                                    queue.forEach(
                                                        item => {

                                                            if (
                                                                item.queue_status !==
                                                                "waiting"
                                                            ) {
                                                                return;
                                                            }

                                                            if (
                                                                !item.arrived_at
                                                            ) {
                                                                return;
                                                            }


                                                            const arrived =
                                                                new Date(
                                                                    item.arrived_at
                                                                ).getTime();


                                                            const waitingMinutes =
                                                                (
                                                                    now -
                                                                    arrived
                                                                ) /
                                                                60000;


                                                            if (
                                                                waitingMinutes >=
                                                                30
                                                            ) {

                                                                alerts.push({

                                                                    title:
                                                                        "Long patient wait",

                                                                    message:
                                                                        `${item.first_name} ${item.last_name} has been waiting for more than 30 minutes.`
                                                                });
                                                            }
                                                        }
                                                    );


                                                    response.alerts =
                                                        alerts.slice(
                                                            0,
                                                            5
                                                        );


                                                    // =================================
                                                    // 13. REPORTS
                                                    // =================================

                                                    response.reports = {

                                                        doctorReports:
                                                            "pending",

                                                        receptionReport:
                                                            "pending",

                                                        financialHandover:
                                                            "pending"
                                                    };


                                                    // =================================
                                                    // 14. CLOSE DAY
                                                    // =================================

                                                    const activeVisits =
                                                        queue.filter(
                                                            item =>
                                                                item.queue_status ===
                                                                "in_visit"
                                                        );


                                                    const calledPatients =
                                                        queue.filter(
                                                            item =>
                                                                item.queue_status ===
                                                                "called"
                                                        );


                                                    if (
                                                        activeVisits.length === 0 &&
                                                        calledPatients.length === 0
                                                    ) {

                                                        response.closeDay = {

                                                            ready:
                                                                false,

                                                            message:
                                                                "The clinic day still requires final reports and financial handover."
                                                        };

                                                    } else {

                                                        response.closeDay = {

                                                            ready:
                                                                false,

                                                            message:
                                                                "There are still active or called patients."
                                                        };
                                                    }


                                                    // =================================
                                                    // SEND RESPONSE
                                                    // =================================

                                                    res.json(
                                                        response
                                                    );

                                                }
                                            );
                                        }
                                    );
                                }
                            );
                        }
                    );
                }
            );
        }
    );
});





/* =========================================================
   ADMIN — APPOINTMENTS
   ========================================================= */

app.get("/api/admin/appointments", (req, res) => {

    const sql = `
        SELECT
            a.id,
            a.patient_id,
            a.dentist_id,
            a.appointment_date,
            a.appointment_time,
            a.reason,
            a.status,
            a.notes,
            a.created_at,
            a.booking_type,
            a.booking_name,
            a.booking_phone,
            a.booking_email,
            a.booking_code,
            a.booking_status,

            p.first_name AS patient_first_name,
            p.last_name AS patient_last_name,
            p.phone AS patient_phone,

            CONCAT(
                d.first_name,
                ' ',
                d.last_name
            ) AS dentist_name

        FROM appointments a

        LEFT JOIN patients p
            ON p.id = a.patient_id

        LEFT JOIN dentists d
            ON d.id = a.dentist_id

        ORDER BY
            a.appointment_date DESC,
            a.appointment_time DESC,
            a.id DESC
    `;

    db.query(sql, (err, results) => {

        if (err) {

            console.error(
                "ADMIN APPOINTMENTS ERROR:",
                err
            );

            return res.status(500).json({
                message: "تعذر تحميل المواعيد."
            });
        }

        res.json(results);
    });
});



/* =========================================================
   ADMIN — OPERATIONS
   ========================================================= */

app.get("/api/admin/operations", (req, res) => {

    const sql = `
        SELECT
            q.id,
            q.queue_number,
            q.patient_id,
            q.appointment_id,
            q.dentist_id,
            q.priority,
            q.queue_status,
            q.arrived_at,
            q.called_at,
            q.visit_started_at,
            q.completed_at,

            p.first_name AS patient_first_name,
            p.last_name AS patient_last_name,
            p.phone AS patient_phone,

            CONCAT(
                d.first_name,
                ' ',
                d.last_name
            ) AS dentist_name,

            a.appointment_date,
            a.appointment_time,
            a.reason

        FROM queue q

        LEFT JOIN patients p
            ON p.id = q.patient_id

        LEFT JOIN dentists d
            ON d.id = q.dentist_id

        LEFT JOIN appointments a
            ON a.id = q.appointment_id

        WHERE DATE(q.arrived_at) = CURDATE()

        ORDER BY
            CASE
                WHEN q.queue_status = 'in_visit' THEN 1
                WHEN q.queue_status = 'called' THEN 2
                WHEN q.queue_status = 'waiting' THEN 3
                WHEN q.queue_status = 'completed' THEN 4
                WHEN q.queue_status = 'absent' THEN 5
                WHEN q.queue_status = 'cancelled' THEN 6
                ELSE 7
            END,

            CASE
                WHEN q.priority = 'emergency' THEN 1
                WHEN q.priority = 'follow_up' THEN 2
                ELSE 3
            END,

            q.queue_number ASC
    `;

    db.query(sql, (err, results) => {

        if (err) {

            console.error(
                "ADMIN OPERATIONS ERROR:",
                err
            );

            return res.status(500).json({
                message: "تعذر تحميل بيانات العمليات."
            });
        }

        const operations = results.map(item => {

            let waitMinutes = 0;

            if (item.arrived_at) {

                const arrivedTime =
                    new Date(item.arrived_at);

                const now =
                    new Date();

                waitMinutes = Math.max(
                    0,
                    Math.floor(
                        (now - arrivedTime) / 60000
                    )
                );
            }

            return {

                ...item,

                patient_name:
                    `${item.patient_first_name || ""} ${item.patient_last_name || ""}`.trim(),

                wait_minutes:
                    waitMinutes
            };
        });

        const summary = {

            total:
                operations.length,

            waiting:
                operations.filter(
                    item =>
                        item.queue_status === "waiting"
                ).length,

            called:
                operations.filter(
                    item =>
                        item.queue_status === "called"
                ).length,

            inVisit:
                operations.filter(
                    item =>
                        item.queue_status === "in_visit"
                ).length,

            completed:
                operations.filter(
                    item =>
                        item.queue_status === "completed"
                ).length,

            longWaiting:
                operations.filter(
                    item =>
                        item.queue_status === "waiting" &&
                        item.wait_minutes >= 30
                ).length
        };

        res.json({
            summary,
            operations
        });
    });
});


/* =========================================================
   ADMIN — ROOMS
   ========================================================= */

app.get("/api/admin/rooms", (req, res) => {

    const sql = `
        SELECT
            r.id,
            r.room_number,
            r.room_name,
            r.room_type,
            r.dentist_id,
            r.status,
            r.notes,
            r.created_at,
            r.updated_at,

            CASE
                WHEN d.id IS NOT NULL
                THEN CONCAT(d.first_name, ' ', d.last_name)
                ELSE NULL
            END AS dentist_name

        FROM rooms r

        LEFT JOIN dentists d
            ON d.id = r.dentist_id

        ORDER BY
            CAST(r.room_number AS UNSIGNED) ASC,
            r.id ASC
    `;

    db.query(sql, (err, results) => {

        if (err) {
            console.error(
                "ADMIN ROOMS ERROR:",
                err
            );

            return res.status(500).json({
                message: "تعذر تحميل بيانات الغرف."
            });
        }

        const rooms = results.map(room => ({
            ...room,

            status_label:
                room.status === "available"
                    ? "متاحة"
                    : room.status === "occupied"
                    ? "مشغولة"
                    : room.status === "cleaning"
                    ? "قيد التنظيف"
                    : room.status === "maintenance"
                    ? "صيانة"
                    : "غير مفعلة",

            room_type_label:
                room.room_type === "treatment"
                    ? "علاج"
                    : room.room_type || "غير محدد"
        }));

        const summary = {
            total: rooms.length,

            available:
                rooms.filter(
                    room =>
                        room.status === "available"
                ).length,

            occupied:
                rooms.filter(
                    room =>
                        room.status === "occupied"
                ).length,

            cleaning:
                rooms.filter(
                    room =>
                        room.status === "cleaning"
                ).length,

            maintenance:
                rooms.filter(
                    room =>
                        room.status === "maintenance"
                ).length,

            inactive:
                rooms.filter(
                    room =>
                        room.status === "inactive"
                ).length
        };

        res.json({
            summary,
            rooms
        });
    });
});

/* =========================================================
   ADMIN — FINANCE
   ========================================================= */

app.get("/api/admin/finance", (req, res) => {

    const sql = `
        SELECT
            p.id,
            p.patient_id,
            p.treatment_id,
            p.amount,
            p.payment_date,
            p.payment_method,
            p.status,
            p.notes,
            p.created_at,

            CONCAT(
                pt.first_name,
                ' ',
                pt.last_name
            ) AS patient_name,

            t.treatment_name

        FROM payments p

        LEFT JOIN patients pt
            ON pt.id = p.patient_id

        LEFT JOIN treatments t
            ON t.id = p.treatment_id

        ORDER BY
            p.payment_date DESC,
            p.id DESC
    `;

    db.query(sql, (err, results) => {

        if (err) {
            console.error(
                "ADMIN FINANCE ERROR:",
                err
            );

            return res.status(500).json({
                message: "تعذر تحميل البيانات المالية."
            });
        }

        const payments = results.map(payment => ({

            ...payment,

            payment_method_label:
                payment.payment_method === "cash"
                    ? "نقدًا"
                    : payment.payment_method === "card"
                    ? "بطاقة"
                    : payment.payment_method === "bank_transfer"
                    ? "تحويل بنكي"
                    : "غير محدد",

            status_label:
                payment.status === "paid"
                    ? "مدفوعة"
                    : "معلقة"

        }));


        const summary = {

            totalRevenue:
                payments.reduce(
                    (sum, payment) =>
                        sum + Number(payment.amount || 0),
                    0
                ),

            paidAmount:
                payments
                    .filter(
                        payment =>
                            payment.status === "paid"
                    )
                    .reduce(
                        (sum, payment) =>
                            sum + Number(payment.amount || 0),
                        0
                    ),

            pendingAmount:
                payments
                    .filter(
                        payment =>
                            payment.status === "pending"
                    )
                    .reduce(
                        (sum, payment) =>
                            sum + Number(payment.amount || 0),
                        0
                    ),

            totalPayments:
                payments.length,

            paidPayments:
                payments.filter(
                    payment =>
                        payment.status === "paid"
                ).length,

            pendingPayments:
                payments.filter(
                    payment =>
                        payment.status === "pending"
                ).length

        };


        const paymentMethods = {

            cash:
                payments.filter(
                    payment =>
                        payment.payment_method === "cash"
                ).reduce(
                    (sum, payment) =>
                        sum + Number(payment.amount || 0),
                    0
                ),

            card:
                payments.filter(
                    payment =>
                        payment.payment_method === "card"
                ).reduce(
                    (sum, payment) =>
                        sum + Number(payment.amount || 0),
                    0
                ),

            bankTransfer:
                payments.filter(
                    payment =>
                        payment.payment_method === "bank_transfer"
                ).reduce(
                    (sum, payment) =>
                        sum + Number(payment.amount || 0),
                    0
                )

        };


        res.json({

            summary,

            paymentMethods,

            payments

        });

    });

});



// =====================================================
// ================= ADMIN REPORTS ======================
// =====================================================

app.get("/api/admin/reports", (req, res) => {

    // =================================================
    // 1. TODAY APPOINTMENTS
    // =================================================

    const appointmentsSql = `
        SELECT
            a.id,
            a.patient_id,
            a.dentist_id,
            a.appointment_date,
            a.appointment_time,
            a.status,
            a.booking_type,

            p.first_name AS patient_first_name,
            p.last_name AS patient_last_name,

            CONCAT(
                d.first_name,
                ' ',
                d.last_name
            ) AS dentist_name

        FROM appointments a

        LEFT JOIN patients p
            ON p.id = a.patient_id

        LEFT JOIN dentists d
            ON d.id = a.dentist_id

        WHERE a.appointment_date = CURDATE()

        ORDER BY
            a.appointment_time ASC,
            a.id ASC
    `;

    db.query(
        appointmentsSql,
        (appointmentsError, appointments) => {

            if (appointmentsError) {

                console.error(
                    "ADMIN REPORTS APPOINTMENTS ERROR:",
                    appointmentsError
                );

                return res.status(500).json({
                    message:
                        "تعذر تحميل بيانات المواعيد للتقرير."
                });
            }


            // =============================================
            // 2. TODAY QUEUE
            // =============================================

            const queueSql = `
                SELECT
                    q.id,
                    q.patient_id,
                    q.dentist_id,
                    q.priority,
                    q.queue_status,
                    q.arrived_at,
                    q.called_at,
                    q.visit_started_at,
                    q.completed_at,

                    p.first_name AS patient_first_name,
                    p.last_name AS patient_last_name,

                    CONCAT(
                        d.first_name,
                        ' ',
                        d.last_name
                    ) AS dentist_name

                FROM queue q

                LEFT JOIN patients p
                    ON p.id = q.patient_id

                LEFT JOIN dentists d
                    ON d.id = q.dentist_id

                WHERE DATE(q.arrived_at) = CURDATE()

                ORDER BY q.id ASC
            `;

            db.query(
                queueSql,
                (queueError, queue) => {

                    if (queueError) {

                        console.error(
                            "ADMIN REPORTS QUEUE ERROR:",
                            queueError
                        );

                        return res.status(500).json({
                            message:
                                "تعذر تحميل بيانات الطابور للتقرير."
                        });
                    }


                    // =====================================
                    // 3. DOCTORS
                    // =====================================

                    const doctorsSql = `
                        SELECT
                            d.id,

                            CONCAT(
                                d.first_name,
                                ' ',
                                d.last_name
                            ) AS name,

                            d.specialty,

                            COALESCE(
                                dw.status,
                                'not_started'
                            ) AS work_status,

                            dw.start_time,
                            dw.end_time

                        FROM dentists d

                        LEFT JOIN doctor_work_days dw
                            ON dw.dentist_id = d.id
                            AND dw.work_date = CURDATE()

                        ORDER BY d.id ASC
                    `;

                    db.query(
                        doctorsSql,
                        (doctorsError, doctors) => {

                            if (doctorsError) {

                                console.error(
                                    "ADMIN REPORTS DOCTORS ERROR:",
                                    doctorsError
                                );

                                return res.status(500).json({
                                    message:
                                        "تعذر تحميل بيانات الأطباء للتقرير."
                                });
                            }


                            // =================================
                            // 4. PAYMENTS
                            // =================================

                            const paymentsSql = `
                                SELECT
                                    id,
                                    amount,
                                    payment_method,
                                    status,
                                    payment_date

                                FROM payments

                                WHERE DATE(payment_date) = CURDATE()

                                ORDER BY
                                    payment_date DESC,
                                    id DESC
                            `;

                            db.query(
                                paymentsSql,
                                (paymentsError, payments) => {

                                    if (paymentsError) {

                                        console.error(
                                            "ADMIN REPORTS PAYMENTS ERROR:",
                                            paymentsError
                                        );

                                        return res.status(500).json({
                                            message:
                                                "تعذر تحميل البيانات المالية للتقرير."
                                        });
                                    }


                                    // =================================
                                    // 5. GENERAL STATISTICS
                                    // =================================

                                    const patientsToday =
                                        new Set(
                                            appointments
                                                .filter(
                                                    appointment =>
                                                        appointment.patient_id !== null
                                                )
                                                .map(
                                                    appointment =>
                                                        appointment.patient_id
                                                )
                                        ).size;


                                    const totalAppointments =
                                        appointments.length;


                                    const completedAppointments =
                                        appointments.filter(
                                            appointment =>
                                                String(
                                                    appointment.status || ""
                                                ).toLowerCase() ===
                                                "completed"
                                        ).length;


                                    const cancelledAppointments =
                                        appointments.filter(
                                            appointment =>
                                                String(
                                                    appointment.status || ""
                                                ).toLowerCase() ===
                                                "cancelled"
                                        ).length;


                                    const waitingPatients =
                                        queue.filter(
                                            item =>
                                                item.queue_status ===
                                                "waiting"
                                        ).length;


                                    const calledPatients =
                                        queue.filter(
                                            item =>
                                                item.queue_status ===
                                                "called"
                                        ).length;


                                    const patientsInVisit =
                                        queue.filter(
                                            item =>
                                                item.queue_status ===
                                                "in_visit"
                                        ).length;


                                    const completedPatients =
                                        queue.filter(
                                            item =>
                                                item.queue_status ===
                                                "completed"
                                        ).length;


                                    const absentPatients =
                                        queue.filter(
                                            item =>
                                                item.queue_status ===
                                                "absent"
                                        ).length;


                                    const cancelledPatients =
                                        queue.filter(
                                            item =>
                                                item.queue_status ===
                                                "cancelled"
                                        ).length;


                                    const doctorsPresent =
                                        doctors.filter(
                                            doctor =>
                                                doctor.work_status ===
                                                "working"
                                        ).length;


                                    const totalDoctors =
                                        doctors.length;


                                    // =================================
                                    // 6. FINANCIAL REPORT
                                    // =================================

                                    const totalRevenue =
                                        payments.reduce(
                                            (sum, payment) =>
                                                sum +
                                                Number(
                                                    payment.amount || 0
                                                ),
                                            0
                                        );


                                    const paidAmount =
                                        payments
                                            .filter(
                                                payment =>
                                                    payment.status ===
                                                    "paid"
                                            )
                                            .reduce(
                                                (sum, payment) =>
                                                    sum +
                                                    Number(
                                                        payment.amount || 0
                                                    ),
                                                0
                                            );


                                    const pendingAmount =
                                        payments
                                            .filter(
                                                payment =>
                                                    payment.status ===
                                                    "pending"
                                            )
                                            .reduce(
                                                (sum, payment) =>
                                                    sum +
                                                    Number(
                                                        payment.amount || 0
                                                    ),
                                                0
                                            );


                                    const paymentMethods = {

                                        cash:
                                            payments
                                                .filter(
                                                    payment =>
                                                        payment.payment_method ===
                                                        "cash"
                                                )
                                                .reduce(
                                                    (sum, payment) =>
                                                        sum +
                                                        Number(
                                                            payment.amount || 0
                                                        ),
                                                    0
                                                ),

                                        card:
                                            payments
                                                .filter(
                                                    payment =>
                                                        payment.payment_method ===
                                                        "card"
                                                )
                                                .reduce(
                                                    (sum, payment) =>
                                                        sum +
                                                        Number(
                                                            payment.amount || 0
                                                        ),
                                                    0
                                                ),

                                        bankTransfer:
                                            payments
                                                .filter(
                                                    payment =>
                                                        payment.payment_method ===
                                                        "bank_transfer"
                                                )
                                                .reduce(
                                                    (sum, payment) =>
                                                        sum +
                                                        Number(
                                                            payment.amount || 0
                                                        ),
                                                    0
                                                )
                                    };


                                    // =================================
                                    // 7. DOCTOR REPORT
                                    // =================================

                                    const doctorReports =
                                        doctors.map(doctor => {

                                            const doctorAppointments =
                                                appointments.filter(
                                                    appointment =>
                                                        Number(
                                                            appointment.dentist_id
                                                        ) ===
                                                        Number(
                                                            doctor.id
                                                        )
                                                );


                                            const doctorQueue =
                                                queue.filter(
                                                    item =>
                                                        Number(
                                                            item.dentist_id
                                                        ) ===
                                                        Number(
                                                            doctor.id
                                                        )
                                                );


                                            return {

                                                id:
                                                    doctor.id,

                                                name:
                                                    doctor.name,

                                                specialty:
                                                    doctor.specialty ||
                                                    "غير محدد",

                                                work_status:
                                                    doctor.work_status,

                                                start_time:
                                                    doctor.start_time,

                                                end_time:
                                                    doctor.end_time,

                                                appointments:
                                                    doctorAppointments.length,

                                                completed:
                                                    doctorQueue.filter(
                                                        item =>
                                                            item.queue_status ===
                                                            "completed"
                                                    ).length,

                                                waiting:
                                                    doctorQueue.filter(
                                                        item =>
                                                            item.queue_status ===
                                                            "waiting"
                                                    ).length,

                                                in_visit:
                                                    doctorQueue.filter(
                                                        item =>
                                                            item.queue_status ===
                                                            "in_visit"
                                                    ).length
                                            };
                                        });


                                    // =================================
                                    // 8. REPORT STATUS
                                    // =================================

                                    const reportStatus = {

                                        doctorReports:
                                            doctors.length > 0
                                                ? "ready"
                                                : "empty",

                                        receptionReport:
                                            "ready",

                                        financialHandover:
                                            payments.length > 0
                                                ? "ready"
                                                : "empty"
                                    };


                                    // =================================
                                    // 9. FINAL RESPONSE
                                    // =================================

                                    res.json({

                                        generatedAt:
                                            new Date(),

                                        summary: {

                                            patientsToday,

                                            totalAppointments,

                                            completedAppointments,

                                            cancelledAppointments,

                                            waitingPatients,

                                            calledPatients,

                                            patientsInVisit,

                                            completedPatients,

                                            absentPatients,

                                            cancelledPatients,

                                            doctorsPresent,

                                            totalDoctors,

                                            totalRevenue,

                                            paidAmount,

                                            pendingAmount
                                        },


                                        doctors:
                                            doctorReports,


                                        operations: {

                                            total:
                                                queue.length,

                                            waiting:
                                                waitingPatients,

                                            called:
                                                calledPatients,

                                            inVisit:
                                                patientsInVisit,

                                            completed:
                                                completedPatients,

                                            absent:
                                                absentPatients,

                                            cancelled:
                                                cancelledPatients
                                        },


                                        finance: {

                                            totalRevenue,

                                            paidAmount,

                                            pendingAmount,

                                            paymentMethods,

                                            totalPayments:
                                                payments.length
                                        },


                                        reportStatus
                                    });
                                }
                            );
                        }
                    );
                }
            );
        }
    );
});



// =====================================================
// ================= ADMIN SETTINGS ======================
// =====================================================

app.get("/api/admin/settings", (req, res) => {

    const sql = `
        SELECT
            id,
            clinic_name,
            clinic_phone,
            clinic_address,
            username,
            email,
            working_days,
            working_hours,
            created_at,
            updated_at
        FROM settings
        ORDER BY id ASC
        LIMIT 1
    `;

    db.query(sql, (err, results) => {

        if (err) {
            console.error(
                "ADMIN SETTINGS GET ERROR:",
                err
            );

            return res.status(500).json({
                message: "تعذر تحميل إعدادات النظام."
            });
        }

        if (!results.length) {
            return res.status(404).json({
                message: "لم يتم العثور على إعدادات العيادة."
            });
        }

        res.json(results[0]);
    });
});


app.put("/api/admin/settings", (req, res) => {

    const {
        clinic_name,
        clinic_phone,
        clinic_address,
        username,
        email,
        working_days,
        working_hours
    } = req.body;

    if (!clinic_name || !username) {
        return res.status(400).json({
            message:
                "اسم العيادة واسم المستخدم مطلوبان."
        });
    }

    const sql = `
        UPDATE settings
        SET
            clinic_name = ?,
            clinic_phone = ?,
            clinic_address = ?,
            username = ?,
            email = ?,
            working_days = ?,
            working_hours = ?
        ORDER BY id ASC
        LIMIT 1
    `;

    const values = [
        clinic_name,
        clinic_phone || null,
        clinic_address || null,
        username,
        email || null,
        working_days,
        working_hours
    ];

    db.query(
        sql,
        values,
        (err, result) => {

            if (err) {
                console.error(
                    "ADMIN SETTINGS UPDATE ERROR:",
                    err
                );

                return res.status(500).json({
                    message:
                        "تعذر حفظ إعدادات النظام."
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    message:
                        "لم يتم العثور على سجل الإعدادات."
                });
            }

            res.json({
                message:
                    "تم حفظ إعدادات العيادة بنجاح.",
                success: true
            });
        }
    );
});

// =====================================================
// ================= RECEPTION STAFF ===================
// =====================================================


// -----------------------------------------------------
// GET ALL RECEPTION STAFF
// -----------------------------------------------------

app.get("/api/admin/receptionists", (req, res) => {

    const sql = `
        SELECT
            u.id,
            u.display_name,
            u.username,
            u.phone,
            u.email,
            u.role,

            rw.work_date,
            rw.start_time,
            rw.end_time,
            rw.status AS work_status

        FROM users u

        LEFT JOIN reception_work_days rw
            ON rw.user_id = u.id
            AND rw.work_date = CURDATE()

        WHERE u.role = 'receptionist'

        ORDER BY u.id ASC
    `;


    db.query(sql, (err, results) => {

        if (err) {

            console.error(
                "GET RECEPTIONISTS ERROR:",
                err
            );

            return res.status(500).json({
                error:
                    "تعذر تحميل موظفي الاستقبال."
            });
        }


        const staff = results.map(person => {

            const name =
                person.display_name ||
                person.username ||
                "موظف استقبال";


            return {
                id: person.id,

                name: name,

                display_name:
                    person.display_name || "",

                username:
                    person.username || "",

                phone:
                    person.phone || "",

                email:
                    person.email || "",

                role:
                    person.role,

                work_status:
                    person.work_status ||
                    "not_started",

                start_time:
                    person.start_time || null,

                end_time:
                    person.end_time || null
            };

        });


        res.json(staff);

    });

});



// -----------------------------------------------------
// ADD RECEPTION STAFF + CREATE ACCOUNT
// -----------------------------------------------------

app.post("/api/admin/receptionists", (req, res) => {

    const {
        display_name,
        phone,
        email,
        username,
        password
    } = req.body;


    if (
        !display_name ||
        !display_name.trim() ||
        !username ||
        !username.trim() ||
        !password ||
        !password.trim()
    ) {

        return res.status(400).json({
            error:
                "اسم الموظف واسم المستخدم وكلمة المرور مطلوبة."
        });
    }


    const cleanName =
        display_name.trim();

    const cleanPhone =
        phone
            ? phone.trim()
            : null;

    const cleanEmail =
        email
            ? email.trim()
            : null;

    const cleanUsername =
        username.trim();

    const cleanPassword =
        password.trim();


    // -----------------------------------------------
    // CHECK USERNAME
    // -----------------------------------------------

    const usernameSql = `
        SELECT id
        FROM users
        WHERE username = ?
        LIMIT 1
    `;


    db.query(
        usernameSql,
        [cleanUsername],
        (usernameError, usernameResults) => {

            if (usernameError) {

                console.error(
                    "ADD RECEPTIONIST USERNAME CHECK ERROR:",
                    usernameError
                );

                return res.status(500).json({
                    error:
                        "تعذر التحقق من اسم المستخدم."
                });
            }


            if (
                usernameResults.length > 0
            ) {

                return res.status(409).json({
                    error:
                        "اسم المستخدم مستخدم بالفعل."
                });
            }


            // ---------------------------------------
            // CREATE ACCOUNT
            // ---------------------------------------

            const insertSql = `
                INSERT INTO users
                (
                    display_name,
                    phone,
                    email,
                    username,
                    password,
                    role
                )
                VALUES
                (
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    'receptionist'
                )
            `;


            db.query(
                insertSql,
                [
                    cleanName,
                    cleanPhone,
                    cleanEmail,
                    cleanUsername,
                    cleanPassword
                ],
                (insertError, result) => {

                    if (insertError) {

                        console.error(
                            "ADD RECEPTIONIST ERROR:",
                            insertError
                        );

                        return res.status(500).json({
                            error:
                                "تعذر إضافة موظف الاستقبال."
                        });
                    }


                    return res.status(201).json({

                        success: true,

                        message:
                            "تمت إضافة موظف الاستقبال وإنشاء حسابه بنجاح.",

                        receptionist: {

                            id:
                                result.insertId,

                            name:
                                cleanName,

                            display_name:
                                cleanName,

                            username:
                                cleanUsername,

                            phone:
                                cleanPhone,

                            email:
                                cleanEmail,

                            role:
                                "receptionist"
                        }

                    });

                }
            );

        }
    );

});



// -----------------------------------------------------
// UPDATE RECEPTION STAFF
// -----------------------------------------------------

app.put(
    "/api/admin/receptionists/:id",
    (req, res) => {

        const id =
            Number(req.params.id);


        if (
            !Number.isInteger(id) ||
            id <= 0
        ) {

            return res.status(400).json({
                error:
                    "معرف الموظف غير صالح."
            });
        }


        const {
            display_name,
            phone,
            email,
            username,
            password
        } = req.body;


        if (
            !display_name ||
            !display_name.trim() ||
            !username ||
            !username.trim()
        ) {

            return res.status(400).json({
                error:
                    "اسم الموظف واسم المستخدم مطلوبان."
            });
        }


        const cleanName =
            display_name.trim();

        const cleanPhone =
            phone
                ? phone.trim()
                : null;

        const cleanEmail =
            email
                ? email.trim()
                : null;

        const cleanUsername =
            username.trim();

        const cleanPassword =
            password
                ? password.trim()
                : "";


        // -------------------------------------------
        // CHECK EXISTING USER
        // -------------------------------------------

        const userSql = `
            SELECT
                id,
                username,
                role
            FROM users
            WHERE id = ?
              AND role = 'receptionist'
            LIMIT 1
        `;


        db.query(
            userSql,
            [id],
            (userError, userRows) => {

                if (userError) {

                    console.error(
                        "UPDATE RECEPTIONIST USER CHECK ERROR:",
                        userError
                    );

                    return res.status(500).json({
                        error:
                            "تعذر التحقق من الموظف."
                    });
                }


                if (
                    userRows.length === 0
                ) {

                    return res.status(404).json({
                        error:
                            "موظف الاستقبال غير موجود."
                    });
                }


                // -----------------------------------
                // CHECK USERNAME
                // -----------------------------------

                const usernameSql = `
                    SELECT id
                    FROM users
                    WHERE username = ?
                      AND id <> ?
                    LIMIT 1
                `;


                db.query(
                    usernameSql,
                    [
                        cleanUsername,
                        id
                    ],
                    (
                        usernameError,
                        usernameRows
                    ) => {

                        if (usernameError) {

                            console.error(
                                "UPDATE RECEPTIONIST USERNAME CHECK ERROR:",
                                usernameError
                            );

                            return res.status(500).json({
                                error:
                                    "تعذر التحقق من اسم المستخدم."
                            });
                        }


                        if (
                            usernameRows.length > 0
                        ) {

                            return res.status(409).json({
                                error:
                                    "اسم المستخدم مستخدم بالفعل."
                            });
                        }


                        // --------------------------------
                        // UPDATE WITH OR WITHOUT PASSWORD
                        // --------------------------------

                        let updateSql;
                        let values;


                        if (cleanPassword) {

                            updateSql = `
                                UPDATE users

                                SET
                                    display_name = ?,
                                    phone = ?,
                                    email = ?,
                                    username = ?,
                                    password = ?

                                WHERE id = ?
                                  AND role = 'receptionist'
                            `;

                            values = [
                                cleanName,
                                cleanPhone,
                                cleanEmail,
                                cleanUsername,
                                cleanPassword,
                                id
                            ];

                        } else {

                            updateSql = `
                                UPDATE users

                                SET
                                    display_name = ?,
                                    phone = ?,
                                    email = ?,
                                    username = ?

                                WHERE id = ?
                                  AND role = 'receptionist'
                            `;

                            values = [
                                cleanName,
                                cleanPhone,
                                cleanEmail,
                                cleanUsername,
                                id
                            ];

                        }


                        db.query(
                            updateSql,
                            values,
                            (
                                updateError,
                                updateResult
                            ) => {

                                if (updateError) {

                                    console.error(
                                        "UPDATE RECEPTIONIST ERROR:",
                                        updateError
                                    );

                                    return res.status(500).json({
                                        error:
                                            "تعذر تعديل موظف الاستقبال."
                                    });
                                }


                                if (
                                    updateResult.affectedRows === 0
                                ) {

                                    return res.status(404).json({
                                        error:
                                            "موظف الاستقبال غير موجود."
                                    });
                                }


                                return res.json({

                                    success: true,

                                    message:
                                        "تم تعديل موظف الاستقبال بنجاح."

                                });

                            }
                        );

                    }
                );

            }
        );

    }
);



// -----------------------------------------------------
// DELETE RECEPTION STAFF
// -----------------------------------------------------

app.delete(
    "/api/admin/receptionists/:id",
    (req, res) => {

        const id =
            Number(req.params.id);


        if (
            !Number.isInteger(id) ||
            id <= 0
        ) {

            return res.status(400).json({
                error:
                    "معرف الموظف غير صالح."
            });
        }


        // -------------------------------------------
        // FIRST CHECK
        // -------------------------------------------

        const checkSql = `
            SELECT
                id,
                username,
                display_name
            FROM users
            WHERE id = ?
              AND role = 'receptionist'
            LIMIT 1
        `;


        db.query(
            checkSql,
            [id],
            (checkError, rows) => {

                if (checkError) {

                    console.error(
                        "DELETE RECEPTIONIST CHECK ERROR:",
                        checkError
                    );

                    return res.status(500).json({
                        error:
                            "تعذر التحقق من الموظف."
                    });
                }


                if (rows.length === 0) {

                    return res.status(404).json({
                        error:
                            "موظف الاستقبال غير موجود."
                    });
                }


                // -----------------------------------
                // DELETE WORK HISTORY FIRST
                // -----------------------------------

                const deleteWorkSql = `
                    DELETE FROM reception_work_days
                    WHERE user_id = ?
                `;


                db.query(
                    deleteWorkSql,
                    [id],
                    workError => {

                        if (workError) {

                            console.error(
                                "DELETE RECEPTION WORK DAYS ERROR:",
                                workError
                            );

                            return res.status(500).json({
                                error:
                                    "تعذر حذف سجل دوام الموظف."
                            });
                        }


                        // -------------------------------
                        // DELETE ACCOUNT
                        // -------------------------------

                        const deleteUserSql = `
                            DELETE FROM users

                            WHERE id = ?
                              AND role = 'receptionist'
                        `;


                        db.query(
                            deleteUserSql,
                            [id],
                            (
                                deleteError,
                                result
                            ) => {

                                if (deleteError) {

                                    console.error(
                                        "DELETE RECEPTIONIST ERROR:",
                                        deleteError
                                    );

                                    return res.status(500).json({
                                        error:
                                            "تعذر حذف موظف الاستقبال."
                                    });
                                }


                                if (
                                    result.affectedRows === 0
                                ) {

                                    return res.status(404).json({
                                        error:
                                            "موظف الاستقبال غير موجود."
                                    });
                                }


                                return res.json({

                                    success: true,

                                    message:
                                        "تم حذف موظف الاستقبال وحسابه بنجاح."

                                });

                            }
                        );

                    }
                );

            }
        );

    }
);




// =====================================================
// ===================== START SERVER ===================
// =====================================================

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {

    console.log(
        `SmileCare Backend running on port ${PORT}`
    );

});






