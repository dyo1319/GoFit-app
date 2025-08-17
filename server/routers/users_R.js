const express = require('express');
const router = express.Router();
module.exports = router;

const user_Mid = require("../middleware/user_Mid");

router.get("/Add",(req,res)=>{
    res.render("user_add",{
        page_title  : "הוספת משתמש",
        data:{},
    });
});
router.post("/Add",[user_Mid.AddUser],(req, res) => {
    res.redirect("/U/List");
});
router.get("/Edit/:id",[user_Mid.GetOneUser],(req,res)=>{
    if(req.GoodOne) {
        res.render("user_add", {
            page_title  : "עריכת משתמש"     ,
            data        :  req.one_user_data ,
        });
    } else{
        res.redirect("/cat/List");/// will be updated in future to missions list
    }
});
router.post("/Edit/:id", [user_Mid.UpdateUser], (req, res) => {
    res.redirect("/U/List");
});
router.get("/List",[user_Mid.GetAllUsers],(req,res)=>{
    res.render("user_list",{
        page_title    : "רשימת משתמשים"  ,
        users         : req.users_data    ,
        page          : req.page          ,
        total_pages   : req.total_pages   ,
    });
});
router.post("/Delete",[user_Mid.DeleteUser],(req,res)=>{
    res.redirect("/U/List");
})