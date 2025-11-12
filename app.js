let users = [];
let page = 1;
const perPage = 12;
let theme = localStorage.getItem("theme") || "light";
let isFetching = false;

const userListEl = document.getElementById("userList");
const loadingEl = document.getElementById("loading");
const errorEl = document.getElementById("error");
const searchInput = document.getElementById("searchInput");
const genderFilter = document.getElementById("genderFilter");
const countryFilter = document.getElementById("countryFilter");
const sortSelect = document.getElementById("sortSelect");
const themeToggle = document.getElementById("themeToggle");
const scrollTopBtn = document.getElementById("scrollTopBtn");

// Restore theme from localStorage
function applyTheme() {
  if(theme === "dark") {
    document.body.classList.add("bg-gray-900","text-gray-100");
    document.body.classList.remove("bg-gray-50","text-gray-900");
    themeToggle.textContent="☀️ Light";
  } else {
    document.body.classList.add("bg-gray-50","text-gray-900");
    document.body.classList.remove("bg-gray-900","text-gray-100");
    themeToggle.textContent="🌙 Dark";
  }
}
applyTheme();

// Fetch users
async function fetchUsers() {
  if(isFetching) return;
  isFetching = true;
  loadingEl.classList.remove("hidden");
  errorEl.textContent = "";

  try {
    // Check localStorage first
    let cachedUsers = JSON.parse(localStorage.getItem("users") || "[]");
    if(cachedUsers.length >= page * perPage) {
      users = cachedUsers.slice(0, page * perPage);
      populateCountryFilter();
      renderUsers();
      page++;
    } else {
      const res = await fetch(`https://randomuser.me/api/?results=${perPage}&page=${page}&seed=demo`);
      const data = await res.json();
      const newUsers = data.results.map(u => {
        u.realEmail = `${u.name.first.toLowerCase()}.${u.name.last.toLowerCase()}@${u.location.country.toLowerCase().replace(/\s/g,'')}.com`;
        return u;
      });
      users = [...users, ...newUsers];
      // Save to localStorage
      localStorage.setItem("users", JSON.stringify(users));
      populateCountryFilter();
      renderUsers();
      page++;
    }
  } catch(err) {
    errorEl.textContent = "Failed to fetch users.";
  } finally {
    loadingEl.classList.add("hidden");
    isFetching = false;
  }
}

// Populate country filter
function populateCountryFilter() {
  const countries = [...new Set(users.map(u => u.location.country))];
  countryFilter.innerHTML = '<option value="">All countries</option>' +
    countries.map(c => `<option value="${c}">${c}</option>`).join("");
}

// Render users
function renderUsers() {
  let filtered = users.filter(u => {
    const name = `${u.name.first} ${u.name.last}`.toLowerCase();
    const matchesName = name.includes(searchInput.value.toLowerCase());
    const matchesGender = !genderFilter.value || u.gender === genderFilter.value;
    const matchesCountry = !countryFilter.value || u.location.country === countryFilter.value;
    return matchesName && matchesGender && matchesCountry;
  });

  const [key, dir] = sortSelect.value.split("-");
  filtered.sort((a,b)=>{
    let valA = key==="name"?`${a.name.first} ${a.name.last}`.toLowerCase():a.location.country.toLowerCase();
    let valB = key==="name"?`${b.name.first} ${b.name.last}`.toLowerCase():b.location.country.toLowerCase();
    return dir==="asc"?valA.localeCompare(valB):valB.localeCompare(valA);
  });

  if(filtered.length === 0){
    userListEl.innerHTML = '<p class="col-span-full text-center text-gray-500 dark:text-gray-300">No users found.</p>';
    return;
  }

  userListEl.innerHTML = filtered.map(u => `
    <div class="bg-white dark:bg-gray-800 border dark:border-gray-700 p-4 rounded-2xl flex flex-col gap-2 shadow-sm dark:text-gray-100 hover:shadow-lg transition">
      <div class="flex gap-4 items-center">
        <img src="${u.picture.medium}" alt="${u.name.first}" class="w-16 h-16 rounded-full object-cover">
        <div>
          <h3 class="font-semibold">${u.name.first} ${u.name.last}</h3>
          <p class="text-sm opacity-80">Email: ${u.realEmail}</p>
        </div>
      </div>
      <p class="text-sm opacity-80">Phone: ${u.phone}</p>
      <p class="text-sm opacity-80">Country: ${u.location.country}</p>
    </div>
  `).join("");
}

// Event listeners
searchInput.addEventListener("input", renderUsers);
genderFilter.addEventListener("change", renderUsers);
countryFilter.addEventListener("change", renderUsers);
sortSelect.addEventListener("change", renderUsers);

// Dark/Light toggle
themeToggle.addEventListener("click", () => {
  theme = theme === "light" ? "dark" : "light";
  localStorage.setItem("theme", theme);
  applyTheme();
});

// Infinite scroll + scroll-to-top
window.addEventListener("scroll", () => {
  if(window.innerHeight + window.scrollY >= document.body.offsetHeight - 500){
    fetchUsers();
  }
  if(window.scrollY > 300){
    scrollTopBtn.classList.remove("hidden");
  } else {
    scrollTopBtn.classList.add("hidden");
  }
});

// Scroll-to-top button
scrollTopBtn.addEventListener("click", () => {
  window.scrollTo({top:0, behavior:"smooth"});
});

// Initial fetch
fetchUsers();