// ===========================
// API
// ===========================

const API_URL = "http://localhost:3000/api";


// ===========================
// ELEMENTS
// ===========================

const clinicName = document.getElementById("clinicName");
const clinicPhone = document.getElementById("clinicPhone");
const clinicAddress = document.getElementById("clinicAddress");

const username = document.getElementById("username");
const email = document.getElementById("email");

const workingDays = document.getElementById("workingDays");
const workingHours = document.getElementById("workingHours");

const saveSettingsBtn = document.getElementById("saveSettings");
const resetSettingsBtn = document.getElementById("resetSettings");


// ===========================
// SETTINGS ID
// ===========================

let settingsId = null;


// ===========================
// LOAD SETTINGS
// ===========================

async function loadSettings() {

    try {

        const response = await fetch(`${API_URL}/settings`);

        if (!response.ok) {
            throw new Error("Failed to load settings");
        }

        const settings = await response.json();

        // Save database ID
        settingsId = settings.id;

        // Clinic information
        clinicName.value = settings.clinic_name || "SmileCare";
        clinicPhone.value = settings.clinic_phone || "";
        clinicAddress.value = settings.clinic_address || "";

        // User information
        username.value = settings.username || "Omar";
        email.value = settings.email || "";

        // Appointment settings
        workingDays.value =
            settings.working_days || "Saturday-Thursday";

        workingHours.value =
            settings.working_hours || "08:00 - 17:00";


    } catch (error) {

        console.error("Load Settings Error:", error);

        alert("Failed to load settings.");

    }

}


// ===========================
// SAVE SETTINGS
// ===========================

saveSettingsBtn.addEventListener("click", async () => {

    // Make sure settings exist
    if (!settingsId) {

        alert("Settings data is not available.");

        return;

    }


    const settings = {

        clinic_name: clinicName.value.trim(),

        clinic_phone: clinicPhone.value.trim(),

        clinic_address: clinicAddress.value.trim(),

        username: username.value.trim(),

        email: email.value.trim(),

        working_days: workingDays.value,

        working_hours: workingHours.value.trim()

    };


    // Basic validation
    if (!settings.clinic_name) {

        alert("Please enter the clinic name.");

        return;

    }

    if (!settings.username) {

        alert("Please enter the username.");

        return;

    }

    if (!settings.working_days) {

        alert("Please select working days.");

        return;

    }

    if (!settings.working_hours) {

        alert("Please enter working hours.");

        return;

    }


    try {

        const response = await fetch(
            `${API_URL}/settings/${settingsId}`,
            {
                method: "PUT",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify(settings)
            }
        );


        const result = await response.json();


        if (!response.ok) {

            throw new Error(
                result.error || "Failed to save settings"
            );

        }


        alert("Settings saved successfully!");


        // Reload from database
        await loadSettings();


    } catch (error) {

        console.error("Save Settings Error:", error);

        alert("Failed to save settings.");

    }

});


// ===========================
// RESET SETTINGS
// ===========================

resetSettingsBtn.addEventListener("click", async () => {

    const confirmReset = confirm(
        "Are you sure you want to reset the settings?"
    );


    if (!confirmReset) {
        return;
    }


    if (!settingsId) {

        alert("Settings data is not available.");

        return;

    }


    const defaultSettings = {

        clinic_name: "SmileCare",

        clinic_phone: "",

        clinic_address: "",

        username: "Omar",

        email: "",

        working_days: "Saturday-Thursday",

        working_hours: "08:00 - 17:00"

    };


    try {

        const response = await fetch(
            `${API_URL}/settings/${settingsId}`,
            {
                method: "PUT",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify(defaultSettings)
            }
        );


        const result = await response.json();


        if (!response.ok) {

            throw new Error(
                result.error || "Failed to reset settings"
            );

        }


        alert("Settings reset successfully!");


        // Reload from database
        await loadSettings();


    } catch (error) {

        console.error("Reset Settings Error:", error);

        alert("Failed to reset settings.");

    }

});


// ===========================
// START
// ===========================

loadSettings();