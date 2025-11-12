const { useState, useEffect } = React;
const PER_PAGE = 12;

const Header = ({theme, setTheme, sort, setSort}) => (
  <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-3">
    <h1 className="text-2xl font-bold">Random User Directory</h1>
    <div className="flex gap-3 items-center">
      <select className="px-3 py-2 rounded-lg border" value={sort} onChange={e=>setSort(e.target.value)}>
        <option value="name-asc">Name ↑</option>
        <option value="name-desc">Name ↓</option>
        <option value="country-asc">Country ↑</option>
        <option value="country-desc">Country ↓</option>
      </select>
      <button className="px-3 py-2 rounded-lg border" onClick={()=>setTheme(theme==="light"?"dark":"light")}>
        {theme==="light"?"🌙 Dark":"☀️ Light"}
      </button>
    </div>
  </div>
);

const Filters = ({search, setSearch, gender, setGender, country, setCountry, users}) => {
  const countries = [...new Set(users.map(u=>u.location.country))];
  return (
    <div className="flex flex-col md:flex-row gap-3 mb-4">
      <input placeholder="Search by name..." className="flex-1 px-4 py-2 rounded-lg border" value={search} onChange={e=>setSearch(e.target.value)} />
      <select className="px-3 py-2 rounded-lg border" value={gender} onChange={e=>setGender(e.target.value)}>
        <option value="">All genders</option>
        <option value="female">Female</option>
        <option value="male">Male</option>
      </select>
      <select className="px-3 py-2 rounded-lg border" value={country} onChange={e=>setCountry(e.target.value)}>
        <option value="">All countries</option>
        {countries.map(c=><option key={c} value={c}>{c}</option>)}
      </select>
    </div>
  );
};

const UserCard = ({user}) => (
  <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 p-4 rounded-2xl flex flex-col gap-2 shadow-sm dark:text-gray-100 hover:shadow-lg transition">
    <div className="flex gap-4 items-center">
      <img src={user.picture.medium} alt={user.name.first} className="w-16 h-16 rounded-full object-cover"/>
      <div>
        <h3 className="font-semibold">{user.name.first} {user.name.last}</h3>
        <p className="text-sm opacity-80">Email: {user.realEmail}</p>
      </div>
    </div>
    <p className="text-sm opacity-80">Phone: {user.phone}</p>
    <p className="text-sm opacity-80">Country: {user.location.country}</p>
  </div>
);

const ScrollTopButton = () => {
  const [visible, setVisible] = useState(false);
  useEffect(()=>{
    const handleScroll = () => setVisible(window.scrollY>300);
    window.addEventListener("scroll", handleScroll);
    return ()=>window.removeEventListener("scroll", handleScroll);
  },[]);
  return visible ? (
    <button className="fixed bottom-5 right-5 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
      onClick={()=>window.scrollTo({top:0, behavior:"smooth"})}>
      ↑ Top
    </button>
  ) : null;
};

const App = () => {
  const [users, setUsers] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");
  const [search, setSearch] = useState("");
  const [gender, setGender] = useState("");
  const [country, setCountry] = useState("");
  const [sort, setSort] = useState("name-asc");

  useEffect(()=>{
    if(theme==="dark"){
      document.body.classList.add("bg-gray-900","text-gray-100");
      document.body.classList.remove("bg-gray-50","text-gray-900");
    } else {
      document.body.classList.add("bg-gray-50","text-gray-900");
      document.body.classList.remove("bg-gray-900","text-gray-100");
    }
    localStorage.setItem("theme", theme);
  },[theme]);

  useEffect(()=>{
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const res = await fetch(`https://randomuser.me/api/?results=${PER_PAGE}&page=${page}&seed=demo`);
        const data = await res.json();
        const newUsers = data.results.map(u=>({...u, realEmail:`${u.name.first.toLowerCase()}.${u.name.last.toLowerCase()}@${u.location.country.toLowerCase().replace(/\s/g,"")}.com`}));
        setUsers(prev=>[...prev,...newUsers]);
      } catch { alert("Failed to fetch users"); }
      finally { setLoading(false); }
    };
    fetchUsers();
  },[page]);

  useEffect(()=>{
    const handleScroll = () => { if(window.innerHeight+window.scrollY>=document.body.offsetHeight-500) setPage(p=>p+1); };
    window.addEventListener("scroll", handleScroll);
    return ()=>window.removeEventListener("scroll", handleScroll);
  },[]);

  const filteredUsers = users
    .filter(u=>(`${u.name.first} ${u.name.last}`.toLowerCase().includes(search.toLowerCase())))
    .filter(u=>(!gender || u.gender===gender))
    .filter(u=>(!country || u.location.country===country))
    .sort((a,b)=>{
      const [key,dir]=sort.split("-");
      const valA = key==="name"?`${a.name.first} ${a.name.last}`.toLowerCase():a.location.country.toLowerCase();
      const valB = key==="name"?`${b.name.first} ${b.name.last}`.toLowerCase():b.location.country.toLowerCase();
      return dir==="asc"?valA.localeCompare(valB):valB.localeCompare(valA);
    });

  return (
    <div className="container mx-auto p-4">
      <Header theme={theme} setTheme={setTheme} sort={sort} setSort={setSort}/>
      <Filters search={search} setSearch={setSearch} gender={gender} setGender={setGender} country={country} setCountry={setCountry} users={users}/>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-4">
        {filteredUsers.length===0 && <p className="text-center col-span-full text-gray-500 dark:text-gray-300">No users found</p>}
        {filteredUsers.map(u=><UserCard key={u.login.uuid} user={u}/>)}
      </div>
      {loading && <p className="text-center mt-4">Loading...</p>}
      <ScrollTopButton/>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById("root")).render(<App />);