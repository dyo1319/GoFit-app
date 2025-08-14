# GoFit מערכת ניהול חדר כושר

מערכת Full-Stack לניהול חדר כושר, הכוללת ממשק למנהלים, מאמנים ולקוחות.  
המערכת מאפשרת הרשמה, תשלום, הצגת מידע אישי, ניהול תוכניות אימון, שליחת התראות.

---

## טכנולוגיות עיקריות

### Front-End
- **React** (Vite)  פיתוח ממשק משתמש רספונסיבי
- **HTML5 / CSS3 / JavaScript**

### Back-End
- **Node.js** + **Express**
- **REST API** לניהול תקשורת בין הלקוח לשרת
- **CORS** **Morgan** לתיעוד וניהול בקשות
- **dotenv** לניהול משתני סביבה

### Database
- **MySQL**  מסד נתונים לאחסון משתמשים, מנויים, תוכניות אימון וסטטיסטיקות

---

## Packages used in the project

### Root (ניהול והפעלה משותפת)
```bash
npm i -D concurrently


cd client
npm create vite@latest . -- --template react
npm i


cd server
npm init -y
npm i express cors morgan dotenv mysql2
npm i -D nodemon