document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // build participants list HTML if there are any
        let participantsHtml = '';
        if (details.participants && details.participants.length > 0) {
          participantsHtml = `<div class="participants">
            <p class="participants-heading">Participants</p>
            <ul>
              ${details.participants.map(p => `<li>${p} <span class="remove-participant" data-activity="${name}" data-email="${p}" title="Unregister">🗑️</span></li>`).join('')}
            </ul>
          </div>`;
        }

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          ${participantsHtml}
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        fetchActivities(); // refresh list so new participant shows up immediately
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Listen for clicks on remove icons (event delegation)
  activitiesList.addEventListener('click', async (evt) => {
    if (evt.target.classList.contains('remove-participant')) {
      const activity = evt.target.dataset.activity;
      const email = evt.target.dataset.email;

      try {
        const resp = await fetch(
          `/activities/${encodeURIComponent(activity)}/participants?email=${encodeURIComponent(email)}`,
          { method: 'DELETE' }
        );
        const res = await resp.json();
        if (resp.ok) {
          messageDiv.textContent = res.message;
          messageDiv.className = 'success';
          fetchActivities(); // refresh list
        } else {
          messageDiv.textContent = res.detail || 'Failed to remove participant';
          messageDiv.className = 'error';
        }
      } catch (err) {
        messageDiv.textContent = 'Error removing participant';
        messageDiv.className = 'error';
        console.error('Error removing participant', err);
      }
      messageDiv.classList.remove('hidden');
      setTimeout(() => messageDiv.classList.add('hidden'), 5000);
    }
  });

  // Initialize app
  fetchActivities();
});
