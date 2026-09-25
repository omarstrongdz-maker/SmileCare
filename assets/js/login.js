const API_BASE = "https://smilecare-r68s.onrender.com/api";

console.log("✅ LOGIN.JS LOADED");

const loginForm = document.getElementById("loginForm");

if (!loginForm) {
    alert("ERROR: loginForm not found");
    console.error("❌ loginForm not found");
} else {

    loginForm.addEventListener("submit", async function (event) {

        event.preventDefault();

        console.log("✅ LOGIN FORM SUBMITTED");

        const usernameInput = document.getElementById("username");
        const passwordInput = document.getElementById("password");

        const username = usernameInput.value.trim();
        const password = passwordInput.value;

        console.log("Username:", username);

        if (!username || !password) {
            alert("Please enter username and password.");
            return;
        }

        const loginButton =
            loginForm.querySelector("button[type='submit']");

        loginButton.disabled = true;
        loginButton.textContent = "Logging in...";

        try {

            console.log("🔵 Sending login request...");

            const response = await fetch(
                `${API_BASE}/login`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        username: username,
                        password: password
                    })
                }
            );

            console.log("🟢 Server response:", response.status);

            const result = await response.json();

            console.log("🟢 Login result:", result);

            if (!response.ok) {
                throw new Error(
                    result.message || "Login failed."
                );
            }

            if (!result.user) {
                throw new Error(
                    "Server did not return user information."
                );
            }

            sessionStorage.setItem(
                "smilecare_user",
                JSON.stringify(result.user)
            );

            console.log(
                "✅ USER SAVED:",
                result.user
            );

            console.log(
                "ROLE:",
                result.user.role
            );

            if (result.user.role === "admin") {

                console.log("➡️ Redirecting to ADMIN...");

                window.location.href =
                    "pages/admin/admin.html";

            } else if (result.user.role === "dentist") {

                console.log("➡️ Redirecting to DOCTOR...");

                window.location.href =
                    "pages/doctor-workspace.html";

            } else if (result.user.role === "receptionist") {

                console.log("➡️ Redirecting to RECEPTION...");

                window.location.href =
                    "pages/reception-workspace.html";

            } else {

                throw new Error(
                    "Unknown user role: " +
                    result.user.role
                );
            }

        } catch (error) {

            console.error(
                "❌ LOGIN ERROR:",
                error
            );

            alert(
                "Login Error:\n\n" +
                error.message
            );

            loginButton.disabled = false;
            loginButton.textContent = "Login";
        }

    });
}
