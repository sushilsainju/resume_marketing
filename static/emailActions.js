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
        // Show modal instead of alert
        const modal = document.getElementById("test-email-success-modal");
        const msg = document.getElementById("test-email-success-message");
        if (msg && data.message) msg.innerText = data.message;
        if (modal) {
          modal.style.display = "flex";
          setTimeout(() => {
            modal.classList.remove("opacity-0");
            modal.classList.add("opacity-100");
          }, 10);
          // Close handler
          const closeBtn = document.getElementById("close-test-email-success");
          if (closeBtn) {
            closeBtn.onclick = function () {
              modal.classList.remove("opacity-100");
              modal.classList.add("opacity-0");
              setTimeout(() => {
                modal.style.display = "none";
              }, 300);
            };
          }
        }
      } else {
        showAlert("Error: " + (data.error || "Unknown error"));
      }
    } catch (error) {
      showAlert("Request failed: " + error.message);
    }
  }

  // Send bulk emails with progress tracking
  async function sendEmails(formElement) {
    const sendBtn = document.getElementById("send-bulk-email-btn");
    const progressContainer = document.getElementById("progress-container");
    const progressBar = document.getElementById("progress-bar");
    const progressText = document.getElementById("progress-text");
    const successModal = document.getElementById("success-modal");

    try {
      const formData = new FormData(formElement);

      if (sendBtn) {
        sendBtn.disabled = true;
        sendBtn.innerText = "Sending...";
      }

      const response = await fetch("/send-emails", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.status === "success") {
        if (progressContainer) progressContainer.style.display = "block";
        pollProgress(data.job_id, progressBar, progressText, successModal);
      } else {
        showAlert("Error: " + data.message);
      }
    } catch (error) {
      showAlert("Failed to send emails.");
      console.error(error);
    } finally {
      if (sendBtn) {
        sendBtn.disabled = false;
        sendBtn.innerText = "Send Emails to All Recruiters";
      }
    }
  }

  // Poll progress endpoint and update UI
  function pollProgress(jobId, progressBar, progressText, successModal) {
    const interval = setInterval(() => {
      fetch(`/progress/${jobId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.status === "not_found") return;

          const { sent, failed, total } = data;
          const percent = Math.round(((sent + failed) / total) * 100);

          if (progressBar) progressBar.style.width = `${percent}%`;
          if (progressText)
            progressText.innerText = `${percent}% complete — ${sent} sent, ${failed} failed`;

          if (sent + failed === total) {
            clearInterval(interval);
            if (progressText) progressText.innerText += " ✅ Finished!";
            setTimeout(() => {
              if (successModal) {
                successModal.style.display = "flex";
                successModal.style.opacity = "1";
              }
            }, 1000);
          }
        })
        .catch((err) => {
          console.error("Polling error:", err);
          clearInterval(interval);
        });
    }, 2000); // poll every 2 seconds
  }

  // Show confirmation modal when send-bulk-email-btn is clicked
  function setupConfirmationModal() {
    const sendBulkBtn = document.getElementById("send-bulk-email-btn");
    const confirmationModal = document.getElementById("confirmation-modal");
    const sendEmailsForm = document.getElementById("send-emails-form");

    if (sendBulkBtn && confirmationModal && sendEmailsForm) {
      sendBulkBtn.addEventListener("click", function (e) {
        e.preventDefault();

        // Update recruiter count from preview table
        const recruitersTableBody = document.querySelector(
          ".bg-white.rounded-xl.border.border-slate-200.shadow-sm.mb-6 tbody"
        );
        let recruiterCount = 0;
        if (recruitersTableBody) {
          recruiterCount = recruitersTableBody.querySelectorAll("tr").length;
          // Subtract 1 if the only row is the "No recruiters uploaded yet." row
          if (
            recruiterCount === 1 &&
            recruitersTableBody.querySelector("td") &&
            recruitersTableBody
              .querySelector("td")
              .innerText.includes("No recruiters uploaded yet")
          ) {
            recruiterCount = 0;
          }
        }
        // Update modal recruiter count
        const modalRecruiterCount = confirmationModal.querySelector(
          ".font-semibold.text-slate-800"
        );
        if (modalRecruiterCount) {
          modalRecruiterCount.innerText = recruiterCount + " recruiters";
        }

        // Update attachment file name
        const resumeFileInput = document.getElementById("resume-file");
        let resumeFileName = "No file";
        if (resumeFileInput && resumeFileInput.files.length > 0) {
          resumeFileName = resumeFileInput.files[0].name;
        }
        const modalAttachmentName = confirmationModal.querySelectorAll(
          ".font-semibold.text-slate-800"
        )[1];
        if (modalAttachmentName) {
          modalAttachmentName.innerText = resumeFileName;
        }

        confirmationModal.style.display = "flex";
        setTimeout(() => {
          confirmationModal.classList.remove("opacity-0");
          confirmationModal.classList.add("opacity-100");
        }, 10);
      });

      // Cancel button
      const cancelBtn = confirmationModal.querySelector(
        "[data-handler='handler_1']"
      );
      if (cancelBtn) {
        cancelBtn.addEventListener("click", function (e) {
          e.preventDefault();
          confirmationModal.classList.remove("opacity-100");
          confirmationModal.classList.add("opacity-0");
          setTimeout(() => {
            confirmationModal.style.display = "none";
          }, 300);
        });
      }

      // Confirm button
      const confirmBtn = confirmationModal.querySelector(
        "[data-handler='handler_2']"
      );
      if (confirmBtn) {
        confirmBtn.addEventListener("click", function (e) {
          e.preventDefault();
          confirmationModal.classList.remove("opacity-100");
          confirmationModal.classList.add("opacity-0");
          setTimeout(() => {
            confirmationModal.style.display = "none";
            sendEmails(sendEmailsForm);
          }, 300);
        });
      }
    }
  }

  // Bind events for test email and confirmation modal
  function bindEvents() {
    // Test email button
    const testEmailBtn = document.getElementById("send-test-email-btn");
    if (testEmailBtn) {
      testEmailBtn.addEventListener("click", (e) => {
        e.preventDefault();
        sendTestEmail();
      });
    }

    // Confirmation modal and send emails form
    const sendEmailsForm = document.getElementById("send-emails-form");
    if (sendEmailsForm) {
      sendEmailsForm.addEventListener("submit", (e) => {
        e.preventDefault();
        sendEmails(sendEmailsForm);
      });
    }

    setupConfirmationModal();
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
