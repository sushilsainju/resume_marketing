document.addEventListener("DOMContentLoaded", () => {
  const recruiterFileInput = document.getElementById("recruiter-file");
  const status = document.getElementById("recruiter-status");

  recruiterFileInput.addEventListener("change", async function () {
    const file = this.files[0];
    if (!file) {
      status.textContent = "No file selected";
      return;
    }

    status.textContent = "Uploading...";

    const formData = new FormData();
    formData.append("recruiters", file);

    try {
      const response = await fetch("/upload-recruiters", {
        method: "POST",
        body: formData,
      });
      debugger;
      if (!response.ok) throw new Error("Upload failed");

      const data = await response.json();

      updateRecruitersPreview(data.recruiters);

      status.textContent = `${data.recruiters.length} recruiters loaded`;
    } catch (err) {
      status.textContent = "Upload failed, please try again.";
    }
  });

  function updateRecruitersPreview(recruiters) {
    const tbody = document.querySelector("table tbody");
    tbody.innerHTML = "";

    if (!recruiters || recruiters.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="4" class="p-4 text-slate-700">No recruiters uploaded yet.</td>
        </tr>`;
      return;
    }

    recruiters.forEach((rec) => {
      tbody.innerHTML += `
        <tr class="border-b border-slate-100 hover:bg-slate-50 transition-colors duration-150">
          <td class="p-4 text-slate-700">${rec.first_name || ""}</td>
          <td class="p-4 text-slate-600">${rec.email || ""}</td>
          <td class="p-4 text-slate-600">${
            rec.company_name
              ? rec.company_name.charAt(0).toUpperCase() +
                rec.company_name.slice(1)
              : "--"
          }</td>
          <td class="p-4"><span class="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">Ready</span></td>
        </tr>`;
    });
  }

  // Modal logic for confirmation and success screens
  document
    .querySelector('[data-handler="handler_0"]')
    ?.addEventListener("click", (e) => {
      const modal = document.getElementById("confirmation-modal");
      modal.style.display = "block";
      modal.classList.add("opacity-100");
      modal.classList.remove("opacity-0");
    });
  document
    .querySelector('[data-handler="handler_1"]')
    ?.addEventListener("click", (e) => {
      const modal = document.getElementById("confirmation-modal");
      modal.classList.add("opacity-0");
      modal.classList.remove("opacity-100");
      setTimeout(() => (modal.style.display = "none"), 300);
    });
  document
    .querySelector('[data-handler="handler_2"]')
    ?.addEventListener("click", (e) => {
      const modal = document.getElementById("confirmation-modal");
      modal.classList.add("opacity-0");
      modal.classList.remove("opacity-100");
      setTimeout(() => {
        modal.style.display = "none";
        const successModal = document.getElementById("success-modal");
        successModal.style.display = "block";
        successModal.classList.add("opacity-100");
        successModal.classList.remove("opacity-0");
      }, 300);
    });
  document
    .querySelector('[data-handler="handler_3"]')
    ?.addEventListener("click", (e) => {
      const modal = document.getElementById("success-modal");
      modal.classList.add("opacity-0");
      modal.classList.remove("opacity-100");
      setTimeout(() => (modal.style.display = "none"), 300);
    });

  // File input status update
  document
    .getElementById("recruiter-file")
    .addEventListener("change", function () {
      const status = document.getElementById("recruiter-status");
      status.textContent = this.files[0]
        ? this.files[0].name
        : "No file selected";
    });
  document
    .getElementById("resume-file")
    .addEventListener("change", function () {
      const status = document.getElementById("resume-status");
      status.textContent = this.files[0]
        ? this.files[0].name
        : "No file selected";
    });
});
