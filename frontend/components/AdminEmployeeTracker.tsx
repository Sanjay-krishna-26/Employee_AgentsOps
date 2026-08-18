import React, { useState, useEffect } from "react";
import { 
  Clock, 
  Calendar as CalendarIcon, 
  Users, 
  AlertCircle, 
  CheckCircle2, 
  XCircle, 
  Info, 
  Plus, 
  Trash2, 
  Edit2, 
  Download, 
  TrendingUp, 
  Award, 
  CalendarOff,
  Filter,
  RefreshCw,
  Search,
  User as UserIcon,
  ChevronRight,
  X,
  HelpCircle
} from "lucide-react";
import { useTheme } from "./ThemeContext";
import { 
  User, 
  Holiday, 
  DailyTrackerItem, 
  WeeklyTrackerSummary, 
  MonthlyTrackerSummary, 
  YearlyTrackerSummary 
} from "../types";

interface AdminEmployeeTrackerProps {
  currentUser: User;
  employees: User[];
  onRefreshAll?: () => void;
}

export default function AdminEmployeeTracker({ currentUser, employees, onRefreshAll }: AdminEmployeeTrackerProps) {
  const { cardBg, cardHeaderBg, isDark } = useTheme();

  // Active view tab: "daily" | "weekly" | "monthly" | "yearly"
  const [viewMode, setViewMode] = useState<"daily" | "weekly" | "monthly" | "yearly">("daily");

  // Filter States
  const todayStr = new Date().toLocaleDateString("sv-SE"); // YYYY-MM-DD
  const currentMonthStr = todayStr.substring(0, 7); // YYYY-MM
  const currentYearStr = todayStr.substring(0, 4); // YYYY

  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthStr);
  const [selectedYear, setSelectedYear] = useState<string>(currentYearStr);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Data Loading States
  const [summaryData, setSummaryData] = useState<any>(null);
  const [dailyData, setDailyData] = useState<DailyTrackerItem[]>([]);
  const [weeklyData, setWeeklyData] = useState<WeeklyTrackerSummary[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyTrackerSummary[]>([]);
  const [yearlyData, setYearlyData] = useState<YearlyTrackerSummary[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // Modals State
  const [showHolidayModal, setShowHolidayModal] = useState<boolean>(false);
  const [showRulesModal, setShowRulesModal] = useState<boolean>(false);
  const [selectedEmployeeForDetail, setSelectedEmployeeForDetail] = useState<string | null>(null);
  const [employeeDetailData, setEmployeeDetailData] = useState<any>(null);
  const [loadingDetail, setLoadingDetail] = useState<boolean>(false);

  // Holiday Form State
  const [holidayDate, setHolidayDate] = useState("");
  const [holidayName, setHolidayName] = useState("");
  const [holidayType, setHolidayType] = useState<"National" | "Festival" | "Company" | "Other">("Company");
  const [holidayDesc, setHolidayDesc] = useState("");
  const [editingHolidayId, setEditingHolidayId] = useState<string | null>(null);
  const [holidayError, setHolidayError] = useState("");
  const [holidaySuccess, setHolidaySuccess] = useState("");
  const [savingHoliday, setSavingHoliday] = useState(false);

  // Fetch summary metrics
  const fetchSummary = async () => {
    try {
      const res = await fetch(`/api/employee-tracker/summary?date=${selectedDate}`);
      if (res.ok) {
        const data = await res.json();
        setSummaryData(data);
      }
    } catch (e) {
      console.error("Failed to load tracker summary:", e);
    }
  };

  // Fetch holidays
  const fetchHolidays = async () => {
    try {
      const res = await fetch("/api/employee-tracker/holidays");
      if (res.ok) {
        const data = await res.json();
        setHolidays(data);
      }
    } catch (e) {
      console.error("Failed to load holidays:", e);
    }
  };

  // Main data fetcher based on active view mode
  const fetchTrackerData = async () => {
    setLoading(true);
    try {
      fetchSummary();
      const empQuery = selectedEmployeeId !== "all" ? `&employeeId=${selectedEmployeeId}` : "";
      
      if (viewMode === "daily") {
        const res = await fetch(`/api/employee-tracker/daily?date=${selectedDate}${empQuery}`);
        if (res.ok) {
          const data = await res.json();
          setDailyData(data);
        }
      } else if (viewMode === "weekly") {
        const res = await fetch(`/api/employee-tracker/weekly?startDate=${selectedDate}${empQuery}`);
        if (res.ok) {
          const data = await res.json();
          setWeeklyData(data);
        }
      } else if (viewMode === "monthly") {
        const res = await fetch(`/api/employee-tracker/monthly?yearMonth=${selectedMonth}${empQuery}`);
        if (res.ok) {
          const data = await res.json();
          setMonthlyData(data);
        }
      } else if (viewMode === "yearly") {
        const res = await fetch(`/api/employee-tracker/yearly?year=${selectedYear}${empQuery}`);
        if (res.ok) {
          const data = await res.json();
          setYearlyData(data);
        }
      }
    } catch (e) {
      console.error("Failed to load tracker data:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHolidays();
  }, []);

  useEffect(() => {
    fetchTrackerData();
  }, [viewMode, selectedDate, selectedMonth, selectedYear, selectedEmployeeId]);

  // Fetch employee detail modal data
  const fetchEmployeeDetail = async (empId: string) => {
    setLoadingDetail(true);
    try {
      const res = await fetch(`/api/employee-tracker/employee/${empId}`);
      if (res.ok) {
        const data = await res.json();
        setEmployeeDetailData(data);
      }
    } catch (e) {
      console.error("Failed to load employee detail profile:", e);
    } finally {
      setLoadingDetail(false);
    }
  };

  const openEmployeeDetail = (empId: string) => {
    setSelectedEmployeeForDetail(empId);
    fetchEmployeeDetail(empId);
  };

  // Holiday CRUD Handlers
  const handleSaveHoliday = async (e: React.FormEvent) => {
    e.preventDefault();
    setHolidayError("");
    setHolidaySuccess("");

    if (!holidayDate || !holidayName.trim()) {
      setHolidayError("Holiday date and title are required.");
      return;
    }

    setSavingHoliday(true);
    try {
      const url = editingHolidayId 
        ? `/api/employee-tracker/holidays/${editingHolidayId}`
        : "/api/employee-tracker/holidays";
      const method = editingHolidayId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: holidayDate,
          name: holidayName.trim(),
          type: holidayType,
          description: holidayDesc.trim()
        })
      });

      if (res.ok) {
        setHolidaySuccess(editingHolidayId ? "Holiday updated successfully!" : "Holiday added successfully!");
        setHolidayDate("");
        setHolidayName("");
        setHolidayType("Company");
        setHolidayDesc("");
        setEditingHolidayId(null);
        fetchHolidays();
        fetchTrackerData();
      } else {
        const err = await res.json();
        setHolidayError(err.detail || "Failed to save holiday.");
      }
    } catch (e) {
      setHolidayError("Network error while saving holiday.");
    } finally {
      setSavingHoliday(false);
    }
  };

  const handleDeleteHoliday = async (id: string) => {
    if (!window.confirm("Are you sure you want to remove this holiday? Working-day evaluations will automatically update.")) return;
    try {
      const res = await fetch(`/api/employee-tracker/holidays/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchHolidays();
        fetchTrackerData();
      }
    } catch (e) {
      console.error("Failed to delete holiday:", e);
    }
  };

  const startEditHoliday = (h: Holiday) => {
    setEditingHolidayId(h.id);
    setHolidayDate(h.date);
    setHolidayName(h.name);
    setHolidayType(h.type);
    setHolidayDesc(h.description || "");
    setHolidayError("");
    setHolidaySuccess("");
  };

  // CSV Export Generator
  const exportCSV = () => {
    let csvContent = "";
    let filename = `Employee_Tracker_${viewMode}_${todayStr}.csv`;

    if (viewMode === "daily") {
      csvContent = "Employee Name,Date,Day,Check-In Time,Check-Out Time,Working Hours,Expected Hours,Difference,Late By (mins),Early Checkout (mins),Score,Status\n";
      dailyData.forEach(row => {
        csvContent += `"${row.employeeName}","${row.date}","${row.dayName}","${row.checkInTime || '--'}","${row.checkOutTime || '--'}","${row.totalWorkingFormatted}","8h 00m","${row.differenceFormatted}",${row.lateMinutes},${row.earlyCheckoutMinutes},${row.score},"${row.status}"\n`;
      });
    } else if (viewMode === "weekly") {
      csvContent = "Employee Name,Week Period,Expected Working Days,Evaluated Days,Present Days,Absent Days,Late Days,Early Checkouts,Total Working Hours,Avg Daily Hours,Weekly Score,Status\n";
      weeklyData.forEach(row => {
        csvContent += `"${row.employeeName}","${row.weekLabel}",${row.expectedWorkingDays},${row.evaluatedDays},${row.presentDays},${row.absentDays},${row.lateDays},${row.earlyCheckoutDays},"${row.totalWorkingFormatted}","${row.avgDailyWorkingFormatted}",${row.weeklyScore},"${row.status}"\n`;
      });
    } else if (viewMode === "monthly") {
      csvContent = "Employee Name,Month,Calendar Days,Weekend Days,Admin Holidays,Expected Working Days,Evaluated Days,Present Days,Absent Days,Late Days,Early Checkouts,Total Working Hours,Avg Daily Hours,Monthly Score,Status\n";
      monthlyData.forEach(row => {
        csvContent += `"${row.employeeName}","${row.monthLabel}",${row.calendarDays},${row.weekendDays},${row.holidayDays},${row.expectedWorkingDays},${row.evaluatedDays},${row.presentDays},${row.absentDays},${row.lateDays},${row.earlyCheckoutDays},"${row.totalWorkingFormatted}","${row.avgDailyWorkingFormatted}",${row.monthlyScore},"${row.status}"\n`;
      });
    } else if (viewMode === "yearly") {
      csvContent = "Employee Name,Year,Total Working Days,Admin Holidays,Evaluated Days,Present Days,Absent Days,Late Days,Early Checkouts,Total Working Hours,Avg Daily Hours,Yearly Score,Status\n";
      yearlyData.forEach(row => {
        csvContent += `"${row.employeeName}","${row.year}",${row.totalWorkingDays},${row.totalAdminHolidays},${row.totalEvaluatedDays},${row.totalPresentDays},${row.totalAbsentDays},${row.totalLateDays},${row.totalEarlyCheckouts},"${row.totalWorkingFormatted}","${row.avgDailyWorkingFormatted}",${row.yearlyScore},"${row.status}"\n`;
      });
    }

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper status color badges
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Excellent":
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">Excellent</span>;
      case "On Time":
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20">On Time</span>;
      case "Very Good":
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-teal-500/10 text-teal-500 border border-teal-500/20">Very Good</span>;
      case "Good":
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-cyan-500/10 text-cyan-500 border border-cyan-500/20">Good</span>;
      case "Late":
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20">Late Arrival</span>;
      case "Early Checkout":
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-orange-500/10 text-orange-500 border border-orange-500/20">Early Checkout</span>;
      case "Short Hours":
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-purple-500/10 text-purple-500 border border-purple-500/20">Short Hours</span>;
      case "Needs Improvement":
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-orange-500/10 text-orange-500 border border-orange-500/20">Needs Impv.</span>;
      case "Poor":
      case "Absent":
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-rose-500/10 text-rose-500 border border-rose-500/20">Absent</span>;
      case "Incomplete":
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">Incomplete</span>;
      case "Holiday":
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-500/10 text-slate-400 border border-slate-500/20">Holiday (Excluded)</span>;
      case "Weekend":
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-500/10 text-slate-400 border border-slate-500/20">Weekend (Excluded)</span>;
      default:
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-500/10 text-slate-400">{status}</span>;
    }
  };

  // Score Bar color
  const getScoreColor = (score: number) => {
    if (score >= 90) return "bg-emerald-500";
    if (score >= 80) return "bg-teal-500";
    if (score >= 70) return "bg-cyan-500";
    if (score >= 60) return "bg-amber-500";
    return "bg-rose-500";
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header & Overview Title */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">Employee Tracker</h1>
            <span className="px-2.5 py-0.5 text-xs font-medium bg-indigo-500/10 text-indigo-400 rounded-full border border-indigo-500/20">
              HR Performance Engine
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Monitor employee working schedules (10:00 AM – 6:00 PM), daily punctuality, duration compliance, and company holidays.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowRulesModal(true)}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-lg border border-slate-700 bg-slate-800/60 hover:bg-slate-700/60 text-slate-300 transition-colors"
          >
            <HelpCircle className="w-4 h-4 text-indigo-400" />
            Evaluation Rules
          </button>

          <button
            onClick={() => setShowHolidayModal(true)}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-lg border border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 transition-colors"
          >
            <CalendarOff className="w-4 h-4" />
            Manage Holidays ({holidays.length})
          </button>

          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors shadow-lg shadow-indigo-600/20"
          >
            <Download className="w-4 h-4" />
            Export CSV Report
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className={`p-4 rounded-xl border ${cardBg} backdrop-blur-sm space-y-1`}>
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Total Employees</span>
            <Users className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-2xl font-bold">{summaryData?.totalEmployees ?? employees.length}</p>
          <p className="text-[10px] text-slate-400 font-mono">Active Workforce</p>
        </div>

        <div className={`p-4 rounded-xl border ${cardBg} backdrop-blur-sm space-y-1`}>
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Working Today</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-emerald-400">{summaryData?.workingToday ?? 0}</p>
          <p className="text-[10px] text-slate-400 font-mono">Check-Ins Approved</p>
        </div>

        <div className={`p-4 rounded-xl border ${cardBg} backdrop-blur-sm space-y-1`}>
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Late Arrivals</span>
            <AlertCircle className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-bold text-amber-400">{summaryData?.lateToday ?? 0}</p>
          <p className="text-[10px] text-slate-400 font-mono">Past 10:00 AM</p>
        </div>

        <div className={`p-4 rounded-xl border ${cardBg} backdrop-blur-sm space-y-1`}>
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Absent Today</span>
            <XCircle className="w-4 h-4 text-rose-400" />
          </div>
          <p className="text-2xl font-bold text-rose-400">{summaryData?.absentToday ?? 0}</p>
          <p className="text-[10px] text-slate-400 font-mono">No Attendance Recorded</p>
        </div>

        <div className={`p-4 rounded-xl border ${cardBg} backdrop-blur-sm space-y-1`}>
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Avg Working Hours</span>
            <Clock className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-2xl font-bold text-cyan-400">{summaryData?.avgWorkingHoursFormatted ?? "0h 00m"}</p>
          <p className="text-[10px] text-slate-400 font-mono">Target: 8h 00m</p>
        </div>

        <div className={`p-4 rounded-xl border ${cardBg} backdrop-blur-sm space-y-1`}>
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Average Score</span>
            <Award className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-2xl font-bold text-indigo-400">{summaryData?.avgScore ?? 0}<span className="text-xs text-slate-400 font-normal">/100</span></p>
          <p className="text-[10px] text-slate-400 font-mono">Overall Rating</p>
        </div>
      </div>

      {/* Non-Working Day Note Banner if Today is Sat/Sun/Holiday */}
      {summaryData && !summaryData.isWorkingDayToday && (
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 flex-shrink-0 text-amber-400" />
            <span>
              <strong>Note:</strong> Today is a <strong>{summaryData.dayNote}</strong>. Weekend and Admin Holiday dates are excluded from working day score calculations and generate zero penalties.
            </span>
          </div>
        </div>
      )}

      {/* Controls & Filter Section */}
      <div className={`p-4 rounded-xl border ${cardBg} backdrop-blur-sm space-y-4`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-700/50 pb-4">
          {/* View Mode Switcher */}
          <div className="flex items-center gap-1 bg-slate-900/60 p-1 rounded-lg border border-slate-700/60 self-start">
            <button
              onClick={() => setViewMode("daily")}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                viewMode === "daily" ? "bg-indigo-600 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Daily View
            </button>
            <button
              onClick={() => setViewMode("weekly")}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                viewMode === "weekly" ? "bg-indigo-600 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Weekly View
            </button>
            <button
              onClick={() => setViewMode("monthly")}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                viewMode === "monthly" ? "bg-indigo-600 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Monthly View
            </button>
            <button
              onClick={() => setViewMode("yearly")}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                viewMode === "yearly" ? "bg-indigo-600 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Yearly View
            </button>
          </div>

          {/* Date / Month / Year Pickers */}
          <div className="flex flex-wrap items-center gap-3">
            {viewMode === "daily" && (
              <div className="flex items-center gap-2">
                <label className="text-xs text-slate-400 font-medium">Select Date:</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-3 py-1.5 text-xs rounded-lg border border-slate-700 bg-slate-900/60 text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>
            )}

            {viewMode === "weekly" && (
              <div className="flex items-center gap-2">
                <label className="text-xs text-slate-400 font-medium">Week Starting (Mon):</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-3 py-1.5 text-xs rounded-lg border border-slate-700 bg-slate-900/60 text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>
            )}

            {viewMode === "monthly" && (
              <div className="flex items-center gap-2">
                <label className="text-xs text-slate-400 font-medium">Select Month:</label>
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="px-3 py-1.5 text-xs rounded-lg border border-slate-700 bg-slate-900/60 text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>
            )}

            {viewMode === "yearly" && (
              <div className="flex items-center gap-2">
                <label className="text-xs text-slate-400 font-medium">Select Year:</label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="px-3 py-1.5 text-xs rounded-lg border border-slate-700 bg-slate-900/60 text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="2026">2026</option>
                  <option value="2025">2025</option>
                  <option value="2024">2024</option>
                </select>
              </div>
            )}

            {/* Employee Filter */}
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-400 font-medium">Employee:</label>
              <select
                value={selectedEmployeeId}
                onChange={(e) => setSelectedEmployeeId(e.target.value)}
                className="px-3 py-1.5 text-xs rounded-lg border border-slate-700 bg-slate-900/60 text-slate-200 focus:outline-none focus:border-indigo-500 min-w-[160px]"
              >
                <option value="all">All Employees ({employees.length})</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={fetchTrackerData}
              className="p-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Search query box */}
        <div className="relative max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search employee name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-700 bg-slate-900/60 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Main Table Container */}
      <div className={`rounded-xl border ${cardBg} backdrop-blur-sm overflow-hidden`}>
        {/* Daily View Table */}
        {viewMode === "daily" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className={`border-b border-slate-700/60 ${cardHeaderBg} text-slate-400 uppercase font-mono`}>
                <tr>
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Date / Day</th>
                  <th className="py-3 px-4">Check-In</th>
                  <th className="py-3 px-4">Check-Out</th>
                  <th className="py-3 px-4">Working Duration</th>
                  <th className="py-3 px-4">Difference</th>
                  <th className="py-3 px-4">Delays & Early</th>
                  <th className="py-3 px-4 text-center">Daily Score</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {dailyData.filter(d => d.employeeName.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-slate-500">
                      No daily employee tracker records found.
                    </td>
                  </tr>
                ) : (
                  dailyData
                    .filter(d => d.employeeName.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-3 px-4 font-semibold text-slate-200">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold text-xs border border-indigo-500/20">
                              {item.employeeName.charAt(0)}
                            </div>
                            <span>{item.employeeName}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-mono text-slate-300">{item.date}</div>
                          <div className="text-[10px] text-slate-500">{item.dayName}</div>
                        </td>
                        <td className="py-3 px-4 font-mono">
                          {item.checkInTime ? (
                            <span className={item.lateMinutes > 0 ? "text-amber-400 font-semibold" : "text-emerald-400"}>
                              {item.checkInTime}
                            </span>
                          ) : (
                            <span className="text-slate-500">--:--</span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-mono">
                          {item.checkOutTime ? (
                            <span className={item.earlyCheckoutMinutes > 0 ? "text-orange-400 font-semibold" : "text-emerald-400"}>
                              {item.checkOutTime}
                            </span>
                          ) : (
                            <span className="text-slate-500">--:--</span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-mono font-semibold text-slate-200">
                          {item.totalWorkingFormatted}
                          <span className="text-[10px] text-slate-500 block font-normal">Expected: 8h 00m</span>
                        </td>
                        <td className="py-3 px-4 font-mono">
                          <span className={item.differenceMinutes >= 0 ? "text-emerald-400" : "text-rose-400"}>
                            {item.differenceFormatted}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {item.lateMinutes > 0 && (
                            <div className="text-amber-400 text-[11px] font-mono">Late: +{item.lateMinutes}m</div>
                          )}
                          {item.earlyCheckoutMinutes > 0 && (
                            <div className="text-orange-400 text-[11px] font-mono">Early: -{item.earlyCheckoutMinutes}m</div>
                          )}
                          {item.lateMinutes === 0 && item.earlyCheckoutMinutes === 0 && item.isWorkingDay && (
                            <div className="text-slate-500 text-[11px]">On Time</div>
                          )}
                          {!item.isWorkingDay && (
                            <div className="text-slate-500 text-[11px]">Exempted</div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {item.isWorkingDay ? (
                            <div className="space-y-1 inline-block">
                              <span className="font-bold text-sm text-indigo-400 font-mono">{item.score}</span>
                              <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                <div className={`h-full ${getScoreColor(item.score)}`} style={{ width: `${item.score}%` }} />
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-500 font-mono">N/A</span>
                          )}
                        </td>
                        <td className="py-3 px-4">{getStatusBadge(item.status)}</td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => openEmployeeDetail(item.employeeId)}
                            className="p-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 text-indigo-400 hover:text-indigo-300 transition-colors"
                            title="View Employee Detail Profile"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Weekly View Table */}
        {viewMode === "weekly" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className={`border-b border-slate-700/60 ${cardHeaderBg} text-slate-400 uppercase font-mono`}>
                <tr>
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Week Period</th>
                  <th className="py-3 px-4 text-center">Expected Days</th>
                  <th className="py-3 px-4 text-center">Present</th>
                  <th className="py-3 px-4 text-center">Absent</th>
                  <th className="py-3 px-4 text-center">Late Days</th>
                  <th className="py-3 px-4">Total Hours</th>
                  <th className="py-3 px-4">Avg Daily Hours</th>
                  <th className="py-3 px-4 text-center">Weekly Score</th>
                  <th className="py-3 px-4">Weekly Rating</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {weeklyData.filter(d => d.employeeName.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 ? (
                  <tr>
                    <td colSpan={11} className="py-8 text-center text-slate-500">
                      No weekly aggregation records found.
                    </td>
                  </tr>
                ) : (
                  weeklyData
                    .filter(d => d.employeeName.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-3 px-4 font-semibold text-slate-200">{item.employeeName}</td>
                        <td className="py-3 px-4 font-mono text-slate-300">{item.weekLabel}</td>
                        <td className="py-3 px-4 text-center font-mono">{item.expectedWorkingDays} Days</td>
                        <td className="py-3 px-4 text-center font-mono font-semibold text-emerald-400">{item.presentDays}</td>
                        <td className="py-3 px-4 text-center font-mono text-rose-400">{item.absentDays}</td>
                        <td className="py-3 px-4 text-center font-mono text-amber-400">{item.lateDays}</td>
                        <td className="py-3 px-4 font-mono font-semibold text-slate-200">{item.totalWorkingFormatted}</td>
                        <td className="py-3 px-4 font-mono text-slate-300">{item.avgDailyWorkingFormatted}</td>
                        <td className="py-3 px-4 text-center font-mono font-bold text-indigo-400">{item.weeklyScore}/100</td>
                        <td className="py-3 px-4">{getStatusBadge(item.status)}</td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => openEmployeeDetail(item.employeeId)}
                            className="p-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 text-indigo-400 transition-colors"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Monthly View Table */}
        {viewMode === "monthly" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className={`border-b border-slate-700/60 ${cardHeaderBg} text-slate-400 uppercase font-mono`}>
                <tr>
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Month</th>
                  <th className="py-3 px-4 text-center">Calendar Days</th>
                  <th className="py-3 px-4 text-center">Weekends & Holidays</th>
                  <th className="py-3 px-4 text-center">Expected Working</th>
                  <th className="py-3 px-4 text-center">Present / Absent</th>
                  <th className="py-3 px-4">Total Working Hours</th>
                  <th className="py-3 px-4">Avg Daily Hours</th>
                  <th className="py-3 px-4 text-center">Monthly Score</th>
                  <th className="py-3 px-4">Rating</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {monthlyData.filter(d => d.employeeName.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 ? (
                  <tr>
                    <td colSpan={11} className="py-8 text-center text-slate-500">
                      No monthly aggregation records found.
                    </td>
                  </tr>
                ) : (
                  monthlyData
                    .filter(d => d.employeeName.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-3 px-4 font-semibold text-slate-200">{item.employeeName}</td>
                        <td className="py-3 px-4 font-mono text-slate-300">{item.monthLabel}</td>
                        <td className="py-3 px-4 text-center font-mono">{item.calendarDays} Days</td>
                        <td className="py-3 px-4 text-center font-mono text-slate-400">
                          {item.weekendDays} Sat/Sun + {item.holidayDays} Hol
                        </td>
                        <td className="py-3 px-4 text-center font-mono font-semibold text-indigo-400">{item.expectedWorkingDays} Days</td>
                        <td className="py-3 px-4 text-center font-mono">
                          <span className="text-emerald-400 font-semibold">{item.presentDays} P</span> / <span className="text-rose-400">{item.absentDays} A</span>
                        </td>
                        <td className="py-3 px-4 font-mono font-semibold text-slate-200">{item.totalWorkingFormatted}</td>
                        <td className="py-3 px-4 font-mono text-slate-300">{item.avgDailyWorkingFormatted}</td>
                        <td className="py-3 px-4 text-center font-mono font-bold text-indigo-400">{item.monthlyScore}/100</td>
                        <td className="py-3 px-4">{getStatusBadge(item.status)}</td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => openEmployeeDetail(item.employeeId)}
                            className="p-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 text-indigo-400 transition-colors"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Yearly View Table */}
        {viewMode === "yearly" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className={`border-b border-slate-700/60 ${cardHeaderBg} text-slate-400 uppercase font-mono`}>
                <tr>
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Year</th>
                  <th className="py-3 px-4 text-center">Working Days</th>
                  <th className="py-3 px-4 text-center">Admin Holidays</th>
                  <th className="py-3 px-4 text-center">Present Days</th>
                  <th className="py-3 px-4 text-center">Absent Days</th>
                  <th className="py-3 px-4">Total Hours</th>
                  <th className="py-3 px-4">Avg Daily Hours</th>
                  <th className="py-3 px-4 text-center">Yearly Score</th>
                  <th className="py-3 px-4">Yearly Rating</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {yearlyData.filter(d => d.employeeName.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 ? (
                  <tr>
                    <td colSpan={11} className="py-8 text-center text-slate-500">
                      No yearly aggregation records found.
                    </td>
                  </tr>
                ) : (
                  yearlyData
                    .filter(d => d.employeeName.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-3 px-4 font-semibold text-slate-200">{item.employeeName}</td>
                        <td className="py-3 px-4 font-mono text-slate-300">{item.year}</td>
                        <td className="py-3 px-4 text-center font-mono">{item.totalWorkingDays} Days</td>
                        <td className="py-3 px-4 text-center font-mono text-slate-400">{item.totalAdminHolidays} Holidays</td>
                        <td className="py-3 px-4 text-center font-mono font-semibold text-emerald-400">{item.totalPresentDays}</td>
                        <td className="py-3 px-4 text-center font-mono text-rose-400">{item.totalAbsentDays}</td>
                        <td className="py-3 px-4 font-mono font-semibold text-slate-200">{item.totalWorkingFormatted}</td>
                        <td className="py-3 px-4 font-mono text-slate-300">{item.avgDailyWorkingFormatted}</td>
                        <td className="py-3 px-4 text-center font-mono font-bold text-indigo-400">{item.yearlyScore}/100</td>
                        <td className="py-3 px-4">{getStatusBadge(item.status)}</td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => openEmployeeDetail(item.employeeId)}
                            className="p-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 text-indigo-400 transition-colors"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL 1: Holiday Management Drawer / Modal */}
      {showHolidayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className={`w-full max-w-2xl rounded-2xl border ${cardBg} shadow-2xl p-6 space-y-6 max-h-[90vh] overflow-y-auto`}>
            <div className="flex items-center justify-between border-b border-slate-700/60 pb-4">
              <div className="flex items-center gap-2.5">
                <CalendarOff className="w-5 h-5 text-indigo-400" />
                <h2 className="text-lg font-bold">Holiday Management Registry</h2>
              </div>
              <button
                onClick={() => setShowHolidayModal(false)}
                className="p-1 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Holiday Form */}
            <form onSubmit={handleSaveHoliday} className="p-4 rounded-xl bg-slate-900/60 border border-slate-700/60 space-y-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                {editingHolidayId ? "Edit Holiday Record" : "Add New Declared Holiday"}
              </h3>

              {holidayError && (
                <div className="p-3 text-xs rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400">
                  {holidayError}
                </div>
              )}
              {holidaySuccess && (
                <div className="p-3 text-xs rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  {holidaySuccess}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">Holiday Date *</label>
                  <input
                    type="date"
                    required
                    value={holidayDate}
                    onChange={(e) => setHolidayDate(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-700 bg-slate-950 text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">Holiday Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Independence Day"
                    value={holidayName}
                    onChange={(e) => setHolidayName(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-700 bg-slate-950 text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">Category / Type</label>
                  <select
                    value={holidayType}
                    onChange={(e) => setHolidayType(e.target.value as any)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-700 bg-slate-950 text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="National">National Holiday</option>
                    <option value="Festival">Festival Holiday</option>
                    <option value="Company">Company Holiday</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Reason / Description</label>
                <input
                  type="text"
                  placeholder="e.g. Official Organization Holiday"
                  value={holidayDesc}
                  onChange={(e) => setHolidayDesc(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-700 bg-slate-950 text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                {editingHolidayId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingHolidayId(null);
                      setHolidayDate("");
                      setHolidayName("");
                      setHolidayDesc("");
                    }}
                    className="px-3 py-1.5 text-xs rounded-lg border border-slate-700 text-slate-400 hover:bg-slate-800"
                  >
                    Cancel Edit
                  </button>
                )}
                <button
                  type="submit"
                  disabled={savingHoliday}
                  className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  {savingHoliday ? "Saving..." : editingHolidayId ? "Update Holiday" : "Add Holiday"}
                </button>
              </div>
            </form>

            {/* List of Holidays */}
            <div className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Declared Organization Holidays ({holidays.length})
              </h3>
              <div className="border border-slate-700/60 rounded-xl overflow-hidden divide-y divide-slate-800/60">
                {holidays.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500">
                    No custom holidays declared yet.
                  </div>
                ) : (
                  holidays.map((h) => (
                    <div key={h.id} className="p-3.5 flex items-center justify-between hover:bg-slate-800/30 transition-colors">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-indigo-400">{h.date}</span>
                          <span className="font-semibold text-xs text-slate-200">{h.name}</span>
                          <span className="px-2 py-0.5 text-[10px] rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                            {h.type}
                          </span>
                        </div>
                        {h.description && (
                          <p className="text-[11px] text-slate-400">{h.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => startEditHoliday(h)}
                          className="p-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-300 transition-colors"
                          title="Edit Holiday"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteHoliday(h.id)}
                          className="p-1.5 rounded-lg border border-rose-500/30 hover:bg-rose-500/10 text-rose-400 transition-colors"
                          title="Delete Holiday"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Evaluation Rules Information Dialog */}
      {showRulesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className={`w-full max-w-xl rounded-2xl border ${cardBg} shadow-2xl p-6 space-y-6`}>
            <div className="flex items-center justify-between border-b border-slate-700/60 pb-4">
              <div className="flex items-center gap-2.5">
                <HelpCircle className="w-5 h-5 text-indigo-400" />
                <h2 className="text-lg font-bold">Employee Evaluation & Scoring Rules</h2>
              </div>
              <button
                onClick={() => setShowRulesModal(false)}
                className="p-1 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
              <div className="p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300">
                <strong>Official Work Schedule:</strong> 10:00 AM to 6:00 PM (Expected Duration: 8 Hours). Working days are Monday through Friday.
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-white uppercase tracking-wider text-[11px]">Normalized 0–100 Daily Scoring System:</h3>
                
                <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between font-semibold text-slate-200">
                    <span>1. Check-In Punctuality</span>
                    <span className="text-indigo-400">Max 30 Points</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    • Full 30 pts if check-in occurs at or before 10:00 AM.<br />
                    • Deducts 0.5 pts per minute of delay after 10:00 AM.
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between font-semibold text-slate-200">
                    <span>2. Working Duration Compliance</span>
                    <span className="text-indigo-400">Max 50 Points</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    • Proportional points based on actual working hours relative to 8 hours.<br />
                    • Full 50 pts awarded for completing 8 hours (480 minutes).
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between font-semibold text-slate-200">
                    <span>3. Check-Out Punctuality</span>
                    <span className="text-indigo-400">Max 20 Points</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    • Full 20 pts if check-out occurs at or after 6:00 PM.<br />
                    • Deducts 0.5 pts per minute of early checkout before 6:00 PM.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
                <strong>Strict Non-Penalization Rule:</strong> Saturdays, Sundays, and Admin-declared Holidays are <strong>never</strong> evaluated as working days. They are excluded from attendance percentages and score calculations with zero penalty.
              </div>

              <div className="space-y-1">
                <h3 className="font-semibold text-white uppercase tracking-wider text-[11px]">Performance Classification Ratings:</h3>
                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                  <div className="p-2 rounded bg-slate-900/60 border border-slate-800">90 – 100 : Excellent</div>
                  <div className="p-2 rounded bg-slate-900/60 border border-slate-800">80 – 89 : Very Good</div>
                  <div className="p-2 rounded bg-slate-900/60 border border-slate-800">70 – 79 : Good</div>
                  <div className="p-2 rounded bg-slate-900/60 border border-slate-800">60 – 69 : Needs Improvement</div>
                  <div className="p-2 col-span-2 rounded bg-slate-900/60 border border-slate-800">Below 60 : Poor / Absent</div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowRulesModal(false)}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Employee Detail Drawer / Modal */}
      {selectedEmployeeForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className={`w-full max-w-3xl rounded-2xl border ${cardBg} shadow-2xl p-6 space-y-6 max-h-[90vh] overflow-y-auto`}>
            <div className="flex items-center justify-between border-b border-slate-700/60 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-base shadow-lg shadow-indigo-600/30">
                  {employeeDetailData?.employee?.name?.charAt(0) || "E"}
                </div>
                <div>
                  <h2 className="text-lg font-bold">{employeeDetailData?.employee?.name}</h2>
                  <p className="text-xs text-slate-400">{employeeDetailData?.employee?.email} • {employeeDetailData?.employee?.mobile}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedEmployeeForDetail(null)}
                className="p-1 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {loadingDetail ? (
              <div className="py-12 text-center text-xs text-slate-400 space-y-2">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto text-indigo-400" />
                <p>Loading employee performance profile...</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Employee KPI Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                    <span className="text-[11px] text-slate-400 block font-medium">Evaluated Days</span>
                    <span className="text-xl font-bold text-slate-200">{employeeDetailData?.summary?.evaluatedDays} Days</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                    <span className="text-[11px] text-slate-400 block font-medium">Present vs Absent</span>
                    <span className="text-xl font-bold text-emerald-400">{employeeDetailData?.summary?.presentDays} P <span className="text-rose-400 font-normal text-sm">/ {employeeDetailData?.summary?.absentDays} A</span></span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                    <span className="text-[11px] text-slate-400 block font-medium">Avg Working Hours</span>
                    <span className="text-xl font-bold text-cyan-400">{employeeDetailData?.summary?.avgWorkingHoursFormatted}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                    <span className="text-[11px] text-slate-400 block font-medium">30-Day Score</span>
                    <span className="text-xl font-bold text-indigo-400">{employeeDetailData?.summary?.overallScore}/100</span>
                  </div>
                </div>

                {/* 30-Day Performance History Table */}
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Past 30 Days Evaluation Log
                  </h3>
                  <div className="border border-slate-700/60 rounded-xl overflow-hidden max-h-72 overflow-y-auto">
                    <table className="w-full text-left text-xs">
                      <thead className={`border-b border-slate-700/60 ${cardHeaderBg} text-slate-400 uppercase font-mono sticky top-0`}>
                        <tr>
                          <th className="py-2.5 px-3">Date / Day</th>
                          <th className="py-2.5 px-3">Check-In</th>
                          <th className="py-2.5 px-3">Check-Out</th>
                          <th className="py-2.5 px-3">Duration</th>
                          <th className="py-2.5 px-3 text-center">Score</th>
                          <th className="py-2.5 px-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {employeeDetailData?.dailyEvaluations?.map((item: DailyTrackerItem, idx: number) => (
                          <tr key={idx} className="hover:bg-slate-800/30">
                            <td className="py-2.5 px-3 font-mono">
                              {item.date} <span className="text-[10px] text-slate-500">({item.dayName.substring(0, 3)})</span>
                            </td>
                            <td className="py-2.5 px-3 font-mono text-slate-300">{item.checkInTime || "--:--"}</td>
                            <td className="py-2.5 px-3 font-mono text-slate-300">{item.checkOutTime || "--:--"}</td>
                            <td className="py-2.5 px-3 font-mono font-semibold text-slate-200">{item.totalWorkingFormatted}</td>
                            <td className="py-2.5 px-3 text-center font-mono font-bold text-indigo-400">
                              {item.isWorkingDay ? item.score : "N/A"}
                            </td>
                            <td className="py-2.5 px-3">{getStatusBadge(item.status)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
