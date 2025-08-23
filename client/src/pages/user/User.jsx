import {
  CalendarToday,
  PermIdentity,
  PhoneAndroid,
  Work,
  AccountCircle,
  Edit,
  Save,
  Cancel,
  Person,
  FitnessCenter,
  Height,
  MonitorWeight,
  SportsGymnastics,
  AccessTime,
  Payment,
  Schedule,
} from "@mui/icons-material";
import { Link, useParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import "./user.css";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";
const ROLE_HE2EN = { "מתאמן": "trainee", "מאמן": "trainer", "מנהל": "admin", "": null };
const ROLE_EN2HE = { trainee: "מתאמן", trainer: "מאמן", admin: "מנהל", null: "" };
const GENDER_HE2EN = { "זכר": "male", "נקבה": "female", "": null };
const GENDER_EN2HE = { male: "זכר", female: "נקבה", null: "" };

export default function User() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState("");

  const [original, setOriginal] = useState(null);
  const [userForm, setUserForm] = useState({
    id: null,
    username: "",
    phone: "",
    birth_date: "",
    role: "",
    gender: "",
    // bodydetails
    weight: "",
    height: "",
    body_fat: "",
    muscle_mass: "",
    circumference: "",
    recorded_at: "",
    // subscriptions
    start_date: "",
    end_date: "",
    payment_status: "pending",
  });

  // ===== LOAD =====
  useEffect(() => {
    let ignore = false;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`${API_BASE}/U/users/${id}?expand=1`);
        const json = await res.json().catch(() => ({}));

        if (!res.ok || !json?.success) {
          throw new Error(json?.message || `שגיאה בטעינה (${res.status})`);
        }

        const u = json.data?.user || {};
        const b = json.data?.bodydetails || null;
        const s = json.data?.subscription || null;

        const filled = {
          id: u.id ?? null,
          username: u.username ?? "",
          phone: u.phone ?? "",
          birth_date: u.birth_date ?? "",                   // YYYY-MM-DD (input type=date)
          role: ROLE_EN2HE[u.role || null] ?? "",
          gender: GENDER_EN2HE[u.gender || null] ?? "",
          weight: b?.weight ?? "",
          height: b?.height ?? "",
          body_fat: b?.body_fat ?? "",
          muscle_mass: b?.muscle_mass ?? "",
          circumference: b?.circumference ?? "",
          recorded_at: b?.recorded_at ?? "",               // YYYY-MM-DD
          start_date: s?.start_date ?? "",                 // YYYY-MM-DD
          end_date: s?.end_date ?? "",                     // YYYY-MM-DD
          payment_status: s?.payment_status ?? "pending",
        };

        if (!ignore) {
          setUserForm(filled);
          setOriginal(filled);
        }
      } catch (e) {
        if (!ignore) setError(e.message || "שגיאת שרת");
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    if (id) load();
    else {
      setError("לא סופק מזהה משתמש");
      setLoading(false);
    }

    return () => { ignore = true; };
  }, [id]);

  const handleInputChange = (field, value) => {
    setUserForm((prev) => ({ ...prev, [field]: value }));
  };

  // ===== Helpers =====
  const toNullOrNumber = (v) => (v === "" || v === null || v === undefined ? null : Number(v));
  const toNullOrISO = (v) => (v === "" || v === null || v === undefined ? null : v);

  const calculateBMI = useMemo(() => {
    const h = Number(userForm.height);
    const w = Number(userForm.weight);
    if (h && w) {
      const m = h / 100;
      return (w / (m * m)).toFixed(1);
    }
    return "לא מחושב";
  }, [userForm.height, userForm.weight]);

  const getSubscriptionStatus = () => {
    if (!userForm.end_date) return "לא פעיל";
    const today = new Date();
    const endDate = new Date(userForm.end_date);
    return endDate > today ? "פעיל" : "פג תוקף";
  };

  const getPaymentStatusText = () => {
    const statusMap = { pending: "ממתין", paid: "שולם", failed: "נכשל" };
    return statusMap[userForm.payment_status] || "לא ידוע";
  };

  // ===== SAVE (diff-only) =====
  const handleSave = async () => {
    setError("");
    if (!original) return;

    const changed = {};
    const addIfChanged = (key, transform = (v) => v) => {
      const cur = userForm[key];
      const orig = original?.[key] ?? "";
      // השוואה טקסטואלית כדי למנוע false positives במספרים
      if (String(cur ?? "") !== String(orig ?? "")) {
        const val = transform(cur);
        changed[key] = val;
      }
    };

    // users
    addIfChanged("username");
    addIfChanged("phone");
    addIfChanged("birth_date", toNullOrISO);
    addIfChanged("role", (he) => (he ? (ROLE_HE2EN[he] ?? null) : null));
    addIfChanged("gender", (he) => (he ? (GENDER_HE2EN[he] ?? null) : null));

    // bodydetails (כל שדה שונה -> נשלח; ריק == null)
    addIfChanged("weight", toNullOrNumber);
    addIfChanged("height", toNullOrNumber);
    addIfChanged("body_fat", toNullOrNumber);
    addIfChanged("muscle_mass", toNullOrNumber);
    addIfChanged("circumference", toNullOrNumber);
    addIfChanged("recorded_at", toNullOrISO);

    // subscription
    addIfChanged("start_date", toNullOrISO);
    addIfChanged("end_date", toNullOrISO);
    addIfChanged("payment_status");

    if (Object.keys(changed).length === 0) {
      setIsEditing(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/U/users/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(changed),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok || j?.success === false) {
        throw new Error(j?.message || `עדכון נכשל (${res.status})`);
      }

      // רענון אחרי שמירה
      const afterRes = await fetch(`${API_BASE}/U/users/${id}?expand=1`);
      const after = await afterRes.json().catch(() => ({}));
      if (!afterRes.ok || !after?.success) {
        throw new Error(after?.message || `שגיאה ברענון (${afterRes.status})`);
      }

      const u = after?.data?.user || {};
      const b = after?.data?.bodydetails || null;
      const s = after?.data?.subscription || null;

      const refreshed = {
        id: u.id ?? null,
        username: u.username ?? "",
        phone: u.phone ?? "",
        birth_date: u.birth_date ?? "",
        role: ROLE_EN2HE[u.role || null] ?? "",
        gender: GENDER_EN2HE[u.gender || null] ?? "",
        weight: b?.weight ?? "",
        height: b?.height ?? "",
        body_fat: b?.body_fat ?? "",
        muscle_mass: b?.muscle_mass ?? "",
        circumference: b?.circumference ?? "",
        recorded_at: b?.recorded_at ?? "",
        start_date: s?.start_date ?? "",
        end_date: s?.end_date ?? "",
        payment_status: s?.payment_status ?? "pending",
      };

      setUserForm(refreshed);
      setOriginal(refreshed);
      setIsEditing(false);
    } catch (e) {
      setError(e.message || "שגיאת שרת בעת עדכון");
    }
  };

  const handleCancel = () => {
    setUserForm(original || userForm);
    setIsEditing(false);
  };

  if (loading) return <div className="user"><p>טוען…</p></div>;
  if (error)   return <div className="user"><p style={{color:"#d33"}}>שגיאה: {error}</p></div>;

  return (
    <div className="user">
      <div className="userTitleContainer">
        <h1 className="userTitle">עריכת משתמש</h1>
        <div className="userActions">
          <Link to="/newUser">
            <button className="userAddButton">
              <AccountCircle /> הוספת משתמש
            </button>
          </Link>
          <button className="editButton" onClick={() => setIsEditing(!isEditing)}>
            <Edit fontSize="small" />
          </button>
        </div>
      </div>

      <div className="userContainer">
        {/* תצוגה */}
        <div className="userShow">
          <div className="userShowHeader">
            <div className="userShowTop">
              <div className="userShowAvatar">
                <FitnessCenter sx={{ fontSize: 60, color: "#667eea" }} />
              </div>
              <div className="userShowTopTitle">
                <span className="userShowUsername">{userForm.username}</span>
                <span className="userShowUserTitle">{userForm.role}</span>
              </div>
            </div>
          </div>

          <div className="userShowBottom">
            <div className="userShowSection">
              <span className="userShowTitle">פרטי חשבון</span>
              <div className="userShowInfo">
                <PermIdentity className="userShowIcon" />
                <span className="userShowInfoTitle">מזהה: {userForm.id}</span>
              </div>
              <div className="userShowInfo">
                <AccountCircle className="userShowIcon" />
                <span className="userShowInfoTitle">{userForm.username}</span>
              </div>
              <div className="userShowInfo">
                <Work className="userShowIcon" />
                <span className="userShowInfoTitle">{userForm.role}</span>
              </div>
            </div>

            <div className="userShowSection">
              <span className="userShowTitle">פרטים אישיים</span>
              <div className="userShowInfo">
                <PhoneAndroid className="userShowIcon" />
                <span className="userShowInfoTitle">{userForm.phone}</span>
              </div>
              <div className="userShowInfo">
                <CalendarToday className="userShowIcon" />
                <span className="userShowInfoTitle">{userForm.birth_date}</span>
              </div>
              <div className="userShowInfo">
                <Person className="userShowIcon" />
                <span className="userShowInfoTitle">{userForm.gender}</span>
              </div>
            </div>

            <div className="userShowSection">
              <span className="userShowTitle">מדדי גוף</span>
              <div className="userShowInfo">
                <Height className="userShowIcon" />
                <span className="userShowInfoTitle">גובה: {userForm.height} ס"מ</span>
              </div>
              <div className="userShowInfo">
                <MonitorWeight className="userShowIcon" />
                <span className="userShowInfoTitle">משקל: {userForm.weight} ק"ג</span>
              </div>
              <div className="userShowInfo">
                <SportsGymnastics className="userShowIcon" />
                <span className="userShowInfoTitle">BMI: {calculateBMI}</span>
              </div>
              <div className="userShowInfo">
                <FitnessCenter className="userShowIcon" />
                <span className="userShowInfoTitle">שומן: {userForm.body_fat}%</span>
              </div>
              <div className="userShowInfo">
                <AccessTime className="userShowIcon" />
                <span className="userShowInfoTitle">תאריך מדידה: {userForm.recorded_at || "—"}</span>
              </div>
            </div>

            <div className="userShowSection">
              <span className="userShowTitle">מנוי</span>
              <div className="userShowInfo">
                <Schedule className="userShowIcon" />
                <span className="userShowInfoTitle">סטטוס: {getSubscriptionStatus()}</span>
              </div>
              <div className="userShowInfo">
                <Payment className="userShowIcon" />
                <span className="userShowInfoTitle">תשלום: {getPaymentStatusText()}</span>
              </div>
              <div className="userShowInfo">
                <AccessTime className="userShowIcon" />
                <span className="userShowInfoTitle">עד: {userForm.end_date || "—"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* טופס עריכה */}
        {isEditing && (
          <div className="userUpdate">
            <div className="userUpdateHeader">
              <h3 className="userUpdateTitle">עדכון פרטי חבר</h3>
            </div>
            <form className="userUpdateForm" onSubmit={(e) => e.preventDefault()}>
              <div className="userUpdateSections">
                {/* חשבון */}
                <div className="userUpdateSection">
                  <h4 className="sectionTitle">פרטי חשבון</h4>
                  <div className="userUpdateRow">
                    <div className="userUpdateItem">
                      <label>שם משתמש</label>
                      <input
                        type="text"
                        value={userForm.username}
                        onChange={(e) => handleInputChange("username", e.target.value)}
                        className="userUpdateInput"
                      />
                    </div>
                    <div className="userUpdateItem">
                      <label>תפקיד</label>
                      <select
                        value={userForm.role}
                        onChange={(e) => handleInputChange("role", e.target.value)}
                        className="userUpdateInput"
                      >
                        <option value="">בחר תפקיד</option>
                        <option value="מתאמן">מתאמן</option>
                        <option value="מאמן">מאמן</option>
                        <option value="מנהל">מנהל</option>
                      </select>
                    </div>
                  </div>
                  <div className="userUpdateRow">
                    <div className="userUpdateItem">
                      <label>מספר טלפון</label>
                      <input
                        type="tel"
                        value={userForm.phone}
                        onChange={(e) => handleInputChange("phone", e.target.value)}
                        className="userUpdateInput"
                        placeholder="05x-xxx-xxxx"
                      />
                    </div>
                    <div className="userUpdateItem">
                      <label>תאריך לידה</label>
                      <input
                        type="date"
                        value={userForm.birth_date}
                        onChange={(e) => handleInputChange("birth_date", e.target.value)}
                        className="userUpdateInput"
                      />
                    </div>
                  </div>
                  <div className="userUpdateRow">
                    <div className="userUpdateItem">
                      <label>מגדר</label>
                      <select
                        value={userForm.gender}
                        onChange={(e) => handleInputChange("gender", e.target.value)}
                        className="userUpdateInput"
                      >
                        <option value="">בחר מגדר</option>
                        <option value="זכר">זכר</option>
                        <option value="נקבה">נקבה</option>
                      </select>
                    </div>
                    <div className="userUpdateItem" />
                  </div>
                </div>

                {/* גוף */}
                <div className="userUpdateSection">
                  <h4 className="sectionTitle">מדדי גוף</h4>
                  <div className="userUpdateRow">
                    <div className="userUpdateItem">
                      <label>משקל (ק"ג)</label>
                      <input
                        type="number"
                        value={userForm.weight}
                        onChange={(e) => handleInputChange("weight", e.target.value)}
                        className="userUpdateInput"
                        step="0.1"
                      />
                    </div>
                    <div className="userUpdateItem">
                      <label>גובה (ס"מ)</label>
                      <input
                        type="number"
                        value={userForm.height}
                        onChange={(e) => handleInputChange("height", e.target.value)}
                        className="userUpdateInput"
                      />
                    </div>
                  </div>
                  <div className="userUpdateRow">
                    <div className="userUpdateItem">
                      <label>אחוז שומן (%)</label>
                      <input
                        type="number"
                        value={userForm.body_fat}
                        onChange={(e) => handleInputChange("body_fat", e.target.value)}
                        className="userUpdateInput"
                        step="0.1"
                      />
                    </div>
                    <div className="userUpdateItem">
                      <label>מסת שריר</label>
                      <input
                        type="number"
                        value={userForm.muscle_mass}
                        onChange={(e) => handleInputChange("muscle_mass", e.target.value)}
                        className="userUpdateInput"
                        step="0.1"
                      />
                    </div>
                  </div>
                  <div className="userUpdateRow">
                    <div className="userUpdateItem">
                      <label>היקף מותניים (ס"מ)</label>
                      <input
                        type="number"
                        value={userForm.circumference}
                        onChange={(e) => handleInputChange("circumference", e.target.value)}
                        className="userUpdateInput"
                      />
                    </div>
                    <div className="userUpdateItem">
                      <label>תאריך מדידה</label>
                      <input
                        type="date"
                        value={userForm.recorded_at}
                        onChange={(e) => handleInputChange("recorded_at", e.target.value)}
                        className="userUpdateInput"
                      />
                    </div>
                  </div>
                </div>

                {/* מנוי */}
                <div className="userUpdateSection">
                  <h4 className="sectionTitle">פרטי מנוי</h4>
                  <div className="userUpdateRow">
                    <div className="userUpdateItem">
                      <label>תאריך התחלה</label>
                      <input
                        type="date"
                        value={userForm.start_date}
                        onChange={(e) => handleInputChange("start_date", e.target.value)}
                        className="userUpdateInput"
                      />
                    </div>
                    <div className="userUpdateItem">
                      <label>תאריך סיום</label>
                      <input
                        type="date"
                        value={userForm.end_date}
                        onChange={(e) => handleInputChange("end_date", e.target.value)}
                        className="userUpdateInput"
                      />
                    </div>
                  </div>
                  <div className="userUpdateRow">
                    <div className="userUpdateItem">
                      <label>סטטוס תשלום</label>
                      <select
                        value={userForm.payment_status}
                        onChange={(e) => handleInputChange("payment_status", e.target.value)}
                        className="userUpdateInput"
                      >
                        <option value="pending">ממתין</option>
                        <option value="paid">שולם</option>
                        <option value="failed">נכשל</option>
                      </select>
                    </div>
                    <div className="userUpdateItem" />
                  </div>
                </div>
              </div>

              <div className="userUpdateActions">
                <button type="button" className="userUpdateButton saveButton" onClick={handleSave}>
                  <Save fontSize="small" /> עדכן פרטים
                </button>
                <button type="button" className="userUpdateButton cancelButton" onClick={handleCancel}>
                  <Cancel fontSize="small" /> ביטול
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}