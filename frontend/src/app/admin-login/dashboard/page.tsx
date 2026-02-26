"use client";
import { useState } from "react";
import { Search, ChevronDown, FileDown, Plus } from "lucide-react";

type ApplicantStatus = "New" | "Review" | "Shortlisted";

type StatItem = {
  title: string;
  value: string;
  change: string;
  color: string;
};

type Applicant = {
  id: number;
  name: string;
  email: string;
  edu: string;
  exp: string;
  course: string;
  status: ApplicantStatus;
  date: string;
  color: string;
};

const stats: StatItem[] = [
  { title: "Total Applications", value: "1,247", change: "+12% from last month", color: "border-purple-400" },
  { title: "This Week", value: "48", change: "+8% from last week", color: "border-blue-400" },
  { title: "Shortlisted", value: "156", change: "+23% increase", color: "border-green-400" },
  { title: "Pending Review", value: "89", change: "Needs attention", color: "border-orange-400" },
];

const applicantsData: Applicant[] = [
  { id: 1, name: "Tanaka Yuki", email: "tanaka.yuki@email.com", edu: "Master's", exp: "5 years", course: "JLPT N2", status: "New", date: "Jan 8, 2026", color: "bg-purple-500" },
  { id: 2, name: "Suzuki Ken", email: "s.ken@email.com", edu: "Bachelor's", exp: "3 years", course: "JLPT N3", status: "Review", date: "Jan 7, 2026", color: "bg-pink-500" },
  { id: 3, name: "Mori Hana", email: "mori.hana@email.com", edu: "Doctorate", exp: "8 years", course: "Business", status: "Shortlisted", date: "Jan 6, 2026", color: "bg-green-500" },
];

export default function AdminDashboard() {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<number[]>([]);

  const toggle = (id: number) => {
    setSelected((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]);
  };

  const toggleAll = () => {
    if (selected.length === applicantsData.length) setSelected([]);
    else setSelected(applicantsData.map((a) => a.id));
  };

  return (
    <div className="min-h-screen bg-gray-50 text-black">
      <div className="max-w-7xl mx-auto p-8">
        <Header />

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
          {stats.map((s) => (
            <StatCard key={s.title} {...s} />
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col lg:flex-row gap-4 mt-8 items-start lg:items-center justify-between">
          <div className="relative w-full lg:w-1/2">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email..."
              className="w-full border rounded-lg pl-9 pr-4 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>

          <div className="flex gap-3 items-center">
            <Select label="All Status" />
            <Select label="All Courses" />
            <Select label="All Education" />
            <span className="text-sm text-black">{selected.length} selected</span>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow mt-8 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="text-black border-b bg-gray-50">
              <tr>
                <th className="px-6">
                  <input type="checkbox" checked={selected.length === applicantsData.length} onChange={toggleAll} />
                </th>
                <th className="py-4 text-left">Applicant</th>
                <th>Education</th>
                <th>Experience</th>
                <th>Course</th>
                <th>Status</th>
                <th>Date</th>
                <th></th>
              </tr>
            </thead>

            <tbody>
              {applicantsData.map((a) => (
                <Row key={a.id} data={a} checked={selected.includes(a.id)} toggle={toggle} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Header() {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold">Applicant Dashboard</h1>
        <p className="text-black mt-1">Track and manage all applications</p>
      </div>

      <div className="flex gap-3">
        <button className="border rounded-lg px-4 py-2 bg-white hover:bg-gray-100 flex items-center gap-2">
          <FileDown size={16} /> Export CSV
        </button>
        <button className="bg-indigo-500 text-white px-5 py-2 rounded-lg hover:bg-indigo-600 flex items-center gap-2">
          <Plus size={16} /> Add Applicant
        </button>
      </div>
    </div>
  );
}

function StatCard({ title, value, change, color }: StatItem) {
  return (
    <div className={`bg-white rounded-2xl p-6 shadow border-l-4 ${color}`}>
      <p className="text-black text-sm">{title}</p>
      <h2 className="text-3xl font-bold mt-2">{value}</h2>
      <p className="text-black text-sm mt-2">{change}</p>
    </div>
  );
}

function Row({
  data,
  checked,
  toggle,
}: {
  data: Applicant;
  checked: boolean;
  toggle: (id: number) => void;
}) {
  const { id, name, email, edu, exp, course, status, date, color } = data;
  return (
    <tr className="border-b last:border-0 hover:bg-gray-50">
      <td className="px-6">
        <input type="checkbox" checked={checked} onChange={() => toggle(id)} />
      </td>
      <td className="py-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg text-white flex items-center justify-center font-semibold ${color}`}>
            {name.split(" ").map((n) => n[0]).join("")}
          </div>
          <div>
            <p className="font-medium">{name}</p>
            <p className="text-black text-xs">{email}</p>
          </div>
        </div>
      </td>
      <td>{edu}</td>
      <td>{exp}</td>
      <td>
        <span className="bg-indigo-100 text-black px-3 py-1 rounded-full text-xs">{course}</span>
      </td>
      <td><StatusBadge status={status} /></td>
      <td>{date}</td>
      <td className="pr-6">
        <button className="border rounded-lg px-4 py-1.5 hover:bg-gray-100">View</button>
      </td>
    </tr>
  );
}

function StatusBadge({ status }: { status: ApplicantStatus }) {
  const map: Record<ApplicantStatus, string> = {
    New: "bg-blue-100 text-black",
    Review: "bg-yellow-100 text-black",
    Shortlisted: "bg-green-100 text-black",
  };
  return <span className={`px-3 py-1 rounded-full text-xs font-medium ${map[status] || "bg-gray-100 text-black"}`}>{status}</span>;
}

function Select({ label }: { label: string }) {
  return (
    <button className="border rounded-lg px-4 py-2 bg-white text-black flex items-center gap-2">
      {label} <ChevronDown size={16} />
    </button>
  );
}
