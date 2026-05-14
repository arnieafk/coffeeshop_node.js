function toggleSidebar() {
  const sidebar = document.getElementById("sidebar");
  if (sidebar) {
    sidebar.classList.toggle("active");
  }
}

/* =========================
   TOAST AUTO HIDE
========================= */
document.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => {
    const success = document.querySelector(".toast.success");
    const error = document.querySelector(".toast.error");

    if (success) success.remove();
    if (error) error.remove();
  }, 3000);
});