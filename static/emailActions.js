// emailActions.js

const EmailActions = (() => {
  // Utility: Show alert message (you can replace this with fancier UI feedback)
  function showAlert(message) {
    alert(message);
  }

  // Send test email
  async function sendTestEmail(recipient) {
    try {
      const response = await fetch("/send-test-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipient }),
      });

      const data = await response.json();

      if (response.ok) {
        showAlert(data.message);
      } else {
        showAlert("Error: " + (data.error || "Unknown error"));
      }
    } catch (error) {
      showAlert("Request failed: " + error.message);
    }
  }

  // Send bulk emails
  async function sendEmails(formElement) {
    try {
      const formData = new FormData(formElement);
      const response = await fetch("/send-emails", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        showAlert(data.message);
      } else {
        showAlert("Error: " + (data.error || "Unknown error"));
      }
    } catch (error) {
      showAlert("Request failed: " + error.message);
    }
  }

  // Bind event listeners (call this on DOMContentLoaded)
  function bindEvents() {
    const testEmailBtn = document.getElementById("send-test-email-btn");
    if (testEmailBtn) {
      testEmailBtn.addEventListener("click", () => {
        sendTestEmail();
      });
    }

    const sendEmailsForm = document.getElementById("send-emails-form");
    if (sendEmailsForm) {
      sendEmailsForm.addEventListener("submit", (e) => {
        e.preventDefault();
        sendEmails(sendEmailsForm);
      });
    }

    // You can add more bindings here for other buttons/actions later
  }

  // Public API
  return {
    bindEvents,
    sendTestEmail, // expose in case you want to call programmatically
    sendEmails,
  };
})();

// Automatically bind events when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  EmailActions.bindEvents();
});
