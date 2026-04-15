class HabitTracker {
  constructor() {
    this.daysRow = document.getElementById("daysRow");
    this.tableBody = document.getElementById("tableBody");
    this.habitInput = document.getElementById("habitInput");
    this.addBtn = document.getElementById("addBtn");
    this.monthSelect = document.getElementById("monthSelect");
    this.yearSelect = document.getElementById("yearSelect");
    this.allData = JSON.parse(localStorage.getItem("habitData")) || {};
    this.days = 31;
    this.lastCompletionState = false;
    this.themes = ["blue", "green", "purple", "pink", "orange", "grey", "red"];
    this.currentThemeIndex = 0;
    this.draggingRow = null;
    this.addBtn.addEventListener("click", () => this.addHabit());
    this.habitInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") this.addHabit();
    });
    this.monthSelect.addEventListener("change", () => this.changeMonth());
    this.yearSelect.addEventListener("change", () => this.changeMonth());
    document.getElementById("darkToggle").addEventListener("click", () => this.toggleTheme());
    document.getElementById("clearMonth").onclick = () => {
      if (confirm("Reset this month?")) {
        this.habits.forEach(h => h.days.fill(false));
        this.save();
        this.render();
      }
    };
    const savedTheme = localStorage.getItem("theme") || "blue";
    this.applyTheme(savedTheme);
    this.changeMonth();
    this.initScrollIndicator();
    this.initDrag();
  }
  initScrollIndicator() {
    const container = document.querySelector(".table-container");
    const indicator = document.querySelector(".scroll-indicator");
    const hint = document.querySelector(".scroll-hint");
    if (!container || !indicator) return;
    const checkScroll = () => {
      const hasOverflow = container.scrollWidth > container.clientWidth;
      const scrollPos = container.scrollLeft;
      const maxScroll = container.scrollWidth - container.clientWidth;
      const atEnd = scrollPos >= maxScroll - 5;
      indicator.classList.toggle("visible", hasOverflow && !atEnd);
      hint.classList.toggle("visible", hasOverflow && scrollPos < 50);
    };
    container.addEventListener("scroll", checkScroll);
    container.addEventListener("mouseenter", checkScroll);
    window.addEventListener("resize", checkScroll);
    setTimeout(checkScroll, 100);
  }
  initDrag() {
    this.tableBody.addEventListener("dragover", (e) => {
      e.preventDefault();
      const dragging = this.draggingRow;
      if (!dragging) return;
      const afterElement = this.getDragAfterElement(e.clientY);
      if (afterElement == null) {
        this.tableBody.appendChild(dragging);
      } else {
        this.tableBody.insertBefore(dragging, afterElement);
      }
    });
  }
  showToast(message, type = "success") {
    let toast = document.querySelector(".toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.className = "toast";
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.className = `toast ${type}`;
    requestAnimationFrame(() => {
      toast.classList.add("show");
    });
    setTimeout(() => {
      toast.classList.remove("show");
    }, 2500);
  }
  applyTheme(theme) {
    document.body.classList.remove(...this.themes);
    document.body.classList.add(theme);
    localStorage.setItem("theme", theme);
    this.currentThemeIndex = this.themes.indexOf(theme);
    this.updateThemeIcon();
  }
  toggleTheme() {
    this.currentThemeIndex = (this.currentThemeIndex + 1) % this.themes.length;
    const newTheme = this.themes[this.currentThemeIndex];
    this.applyTheme(newTheme);
  }
  updateThemeIcon() {
    const icon = document.getElementById("themeIcon");
    if (!icon) return;
    const theme = this.themes[this.currentThemeIndex];
    const icons = {
      blue: "fa-cloud",
      pink: "fa-heart",
      green: "fa-leaf",
      orange: "fa-smile",
      purple: "fa-star",
      grey: "fa-snowflake",
      red: "fa-feather"
    };
    icon.className = `fa-solid ${icons[theme]}`;
  }
  getCurrentKey() {
    return `${this.monthSelect.value}-${this.yearSelect.value}`;
  }
  getDefaultHabits() {
    const defaults = ["Wake early", "Study", "Workout", "Read book", "Drink water"];
    return defaults.map((text, i) => ({
      id: Date.now() + i,
      text,
      days: Array(this.days).fill(false)
    }));
  }
  save() {
    this.allData[this.currentKey] = this.habits;
    localStorage.setItem("habitData", JSON.stringify(this.allData));
  }
  generateDays() {
    this.daysRow.innerHTML = "";
    const first = document.createElement("th");
    first.textContent = "Habit";
    this.daysRow.appendChild(first);
    for (let i = 1; i <= this.days; i++) {
      const th = document.createElement("th");
      th.textContent = i;
      this.daysRow.appendChild(th);
    }
  }
  addHabit() {
    const text = this.habitInput.value.trim();
    if (!text) {
      this.showToast("Please enter a habit name", "info");
      this.habitInput.focus();
      return;
    }
    this.habits.push({
      id: Date.now(),
      text,
      days: Array(this.days).fill(false)
    });
    this.habitInput.value = "";
    this.save();
    this.render();
    this.showToast(`"${text}" added successfully!`);
  }
  toggleDay(id, index) {
    this.habits.forEach(h => {
      if (h.id === id) {
        h.days[index] = !h.days[index];
      }
    });
    this.save();
    this.render();
  }
  deleteHabit(id) {
    const habit = this.habits.find(h => h.id === id);
    if (habit) {
      this.habits = this.habits.filter(h => h.id !== id);
      this.save();
      this.render();
      this.showToast(`"${habit.text}" deleted`);
    }
  }
  editHabit(id) {
    const habit = this.habits.find(h => h.id === id);
    if (!habit) return;
    const updated = prompt("Edit habit:", habit.text);
    if (updated && updated.trim()) {
      habit.text = updated.trim();
      this.save();
      this.render();
      this.showToast("Habit updated!");
    }
  }
  changeMonth() {
    this.currentMonth = this.monthSelect.value;
    this.currentYear = this.yearSelect.value;
    this.currentKey = this.getCurrentKey();
    if (["April", "June", "September", "November"].includes(this.currentMonth)) {
      this.days = 30;
    } else if (this.currentMonth === "February") {
      const year = parseInt(this.currentYear);
      this.days = (year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)) ? 29 : 28;
    } else {
      this.days = 31;
    }
    if (!this.allData[this.currentKey]) {
      this.habits = this.getDefaultHabits();
      this.save();
    } else {
      this.habits = this.allData[this.currentKey];
    }
    this.habits.forEach(h => {
      const newDays = Array(this.days).fill(false);
      for (let i = 0; i < Math.min(h.days.length, this.days); i++) {
        newDays[i] = h.days[i];
      }
      h.days = newDays;
    });
    this.generateDays();
    this.render();
  }
  calculateProgress() {
    let total = 0;
    let completed = 0;
    this.habits.forEach(h => {
      h.days.forEach(d => {
        total++;
        if (d) completed++;
      });
    });
    const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
    document.getElementById("progressFill").style.width = percent + "%";
    document.getElementById("progressText").textContent = percent + "%";
  }
  calculateStreak() {
    let streak = 0;
    const today = new Date().getDate() - 1;
    for (let i = today; i >= 0; i--) {
      if (this.habits.every(h => h.days[i])) streak++;
      else break;
    }
    return streak;
  }
  updateStreakUI() {
    document.getElementById("streakBox").innerHTML = `<i class="fa-solid fa-fire"></i> ${this.calculateStreak()}`;
  }
  highlightTodayColumn() {
    const today = new Date();
    const isCurrent =
      today.getMonth() === this.monthSelect.selectedIndex &&
      today.getFullYear().toString() === this.yearSelect.value;
    if (!isCurrent) return;
    const index = today.getDate();
    const rows = this.tableBody.querySelectorAll("tr");
    rows.forEach(row => {
      const cells = row.querySelectorAll("td");
      if (cells[index]) {
        cells[index].classList.add("today-col");
      }
    });
    const headers = this.daysRow.querySelectorAll("th");
    if (headers[index] && !headers[index].querySelector("small")) {
      headers[index].innerHTML += "<br><small>⭐</small>";
    }
  }
  checkFullDayCompletion() {
    const today = new Date();
    const index = today.getDate() - 1;
    if (index < 0 || index >= this.days) return;
    const allDone = this.habits.length > 0 && this.habits.every(h => h.days[index]);
    if (allDone && !this.lastCompletionState) {
      confetti({ particleCount: 120, spread: 80 });
    }
    this.lastCompletionState = allDone;
  }
  getDragAfterElement(y) {
    const rows = [...this.tableBody.querySelectorAll("tr:not(.dragging)")];
    return rows.reduce((closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;
      if (offset < 0 && offset > closest.offset) {
        return { offset: offset, element: child };
      } else {
        return closest;
      }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
  }
  render() {
    this.tableBody.innerHTML = "";
    this.habits.forEach((habit, index) => {
      const row = document.createElement("tr");
      row.setAttribute("draggable", true);
      row.dataset.id = habit.id;
      row.addEventListener("mouseenter", () => row.classList.add("highlight-row"));
      row.addEventListener("mouseleave", () => row.classList.remove("highlight-row"));
      row.addEventListener("dragstart", (e) => {
        this.draggingRow = row;
        row.classList.add("dragging");
        e.dataTransfer.effectAllowed = "move";
      });
      row.addEventListener("dragend", () => {
        row.classList.remove("dragging");
        this.draggingRow = null;
        const newOrder = [...this.tableBody.querySelectorAll("tr")].map(tr => Number(tr.dataset.id));
        this.habits.sort((a, b) => newOrder.indexOf(a.id) - newOrder.indexOf(b.id));
        this.save();
      });
      const nameCell = document.createElement("td");
      nameCell.className = "habit-name";
      nameCell.innerHTML = `
        <div class="habit-box">
          <span class="habit-text">${habit.text}</span>
          <div class="icons">
            <span class="edit-btn"><i class="fa-solid fa-pencil"></i></span>
            <span class="delete-btn"><i class="fa-solid fa-trash"></i></span>
          </div>
        </div>
      `;
      nameCell.querySelector(".edit-btn").onclick = () => this.editHabit(habit.id);
      nameCell.querySelector(".delete-btn").onclick = () => this.deleteHabit(habit.id);
      row.appendChild(nameCell);
      habit.days.forEach((done, i) => {
        const td = document.createElement("td");
        if (done) td.classList.add("active");
        td.addEventListener("click", () => this.toggleDay(habit.id, i));
        row.appendChild(td);
      });
      this.tableBody.appendChild(row);
    });
    if (this.habits.length === 0) {
      this.tableBody.innerHTML = `
        <tr>
          <td colspan="${this.days + 1}" style="padding: 40px 20px; text-align: center; color: #888;">
            No habits yet. Add one above! ✨
          </td>
        </tr>
      `;
    }
    this.calculateProgress();
    this.updateStreakUI();
    this.highlightTodayColumn();
    this.checkFullDayCompletion();
    setTimeout(() => {
      const container = document.querySelector(".table-container");
      if (container) {
        const indicator = document.querySelector(".scroll-indicator");
        const hint = document.querySelector(".scroll-hint");
        const hasOverflow = container.scrollWidth > container.clientWidth;
        const scrollPos = container.scrollLeft;
        const maxScroll = container.scrollWidth - container.clientWidth;
        const atEnd = maxScroll > 0 && scrollPos >= maxScroll - 5;
        if (indicator) indicator.classList.toggle("visible", hasOverflow && !atEnd);
        if (hint) hint.classList.toggle("visible", hasOverflow && scrollPos < 50);
      }
    }, 150);
  }
}
document.addEventListener("DOMContentLoaded", () => {
  new HabitTracker();
});
