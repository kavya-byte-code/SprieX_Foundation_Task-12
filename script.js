"use strict";

/* ---------- Data ---------- */
var SERVICES = [
  { id: "general", name: "General Medicine", desc: "Fever, infections, diabetes and everyday health concerns.", hours: "Mon - Sat, 9 AM - 5 PM" },
  { id: "cardio", name: "Cardiology", desc: "Heart check-ups, ECG, blood pressure and cholesterol care.", hours: "Mon, Wed, Fri, 10 AM - 4 PM" },
  { id: "pediatrics", name: "Pediatrics", desc: "Newborn, child health, growth and vaccinations.", hours: "Mon - Sat, 9 AM - 1 PM" },
  { id: "ortho", name: "Orthopedics", desc: "Bone, joint and sports injuries, fracture care.", hours: "Tue, Thu, Sat, 10 AM - 4 PM" },
  { id: "derma", name: "Dermatology", desc: "Skin, hair and nail conditions.", hours: "Mon, Tue, Thu, 11 AM - 5 PM" },
  { id: "gyn", name: "Gynecology", desc: "Women's health, pregnancy care and consultations.", hours: "Mon - Fri, 9 AM - 3 PM" }
];

/* days: 0 = Sunday ... 6 = Saturday */
var DOCTORS = [
  { id: 1, name: "Dr. Anil Sharma", service: "general", exp: 14, days: [1, 2, 3, 4, 5, 6], slots: ["09:00 AM", "10:00 AM", "11:00 AM", "02:00 PM", "03:00 PM"] },
  { id: 2, name: "Dr. Meera Reddy", service: "cardio", exp: 18, days: [1, 3, 5], slots: ["10:00 AM", "11:00 AM", "12:00 PM", "03:00 PM"] },
  { id: 3, name: "Dr. Suresh Babu", service: "cardio", exp: 11, days: [2, 4, 6], slots: ["10:30 AM", "11:30 AM", "02:30 PM", "03:30 PM"] },
  { id: 4, name: "Dr. Kavya Nair", service: "pediatrics", exp: 9, days: [1, 2, 3, 4, 5, 6], slots: ["09:00 AM", "09:30 AM", "10:00 AM", "11:00 AM", "12:00 PM"] },
  { id: 5, name: "Dr. Rahul Verma", service: "ortho", exp: 12, days: [2, 4, 6], slots: ["10:00 AM", "11:00 AM", "01:00 PM", "03:00 PM"] },
  { id: 6, name: "Dr. Priya Menon", service: "derma", exp: 8, days: [1, 2, 4], slots: ["11:00 AM", "12:00 PM", "02:00 PM", "04:00 PM"] },
  { id: 7, name: "Dr. Lakshmi Devi", service: "gyn", exp: 16, days: [1, 2, 3, 4, 5], slots: ["09:00 AM", "10:00 AM", "11:00 AM", "01:00 PM", "02:00 PM"] }
];

var DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
var STORAGE_KEY = "citycare_appointments";

/* ---------- Helpers ---------- */
function $(id) { return document.getElementById(id); }

