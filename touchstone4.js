"use strict";

// North Star Bakery — Sophia Touchstone 4
// Feature: Save favorite products, restore them across pages, and help compose a preorder inquiry.
const FAVORITES_KEY = "north-star-bakery-favorites";
const bakeryProducts = [
  { id: "signature-loaf", name: "Signature Loaf" },
  { id: "pastries", name: "Fresh Pastries" },
  { id: "cakes", name: "Celebration Cakes" }
];

function getSavedFavorites() {
  try {
    const stored = JSON.parse(localStorage.getItem(FAVORITES_KEY) || "[]");
    if (!Array.isArray(stored)) return [];
    return stored.filter(id => bakeryProducts.some(product => product.id === id));
  } catch (error) {
    return []; // The site remains usable if browser storage is unavailable.
  }
}

function saveFavorites(favorites) {
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
    return true;
  } catch (error) {
    return false;
  }
}

function getFavoriteProductNames() {
  const favorites = getSavedFavorites();
  return bakeryProducts.filter(product => favorites.includes(product.id)).map(product => product.name);
}

function renderFavorites() {
  const summary = document.getElementById("favorites-summary");
  if (!summary) return;
  const favorites = getSavedFavorites();
  summary.textContent = favorites.length === 0
    ? "No favorites saved yet. Choose a product below to get started."
    : `${favorites.length} saved ${favorites.length === 1 ? "favorite" : "favorites"}.`;

  document.querySelectorAll("[data-favorite-id]").forEach(button => {
    const selected = favorites.includes(button.dataset.favoriteId);
    button.setAttribute("aria-pressed", String(selected));
    button.textContent = selected ? "Remove from favorites" : "Save to favorites";
  });

  const list = document.getElementById("favorites-list");
  if (!list) return;
  list.replaceChildren();
  getFavoriteProductNames().forEach(name => {
    const item = document.createElement("li");
    item.textContent = name;
    list.append(item);
  });
}

function initializeProductFavorites() {
  document.querySelectorAll("[data-favorite-id]").forEach(button => {
    button.addEventListener("click", () => {
      const id = button.dataset.favoriteId;
      const favorites = getSavedFavorites();
      const updated = favorites.includes(id)
        ? favorites.filter(favoriteId => favoriteId !== id)
        : [...favorites, id];
      const stored = saveFavorites(updated);
      renderFavorites();
      if (!stored) {
        const summary = document.getElementById("favorites-summary");
        summary.textContent = "Browser storage is unavailable. Try allowing site storage to save favorites.";
      }
    });
  });
  renderFavorites();
}

function localToday() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function checkField(field, requestType) {
  const value = field.value.trim();
  switch (field.id) {
    case "customer-name":
      if (!value) return "Please enter your full name.";
      if (value.length < 2) return "Your name must have at least 2 characters.";
      if (value.length > 80) return "Your name must be no more than 80 characters.";
      return "";
    case "customer-email":
      if (!value) return "Please enter your email address.";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "Please enter a valid email address.";
      return "";
    case "request-type":
      return value ? "" : "Please select a request type.";
    case "pickup-date":
      if (requestType === "preorder" && !value) return "Choose a preferred pickup date for your preorder.";
      if (value && value < localToday()) return "Pickup date cannot be in the past.";
      return "";
    case "item-details":
      if (!value) return "Please describe your items or question.";
      if (value.length < 10) return "Please enter at least 10 characters.";
      if (value.length > 1000) return "Please use no more than 1,000 characters.";
      return "";
    default:
      return "";
  }
}

function showFieldError(field, message) {
  const errorBox = document.getElementById(`${field.id}-error`);
  if (errorBox) errorBox.textContent = message;
  field.setAttribute("aria-invalid", message ? "true" : "false");
}

function showContactFavorites() {
  const message = document.getElementById("contact-favorites");
  const useButton = document.getElementById("use-favorites");
  if (!message || !useButton) return;
  const names = getFavoriteProductNames();
  message.textContent = names.length
    ? `Saved in your browser: ${names.join(", ")}.`
    : "No favorites saved yet. Visit Products to save some.";
  useButton.disabled = names.length === 0;
}

function initializeRequestForm() {
  const form = document.getElementById("bakery-request-form");
  if (!form) return;
  const requestType = document.getElementById("request-type");
  const pickupDate = document.getElementById("pickup-date");
  const details = document.getElementById("item-details");
  const status = document.getElementById("form-status");
  const checkedFields = ["customer-name", "customer-email", "request-type", "pickup-date", "item-details"]
    .map(id => document.getElementById(id));

  pickupDate.min = localToday();
  showContactFavorites();
  document.getElementById("use-favorites").addEventListener("click", () => {
    const names = getFavoriteProductNames();
    if (!names.length) return;
    requestType.value = "preorder";
    pickupDate.required = true;
    const intro = `I'd like to ask about: ${names.join(", ")}. Please confirm availability and pricing. `;
    details.value = details.value.trim() ? `${intro}\n${details.value.trim()}` : `${intro}Quantities needed: `;
    showFieldError(requestType, "");
    showFieldError(details, "");
    status.textContent = "Your favorites have been added. Enter quantities and a pickup date before checking the form.";
    status.classList.remove("is-error");
    details.focus();
  });

  requestType.addEventListener("change", () => {
    pickupDate.required = requestType.value === "preorder";
    if (requestType.getAttribute("aria-invalid") === "true") showFieldError(requestType, checkField(requestType, requestType.value));
    if (pickupDate.getAttribute("aria-invalid") === "true") showFieldError(pickupDate, checkField(pickupDate, requestType.value));
  });
  checkedFields.forEach(field => {
    for (const event of ["input", "change"]) {
      field.addEventListener(event, () => {
        if (field.getAttribute("aria-invalid") === "true") {
          showFieldError(field, checkField(field, requestType.value));
        }
      });
    }
  });

  form.addEventListener("submit", event => {
    event.preventDefault(); // No real server exists for this student project.
    pickupDate.required = requestType.value === "preorder";
    let firstInvalid = null;
    checkedFields.forEach(field => {
      const message = checkField(field, requestType.value);
      showFieldError(field, message);
      if (message && !firstInvalid) firstInvalid = field;
    });
    if (firstInvalid) {
      status.textContent = "Please correct the highlighted fields, then try again.";
      status.classList.add("is-error");
      firstInvalid.focus();
      return;
    }
    status.classList.remove("is-error");
    status.textContent = "All fields look valid. This is a student demonstration: your request has NOT been sent to the bakery.";
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initializeProductFavorites();
  initializeRequestForm();
});
