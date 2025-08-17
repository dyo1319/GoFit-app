import "./userList.css";
import { DataGrid } from "@mui/x-data-grid";
import { DeleteOutline } from "@mui/icons-material";
import { Link } from "react-router-dom";
import { useState } from "react";

const initialRows = [
  { id: 1, username: "Anna Becker", email: "anna@mail.com", status: "active", transaction: "$120.00",
    avatar: "https://i.pravatar.cc/40?img=1" },
  { id: 2, username: "John Smith",  email: "john@mail.com", status: "inactive", transaction: "$80.00",
    avatar: "https://i.pravatar.cc/40?img=2" },
];

export default function UserList() {
  const [data, setData] = useState(initialRows);

  const handleDelete = (id) => setData(prev => prev.filter((row) => row.id !== id));

  const columns = [
    { field: "id", headerName: "ID", width: 90 },
    {
      field: "user", headerName: "User", width: 200,
      renderCell: (params) => (
        <div className="userListUser">
          <img className="userListImg" src={params.row.avatar} alt={params.row.username} />
          {params.row.username}
        </div>
      ),
    },
    { field: "email", headerName: "Email", width: 200 },
    { field: "status", headerName: "Status", width: 120 },
    { field: "transaction", headerName: "Transaction Volume", width: 160 },
    {
      field: "action", headerName: "Action", width: 150,
      renderCell: (params) => (
        <>
          <Link to={`/user/${params.row.id}`}>
            <button className="userListEdit">Edit</button>
          </Link>
          <DeleteOutline className="userListDelete" onClick={() => handleDelete(params.row.id)} />
        </>
      ),
    },
  ];

  return (
    <div className="userList">
      <DataGrid
        rows={data}
        columns={columns}
        checkboxSelection
        disableRowSelectionOnClick
        initialState={{ pagination: { paginationModel: { pageSize: 8, page: 0 } } }}
        pageSizeOptions={[8]}
      />
    </div>
  );
}