function esc(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getService(id) {
  for (var i = 0; i < SERVICES.length; i++) {
    if (SERVICES[i].id === id) { return SERVICES[i]; }
  }
  return null;
}

function getDoctor(id) {
  for (var i = 0; i < DOCTORS.length; i++) {
    if (String(DOCTORS[i].id) === String(id)) { return DOCTORS[i]; }
  }
  return null;
}

function initials(name) {
  var parts = name.replace("Dr. ", "").split(" ");
  return (parts[0].charAt(0) + (parts[1] ? parts[1].charAt(0) : "")).toUpperCase();
}

function daysText(days) {
  return days.map(function (d) { return DAY_NAMES[d]; }).join(", ");
}

function todayString() {
  var d = new Date();
  var m = String(d.getMonth() + 1).padStart(2, "0");
  var day = String(d.getDate()).padStart(2, "0");
  return d.getFullYear() + "-" + m + "-" + day;
}

function parseDate(str) {
  return new Date(str + "T00:00:00");
}

function formatDate(str) {
  return parseDate(str).toLocaleDateString("en-IN", {
    weekday: "short", day: "numeric", month: "short", year: "numeric"
  });
}

function timeToMinutes(t) {
  var parts = t.split(/[: ]/);
  var h = parseInt(parts[0], 10) % 12;
  if (parts[2] === "PM") { h += 12; }
  return h * 60 + parseInt(parts[1], 10);
}

/* ---------- Storage ---------- */
function loadAppointments() {
  try {
    var raw = localStorage.getItem(STORAGE_KEY);
    var list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch (e) {
    return [];
  }
}

function saveAppointments(list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    return true;
  } catch (e) {
    return false;
  }
}

/* ---------- Rendering: services and doctors ---------- */
function renderServices() {
  var html = "";
  SERVICES.forEach(function (s) {
    html += '<article class="card">' +
      "<h3>" + esc(s.name) + "</h3>" +
      "<p>" + esc(s.desc) + "</p>" +
      '<p class="meta">' + esc(s.hours) + "</p>" +
      '<button type="button" class="btn ghost small" data-filter="' + esc(s.id) + '">View doctors</button>' +
      "</article>";
  });
  $("services-list").innerHTML = html;
}

function fillFilter() {
  var select = $("filter-dept");
  select.innerHTML = '<option value="all">All services</option>';
  SERVICES.forEach(function (s) {
    var opt = document.createElement("option");
    opt.value = s.id;
    opt.textContent = s.name;
    select.appendChild(opt);
  });
}

function renderDoctors(serviceId) {
  var list = DOCTORS.filter(function (d) {
    return serviceId === "all" || d.service === serviceId;
  });
  var html = "";
  list.forEach(function (d) {
    html += '<article class="card">' +
      '<div class="avatar" aria-hidden="true">' + esc(initials(d.name)) + "</div>" +
      "<h3>" + esc(d.name) + "</h3>" +
      '<span class="tag">' + esc(getService(d.service).name) + "</span>" +
      '<p class="meta">' + d.exp + " years of experience</p>" +
      '<p class="meta">Available: ' + esc(daysText(d.days)) + "</p>" +
      '<button type="button" class="btn small" data-book="' + d.id + '">Book this doctor</button>' +
      "</article>";
  });
  $("doctors-list").innerHTML = html || '<p class="muted">No doctors found for this service.</p>';
}

/* ---------- Booking form ---------- */
function fillDepartments() {
  var select = $("department");
  select.innerHTML = '<option value="">Select a service</option>';
  SERVICES.forEach(function (s) {
    var opt = document.createElement("option");
    opt.value = s.id;
    opt.textContent = s.name;
    select.appendChild(opt);
  });
}

function fillDoctors(serviceId) {
  var select = $("doctor");
  select.innerHTML = '<option value="">Select a doctor</option>';
  if (!serviceId) {
    select.disabled = true;
    return;
  }
  DOCTORS.filter(function (d) { return d.service === serviceId; }).forEach(function (d) {
    var opt = document.createElement("option");
    opt.value = d.id;
    opt.textContent = d.name;
    select.appendChild(opt);
  });
  select.disabled = false;
}

function isBooked(doctorId, date, time) {
  return loadAppointments().some(function (a) {
    return String(a.doctorId) === String(doctorId) && a.date === date && a.time === time;
  });
}

function isDoctorAvailableOn(doctor, dateStr) {
  return doctor.days.indexOf(parseDate(dateStr).getDay()) !== -1;
}

function setError(field, message) {
  var box = $(field + "-error");
  var input = $(field);
  if (box) { box.textContent = message || ""; }
  if (input) {
    if (message) { input.classList.add("invalid"); } else { input.classList.remove("invalid"); }
  }
}

function clearSlots(message) {
  $("slots").innerHTML = '<p class="muted">' + esc(message) + "</p>";
}

function renderSlots() {
  var doctor = getDoctor($("doctor").value);
  var date = $("date").value;
  setError("date", "");
  $("slot-error").textContent = "";

  if (!doctor) { clearSlots("Choose a doctor and date to see free slots."); return; }
  if (!date) { clearSlots("Pick a date to see free slots."); return; }

  if (date < todayString()) {
    setError("date", "Please choose today or a future date.");
    clearSlots("No slots for a past date.");
    return;
  }
  if (!isDoctorAvailableOn(doctor, date)) {
    setError("date", doctor.name + " is not available on this day. Available: " + daysText(doctor.days) + ".");
    clearSlots("No slots on this day.");
    return;
  }

  var now = new Date();
  var isToday = date === todayString();
  var nowMinutes = now.getHours() * 60 + now.getMinutes();
  var html = "";
  var freeCount = 0;

  doctor.slots.forEach(function (time, index) {
    var past = isToday && timeToMinutes(time) <= nowMinutes;
    var taken = isBooked(doctor.id, date, time);
    var disabled = past || taken;
    if (!disabled) { freeCount++; }
    html += '<label class="slot">' +
      '<input type="radio" name="slot" value="' + esc(time) + '" id="slot-' + index + '"' + (disabled ? " disabled" : "") + ">" +
      "<span>" + esc(time) + "</span></label>";
  });

  $("slots").innerHTML = html;
  if (freeCount === 0) {
    $("slot-error").textContent = "All slots are full for this day. Please choose another date.";
  }
}

function updateDoctorHint() {
  var doctor = getDoctor($("doctor").value);
  var dateInput = $("date");
  dateInput.min = todayString();
  $("date-hint").textContent = doctor
    ? doctor.name + " is available on " + daysText(doctor.days) + "."
    : "Select a doctor to see available days.";
}

function selectedSlot() {
  var checked = document.querySelector('input[name="slot"]:checked');
  return checked ? checked.value : "";
}

function validateForm() {
  var valid = true;
  var name = $("name").value.trim();
  var phone = $("phone").value.trim();
  var email = $("email").value.trim();

  setError("name", "");
  setError("phone", "");
  setError("email", "");
  setError("department", "");
  setError("doctor", "");
  setError("date", "");
  $("slot-error").textContent = "";

  if (!/^[A-Za-z][A-Za-z .'-]{2,49}$/.test(name)) {
    setError("name", "Enter your full name (letters only, at least 3 characters).");
    valid = false;
  }
  if (!/^[6-9]\d{9}$/.test(phone)) {
    setError("phone", "Enter a valid 10-digit mobile number.");
    valid = false;
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    setError("email", "Enter a valid email address or leave it empty.");
    valid = false;
  }
  if (!$("department").value) {
    setError("department", "Select a service.");
    valid = false;
  }

  var doctor = getDoctor($("doctor").value);
  if (!doctor) {
    setError("doctor", "Select a doctor.");
    valid = false;
  }

  var date = $("date").value;
  if (!date) {
    setError("date", "Select a date.");
    valid = false;
  } else if (date < todayString()) {
    setError("date", "Please choose today or a future date.");
    valid = false;
  } else if (doctor && !isDoctorAvailableOn(doctor, date)) {
    setError("date", doctor.name + " is not available on this day. Available: " + daysText(doctor.days) + ".");
    valid = false;
  }

  if (doctor && date && !selectedSlot() && !$("date-error").textContent) {
    $("slot-error").textContent = "Select a time slot.";
    valid = false;
  }
  return valid;
}

function resetDynamicParts() {
  fillDoctors("");
  $("doctor").disabled = true;
  $("date-hint").textContent = "Select a doctor to see available days.";
  clearSlots("Choose a doctor and date to see free slots.");
  ["name", "phone", "email", "department", "doctor", "date"].forEach(function (f) { setError(f, ""); });
  $("slot-error").textContent = "";
}

function handleSubmit(event) {
  event.preventDefault();
  var box = $("confirmation");
  box.hidden = true;

  if (!validateForm()) {
    var firstError = document.querySelector(".invalid");
    if (firstError) { firstError.focus(); }
    return;
  }

  var doctor = getDoctor($("doctor").value);
  var date = $("date").value;
  var time = selectedSlot();

  if (isBooked(doctor.id, date, time)) {
    $("slot-error").textContent = "That slot was just taken. Please choose another one.";
    renderSlots();
    return;
  }

  var appointment = {
    id: "CC" + String(Date.now()).slice(-6),
    name: $("name").value.trim(),
    phone: $("phone").value.trim(),
    email: $("email").value.trim(),
    service: getService(doctor.service).name,
    doctorId: doctor.id,
    doctorName: doctor.name,
    date: date,
    time: time,
    reason: $("reason").value.trim()
  };

  var list = loadAppointments();
  list.push(appointment);
  if (!saveAppointments(list)) {
    $("slot-error").textContent = "Could not save the appointment. Please enable browser storage and try again.";
    return;
  }

  box.innerHTML = "<strong>Appointment confirmed.</strong> Booking ID " + esc(appointment.id) + ": " +
    esc(appointment.doctorName) + " (" + esc(appointment.service) + ") on " +
    esc(formatDate(appointment.date)) + " at " + esc(appointment.time) + ". Please arrive 15 minutes early.";
  box.hidden = false;

  $("booking-form").reset();
  resetDynamicParts();
  renderAppointments();
  box.scrollIntoView({ behavior: "smooth", block: "center" });
}

/* ---------- My appointments ---------- */
function renderAppointments() {
  var list = loadAppointments().sort(function (a, b) {
    if (a.date !== b.date) { return a.date < b.date ? -1 : 1; }
    return timeToMinutes(a.time) - timeToMinutes(b.time);
  });
  var container = $("appointments-list");

  if (list.length === 0) {
    container.innerHTML = '<p class="muted">You have no appointments yet. Book one above and it will appear here.</p>';
    return;
  }

  var html = '<div class="appt-list">';
  list.forEach(function (a) {
    html += '<article class="appt">' +
      "<div><h3>" + esc(a.doctorName) + " - " + esc(a.service) + "</h3>" +
      "<p>" + esc(formatDate(a.date)) + " at " + esc(a.time) + "</p>" +
      "<p>Patient: " + esc(a.name) + " | Phone: " + esc(a.phone) + " | ID: " + esc(a.id) + "</p>" +
      (a.reason ? "<p>Reason: " + esc(a.reason) + "</p>" : "") +
      "</div>" +
      '<button type="button" class="btn danger small" data-cancel="' + esc(a.id) + '">Cancel appointment</button>' +
      "</article>";
  });
  html += "</div>";
  container.innerHTML = html;
}

function cancelAppointment(id) {
  if (!window.confirm("Cancel this appointment?")) { return; }
  var list = loadAppointments().filter(function (a) { return a.id !== id; });
  saveAppointments(list);
  renderAppointments();
  renderSlots();
}

/* ---------- Events ---------- */
function bookDoctor(doctorId) {
  var doctor = getDoctor(doctorId);
  if (!doctor) { return; }
  $("department").value = doctor.service;
  fillDoctors(doctor.service);
  $("doctor").value = String(doctor.id);
  updateDoctorHint();
  renderSlots();
  $("book").scrollIntoView({ behavior: "smooth" });
  $("date").focus({ preventScroll: true });
}

function init() {
  $("doctor-count").textContent = DOCTORS.length;
  renderServices();
  fillFilter();
  renderDoctors("all");
  fillDepartments();
  fillDoctors("");
  $("date").min = todayString();
  renderAppointments();

  $("filter-dept").addEventListener("change", function () {
    renderDoctors(this.value);
  });

  $("services-list").addEventListener("click", function (e) {
    var btn = e.target.closest("[data-filter]");
    if (!btn) { return; }
    $("filter-dept").value = btn.getAttribute("data-filter");
    renderDoctors(btn.getAttribute("data-filter"));
    $("doctors").scrollIntoView({ behavior: "smooth" });
  });

  $("doctors-list").addEventListener("click", function (e) {
    var btn = e.target.closest("[data-book]");
    if (btn) { bookDoctor(btn.getAttribute("data-book")); }
  });

  $("appointments-list").addEventListener("click", function (e) {
    var btn = e.target.closest("[data-cancel]");
    if (btn) { cancelAppointment(btn.getAttribute("data-cancel")); }
  });

  $("department").addEventListener("change", function () {
    fillDoctors(this.value);
    updateDoctorHint();
    renderSlots();
  });

  $("doctor").addEventListener("change", function () {
    updateDoctorHint();
    renderSlots();
  });

  $("date").addEventListener("change", renderSlots);

  $("booking-form").addEventListener("submit", handleSubmit);

  $("booking-form").addEventListener("reset", function () {
    $("confirmation").hidden = true;
    setTimeout(resetDynamicParts, 0);
  });
}

document.addEventListener("DOMContentLoaded", init);